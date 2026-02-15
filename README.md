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
│   ├── browser/          # Puppeteer browser session (audio-enabled)
│   ├── meeting/          # Meeting join logic
│   ├── listeners/        # Conversation listeners (future)
│   ├── requirements/     # Requirements extraction (future)
│   ├── signals/          # Red flag detection (future)
│   ├── output/           # Technical requirements output (future)
│   ├── config/           # Configuration
│   ├── types/            # Shared TypeScript types
│   └── index.ts          # Entry point
├── documents/            # Meeting docs, transcripts, exports
├── package.json
└── README.md
```

## Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

## Setup

```bash
pnpm install
```

## Usage

### Join a meeting

Pass the meeting URL and bot name as arguments:

```bash
pnpm dev "https://meet.google.com/abc-defg-hij" "Vantai Bot"
```

The bot will:
1. Launch a visible browser with fake audio/video devices (mic/camera stay muted)
2. Navigate to the meeting URL
3. Enter your bot name in the "Your name" field
4. Click "Join now" or "Ask to join"

### Environment variables (optional)

| Variable      | Description                    | Default                    |
|---------------|--------------------------------|----------------------------|
| `MEETING_URL` | Full URL of the meeting to join | `https://meet.google.com/new` |
| `BOT_NAME`    | Display name in the meeting    | `Meeting Bot`              |

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
