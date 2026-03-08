# F&I Co-Pilot — Environment Variables Reference

This document lists all environment variables used by the application.
All secrets are managed through the Manus platform secrets manager — never commit `.env` files.

## Automatically Injected by Manus Platform

These are pre-configured and do not require manual setup:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Session cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (frontend) |
| `OWNER_OPEN_ID` | Owner's Manus OpenID |
| `OWNER_NAME` | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Manus built-in APIs base URL |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for server-side Manus APIs |
| `VITE_FRONTEND_FORGE_API_KEY` | Bearer token for frontend Manus APIs |
| `VITE_FRONTEND_FORGE_API_URL` | Manus APIs URL for frontend |
| `VITE_ANALYTICS_ENDPOINT` | Analytics collection endpoint |
| `VITE_ANALYTICS_WEBSITE_ID` | Analytics website identifier |
| `VITE_APP_TITLE` | Application display title |
| `VITE_APP_LOGO` | Application logo CDN URL |

## Required — Must Be Set

| Variable | Description | How to Get |
|---|---|---|
| `ENCRYPTION_KEY` | 64-char hex string for AES-256-GCM field-level encryption (CFPB compliance). Encrypts customerName, transcripts, compliance excerpts, audio URLs. | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## Optional — Enhanced Features

| Variable | Description | How to Get | Fallback |
|---|---|---|---|
| `DEEPGRAM_API_KEY` | Real-time server-side transcription via Deepgram | [console.deepgram.com](https://console.deepgram.com) | Browser SpeechRecognition (demo mode) |
| `RESEND_API_KEY` | Email notifications for critical compliance alerts | [resend.com/api-keys](https://resend.com/api-keys) | Silent no-op (no errors) |
| `EMAIL_FROM` | Verified sender email address for Resend | Must be a verified domain in Resend | `noreply@fi-copilot.com` |

## Email Notification Triggers (when RESEND_API_KEY is set)

- **Critical compliance flag** — sent immediately when a TILA/ECOA/UDAP violation is detected during a live session
- **Session summary** — sent after grading completes with score breakdown and coaching recommendations

## Encryption Details

The `ENCRYPTION_KEY` is used for AES-256-GCM field-level encryption of all PII fields:
- `sessions.customerName`
- `transcripts.text`
- `compliance_flags.excerpt`
- `audio_recordings.fileUrl`

The `decrypt()` function is backward-compatible: values not starting with `enc:v1:` are returned as-is, allowing gradual migration of legacy plaintext data.

To encrypt existing plaintext data, run:
```bash
node server/migrate-encrypt.mjs
```
