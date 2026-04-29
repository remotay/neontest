import Phaser from "phaser";
import type { PlayerState } from "../systems/GameState";
import { UI_WIDTH, UI_X } from "../Game";

export class InventoryStrip {
  private readonly container: Phaser.GameObjects.Container;
  private readonly meterText: Phaser.GameObjects.Text;
  private readonly relicText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(UI_X, 610).setDepth(55);
    const bg = scene.add.rectangle(0, 0, UI_WIDTH, 76, 0x030006, 0.86).setOrigin(0);
    bg.setStrokeStyle(1, 0x00eaff, 0.35);
    this.meterText = scene.add.text(14, 10, "", {
      fontFamily: '"Courier New", monospace',
      fontSize: "13px",
      color: "#8ffcff",
      lineSpacing: 3,
      wordWrap: { width: UI_WIDTH - 24 },
    });
    this.relicText = scene.add.text(14, 44, "", {
      fontFamily: '"Courier New", monospace',
      fontSize: "13px",
      color: "#fff0a5",
      wordWrap: { width: UI_WIDTH - 24 },
      maxLines: 2,
    });
    this.container.add([bg, this.meterText, this.relicText]);
  }

  update(state: PlayerState): void {
    this.meterText.setText(`FAITH ${this.bars(state.faith)}  COR ${this.bars(state.corruption)}\nSIGNAL ${this.bars(state.signal)}`);
    const relics = state.relics.length > 0 ? state.relics.join(", ") : "No relics recorded";
    this.relicText.setText(`RELICS ${state.relics.length}: ${this.truncate(relics, 82)}`);
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private bars(value: number): string {
    return `[${"#".repeat(value)}${".".repeat(9 - value)}]`;
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, maxLength - 3)}...`;
  }
}
