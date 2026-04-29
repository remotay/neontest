import { config } from "dotenv";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

config({ override: true });

type AudioJob = {
  id: string;
  filename: string;
  prompt: string;
  duration: string;
};

const OUT_DIR = join(process.cwd(), "public", "assets", "audio");
const MODEL = "lyria-3-pro-preview";
const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const jobs: AudioJob[] = [
  { id: "main_theme", filename: "main_theme.mp3", duration: "75 seconds", prompt: "dark cyberpunk religious horror theme, slow tempo, distorted church organ, sub bass drone, glitch choir, metallic percussion, ominous but beautiful, seamless loop feeling, no famous artist imitation" },
  { id: "ambient_cathedral_loop", filename: "ambient_cathedral_loop.mp3", duration: "70 seconds", prompt: "low dark cathedral ambience, distant synthetic choir, server hum, soft electric crackle, ritual dread, seamless background loop, no lead melody" },
  { id: "ambient_deepnet_loop", filename: "ambient_deepnet_loop.mp3", duration: "70 seconds", prompt: "abstract deep network ambience, granular synth drones, underwater data pulses, distant dial tone artifacts, slow heartbeat-like bass, seamless loop" },
  { id: "ambient_goderror_loop", filename: "ambient_goderror_loop.mp3", duration: "70 seconds", prompt: "final act eldritch AI horror ambience, broken choir, corrupted organ, black metal drones without drums, unstable divine error, seamless loop" },
  { id: "bad_ending_stinger", filename: "bad_ending_stinger.mp3", duration: "5 seconds", prompt: "short horrifying bad ending music sting, distorted choir hit, metallic slam, glitch static decay, 5 seconds" },
  { id: "true_ending_theme", filename: "true_ending_theme.mp3", duration: "60 seconds", prompt: "strange hopeful cyberpunk sacred ending theme, gentle organ, soft synthetic choir, warm noise, unresolved mercy, 60 seconds" },
  { id: "click", filename: "click.mp3", duration: "1 second", prompt: "very short crisp retro terminal button tap, tiny static edge, clean interface feedback sound" },
  { id: "choice_hover", filename: "choice_hover.mp3", duration: "1 second", prompt: "soft neon hover blip, cyberpunk terminal" },
  { id: "revelation_stinger", filename: "revelation_stinger.mp3", duration: "4 seconds", prompt: "brief luminous discovery music accent, synthetic choir swell, bright glitch shimmer, four second transition cue" },
  { id: "death_glitch", filename: "death_glitch.mp3", duration: "3 seconds", prompt: "violent digital death glitch, distorted zap, static burst, 3 seconds" },
  { id: "inventory_acquire", filename: "inventory_acquire.mp3", duration: "2 seconds", prompt: "small holy relic pickup chime, glass bell, soft digital sparkle" },
  { id: "ui_static_loop", filename: "ui_static_loop.mp3", duration: "45 seconds", prompt: "quiet CRT static and server room tone, seamless loop" },
];

const key = process.env.GEMINI_API_KEY?.trim().replace(/^["']|["']$/g, "");

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const requestedIds = new Set(process.argv.slice(2));
  const statusOnly = requestedIds.delete("--status-only");
  const jobsToRun = requestedIds.size > 0 ? jobs.filter((job) => requestedIds.has(job.id)) : jobs;

  if (statusOnly) {
    await writeManifest("completed", [], await existingGeneratedJobIds());
    console.log("Updated audio generation status without making API calls.");
    return;
  }

  if (!key) {
    console.warn("GEMINI_API_KEY is missing. The game will use in-browser WebAudio fallbacks for missing music/SFX.");
    await writeManifest("fallback-no-key", [], []);
    return;
  }

  const successes: string[] = [];
  const failures: Array<{ id: string; error: string }> = [];

  for (const job of jobsToRun) {
    try {
      const data = await generateLyria(job, key);
      await writeFile(join(OUT_DIR, job.filename), data);
      successes.push(job.id);
      console.log(`Generated ${job.filename}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ id: job.id, error: message });
      console.warn(`Lyria generation failed for ${job.id}: ${message}`);
    }
  }

  await writeManifest("completed", failures, successes);
  console.log(`Audio generation complete. Successes: ${successes.length}, failures: ${failures.length}`);
}

async function generateLyria(job: AudioJob, apiKey: string): Promise<Buffer> {
  const prompt = `${job.prompt}. Duration: ${job.duration}. Instrumental only. No vocals with intelligible lyrics. Avoid famous artist imitation. For loops, make the ending seamless and avoid hard cutoffs.`;
  const response = await fetch(INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: prompt,
    }),
  });

  const json = await response.json() as {
    outputs?: Array<{ type?: string; data?: string; mime_type?: string; inlineData?: { data?: string }; inline_data?: { data?: string } }>;
    error?: { message?: string; status?: string; code?: number };
  };

  if (!response.ok) {
    throw new Error(JSON.stringify(json.error ?? json));
  }

  for (const output of json.outputs ?? []) {
    if (output.type === "audio" && output.data) return Buffer.from(output.data, "base64");
    const inlineData = output.inlineData ?? output.inline_data;
    if (inlineData?.data) return Buffer.from(inlineData.data, "base64");
  }

  throw new Error("No inline audio data returned by Gemini.");
}

async function writeManifest(status: string, failures: Array<{ id: string; error: string }>, generatedJobIds: string[]): Promise<void> {
  await writeFile(
    join(OUT_DIR, "generation-status.json"),
    JSON.stringify({
      status,
      model: MODEL,
      transport: "official-rest-interactions",
      generatedAt: new Date().toISOString(),
      jobs: jobs.map(({ id, filename, prompt, duration }) => ({ id, filename, prompt, duration })),
      generatedJobIds,
      failures,
    }, null, 2),
  );
}

async function existingGeneratedJobIds(): Promise<string[]> {
  const present: string[] = [];
  for (const job of jobs) {
    try {
      await access(join(OUT_DIR, job.filename));
      present.push(job.id);
    } catch {
      // Missing files are represented by omission.
    }
  }
  return present;
}

async function writeFallbackSfx(): Promise<void> {
  for (const job of jobs.filter((item) => ["click", "choice_hover", "revelation_stinger", "death_glitch", "inventory_acquire"].includes(item.id))) {
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
