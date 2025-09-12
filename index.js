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
  // one-line, ≤280 chars, no code blocks
  let t = String(text || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > 280) t = t.slice(0, 277).trimEnd() + '…';
  return t;
}

async function makeTweetText(modelName = 'models/gemini-2.5-flash') {
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

    // Generate the tweet using the Gemini 2.5-flash model
    const tweetText = await makeTweetText();
    if (!tweetText) {
      console.log('Generated empty tweet text; exiting without sending.');
      return;
    }

    console.log('Draft:', tweetText);
    await sendTweet(tweetText);
  } catch (err) {
    console.error('Startup/auth/send error:', err?.data || err?.message || err);
    process.exit(1);
  }
})();
