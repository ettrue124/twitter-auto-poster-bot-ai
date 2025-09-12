// SECRETS.js
function requireEnv(name, minLen = 10) {
  const v = (process.env[name] || '').trim();
  if (!v) throw new Error(`Missing required env var: ${name}`);
  if (v.length < minLen) throw new Error(`${name} looks too short; paste full value (no quotes)`);
  if (/^['"].*['"]$/.test(v)) throw new Error(`${name} contains quotes; remove them`);
  return v;
}

module.exports = {
  APP_KEY: requireEnv('APP_KEY'),
  APP_SECRET: requireEnv('APP_SECRET', 20),
  ACCESS_TOKEN: requireEnv('ACCESS_TOKEN', 20),
  ACCESS_SECRET: requireEnv('ACCESS_SECRET', 20),
  GEMINI_API_KEY: requireEnv('GEMINI_API_KEY', 20),
  // Optional: override model via GH secret/ENV; sane default if not set
  GEMINI_MODEL: (process.env.GEMINI_MODEL || 'models/gemini-2.5-flash').trim(),
};
