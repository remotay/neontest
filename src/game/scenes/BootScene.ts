import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.input.setDefaultCursor("crosshair");
    this.scene.start("PreloadScene");
  }
}
