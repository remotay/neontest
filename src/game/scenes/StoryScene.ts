import Phaser from "phaser";
import { getStoryNode, type Choice, type ChoiceOutcome, type StoryNode } from "../data/story";
import { GAME_HEIGHT, GAME_WIDTH, UI_WIDTH, UI_X } from "../Game";
import { AudioManager, playButtonFeedback } from "../systems/AudioManager";
import { GameStore, type PlayerState } from "../systems/GameState";
import { VisualEffects } from "../systems/VisualEffects";
import { ChoicePanel } from "../ui/ChoicePanel";
import { DialogueBox } from "../ui/DialogueBox";
import { InventoryStrip } from "../ui/InventoryStrip";

const store = new GameStore();

export class StoryScene extends Phaser.Scene {
  private state!: PlayerState;
  private node!: StoryNode;
  private bg?: Phaser.GameObjects.Image;
  private effects!: VisualEffects;
  private dialogue?: DialogueBox;
  private choices?: ChoicePanel;
  private inventory?: InventoryStrip;
  private sceneLabel?: Phaser.GameObjects.Text;
  private inputLocked = false;

  constructor() {
    super("StoryScene");
  }

  init(data: { sceneId?: string; reset?: boolean }): void {
    if (data.reset) this.state = store.reset();
    else this.state = store.snapshot;
    if (data.sceneId) this.state.currentSceneId = data.sceneId;
  }

  create(): void {
    void AudioManager.get().unlock();
    this.effects = new VisualEffects(this);
    this.effects.create();
    this.dialogue = new DialogueBox(this);
    this.choices = new ChoicePanel(this);
    this.inventory = new InventoryStrip(this);
    this.addUiFrame();
    this.input.on("pointerdown", () => {
      if (this.inputLocked) return;
      if (this.dialogue?.skip()) AudioManager.get().playSfx("click");
    });
    this.input.keyboard?.on("keydown-M", () => AudioManager.get().toggleMute());
    this.input.keyboard?.on("keydown-R", () => this.scene.start("TitleScene"));
    this.showNode(this.state.currentSceneId);
  }

  update(): void {
    this.effects.tick();
  }

  private showNode(sceneId: string): void {
    this.node = getStoryNode(sceneId);
    this.state = store.setScene(sceneId);
    AudioManager.get().startForScene(sceneId);
    this.effects.bindSceneOverlay(sceneId);
    this.choices?.clear();
    this.inventory?.update(this.state);

    if (!this.bg) {
      this.bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, this.node.image).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);
    } else {
      this.bg.setTexture(this.node.image).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    }
    this.bg.setAlpha(0.1);
    this.tweens.add({ targets: this.bg, alpha: 1, duration: 280 });
    this.sceneLabel?.setText(`${this.node.act.toUpperCase()} // ${this.node.id}`);
    this.dialogue?.start(this.node.title, this.node.body, () => {
      this.choices?.show(this.node.choices, this.state, (choice) => this.choose(choice));
    });
  }

  private choose(choice: Choice): void {
    if (this.inputLocked) return;
    if (choice.require && !choice.require(this.state)) return;
    this.inputLocked = true;
    playButtonFeedback(this);
    const outcome: ChoiceOutcome = choice.resolve ? choice.resolve(this.state) : {
      target: choice.target,
      ending: choice.ending,
      effects: choice.effects,
    };
    const effects = [...(choice.effects ?? []), ...(outcome.effects ?? [])];
    const beforeRelics = this.state.relics.length;
    this.state = store.apply(effects);
    if (this.state.relics.length > beforeRelics) AudioManager.get().playSfx("inventory_acquire");
    if (choice.revelation) {
      this.effects.revelationFlash();
      AudioManager.get().playSfx("revelation_stinger");
    }
    this.inventory?.update(this.state);

    this.time.delayedCall(choice.death || outcome.ending ? 280 : 180, () => {
      this.inputLocked = false;
      if (outcome.ending) {
        if (choice.death) this.effects.deathGlitch();
        store.reachEnding(outcome.ending);
        this.scene.start("EndingScene", { endingId: outcome.ending });
        return;
      }
      if (outcome.target) this.showNode(outcome.target);
    });
  }

  private addUiFrame(): void {
    this.add.rectangle(UI_X - 16, 0, UI_WIDTH + 56, GAME_HEIGHT, 0x040006, 0.62).setOrigin(0).setDepth(38);
    this.add.rectangle(UI_X - 18, 0, 2, GAME_HEIGHT, 0xff00cc, 0.55).setOrigin(0).setDepth(58);
    this.sceneLabel = this.add.text(22, 20, "", {
      fontFamily: '"Courier New", monospace',
      fontSize: "15px",
      color: "#8ffcff",
    }).setDepth(58);
    const controls = this.add.text(22, 672, "CLICK: SKIP TEXT  //  M: MUTE  //  R: TITLE", {
      fontFamily: '"Courier New", monospace',
      fontSize: "14px",
      color: "#b9d4de",
    }).setDepth(58);
    controls.setAlpha(0.72);
  }
}
