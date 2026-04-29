# NEON TESTAMENT: THE GOD INFERENCE

A complete 10-minute browser horror game built with Vite, TypeScript, and Phaser 3.

You play an Acolyte-Operator auditing SERAPH-9 inside The Chancel Array, a cyberpunk cathedral-laboratory where prayer, confession, judgment, and death certification have been outsourced to an ancient AI.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5181](http://localhost:5181), or the local URL printed by Vite. The game targets a 1280x720 logical canvas and scales responsively.

## Build

```bash
npm run build
npm run preview
```

## Generate Audio

Create a `.env` file with:

```text
GEMINI_API_KEY=your_key_here
```

Then run:

```bash
npm run generate:audio
```

The script uses Gemini API model `lyria-3-pro-preview` for music/SFX generation and writes files into `public/assets/audio`. If the key is missing or a generation job fails, the game still runs with WebAudio fallback drones and synthesized SFX. The script writes `public/assets/audio/generation-status.json`.

Official Gemini music generation reference used for the script: https://ai.google.dev/gemini-api/docs/music-generation

## Project Layout

- `src/game/data/story.ts` - complete story graph, choices, conditions, effects, and endings.
- `src/game/systems/GameState.ts` - meters, relics, flags, save/load, effect application.
- `src/game/systems/AudioManager.ts` - Gemini asset playback when present, WebAudio fallback when absent.
- `src/game/systems/VisualEffects.ts` - CRT noise, scanlines, particles, flashes, scene overlays.
- `src/game/scenes/*` - Phaser boot, preload, title, story, and ending scenes.
- `public/assets/images` - imagegen-generated backgrounds and overlay assets.
- `public/assets/image-prompts` and `scripts/imagegenPlan.md` - reusable image prompts.
- `scripts/generateAudio.ts` - Gemini/Lyria audio generation script.
- `scripts/validateStory.ts` - story graph validation.

## Verification

```bash
npm run validate:story
npm run generate:manifest
npm run build
```

Gameplay does not require any network access after assets are generated.
