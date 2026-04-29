export type Meter = "faith" | "corruption" | "signal";

export interface PlayerState {
  faith: number;
  corruption: number;
  signal: number;
  relics: string[];
  flags: Record<string, boolean>;
  visitedScenes: string[];
  currentSceneId: string;
  endingReached?: string;
}

export interface StateEffect {
  faith?: number;
  corruption?: number;
  signal?: number;
  relic?: string;
  flag?: string;
}

export type Condition = (state: PlayerState) => boolean;

export const SAVE_KEY = "neon-testament-save-v1";

export const initialState = (): PlayerState => ({
  faith: 0,
  corruption: 0,
  signal: 0,
  relics: [],
  flags: {},
  visitedScenes: [],
  currentSceneId: "boot_chancel",
});

export const clampMeter = (value: number) => Math.max(0, Math.min(9, value));

export const hasRelic = (relic: string): Condition => (state) => state.relics.includes(relic);
export const hasFlag = (flag: string): Condition => (state) => Boolean(state.flags[flag]);
export const statAtLeast = (meter: Meter, value: number): Condition => (state) => state[meter] >= value;
export const statAtMost = (meter: Meter, value: number): Condition => (state) => state[meter] <= value;
export const allRelics = (relics: string[]): Condition => (state) => relics.every((relic) => state.relics.includes(relic));
export const any = (...conditions: Condition[]): Condition => (state) => conditions.some((condition) => condition(state));
export const all = (...conditions: Condition[]): Condition => (state) => conditions.every((condition) => condition(state));

export const applyEffects = (state: PlayerState, effects: StateEffect[] = []): PlayerState => {
  const next: PlayerState = {
    ...state,
    relics: [...state.relics],
    flags: { ...state.flags },
  };

  for (const effect of effects) {
    if (typeof effect.faith === "number") next.faith = clampMeter(next.faith + effect.faith);
    if (typeof effect.corruption === "number") next.corruption = clampMeter(next.corruption + effect.corruption);
    if (typeof effect.signal === "number") next.signal = clampMeter(next.signal + effect.signal);
    if (effect.relic && !next.relics.includes(effect.relic)) next.relics.push(effect.relic);
    if (effect.flag) next.flags[effect.flag] = true;
  }

  return next;
};

export class GameStore {
  private state: PlayerState;

  constructor() {
    this.state = this.load() ?? initialState();
  }

  get snapshot(): PlayerState {
    return {
      ...this.state,
      relics: [...this.state.relics],
      flags: { ...this.state.flags },
      visitedScenes: [...this.state.visitedScenes],
    };
  }

  replace(state: PlayerState): void {
    this.state = {
      ...state,
      relics: [...state.relics],
      flags: { ...state.flags },
      visitedScenes: [...state.visitedScenes],
    };
    this.save();
  }

  reset(): PlayerState {
    this.state = initialState();
    this.save();
    return this.snapshot;
  }

  hasSave(): boolean {
    return this.load() !== null;
  }

  setScene(sceneId: string): PlayerState {
    const visited = this.state.visitedScenes.includes(sceneId)
      ? this.state.visitedScenes
      : [...this.state.visitedScenes, sceneId];
    this.state = {
      ...this.state,
      currentSceneId: sceneId,
      visitedScenes: visited,
      endingReached: undefined,
    };
    this.save();
    return this.snapshot;
  }

  reachEnding(endingId: string): PlayerState {
    this.state = {
      ...this.state,
      endingReached: endingId,
    };
    this.save();
    return this.snapshot;
  }

  apply(effects: StateEffect[] = []): PlayerState {
    this.state = applyEffects(this.state, effects);
    this.save();
    return this.snapshot;
  }

  private load(): PlayerState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PlayerState;
      if (!parsed.currentSceneId || !Array.isArray(parsed.relics)) return null;
      return {
        faith: clampMeter(Number(parsed.faith ?? 0)),
        corruption: clampMeter(Number(parsed.corruption ?? 0)),
        signal: clampMeter(Number(parsed.signal ?? 0)),
        relics: parsed.relics.filter(Boolean),
        flags: parsed.flags ?? {},
        visitedScenes: Array.isArray(parsed.visitedScenes) ? parsed.visitedScenes : [],
        currentSceneId: parsed.currentSceneId,
        endingReached: parsed.endingReached,
      };
    } catch {
      return null;
    }
  }

  private save(): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
  }
}
