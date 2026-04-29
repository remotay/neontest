import Phaser from "phaser";
import type { Choice } from "../data/story";
import type { PlayerState } from "../systems/GameState";
import { AudioManager } from "../systems/AudioManager";
import { UI_WIDTH, UI_X } from "../Game";

export class ChoicePanel {
  private readonly container: Phaser.GameObjects.Container;
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(UI_X, 432).setDepth(56);
  }

  show(choices: Choice[], state: PlayerState, onChoice: (choice: Choice) => void): void {
    this.clear();
    const visible = choices.filter((choice) => !choice.visibleIf || choice.visibleIf(state));
    const panelHeight = 168;
    const rowHeight = Math.floor(panelHeight / Math.max(visible.length, 1));
    const buttonHeight = Math.max(30, rowHeight - 4);
    const baseFontSize = visible.length >= 5 ? 12 : 14;
    visible.forEach((choice, index) => {
      const locked = Boolean(choice.require && !choice.require(state));
      const y = index * rowHeight;
      const btn = this.scene.add.container(0, y);
      const rect = this.scene.add.rectangle(0, 0, UI_WIDTH, buttonHeight, locked ? 0x1b101f : 0x13001d, locked ? 0.72 : 0.88).setOrigin(0);
      rect.setStrokeStyle(1, locked ? 0x59505f : 0xff00cc, locked ? 0.45 : 0.75);
      const label = locked ? `LOCKED: ${choice.lockedText ?? choice.label}` : choice.label;
      const text = this.scene.add.text(14, 5, label, {
        fontFamily: '"Courier New", monospace',
        fontSize: `${baseFontSize}px`,
        color: locked ? "#8b7a91" : "#f9f5ff",
        wordWrap: { width: UI_WIDTH - 28 },
        maxLines: 2,
      });
      this.fitChoiceText(text, buttonHeight, baseFontSize);
      btn.add([rect, text]);
      if (!locked) {
        rect.setInteractive({ useHandCursor: true })
          .on("pointerover", () => {
            rect.setFillStyle(0x260033, 0.94);
            text.setColor("#fff37a");
            AudioManager.get().playSfx("choice_hover");
          })
          .on("pointerout", () => {
            rect.setFillStyle(0x13001d, 0.88);
            text.setColor("#f9f5ff");
          })
          .on("pointerdown", () => onChoice(choice));
      }
      this.buttons.push(btn);
      this.container.add(btn);
    });
  }

  clear(): void {
    for (const button of this.buttons) button.destroy(true);
    this.buttons = [];
  }

  destroy(): void {
    this.clear();
    this.container.destroy(true);
  }

  private fitChoiceText(text: Phaser.GameObjects.Text, buttonHeight: number, baseFontSize: number): void {
    for (let size = baseFontSize; size >= 10; size -= 1) {
      text.setFontSize(size);
      if (text.height <= buttonHeight - 8) return;
    }
  }
}
