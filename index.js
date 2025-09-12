// index.js
const { TwitterApi } = require('twitter-api-v2');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const SECRETS = require('./SECRETS');

// --- Twitter client (OAuth 1.0a) ---
const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

// --- Gemini client ---
const genAI = new GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);
const generationConfig = { maxOutputTokens: 400 };

function clampTweet(text) {
  // one-line, ≤280 chars, no quotes or triple backticks
  let t = String(text || '')
    .replace(/```[\s\S]*?```/g, '')     // strip fenced blocks
    .replace(/\s+/g, ' ')               // collapse whitespace/newlines
    .trim();
  if (t.length > 280) t = t.slice(0, 277).trimEnd() + '…';
  return t;
}

async function makeTweetText(modelName) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig,
  });

  const prompt = [
    'Generate a tweet on web dev:',
    '• tips & tricks, a fresh insight, a tiny rant, or practical advice',
    '• be specific, unique, and helpful',
    '• ≤280 chars, plain text (you may use a couple emojis)',
  ].join('\n');

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return clampTweet(response.text());
}

async function sendTweet(tweetText) {
  await twitterClient.v2.tweet(tweetText);
  console.log('Tweet sent successfully!');
}

(async () => {
  try {
    // Fail fast if tokens/permissions are wrong
    const me = await twitterClient.v2.me();
    console.log(`Auth OK as @${me.data?.username || 'unknown'}`);
    const genAI = new GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash',  // or whichever version you want
      generationConfig,
    });
    if (!text) throw new Error('Generated empty tweet text.');
    console.log('Draft:', text);

    await sendTweet(text);
  } catch (err) {
    console.error('Startup/auth/send error:', err?.data || err?.message || err);
    process.exit(1);
  }
})();
