# RoomRoast

Film a short lap of your room. RoomRoast pulls a handful of stills on-device, sends them to a
Supabase Edge Function that asks a vision model for a verdict, and shows you a comedic roast plus
two or three fixes you can actually afford.

Expo Go compatible — no dev client, no EAS build, no custom native modules.

## Privacy design

This is enforced in code, not just documented:

- **No server-side persistence.** The Edge Function holds the frames in request scope only. No
  Storage bucket, no table, no durable URL. Image bytes are never logged (`supabase/functions/roast/index.ts`).
- **On-device cleanup.** Every local file the app creates is tracked in a set. The moment a roast
  renders — and on every other exit from the flow — the video and all frames are deleted with
  `expo-file-system` (`App.tsx` → `purge()`, `src/lib/cleanup.ts`).
- **Full-resolution intermediates are discarded immediately** after each frame is downscaled
  (`src/lib/frames.ts`).
- **The LLM key never touches the client.** It lives only as an Edge Function secret. The app ships
  with the Supabase URL and anon key, both of which are public by design.
- Recording is muted, so no room audio is ever captured.

## Setup

### 1. Client env

```bash
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's
API settings.

### 2. Deploy the Edge Function

```bash
npm i -g supabase          # if you don't have the CLI
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy roast
```

The key must have credit on it, or the function returns
`"The roast service is misconfigured. Check its API key and credit balance."`

### 3. Run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Camera recording does not work in the iOS Simulator or Android
emulator — use a real phone.

## Flow

| Stage | Where |
|---|---|
| Record, max 15s, live timer + progress bar | `src/screens/RecordScreen.tsx` |
| Extract 5 frames, downscale to 768px long edge, JPEG q0.5 | `src/lib/frames.ts` |
| Confirm frames + video playback | `src/screens/ReviewScreen.tsx` |
| Upload base64 frames, vision call, structured result | `src/lib/roast.ts` → `supabase/functions/roast/index.ts` |
| Render roast + fixes, then wipe local files | `src/screens/ResultScreen.tsx`, `App.tsx` |
| Retry without re-recording (base64 kept in memory) | `src/screens/ErrorScreen.tsx` |

Phase state lives in one discriminated union in `App.tsx` — no router, since the flow is linear.

## API contract

`POST /functions/v1/roast`

```json
{ "images": ["<base64 jpeg>", "..."] }
```

```json
{ "roast": "string", "fixes": ["string", "string", "string"] }
```

Errors return `{ "error": "human readable message" }`. The model is asked to call a strict-schema
tool, so the JSON shape is guaranteed rather than parsed out of prose.

## Tuning

| Knob | File |
|---|---|
| Frame count, resolution, JPEG quality | `src/lib/frames.ts` |
| Recording cap, request timeout, persona name | `src/config.ts` |
| Model, effort level, roast persona and prompt | `supabase/functions/roast/index.ts` |

Effort is set to `low` to keep the demo wait short. Raise it to `medium` for sharper comedy at the
cost of a few more seconds.
