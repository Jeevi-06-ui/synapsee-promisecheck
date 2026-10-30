const fs = require('node:fs');
const path = require('node:path');

const appDir = path.resolve(__dirname, '..');
const envPath = path.join(appDir, '.env');

// Load .env if present. Existing process environment variables take precedence.
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.warn(`[config] Note: Could not load .env file: ${err.message}`);
  }
}

const DEFAULT_CAFE_URL = 'https://synapsee-promisecheck.vercel.app/';
const DEFAULT_PORT = 4004;
const DEFAULT_HOST = '127.0.0.1';

const TEAM_INFO = {
  teamName: 'Synapsee',
  institution: 'Presidency University, Bengaluru',
  department: 'Department of Computer Science & Engineering',
  members: [
    {
      name: 'Jeevith P',
      role: 'Team Leader, PromiseCheck Developer & System Integration',
      branch: 'feature/promisecheck'
    },
    {
      name: 'Neha Ashok',
      role: 'Café Website & Frontend Experience',
      branch: 'feature/cafe'
    },
    {
      name: 'Likitha R',
      role: 'Independent QA, Validation & Evidence',
      branch: 'test/integration'
    }
  ]
};

function getApiKey() {
  return process.env.TINYFISH_API_KEY ? process.env.TINYFISH_API_KEY.trim() : '';
}

function redact(text) {
  const key = getApiKey();
  if (!key || typeof text !== 'string') return String(text ?? '');
  return text.split(key).join('[REDACTED]');
}

/**
 * Validates target URL reachability for TinyFish cloud agents.
 * Rejects private/local network ranges, loopbacks, credentials, and non-HTTP(S) protocols.
 */
function validatePublicUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('A target URL string is required.');
  }
  let parsed;
  try {
    parsed = new URL(targetUrl.trim());
  } catch {
    throw new Error(`Invalid URL format: "${targetUrl}". Expected format: https://...`);
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`Invalid protocol "${parsed.protocol}". Only HTTP and HTTPS are supported.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error('Target URL must not contain embedded authentication credentials.');
  }

  const host = parsed.hostname.toLowerCase();
  const isPrivateOrLocal = (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === '0.0.0.0' ||
    host === '[::1]' ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '169.254.169.254'
  );

  if (isPrivateOrLocal) {
    throw new Error(
      `TinyFish cloud agents run in remote datacenters and cannot reach local/private host "${host}". ` +
      'Please supply a public URL (e.g. https://synapsee-promisecheck.vercel.app).'
    );
  }

  return parsed.href;
}

function getConfig() {
  const key = getApiKey();
  return {
    appDir,
    evidenceDir: path.join(appDir, 'evidence'),
    cafePublicUrl: process.env.CAFE_PUBLIC_URL?.trim() || DEFAULT_CAFE_URL,
    hasApiKey: Boolean(key),
    apiKeyMasked: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    port: Number(process.env.PORT) || DEFAULT_PORT,
    host: process.env.HOST || DEFAULT_HOST,
    nodeVersion: process.version,
    team: TEAM_INFO
  };
}

module.exports = {
  appDir,
  getConfig,
  getApiKey,
  redact,
  validatePublicUrl,
  DEFAULT_CAFE_URL,
  DEFAULT_PORT,
  DEFAULT_HOST,
  TEAM_INFO
};

