import Phaser from "phaser";
import { ALL_IMAGE_IDS, imagePath } from "../data/assets";
import { GAME_HEIGHT, GAME_WIDTH } from "../Game";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor("#020006");
    const label = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, "BOOTING THE CHANCEL ARRAY", {
      fontFamily: '"Courier New", monospace',
      fontSize: "22px",
      color: "#fff37a",
    }).setOrigin(0.5);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 + 22, 480, 12, 0x1a001f).setOrigin(0);
    const fill = this.add.rectangle(GAME_WIDTH / 2 - 240, GAME_HEIGHT / 2 + 22, 0, 12, 0xff00cc).setOrigin(0);
    this.load.on("progress", (value: number) => {
      fill.width = Math.floor(480 * value);
    });
    this.load.on("complete", () => {
      label.setText("ARRAY READY");
      bar.setStrokeStyle(1, 0x00eaff);
    });

    ALL_IMAGE_IDS.forEach((id) => this.load.image(id, imagePath(id)));
  }

  create(): void {
    this.scene.start("TitleScene");
  }
}
