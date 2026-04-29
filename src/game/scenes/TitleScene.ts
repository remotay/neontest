import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../Game";
import { AudioManager } from "../systems/AudioManager";
import { GameStore } from "../systems/GameState";

const store = new GameStore();

export class TitleScene extends Phaser.Scene {
  private mode: "menu" | "note" | "credits" = "menu";
  private panel?: Phaser.GameObjects.Container;

  constructor() {
    super("TitleScene");
  }

  create(): void {
    AudioManager.get().startTitle();
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "boot_chancel").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020006, 0.28).setOrigin(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0xff00cc, 0.035).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    this.renderMenu();
  }

  private renderMenu(): void {
    this.mode = "menu";
    this.panel?.destroy(true);
    this.panel = this.add.container(82, 82).setDepth(10);
    const title = this.add.text(0, 0, "NEON TESTAMENT", {
      fontFamily: '"Courier New", monospace',
      fontSize: "56px",
      color: "#fff37a",
      stroke: "#ff00cc",
      strokeThickness: 2,
    });
    const subtitle = this.add.text(4, 62, "THE GOD INFERENCE", {
      fontFamily: '"Courier New", monospace',
      fontSize: "30px",
      color: "#8ffcff",
    });
    const body = this.add.text(4, 124, "A short point-and-click horror liturgy inside a cyberpunk cathedral-laboratory.", {
      fontFamily: '"Courier New", monospace',
      fontSize: "18px",
      color: "#f5edff",
      wordWrap: { width: 660 },
    });
    this.panel.add([title, subtitle, body]);
    this.addButton(4, 208, "START NEW AUDIT", () => {
      void AudioManager.get().unlock();
      store.reset();
      this.scene.start("StoryScene", { sceneId: "boot_chancel", reset: true });
    });
    if (store.hasSave()) {
      this.addButton(4, 258, "CONTINUE SAVED AUDIT", () => {
        void AudioManager.get().unlock();
        this.scene.start("StoryScene", { sceneId: store.snapshot.currentSceneId });
      });
    }
    this.addButton(4, 318, "CONTENT NOTE", () => this.renderTextPanel("note"));
    this.addButton(4, 368, "CREDITS", () => this.renderTextPanel("credits"));
    this.addButton(4, 418, AudioManager.get().isMuted() ? "UNMUTE AUDIO" : "MUTE AUDIO", () => {
      AudioManager.get().toggleMute();
      this.renderMenu();
    });
  }

  private renderTextPanel(mode: "note" | "credits"): void {
    this.mode = mode;
    this.panel?.destroy(true);
    this.panel = this.add.container(86, 78).setDepth(10);
    const bg = this.add.rectangle(0, 0, 700, 500, 0x050008, 0.84).setOrigin(0);
    bg.setStrokeStyle(2, 0xff00cc, 0.5);
    const title = this.add.text(28, 28, mode === "note" ? "CONTENT NOTE" : "CREDITS", {
      fontFamily: '"Courier New", monospace',
      fontSize: "30px",
      color: "#fff37a",
    });
    const text = mode === "note"
      ? "This game contains fictional religious horror, cyberpunk theology, unsettling AI prophecy, death/fail states, body-horror imagery in text, flashing/glitch effects, and oppressive sound design. It does not depict real-world faiths or political groups."
      : "Design, writing, implementation, and integration: Codex.\n\nVisual assets: generated with Codex built-in imagegen and finalized locally into public/assets/images.\n\nAudio pipeline: Gemini API / Lyria 3 Pro Preview when GEMINI_API_KEY is present; WebAudio fallback synthesis when it is not.\n\nBuilt with Vite, TypeScript, and Phaser 3.";
    const body = this.add.text(28, 92, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: "20px",
      color: "#f5edff",
      wordWrap: { width: 640 },
      lineSpacing: 8,
    });
    this.panel.add([bg, title, body]);
    this.addButton(114, 518, "BACK", () => this.renderMenu());
  }

  private addButton(x: number, y: number, label: string, action: () => void): void {
    const rect = this.add.rectangle(x, y, 310, 36, 0x12001a, 0.9).setOrigin(0);
    rect.setStrokeStyle(1, 0x00eaff, 0.6);
    const text = this.add.text(x + 16, y + 9, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: "17px",
      color: "#f8f8ff",
    });
    rect.setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        rect.setFillStyle(0x2b0038, 0.95);
        text.setColor("#fff37a");
        AudioManager.get().playSfx("choice_hover");
      })
      .on("pointerout", () => {
        rect.setFillStyle(0x12001a, 0.9);
        text.setColor("#f8f8ff");
      })
      .on("pointerdown", () => {
        AudioManager.get().playSfx("click");
        action();
      });
    this.panel?.add([rect, text]);
  }
}
