import cors from 'cors';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
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
const AUTH_EMAILS = (process.env.WIKINB_AUTH_EMAILS || 'chaos60649@gmail.com')
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

async function sendCodeEmail(code) {
  const subject = `Kiannne WikiNB 登入驗證碼：${code}`;
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

app.post('/api/auth/send-code', async (_req, res) => {
  try {
    const code = randomCode();
    pendingCodes.set('login', { code, expiresAt: Date.now() + CODE_TTL_MS });

    await sendCodeEmail(code);

    res.json({
      ok: true,
      message: `驗證碼已寄送至 ${AUTH_EMAILS.length} 個信箱`,
      expiresIn: CODE_TTL_MS / 1000,
    });
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

app.post('/api/sync', authMiddleware, async (_req, res) => {
  try {
    let gitPush = false;

    if (process.env.AUTO_GIT_PUSH === 'true' && process.env.GITHUB_TOKEN) {
      await execFileAsync('git', ['add', 'wiki/'], { cwd: PROJECT_ROOT });
      await execFileAsync(
        'git',
        ['commit', '-m', 'sync: update wiki from Bridge', '--allow-empty'],
        { cwd: PROJECT_ROOT },
      ).catch(() => {});
      await execFileAsync('git', ['push'], {
        cwd: PROJECT_ROOT,
        env: { ...process.env, GH_TOKEN: process.env.GITHUB_TOKEN },
      });
      gitPush = true;
    } else {
      await execFileAsync('npm', ['run', 'build'], { cwd: PROJECT_ROOT, timeout: 120000 });
    }

    res.json({
      ok: true,
      message: gitPush
        ? 'Wiki 已推送至 GitHub，Pages 將自動重新部署'
        : 'Wiki 已在本機重新建置（dist/）。若要雲端同步，請在 bridge/.env 設定 GITHUB_TOKEN 與 AUTO_GIT_PUSH=true',
      gitPush,
    });
  } catch (err) {
    console.error('sync error:', err);
    res.status(500).json({ error: '同步失敗', detail: String(err.message || err) });
  }
});

app.post('/api/codex/chat', authMiddleware, async (req, res) => {
  const { message } = req.body || {};
  if (!message?.trim()) {
    res.status(400).json({ error: '請輸入訊息' });
    return;
  }

  const wikiDir = path.join(PROJECT_ROOT, 'wiki');
  let wikiContext = '';
  if (fs.existsSync(wikiDir)) {
    const files = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md') && f !== 'index.md');
    for (const file of files.slice(0, 8)) {
      const content = fs.readFileSync(path.join(wikiDir, file), 'utf-8');
      wikiContext += `\n--- ${file} ---\n${content.slice(0, 3000)}\n`;
    }
  }

  const prompt = `你是 Kiannne WikiNB 助手。根據以下 wiki 筆記回答使用者問題。若筆記中沒有答案，請明確說不知道。回答請簡潔清楚，使用繁體中文。

${wikiContext}

使用者問題：${message.trim()}`;

  try {
    const { stdout, stderr } = await execFileAsync(
      'codex',
      ['exec', '--sandbox', 'read-only', '--ephemeral', prompt],
      { cwd: PROJECT_ROOT, timeout: 180000, maxBuffer: 10 * 1024 * 1024 },
    );

    const answer = stdout?.trim() || stderr?.trim() || '（Codex 未回傳內容）';
    res.json({ ok: true, answer });
  } catch (err) {
    console.error('codex error:', err);
    const msg = err.stderr || err.message || String(err);
    res.status(500).json({
      error: 'Codex 執行失敗。請確認 Mac 上已安裝 Codex CLI 並以 ChatGPT 帳號登入。',
      detail: msg.slice(0, 500),
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🌸 WikiNB Bridge running on http://localhost:${PORT}`);
  console.log(`   Project: ${PROJECT_ROOT}`);
  console.log(`   Auth emails: ${AUTH_EMAILS.join(', ')}`);
  console.log(`   CORS: ${CORS_ORIGINS.join(', ')}\n`);
});
