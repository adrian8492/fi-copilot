import 'dotenv/config';

const key = process.env.DEEPGRAM_API_KEY;
console.log('DEEPGRAM_API_KEY present:', !!key);
console.log('Key prefix:', key ? key.substring(0, 8) + '...' : 'NOT SET');
console.log('Key length:', key ? key.length : 0);

if (!key) {
  console.error('DEEPGRAM_API_KEY is not set! This is the root cause.');
  process.exit(1);
}

// Test the key with a simple API call
try {
  const resp = await fetch('https://api.deepgram.com/v1/projects', {
    headers: { 'Authorization': `Token ${key}` },
  });
  console.log('Deepgram API status:', resp.status, resp.statusText);
  if (resp.ok) {
    const data = await resp.json();
    console.log('Projects:', data.projects?.length ?? 'unknown');
    console.log('Key is VALID ✅');
  } else {
    const body = await resp.text();
    console.error('Key validation FAILED ❌:', body);
  }
} catch (err) {
  console.error('Network error:', err.message);
}
