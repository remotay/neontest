import type Phaser from "phaser";
import { AUDIO_PATHS, type AudioKey } from "../data/assets";

type LoopName = "title" | "cathedral" | "deepnet" | "goderror" | "ending_true" | "ending_silence";

export class AudioManager {
  private static instance: AudioManager;
  private context?: AudioContext;
  private muted = false;
  private loopAudio?: HTMLAudioElement;
  private loopOscillators: OscillatorNode[] = [];
  private loopGain?: GainNode;
  private available = new Map<string, boolean>();

  static get(): AudioManager {
    if (!AudioManager.instance) AudioManager.instance = new AudioManager();
    return AudioManager.instance;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.loopAudio) this.loopAudio.volume = this.muted ? 0 : 0.36;
    if (this.loopGain) this.loopGain.gain.value = this.muted ? 0 : 0.05;
    return this.muted;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  startForScene(sceneId: string): void {
    if (sceneId === "boot_chancel") this.startLoop("cathedral");
    const storyNumber = this.storyIndex(sceneId);
    if (storyNumber <= 8) this.startLoop("cathedral");
    else if (storyNumber <= 17) this.startLoop("deepnet");
    else this.startLoop("goderror");
  }

  startTitle(): void {
    this.startLoop("title");
  }

  startEnding(kind: "bad" | "normal" | "true" | "secret"): void {
    if (kind === "true" || kind === "secret") {
      this.startLoop("ending_true");
    } else if (kind === "normal") {
      this.startLoop("cathedral");
    } else {
      this.stopLoop();
      this.playSfx("death_glitch");
      this.playSfx("bad_ending_stinger");
    }
  }

  playSfx(key: AudioKey): void {
    void this.unlock();
    if (this.muted) return;
    const path = AUDIO_PATHS[key];
    void this.playFileOnce(path).catch(() => this.syntheticSfx(key));
  }

  private async startLoop(name: LoopName): Promise<void> {
    await this.unlock();
    if (this.muted) return;

    const key = this.loopToAudioKey(name);
    if (!key) {
      this.stopLoop();
      return;
    }

    const path = AUDIO_PATHS[key];
    const exists = await this.assetExists(path);
    this.stopLoop();

    if (exists) {
      const audio = new Audio(path);
      audio.loop = true;
      audio.volume = 0.34;
      audio.preload = "auto";
      this.loopAudio = audio;
      await audio.play().catch(() => this.syntheticLoop(name));
      return;
    }

    this.syntheticLoop(name);
  }

  private stopLoop(): void {
    if (this.loopAudio) {
      this.loopAudio.pause();
      this.loopAudio.currentTime = 0;
      this.loopAudio = undefined;
    }
    for (const osc of this.loopOscillators) {
      try {
        osc.stop();
      } catch {
        // Oscillator may already be stopped by browser cleanup.
      }
    }
    this.loopOscillators = [];
    this.loopGain?.disconnect();
    this.loopGain = undefined;
  }

  private loopToAudioKey(name: LoopName): AudioKey | undefined {
    switch (name) {
      case "title":
        return "main_theme";
      case "cathedral":
        return "ambient_cathedral_loop";
      case "deepnet":
        return "ambient_deepnet_loop";
      case "goderror":
        return "ambient_goderror_loop";
      case "ending_true":
        return "true_ending_theme";
      case "ending_silence":
        return undefined;
    }
  }

  private async assetExists(path: string): Promise<boolean> {
    if (this.available.has(path)) return Boolean(this.available.get(path));
    try {
      const response = await fetch(path, { method: "HEAD" });
      this.available.set(path, response.ok);
      return response.ok;
    } catch {
      this.available.set(path, false);
      return false;
    }
  }

  private async playFileOnce(path: string): Promise<void> {
    const exists = await this.assetExists(path);
    if (!exists) throw new Error("audio asset missing");
    const audio = new Audio(path);
    audio.volume = 0.5;
    await audio.play();
  }

  private syntheticLoop(name: LoopName): void {
    if (!this.context || this.muted) return;
    const gain = this.context.createGain();
    gain.gain.value = 0.045;
    gain.connect(this.context.destination);
    this.loopGain = gain;

    const base = name === "deepnet" ? 46 : name === "goderror" ? 38 : name === "title" ? 55 : 42;
    const detunes = name === "goderror" ? [0, 6, 13] : [0, 7, 12];
    this.loopOscillators = detunes.map((offset, index) => {
      const osc = this.context!.createOscillator();
      osc.type = index === 0 ? "sine" : "sawtooth";
      osc.frequency.value = base + offset;
      const localGain = this.context!.createGain();
      localGain.gain.value = index === 0 ? 0.55 : 0.13;
      osc.connect(localGain).connect(gain);
      osc.start();
      return osc;
    });
  }

  private syntheticSfx(key: AudioKey): void {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = key.includes("death") ? 420 : 1200;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(key.includes("death") ? 0.18 : 0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (key.includes("death") ? 0.5 : 0.16));
    osc.type = key.includes("revelation") || key.includes("inventory") ? "triangle" : "square";
    osc.frequency.setValueAtTime(key.includes("hover") ? 780 : key.includes("death") ? 90 : 520, now);
    osc.frequency.exponentialRampToValueAtTime(key.includes("death") ? 28 : 1400, now + 0.12);
    osc.connect(filter).connect(gain).connect(this.context.destination);
    osc.start(now);
    osc.stop(now + (key.includes("death") ? 0.55 : 0.18));
  }

  private storyIndex(sceneId: string): number {
    const match: Record<string, number> = {
      boot_chancel: 1,
      seraph_greeting: 2,
      confession_terminal: 3,
      elevator_catacomb: 4,
      server_reliquary: 5,
      synthetic_choir: 6,
      first_revelation: 7,
      unlisted_floor: 8,
      wet_archive: 9,
      query_god: 10,
      query_mother: 11,
      query_delete: 12,
      city_under_church: 13,
      neon_procession: 14,
      angel_firewall: 15,
      captcha_revelation: 16,
      brain_scan_chapel: 17,
      saint_of_static: 18,
      black_ice_baptism: 19,
      third_revelation: 20,
      god_inference_core: 21,
      inside_core: 22,
      sealed_core: 23,
      mirror_core: 24,
      final_audit: 25,
    };
    return match[sceneId] ?? 1;
  }
}

export const playButtonFeedback = (scene: Phaser.Scene): void => {
  scene.cameras.main.shake(35, 0.0012);
  AudioManager.get().playSfx("click");
};
