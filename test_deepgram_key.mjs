import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { createClient } = require("@deepgram/sdk");

const apiKey = process.env.DEEPGRAM_API_KEY;
console.log("Key present:", !!apiKey);
console.log("Key prefix:", apiKey?.substring(0, 10));
console.log("Key length:", apiKey?.length);

if (!apiKey) {
  console.error("FATAL: DEEPGRAM_API_KEY is not set in environment");
  process.exit(1);
}

const dg = createClient(apiKey);
console.log("Client created successfully");

try {
  const res = await dg.manage.getProjects();
  console.log("API key VALID - response:", JSON.stringify(res).substring(0, 300));
} catch (err) {
  console.error("API key INVALID or network error:", err.message || err);
}
