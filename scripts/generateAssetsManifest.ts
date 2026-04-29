import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function main(): Promise<void> {
  const imagesDir = join(process.cwd(), "public", "assets", "images");
  const audioDir = join(process.cwd(), "public", "assets", "audio");
  const [images, audio] = await Promise.all([
    readdir(imagesDir).catch(() => []),
    readdir(audioDir).catch(() => []),
  ]);
  const manifest = {
    generatedAt: new Date().toISOString(),
    images: images.filter((name) => /\.(png|webp)$/i.test(name)).sort(),
    audio: audio.filter((name) => /\.(mp3|wav|ogg|json)$/i.test(name)).sort(),
  };
  await writeFile(join(process.cwd(), "public", "assets", "assets-manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`Wrote manifest with ${manifest.images.length} images and ${manifest.audio.length} audio/status files.`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
