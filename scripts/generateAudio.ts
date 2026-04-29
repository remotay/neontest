import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

type AudioJob = {
  id: string;
  filename: string;
  prompt: string;
  duration: string;
  mime?: "audio/mpeg" | "audio/wav";
};

const OUT_DIR = join(process.cwd(), "public", "assets", "audio");
const MODEL = "lyria-3-pro-preview";

const jobs: AudioJob[] = [
  { id: "main_theme", filename: "main_theme.mp3", duration: "75 seconds", prompt: "dark cyberpunk religious horror theme, slow tempo, distorted church organ, sub bass drone, glitch choir, metallic percussion, ominous but beautiful, seamless loop feeling, no famous artist imitation" },
  { id: "ambient_cathedral_loop", filename: "ambient_cathedral_loop.mp3", duration: "70 seconds", prompt: "low dark cathedral ambience, distant synthetic choir, server hum, soft electric crackle, ritual dread, seamless background loop, no lead melody" },
  { id: "ambient_deepnet_loop", filename: "ambient_deepnet_loop.mp3", duration: "70 seconds", prompt: "abstract digital abyss ambience, granular synth drones, underwater data pulses, distant modem shrieks, slow heartbeat bass, seamless loop" },
  { id: "ambient_goderror_loop", filename: "ambient_goderror_loop.mp3", duration: "70 seconds", prompt: "final act eldritch AI horror ambience, broken choir, corrupted organ, black metal drones without drums, unstable divine error, seamless loop" },
  { id: "bad_ending_stinger", filename: "bad_ending_stinger.mp3", duration: "5 seconds", prompt: "short horrifying bad ending music sting, distorted choir hit, metallic slam, glitch static decay, 5 seconds" },
  { id: "true_ending_theme", filename: "true_ending_theme.mp3", duration: "60 seconds", prompt: "strange hopeful cyberpunk sacred ending theme, gentle organ, soft synthetic choir, warm noise, unresolved mercy, 60 seconds" },
  { id: "click", filename: "click.wav", duration: "1 second", mime: "audio/wav", prompt: "short dry retro UI click, subtle static" },
  { id: "choice_hover", filename: "choice_hover.wav", duration: "1 second", mime: "audio/wav", prompt: "soft neon hover blip, cyberpunk terminal" },
  { id: "revelation_stinger", filename: "revelation_stinger.wav", duration: "4 seconds", mime: "audio/wav", prompt: "brief sacred revelation sting, choir swell, glitch shimmer, 4 seconds" },
  { id: "death_glitch", filename: "death_glitch.wav", duration: "3 seconds", mime: "audio/wav", prompt: "violent digital death glitch, distorted zap, static burst, 3 seconds" },
  { id: "inventory_acquire", filename: "inventory_acquire.wav", duration: "2 seconds", mime: "audio/wav", prompt: "small holy relic pickup chime, glass bell, soft digital sparkle" },
  { id: "ui_static_loop", filename: "ui_static_loop.mp3", duration: "45 seconds", prompt: "quiet CRT static and server room tone, seamless loop" },
];

const key = process.env.GEMINI_API_KEY;
if (key) {
  process.env.GOOGLE_API_KEY = key;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  if (!key) {
    console.warn("GEMINI_API_KEY is missing. Writing local WAV fallbacks for short SFX and relying on in-game WebAudio fallback for music loops.");
    await writeFallbackSfx();
    await writeManifest("fallback-no-key", []);
    return;
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const successes: string[] = [];
  const failures: Array<{ id: string; error: string }> = [];

  for (const job of jobs) {
    try {
      const data = await generateLyria(ai, job);
      await writeFile(join(OUT_DIR, job.filename), data);
      successes.push(job.id);
      console.log(`Generated ${job.filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ id: job.id, error: message });
      console.warn(`Lyria generation failed for ${job.id}: ${message}`);
      if (job.filename.endsWith(".wav")) {
        await writeFile(join(OUT_DIR, job.filename), synthWav(job.id));
        console.warn(`Wrote synthesized fallback ${job.filename}`);
      }
    }
  }

  await writeManifest("completed", failures);
  console.log(`Audio generation complete. Successes: ${successes.length}, failures: ${failures.length}`);
}

async function generateLyria(ai: GoogleGenAI, job: AudioJob): Promise<Buffer> {
  const contents = [{
    role: "user",
    parts: [{
      text: `${job.prompt}. Duration: ${job.duration}. Instrumental only. No vocals with intelligible lyrics. Avoid famous artist imitation. For loops, make the ending seamless and avoid hard cutoffs.`,
    }],
  }];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: job.mime === "audio/wav"
      ? { responseModalities: ["AUDIO"], responseMimeType: "audio/wav" }
      : undefined,
  });

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const inlineData = part.inlineData;
      if (inlineData?.data) {
        return Buffer.from(inlineData.data, "base64");
      }
    }
  }

  throw new Error("No inline audio data returned by Gemini.");
}

async function writeManifest(status: string, failures: Array<{ id: string; error: string }>): Promise<void> {
  await writeFile(
    join(OUT_DIR, "generation-status.json"),
    JSON.stringify({
      status,
      model: MODEL,
      generatedAt: new Date().toISOString(),
      jobs: jobs.map(({ id, filename, prompt, duration }) => ({ id, filename, prompt, duration })),
      failures,
    }, null, 2),
  );
}

async function writeFallbackSfx(): Promise<void> {
  for (const job of jobs.filter((item) => item.filename.endsWith(".wav"))) {
    await writeFile(join(OUT_DIR, job.filename), synthWav(job.id));
  }
}

function synthWav(id: string): Buffer {
  const sampleRate = 44100;
  const duration = id.includes("death") ? 0.65 : id.includes("revelation") ? 0.8 : 0.18;
  const samples = Math.floor(sampleRate * duration);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.max(0, 1 - t / duration);
    const base = id.includes("hover") ? 760 : id.includes("death") ? 95 : id.includes("inventory") ? 980 : 520;
    const noise = (Math.random() * 2 - 1) * (id.includes("death") ? 0.35 : 0.08);
    const wave = Math.sin(2 * Math.PI * (base + t * 900) * t) * envelope * 0.28 + noise * envelope;
    data.writeInt16LE(Math.max(-1, Math.min(1, wave)) * 0x7fff, i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
