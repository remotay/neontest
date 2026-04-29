import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../Game";

export class VisualEffects {
  private noise?: Phaser.GameObjects.Graphics;
  private scanlines?: Phaser.GameObjects.Graphics;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private overlay?: Phaser.GameObjects.Image;
  private flash?: Phaser.GameObjects.Rectangle;

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    this.createScanlines();
    this.createNoise();
    this.createParticles();
    this.flash = this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0).setOrigin(0).setDepth(90);
  }

  bindSceneOverlay(sceneId: string): void {
    this.overlay?.destroy();
    const overlayKey = this.overlayForScene(sceneId);
    if (!overlayKey || !this.scene.textures.exists(overlayKey)) return;
    this.overlay = this.scene.add.image(455, 360, overlayKey).setDepth(25).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: { from: 0.07, to: 0.28 },
      scaleX: { from: 1, to: 1.025 },
      scaleY: { from: 1, to: 0.985 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  tick(): void {
    if (!this.noise) return;
    this.noise.clear();
    for (let i = 0; i < 105; i += 1) {
      const alpha = Phaser.Math.FloatBetween(0.015, 0.065);
      const color = Phaser.Utils.Array.GetRandom([0xff00b8, 0x00eaff, 0xffff4d, 0xffffff]);
      this.noise.fillStyle(color, alpha);
      this.noise.fillRect(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.Between(1, 3), 1);
    }
  }

  revelationFlash(): void {
    if (!this.flash) return;
    this.scene.cameras.main.shake(160, 0.008);
    this.flash.setFillStyle(0xfff5a3, 0.5);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 260, ease: "Quad.easeOut" });
  }

  deathGlitch(): void {
    if (!this.flash) return;
    this.scene.cameras.main.shake(600, 0.02);
    this.flash.setFillStyle(0xff0038, 0.65);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 520, ease: "Stepped" });
  }

  private createScanlines(): void {
    this.scanlines = this.scene.add.graphics().setDepth(80);
    this.scanlines.fillStyle(0x000000, 0.22);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      this.scanlines.fillRect(0, y, GAME_WIDTH, 1);
    }
  }

  private createNoise(): void {
    this.noise = this.scene.add.graphics().setDepth(82).setBlendMode(Phaser.BlendModes.ADD);
  }

  private createParticles(): void {
    const textureKey = "glyph-pixel";
    if (!this.scene.textures.exists(textureKey)) {
      const g = this.scene.add.graphics();
      g.fillStyle(0x00fff0, 1).fillRect(0, 0, 2, 2);
      g.generateTexture(textureKey, 2, 2);
      g.destroy();
    }

    this.particles = this.scene.add.particles(0, 0, textureKey, {
      x: { min: 0, max: GAME_WIDTH },
      y: GAME_HEIGHT + 8,
      lifespan: { min: 2800, max: 6200 },
      speedY: { min: -22, max: -6 },
      speedX: { min: -8, max: 8 },
      scale: { min: 1, max: 3 },
      alpha: { start: 0.18, end: 0 },
      quantity: 1,
      frequency: 95,
      tint: [0xff00bc, 0x00eaff, 0xfff05a],
      blendMode: "ADD",
    }).setDepth(24);
  }

  private overlayForScene(sceneId: string): string | undefined {
    if (["seraph_greeting", "final_audit"].includes(sceneId)) return "overlay_seraph_eyes";
    if (["god_inference_core", "final_audit"].includes(sceneId)) return "overlay_neural_heart";
    if (sceneId === "synthetic_choir") return "overlay_waveform_choir";
    if (sceneId === "black_ice_baptism") return "overlay_black_ice";
    if (sceneId === "saint_of_static") return "overlay_static_aura";
    if (sceneId === "mirror_core") return "overlay_mirror_ripple";
    if (sceneId.includes("revelation")) return "overlay_revelation_flash";
    return undefined;
  }
}
