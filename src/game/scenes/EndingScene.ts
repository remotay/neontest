import Phaser from "phaser";
import { getEnding, type EndingNode } from "../data/story";
import { GAME_HEIGHT, GAME_WIDTH } from "../Game";
import { AudioManager } from "../systems/AudioManager";
import { GameStore } from "../systems/GameState";
import { VisualEffects } from "../systems/VisualEffects";

const store = new GameStore();

export class EndingScene extends Phaser.Scene {
  private ending!: EndingNode;
  private effects!: VisualEffects;

  constructor() {
    super("EndingScene");
  }

  init(data: { endingId: string }): void {
    this.ending = getEnding(data.endingId);
  }

  create(): void {
    store.reachEnding(this.ending.id);
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.ending.image).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x020006, this.ending.kind === "bad" ? 0.24 : 0.14).setOrigin(0);
    this.effects = new VisualEffects(this);
    this.effects.create();
    if (this.ending.kind === "bad") this.effects.deathGlitch();
    else this.effects.revelationFlash();
    AudioManager.get().startEnding(this.ending.kind);

    const kind = this.ending.kind === "bad" ? "BAD ENDING" : this.ending.kind === "normal" ? "ENDING" : this.ending.kind === "secret" ? "SECRET ENDING" : "TRUE ENDING";
    this.add.text(76, 70, kind, {
      fontFamily: '"Courier New", monospace',
      fontSize: "22px",
      color: this.ending.kind === "bad" ? "#ff6b9f" : "#8ffcff",
    }).setDepth(20);
    const titleText = this.add.text(76, 108, this.ending.title.toUpperCase(), {
      fontFamily: '"Courier New", monospace',
      fontSize: "46px",
      color: "#fff37a",
      stroke: "#260017",
      strokeThickness: 4,
      wordWrap: { width: 760 },
    }).setDepth(20);
    this.fitText(titleText, 760, 100, 46, 30);
    const bodyText = this.add.text(80, 230, this.ending.body.join("\n\n"), {
      fontFamily: '"Courier New", monospace',
      fontSize: "21px",
      color: "#f6efff",
      lineSpacing: 10,
      wordWrap: { width: 670 },
    }).setDepth(20);
    this.fitText(bodyText, 670, 310, 21, 15);

    this.addButton(82, 592, "RESTART AUDIT", () => {
      store.reset();
      this.scene.start("StoryScene", { sceneId: "boot_chancel", reset: true });
    });
    this.addButton(332, 592, "TITLE SCREEN", () => this.scene.start("TitleScene"));
  }

  update(): void {
    this.effects.tick();
  }

  private addButton(x: number, y: number, label: string, action: () => void): void {
    const rect = this.add.rectangle(x, y, 210, 38, 0x100018, 0.9).setOrigin(0).setDepth(25);
    rect.setStrokeStyle(1, 0x00eaff, 0.6);
    const text = this.add.text(x + 14, y + 10, label, {
      fontFamily: '"Courier New", monospace',
      fontSize: "16px",
      color: "#f8f8ff",
    }).setDepth(26);
    rect.setInteractive({ useHandCursor: true })
      .on("pointerover", () => {
        rect.setFillStyle(0x2b0038, 0.95);
        text.setColor("#fff37a");
        AudioManager.get().playSfx("choice_hover");
      })
      .on("pointerout", () => {
        rect.setFillStyle(0x100018, 0.9);
        text.setColor("#f8f8ff");
      })
      .on("pointerdown", () => {
        AudioManager.get().playSfx("click");
        action();
      });
  }

  private fitText(text: Phaser.GameObjects.Text, maxWidth: number, maxHeight: number, startSize: number, minSize: number): void {
    text.setWordWrapWidth(maxWidth);
    for (let size = startSize; size >= minSize; size -= 1) {
      text.setFontSize(size);
      if (text.width <= maxWidth && text.height <= maxHeight) return;
    }
  }
}
