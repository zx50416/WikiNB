const SESSION_KEY = 'wikinb_session';

function getBase() {
  return document.documentElement.dataset.base || import.meta.env.BASE_URL || '/';
}

export function getBridgeUrl() {
  const el = document.getElementById('bridge-config');
  if (el?.textContent) {
    try {
      const cfg = JSON.parse(el.textContent);
      const isLocal =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const prod = cfg.productionUrl;
      if (!isLocal && prod && !prod.includes('YOUR-MAC')) return prod;
      return cfg.url || 'http://localhost:8787';
    } catch {
      /* ignore */
    }
  }
  return import.meta.env.PUBLIC_BRIDGE_URL || 'http://localhost:8787';
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt && data.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return Boolean(getSession()?.token);
}

async function bridgeFetch(path, options = {}) {
  const base = getBridgeUrl();
  const session = getSession();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  return data;
}

export async function checkHealth() {
  try {
    return await bridgeFetch('/api/health');
  } catch {
    return { online: false };
  }
}

export async function sendLoginCode(username, password) {
  return bridgeFetch('/api/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function verifyLoginCode(code) {
  return bridgeFetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function logout() {
  try {
    await bridgeFetch('/api/auth/logout', { method: 'POST', body: '{}' });
  } catch {
    /* ignore */
  }
  clearSession();
}

export async function syncWiki() {
  return bridgeFetch('/api/sync', { method: 'POST', body: '{}' });
}

export async function ingestRawNote({ filename, content, sync = true, model, reasoningEffort }) {
  return bridgeFetch('/api/ingest', {
    method: 'POST',
    body: JSON.stringify({ filename, content, sync, model, reasoningEffort }),
  });
}

export async function codexChat(message, options = {}) {
  return bridgeFetch('/api/codex/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
    }),
  });
}

export async function fetchCodexModels() {
  return bridgeFetch('/api/codex/models');
}

export async function stopCodex() {
  return bridgeFetch('/api/codex/stop', { method: 'POST', body: '{}' });
}

/**
 * Stream Codex output via SSE. onEvent receives { type, ... }.
 * options: { model, reasoningEffort, signal }
 */
export async function codexChatStream(message, onEvent = () => {}, options = {}) {
  const base = getBridgeUrl();
  const session = getSession();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;

  const res = await fetch(`${base}/api/codex/chat?stream=1`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.detail || `HTTP ${res.status}`);
  }

  if (!res.body) throw new Error('瀏覽器不支援串流回應');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const line = part
          .split('\n')
          .filter((l) => l.startsWith('data:'))
          .map((l) => l.slice(5).trim())
          .join('');
        if (!line) continue;
        try {
          const payload = JSON.parse(line);
          onEvent(payload);
          if (payload.type === 'done' || payload.type === 'error') {
            finalPayload = payload;
          }
        } catch {
          onEvent({ type: 'log', text: line });
        }
      }
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { type: 'done', ok: true, stopped: true, answer: '（已停止）' };
    }
    throw err;
  }

  if (!finalPayload) {
    throw new Error('Codex 串流中斷，沒有收到完成事件');
  }
  if (finalPayload.type === 'error' && !finalPayload.answer) {
    throw new Error(finalPayload.error || finalPayload.detail || 'Codex 執行失敗');
  }
  return finalPayload;
}

export function mountNavAuth() {
  const loginLink = document.getElementById('nav-login');
  const logoutBtn = document.getElementById('nav-logout');
  const syncBtn = document.getElementById('nav-sync');

  const update = () => {
    const loggedIn = isLoggedIn();
    if (loginLink) loginLink.classList.toggle('hidden', loggedIn);
    if (logoutBtn) logoutBtn.classList.toggle('hidden', !loggedIn);
    if (syncBtn) syncBtn.classList.toggle('hidden', !loggedIn);
    document.dispatchEvent(new CustomEvent('wikinb:auth-change', { detail: { loggedIn } }));
  };

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logout();
    update();
    window.location.href = getBase();
  });

  syncBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    syncBtn.textContent = '同步中…';
    syncBtn.setAttribute('disabled', 'true');
    try {
      const result = await syncWiki();
      alert(result.message || '同步完成');
    } catch (err) {
      alert(err.message || '同步失敗，請確認 Bridge 已啟動');
    } finally {
      syncBtn.textContent = '同步 Wiki';
      syncBtn.removeAttribute('disabled');
    }
  });

  update();
  return { update };
}
