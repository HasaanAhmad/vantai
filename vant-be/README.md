# Vantai – Meeting Requirements Bot

A bot that joins meetings as a middleman to capture client requirements, listen to conversations, detect red flags, and automatically convert requirements into technical specifications—removing the need for manual requirement translation.

## Features (Planned)

- **Join meetings** via browser (Google Meet, Zoom, Teams, etc.)
- **Listen & transcribe** conversation in real time
- **Extract requirements** from client discussions
- **Detect red flags** in the conversation
- **Output technical requirements** – features, fixes, and specifications

## Project Structure

```
vantai/
├── src/
│   ├── app.ts              # Express app entry point
│   ├── config/             # Configuration
│   ├── routes/             # API routes (auth, meetings)
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic (meeting session)
│   ├── browser/            # Puppeteer browser session (audio-enabled)
│   ├── meeting/            # Meeting join logic
│   ├── prisma/             # Prisma schema & migrations
│   ├── generated/prisma/   # Generated Prisma client (gitignored)
│   └── types/              # Shared TypeScript types
├── documents/               # Meeting docs, transcripts, exports
├── prisma.config.ts        # Prisma config (schema path, datasource)
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- PostgreSQL database
- Google OAuth credentials (for auth)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `AUTH_SECRET` | Auth.js secret (min 32 chars). Generate with `openssl rand -hex 32` | Yes |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | Yes (for Google sign-in) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | Yes (for Google sign-in) |
| `PORT` | Server port | No (default: 3000) |
| `MEETING_URL` | Default meeting URL for CLI | No |
| `BOT_NAME` | Default bot display name | No |

### 3. Database setup

Run migrations to create tables (User, Account, Session, etc.):

```bash
pnpm exec prisma migrate deploy
```

Or for development with a fresh DB:

```bash
pnpm exec prisma migrate dev
```

### 4. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Google+ API** (or **Google Identity**)
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:{PORT}/auth/callback/google` (e.g. `http://localhost:6969/auth/callback/google` if PORT=6969)
6. Copy Client ID and Client Secret to `.env`

## Usage

### Start the server

```bash
pnpm dev
```

Server runs at `http://localhost:3000`.

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/auth/signin` | Sign in page |
| GET | `/auth/callback/google` | Google OAuth callback |
| GET | `/api/meetings/health` | Meeting service health |
| POST | `/api/meetings/join` | Trigger meeting bot (body: `{ meetingLink, name }`) |

### Join a meeting via API

```bash
curl -X POST http://localhost:3000/api/meetings/join \
  -H "Content-Type: application/json" \
  -d '{"meetingLink": "https://meet.google.com/abc-defg-hij", "name": "Vantai Bot"}'
```

The bot will:
1. Launch a visible browser with fake audio/video devices (mic/camera stay muted)
2. Navigate to the meeting URL
3. Enter your bot name in the "Your name" field
4. Click "Ask to join"

### Build for production

```bash
pnpm build
pnpm start
```

## Auth & Prisma

- **Auth.js** (`@auth/express`) with **Prisma adapter** for session storage
- **Google** provider for sign-in
- Prisma schema: `User`, `Account`, `Session`, `VerificationToken`, `Authenticator`
- Supports **Prisma Accelerate** (use `prisma://` URL for `DATABASE_URL`; set `DIRECT_DATABASE_URL` for migrations)

## Audio configuration

The bot uses Puppeteer with Chrome flags that enable audio/video for meetings:

- `--use-fake-device-for-media-stream` – fake mic/camera when no hardware
- `--use-fake-ui-for-media-stream` – auto-grant media permissions
- `--autoplay-policy=no-user-gesture-required` – allow meeting audio to play

**Note:** For real audio transmission in meetings, the browser runs in **headed mode** (visible window). Headless mode has limited audio support.

## Documents folder

The `documents/` folder is for:

- Meeting transcripts
- Exported requirements
- Red flag reports
- Technical specification outputs

## License

ISC
