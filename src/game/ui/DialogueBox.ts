import Phaser from "phaser";
import { UI_WIDTH, UI_X } from "../Game";

export class DialogueBox {
  readonly container: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private fullText = "";
  private index = 0;
  private timer?: Phaser.Time.TimerEvent;
  private onDone?: () => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(UI_X, 34).setDepth(50);
    const bg = scene.add.rectangle(0, 0, UI_WIDTH, 388, 0x08000d, 0.82).setOrigin(0);
    bg.setStrokeStyle(2, 0xff00cc, 0.45);
    this.titleText = scene.add.text(20, 18, "", {
      fontFamily: '"Courier New", monospace',
      fontSize: "22px",
      color: "#fff37a",
      wordWrap: { width: UI_WIDTH - 38 },
      lineSpacing: 4,
    });
    this.bodyText = scene.add.text(20, 88, "", {
      fontFamily: '"Courier New", monospace',
      fontSize: "17px",
      color: "#e7f8ff",
      wordWrap: { width: UI_WIDTH - 38 },
      lineSpacing: 6,
    });
    this.container.add([bg, this.titleText, this.bodyText]);
  }

  start(title: string, paragraphs: string[], onDone: () => void): void {
    this.timer?.remove(false);
    this.titleText.setText(title.toUpperCase());
    this.fullText = paragraphs.join("\n\n");
    this.fitTitle();
    this.fitBody();
    this.bodyText.setText("");
    this.index = 0;
    this.onDone = onDone;
    this.timer = this.scene.time.addEvent({
      delay: 15,
      loop: true,
      callback: () => this.step(),
    });
  }

  skip(): boolean {
    if (this.index >= this.fullText.length) return false;
    this.timer?.remove(false);
    this.index = this.fullText.length;
    this.bodyText.setText(this.fullText);
    this.onDone?.();
    return true;
  }

  destroy(): void {
    this.timer?.remove(false);
    this.container.destroy(true);
  }

  private step(): void {
    this.index += 2;
    this.bodyText.setText(this.fullText.slice(0, this.index));
    if (this.index >= this.fullText.length) {
      this.timer?.remove(false);
      this.onDone?.();
    }
  }

  private fitTitle(): void {
    for (let size = 22; size >= 16; size -= 1) {
      this.titleText.setFontSize(size);
      if (this.titleText.height <= 60) return;
    }
  }

  private fitBody(): void {
    this.bodyText.setText(this.fullText);
    for (let size = 17; size >= 13; size -= 1) {
      this.bodyText.setFontSize(size);
      this.bodyText.setLineSpacing(size <= 14 ? 3 : 5);
      if (this.bodyText.height <= 282) return;
    }
  }
}
