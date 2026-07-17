import cors from 'cors';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import express from 'express';
import nodemailer from 'nodemailer';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = Number(process.env.PORT || 8787);
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
const AUTH_USER = process.env.WIKINB_AUTH_USER || '';
const AUTH_PASS = process.env.WIKINB_AUTH_PASS || '';
const AUTH_EMAILS = (process.env.WIKINB_AUTH_EMAILS || 'chaos60649@gmail.com,st101031616@gmail.com')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:4321,https://zx50416.github.io')
  .split(',')
  .map((o) => o.trim());
const DEV_LOG_CODE = process.env.DEV_LOG_CODE !== 'false';
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const pendingCodes = new Map();
const sessions = new Map();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || CORS_ORIGINS.some((o) => origin === o || origin.startsWith(o))) {
        cb(null, true);
        return;
      }
      cb(null, CORS_ORIGINS.includes('*'));
    },
    credentials: true,
  }),
);

function randomCode() {
  return String(crypto.randomInt(100000, 999999));
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function credentialsOk(username, password) {
  if (!AUTH_USER || !AUTH_PASS) return false;
  return String(username ?? '') === AUTH_USER && String(password ?? '') === AUTH_PASS;
}

async function sendCodeEmail(code) {
  const subject = `Kainnne WikiNB 登入驗證碼：${code}`;
  const text = `你的 WikiNB 登入驗證碼是：${code}\n\n10 分鐘內有效。若不是你本人操作，請忽略此信。`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (DEV_LOG_CODE) {
      console.log('\n📧 [DEV] 驗證碼（未設定 SMTP，僅顯示於終端機）:', code);
      console.log('   將寄送至:', AUTH_EMAILS.join(', '), '\n');
    }
    return { dev: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: AUTH_EMAILS.join(','),
    subject,
    text,
  });

  return { dev: false };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    res.status(401).json({ error: '未登入或 session 已過期' });
    return;
  }
  req.session = session;
  next();
}

app.get('/api/health', (_req, res) => {
  const wikiDir = path.join(PROJECT_ROOT, 'wiki');
  let wikiPages = 0;
  if (fs.existsSync(wikiDir)) {
    wikiPages = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md') && f !== 'index.md').length;
  }
  res.json({
    online: true,
    codex: 'ready',
    wikiPages,
    authEmails: AUTH_EMAILS.length,
  });
});

app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!AUTH_USER || !AUTH_PASS) {
      res.status(500).json({ error: 'Bridge 尚未設定 WIKINB_AUTH_USER / WIKINB_AUTH_PASS' });
      return;
    }

    if (!credentialsOk(username, password)) {
      res.status(401).json({ error: '帳號或密碼錯誤' });
      return;
    }

    const code = randomCode();
    pendingCodes.set('login', { code, expiresAt: Date.now() + CODE_TTL_MS });

    try {
      const sendResult = await sendCodeEmail(code);
      res.json({
        ok: true,
        message: sendResult.dev
          ? `帳密正確。未設定 SMTP，驗證碼已顯示於 Bridge 終端機（將寄至 ${AUTH_EMAILS.length} 個信箱）`
          : `帳密正確，驗證碼已寄送至 ${AUTH_EMAILS.length} 個信箱`,
        expiresIn: CODE_TTL_MS / 1000,
        dev: Boolean(sendResult.dev),
      });
    } catch (mailErr) {
      console.error('send-code SMTP error:', mailErr.message || mailErr);
      if (DEV_LOG_CODE) {
        console.log('\n📧 [FALLBACK] SMTP 失敗，驗證碼改顯示於終端機:', code);
        console.log('   目標信箱:', AUTH_EMAILS.join(', '), '\n');
        res.json({
          ok: true,
          message: '帳密正確，但 Gmail 寄信失敗。請查看 Bridge 終端機上的驗證碼（並檢查 SMTP_PASS 應用程式密碼）',
          expiresIn: CODE_TTL_MS / 1000,
          dev: true,
        });
        return;
      }
      pendingCodes.delete('login');
      res.status(500).json({ error: '寄送驗證碼失敗，請檢查 SMTP 設定（Gmail 應用程式密碼）' });
    }
  } catch (err) {
    console.error('send-code error:', err);
    res.status(500).json({ error: '寄送驗證碼失敗，請檢查 SMTP 設定' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { code } = req.body || {};
  const pending = pendingCodes.get('login');

  if (!pending || pending.expiresAt < Date.now()) {
    res.status(400).json({ error: '驗證碼已過期，請重新寄送' });
    return;
  }

  if (String(code).trim() !== pending.code) {
    res.status(400).json({ error: '驗證碼錯誤' });
    return;
  }

  pendingCodes.delete('login');
  const token = randomToken();
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, createdAt: Date.now() });

  res.json({
    ok: true,
    token,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (_req, res) => {
  res.json({ ok: true, authenticated: true });
});

const CODEX_MODELS = [
  { id: 'gpt-5.6-terra', label: 'gpt-5.6-terra（預設）' },
  { id: 'gpt-5.5', label: 'gpt-5.5' },
  { id: 'gpt-5.3-codex', label: 'gpt-5.3-codex' },
  { id: 'o3', label: 'o3' },
  { id: 'o4-mini', label: 'o4-mini' },
  { id: 'gpt-4.1', label: 'gpt-4.1' },
];

const CODEX_EFFORTS = [
  { id: 'low', label: '低（較快）' },
  { id: 'medium', label: '中（預設）' },
  { id: 'high', label: '高（較慢、較深）' },
];

function readCodexDefaultModel() {
  try {
    const cfgPath = path.join(process.env.HOME || '', '.codex', 'config.toml');
    if (!fs.existsSync(cfgPath)) return 'gpt-5.6-terra';
    const text = fs.readFileSync(cfgPath, 'utf8');
    const m = text.match(/^\s*model\s*=\s*"([^"]+)"/m);
    return m?.[1] || 'gpt-5.6-terra';
  } catch {
    return 'gpt-5.6-terra';
  }
}

function readCodexDefaultEffort() {
  try {
    const cfgPath = path.join(process.env.HOME || '', '.codex', 'config.toml');
    if (!fs.existsSync(cfgPath)) return 'medium';
    const text = fs.readFileSync(cfgPath, 'utf8');
    const m = text.match(/^\s*model_reasoning_effort\s*=\s*"([^"]+)"/m);
    return m?.[1] || 'medium';
  } catch {
    return 'medium';
  }
}

/** @type {Map<string, import('node:child_process').ChildProcess>} */
const activeCodexJobs = new Map();

app.get('/api/codex/models', authMiddleware, (_req, res) => {
  const defaultModel = readCodexDefaultModel();
  const defaultEffort = readCodexDefaultEffort();
  const models = [...CODEX_MODELS];
  if (!models.some((m) => m.id === defaultModel)) {
    models.unshift({
      id: defaultModel,
      label: `${defaultModel}（本機設定）`,
    });
  }
  res.json({
    ok: true,
    defaultModel,
    defaultEffort,
    models,
    efforts: CODEX_EFFORTS,
    tips: [
      '簡單 wiki 問答通常只需 15–60 秒；第一次啟動或面對複雜任務可能需要更久。',
    ],
  });
});

app.post('/api/codex/stop', authMiddleware, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const child = activeCodexJobs.get(token);
  if (!child || child.killed) {
    res.json({ ok: true, stopped: false, message: '目前沒有執行中的 Codex' });
    return;
  }
  child.kill('SIGTERM');
  setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL');
  }, 1500);
  res.json({ ok: true, stopped: true, message: '已送出停止訊號' });
});

app.post('/api/sync', authMiddleware, async (_req, res) => {
  try {
    const result = await runWikiSync();
    res.json(result);
  } catch (err) {
    console.error('sync error:', err);
    res.status(500).json({ error: '同步失敗', detail: String(err.message || err) });
  }
});

async function runWikiSync() {
  const autoPush = process.env.AUTO_GIT_PUSH === 'true';

  if (!autoPush) {
    await execFileAsync('npm', ['run', 'build'], { cwd: PROJECT_ROOT, timeout: 120000 });
    return {
      ok: true,
      message:
        'Wiki 已在本機重新建置（dist/）。若要自動推上 GitHub，請在 bridge/.env 設定 AUTO_GIT_PUSH=true',
      gitPush: false,
    };
  }

  await execFileAsync('git', ['add', 'wiki/'], { cwd: PROJECT_ROOT });
  const commitEnv = { ...process.env };
  try {
    await execFileAsync('git', ['commit', '-m', 'sync: update wiki from Bridge'], {
      cwd: PROJECT_ROOT,
      env: commitEnv,
    });
  } catch (err) {
    const msg = String(err.stdout || err.stderr || err.message || '');
    if (!/nothing to commit|no changes added|clean working tree/i.test(msg)) {
      console.warn('git commit:', msg.slice(0, 300));
    }
  }

  const pushEnv = { ...process.env };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    // Prefer token when provided; otherwise use Mac 既有 git 憑證
    pushEnv.GIT_ASKPASS = 'echo';
    pushEnv.GIT_TERMINAL_PROMPT = '0';
    const remote = `https://x-access-token:${token}@github.com/zx50416/WikiNB.git`;
    await execFileAsync('git', ['push', remote, 'HEAD:main'], {
      cwd: PROJECT_ROOT,
      env: pushEnv,
      timeout: 120000,
    });
  } else {
    await execFileAsync('git', ['push', 'origin', 'HEAD'], {
      cwd: PROJECT_ROOT,
      env: pushEnv,
      timeout: 120000,
    });
  }

  return {
    ok: true,
    message: 'Wiki 已推送至 GitHub，Pages 將自動重新部署（約 1–2 分鐘）',
    gitPush: true,
  };
}

function safeInboxFilename(name) {
  const base = path.basename(String(name || 'note.md')).replace(/[^\w.\-()\u4e00-\u9fff]+/g, '_');
  if (!base || base === '.' || base === '..') return `note-${Date.now()}.md`;
  return base.endsWith('.md') ? base : `${base}.md`;
}

/** 僅儲存到 raw/inbox，不做 AI 整理 */
async function handleRawUpload(req, res) {
  const { filename, content } = req.body || {};
  if (!content || !String(content).trim()) {
    res.status(400).json({ error: '請提供筆記內容' });
    return;
  }

  try {
    const inboxDir = path.join(PROJECT_ROOT, 'raw', 'inbox');
    fs.mkdirSync(inboxDir, { recursive: true });
    const safeName = safeInboxFilename(filename);
    const targetPath = path.join(inboxDir, safeName);
    fs.writeFileSync(targetPath, String(content), 'utf8');

    res.json({
      ok: true,
      filename: safeName,
      path: `raw/inbox/${safeName}`,
      message: `已儲存到 raw/inbox/${safeName}`,
    });
  } catch (err) {
    console.error('raw upload error:', err);
    res.status(500).json({
      error: '儲存失敗',
      detail: String(err.message || err).slice(0, 400),
    });
  }
}

app.post('/api/raw/upload', authMiddleware, handleRawUpload);
// 相容舊前端路徑（僅存檔，不整理 wiki）
app.post('/api/ingest', authMiddleware, handleRawUpload);

function listDirBasenames(dir, { max = 40, ext } = {}) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => !f.startsWith('.'))
    .filter((f) => (ext ? f.endsWith(ext) : true))
    .sort()
    .slice(0, max);
}

function formatHistoryBlock(history) {
  if (!Array.isArray(history) || history.length === 0) return '';
  const lines = [];
  for (const turn of history.slice(-16)) {
    const role = turn?.role === 'assistant' ? '助手' : '使用者';
    const text = String(turn?.content || '')
      .trim()
      .slice(0, 2500);
    if (!text) continue;
    lines.push(`${role}：${text}`);
  }
  if (!lines.length) return '';
  return `\n\n以下是稍早的對話（請延續上下文，不要假裝沒看過）：\n${lines.join('\n\n')}\n`;
}

function buildCodexChatPrompt(message, history) {
  const wikiFiles = listDirBasenames(path.join(PROJECT_ROOT, 'wiki'), { ext: '.md' });
  const inboxFiles = listDirBasenames(path.join(PROJECT_ROOT, 'raw', 'inbox'));
  const archiveFiles = listDirBasenames(path.join(PROJECT_ROOT, 'raw', 'archive'));

  return `你是 Kainnne WikiNB 專案裡的 Codex 學習助理（本機 CLI）。

專案目的（見 AGENTS.md）：
- 使用者寫 raw 筆記 → AI 整理成 wiki → 你幫他彙整、回想、複習、延伸思考
- 你不是「只能念 wiki」的機器人；wiki 沒寫也可以回答，需要時請讀 raw/ 與其他檔案

角色與風格：
- 像正常、自由的 GPT：可延伸討論、舉例、教學、推測、腦力激盪；不要過度保守
- 需要專案現況時，請主動讀取工作區（AGENTS.md、wiki/、raw/inbox、raw/archive、docs/）
- 使用者問 raw 原文怎麼寫、怎麼改、在講什麼時，請直接讀檔協助
- 只有真的無法取得的資訊才說不知道；「wiki 沒寫」不是拒絕理由
- 若使用者允許主觀判斷／假設，可以天馬行空，但請標明哪些是推測
- 使用繁體中文；可用 Markdown

專案快照（可能不完整，詳情請自行讀檔）：
- 工作目錄：${PROJECT_ROOT}
- wiki 頁面：${wikiFiles.length ? wikiFiles.join(', ') : '（無）'}
- raw/inbox：${inboxFiles.length ? inboxFiles.join(', ') : '（空）'}
- raw/archive：${archiveFiles.length ? archiveFiles.join(', ') : '（空）'}
${formatHistoryBlock(history)}
使用者最新問題：
${String(message || '').trim()}`;
}

app.post('/api/codex/chat', authMiddleware, async (req, res) => {
  const { message, model, reasoningEffort, history } = req.body || {};
  if (!message?.trim()) {
    res.status(400).json({ error: '請輸入訊息' });
    return;
  }

  const chosenModel = String(model || readCodexDefaultModel()).trim();
  const chosenEffort = String(reasoningEffort || readCodexDefaultEffort()).trim();
  const allowedEffort = new Set(CODEX_EFFORTS.map((e) => e.id));
  const effort = allowedEffort.has(chosenEffort) ? chosenEffort : 'medium';

  const prompt = buildCodexChatPrompt(message, history);

  const authHeader = req.headers.authorization || '';
  const sessionToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  const codexArgs = [
    'exec',
    '--json',
    '--color',
    'never',
    '--sandbox',
    'read-only',
    '--ephemeral',
    '-m',
    chosenModel,
    '-c',
    `model_reasoning_effort="${effort}"`,
    '-',
  ];

  const wantStream =
    String(req.query.stream || '') === '1' ||
    (req.headers.accept || '').includes('text/event-stream');

  if (!wantStream) {
    try {
      const { stdout, stderr } = await execFileAsync(
        'codex',
        [
          'exec',
          '--color',
          'never',
          '--sandbox',
          'read-only',
          '--ephemeral',
          '-m',
          chosenModel,
          '-c',
          `model_reasoning_effort="${effort}"`,
          '-',
        ],
        {
          cwd: PROJECT_ROOT,
          timeout: 180000,
          maxBuffer: 10 * 1024 * 1024,
          input: prompt,
        },
      );
      const answer = stdout?.trim() || stderr?.trim() || '（Codex 未回傳內容）';
      res.json({ ok: true, answer, model: chosenModel, reasoningEffort: effort });
    } catch (err) {
      console.error('codex error:', err);
      const msg = err.stderr || err.message || String(err);
      res.status(500).json({
        error: 'Codex 執行失敗。請確認 Mac 上已安裝 Codex CLI 並以 ChatGPT 帳號登入。',
        detail: msg.slice(0, 500),
      });
    }
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  send({
    type: 'status',
    message: `正在啟動 Codex（${chosenModel} · ${effort}）…`,
    model: chosenModel,
    reasoningEffort: effort,
  });

  const startedAt = Date.now();
  const tick = setInterval(() => {
    send({ type: 'tick', elapsedMs: Date.now() - startedAt });
  }, 1000);

  let buffer = '';
  let fullLog = '';
  let answerParts = [];
  let stoppedByUser = false;

  const child = spawn('codex', codexArgs, {
    cwd: PROJECT_ROOT,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  if (sessionToken) activeCodexJobs.set(sessionToken, child);

  child.stdin.write(prompt);
  child.stdin.end();

  const handleChunk = (chunk, source) => {
    const text = chunk.toString('utf8');
    fullLog += text;
    buffer += text;

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let parsed = null;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        send({ type: 'log', source, text: trimmed });
        continue;
      }

      const extracted = extractCodexText(parsed);
      if (extracted) {
        answerParts.push(extracted);
        send({ type: 'delta', text: extracted });
      }

      send({
        type: 'event',
        eventType: parsed.type || parsed.msg?.type || 'unknown',
        summary: summarizeCodexEvent(parsed),
        raw: trimmed.length > 4000 ? `${trimmed.slice(0, 4000)}…` : trimmed,
      });
    }
  };

  child.stdout.on('data', (c) => handleChunk(c, 'stdout'));
  child.stderr.on('data', (c) => handleChunk(c, 'stderr'));

  const killTimer = setTimeout(() => {
    send({ type: 'status', message: '超過 3 分鐘，正在停止 Codex…' });
    child.kill('SIGTERM');
  }, 180000);

  const cleanupJob = () => {
    clearInterval(tick);
    clearTimeout(killTimer);
    if (sessionToken && activeCodexJobs.get(sessionToken) === child) {
      activeCodexJobs.delete(sessionToken);
    }
  };

  // 注意：不要用 req.on('close')——body 讀完就會觸發，會誤殺剛啟動的 Codex
  res.on('close', () => {
    if (res.writableEnded) return;
    stoppedByUser = true;
    cleanupJob();
    if (!child.killed) {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) child.kill('SIGKILL');
      }, 1500);
    }
  });

  child.on('error', (err) => {
    cleanupJob();
    send({
      type: 'error',
      error: '無法啟動 Codex CLI',
      detail: String(err.message || err),
    });
    if (!res.writableEnded) res.end();
  });

  child.on('close', (code) => {
    cleanupJob();

    if (buffer.trim()) {
      handleChunk(Buffer.from(`${buffer}\n`), 'stdout');
      buffer = '';
    }

    const answer =
      answerParts.join('\n').trim() ||
      fullLog.trim() ||
      (stoppedByUser
        ? '（已停止）'
        : code === 0
          ? '（Codex 未回傳可顯示的文字）'
          : `Codex 結束，代碼 ${code}`);

    if (res.writableEnded) return;

    if (stoppedByUser) {
      send({
        type: 'done',
        ok: true,
        stopped: true,
        answer,
        fullLog,
        exitCode: code ?? 0,
        elapsedMs: Date.now() - startedAt,
        model: chosenModel,
        reasoningEffort: effort,
      });
    } else if (code && code !== 0 && !answerParts.length) {
      send({
        type: 'error',
        error: 'Codex 執行失敗',
        detail: fullLog.slice(-800) || `exit ${code}`,
        answer,
        elapsedMs: Date.now() - startedAt,
        model: chosenModel,
        reasoningEffort: effort,
      });
    } else {
      send({
        type: 'done',
        ok: true,
        answer,
        fullLog,
        exitCode: code ?? 0,
        elapsedMs: Date.now() - startedAt,
        model: chosenModel,
        reasoningEffort: effort,
      });
    }
    res.end();
  });
});

function extractCodexText(ev) {
  if (!ev || typeof ev !== 'object') return '';

  const candidates = [];
  const push = (v) => {
    if (typeof v === 'string' && v.trim()) candidates.push(v.trim());
  };

  push(ev.text);
  push(ev.message);
  push(ev.content);
  push(ev.delta);
  push(ev.msg?.message);
  push(ev.msg?.text);
  push(ev.item?.text);
  push(ev.item?.content);
  push(ev.item?.message);

  if (Array.isArray(ev.content)) {
    for (const part of ev.content) {
      if (typeof part === 'string') push(part);
      else if (part?.text) push(part.text);
    }
  }

  const type = String(ev.type || ev.msg?.type || '');
  const itemType = String(ev.item?.type || '');
  const interesting =
    /agent_message|output_text|message\.delta|response\.output|assistant/i.test(type) ||
    /agent_message|message/i.test(itemType);

  if (interesting) return candidates[0] || '';
  // item.completed with agent message body
  if (type.includes('item.') && itemType.includes('agent_message')) {
    return candidates[0] || '';
  }
  return '';
}

function summarizeCodexEvent(ev) {
  const t = ev.type || ev.msg?.type || ev.item?.type || 'event';
  if (/reasoning|thinking|thinking_delta/i.test(t)) return '思考中';
  if (/agent_message|message/i.test(t)) return '產生回覆';
  if (/tool|command|exec/i.test(t)) return '執行工具';
  if (/error/i.test(t)) return '錯誤';
  if (/task_complete|turn_complete|done/i.test(t)) return '完成';
  return t;
}

app.listen(PORT, () => {
  console.log(`\n🌸 WikiNB Bridge running on http://localhost:${PORT}`);
  console.log(`   Project: ${PROJECT_ROOT}`);
  console.log(`   Auth user: ${AUTH_USER ? 'set' : 'MISSING'}`);
  console.log(`   Auth emails: ${AUTH_EMAILS.join(', ')}`);
  console.log(`   SMTP: ${process.env.SMTP_USER && process.env.SMTP_PASS ? 'configured' : 'DEV (codes in terminal)'}`);
  console.log(`   CORS: ${CORS_ORIGINS.join(', ')}\n`);
});
