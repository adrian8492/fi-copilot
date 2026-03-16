/**
 * Data Migration Script: Encrypt legacy plaintext PII
 * 
 * Encrypts existing plaintext values in:
 *   - sessions.customerName
 *   - transcripts.text
 *   - compliance_flags.excerpt
 *   - audio_recordings.fileUrl
 *
 * Safe to run multiple times — skips already-encrypted values (enc:v1: prefix).
 * Requires ENCRYPTION_KEY env var to be set.
 */
import { createCipheriv, randomBytes } from "crypto";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY env var must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

function encrypt(plaintext, key) {
  if (!plaintext) return null;
  if (plaintext.startsWith(PREFIX)) return plaintext; // Already encrypted
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

async function main() {
  const key = getKey();
  console.log("🔐 Starting PII encryption migration...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  // ── 1. sessions.customerName ──
  const [sessions] = await connection.execute(
    "SELECT id, customerName FROM sessions WHERE customerName IS NOT NULL AND customerName != '' AND customerName NOT LIKE 'enc:v1:%'"
  );
  console.log(`📋 Sessions with plaintext customerName: ${sessions.length}`);
  let sessionCount = 0;
  for (const row of sessions) {
    const encrypted = encrypt(row.customerName, key);
    if (encrypted !== row.customerName) {
      await connection.execute("UPDATE sessions SET customerName = ? WHERE id = ?", [encrypted, row.id]);
      sessionCount++;
    }
  }
  console.log(`   ✅ Encrypted ${sessionCount} session customerNames\n`);

  // ── 2. transcripts.text ──
  const [transcripts] = await connection.execute(
    "SELECT id, text FROM transcripts WHERE text IS NOT NULL AND text != '' AND text NOT LIKE 'enc:v1:%'"
  );
  console.log(`📋 Transcripts with plaintext text: ${transcripts.length}`);
  let transcriptCount = 0;
  const BATCH_SIZE = 100;
  for (let i = 0; i < transcripts.length; i += BATCH_SIZE) {
    const batch = transcripts.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      const encrypted = encrypt(row.text, key);
      if (encrypted !== row.text) {
        await connection.execute("UPDATE transcripts SET text = ? WHERE id = ?", [encrypted, row.id]);
        transcriptCount++;
      }
    }
    if (i + BATCH_SIZE < transcripts.length) {
      process.stdout.write(`   Processing... ${Math.min(i + BATCH_SIZE, transcripts.length)}/${transcripts.length}\r`);
    }
  }
  console.log(`   ✅ Encrypted ${transcriptCount} transcript texts\n`);

  // ── 3. compliance_flags.excerpt ──
  const [flags] = await connection.execute(
    "SELECT id, excerpt FROM compliance_flags WHERE excerpt IS NOT NULL AND excerpt != '' AND excerpt NOT LIKE 'enc:v1:%'"
  );
  console.log(`📋 Compliance flags with plaintext excerpt: ${flags.length}`);
  let flagCount = 0;
  for (const row of flags) {
    const encrypted = encrypt(row.excerpt, key);
    if (encrypted !== row.excerpt) {
      await connection.execute("UPDATE compliance_flags SET excerpt = ? WHERE id = ?", [encrypted, row.id]);
      flagCount++;
    }
  }
  console.log(`   ✅ Encrypted ${flagCount} compliance flag excerpts\n`);

  // ── 4. audio_recordings.fileUrl ──
  const [recordings] = await connection.execute(
    "SELECT id, fileUrl FROM audio_recordings WHERE fileUrl IS NOT NULL AND fileUrl != '' AND fileUrl NOT LIKE 'enc:v1:%'"
  );
  console.log(`📋 Audio recordings with plaintext fileUrl: ${recordings.length}`);
  let recordingCount = 0;
  for (const row of recordings) {
    const encrypted = encrypt(row.fileUrl, key);
    if (encrypted !== row.fileUrl) {
      await connection.execute("UPDATE audio_recordings SET fileUrl = ? WHERE id = ?", [encrypted, row.id]);
      recordingCount++;
    }
  }
  console.log(`   ✅ Encrypted ${recordingCount} audio recording fileUrls\n`);

  // ── Summary ──
  const total = sessionCount + transcriptCount + flagCount + recordingCount;
  console.log("═══════════════════════════════════════");
  console.log(`🔐 Migration complete: ${total} fields encrypted`);
  console.log(`   Sessions:    ${sessionCount}`);
  console.log(`   Transcripts: ${transcriptCount}`);
  console.log(`   Flags:       ${flagCount}`);
  console.log(`   Recordings:  ${recordingCount}`);
  console.log("═══════════════════════════════════════");

  await connection.end();
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
