export type ResourceType = 'lumber' | 'grain' | 'water' | 'sheep' | 'people';

export type Resources = Record<ResourceType, number>;

/** A sparse set of resource amounts, used for costs and production. */
export type ResourceAmounts = Partial<Resources>;

export type ImprovementType = 'house' | 'field' | 'well' | 'lumberMill' | 'pasture';

export interface Improvement {
  type: ImprovementType;
  level: number;
}

/** A map tile is either empty or holds one improvement. */
export type Tile = Improvement | null;

export type LogTone = 'info' | 'good' | 'bad';

export interface LogEntry {
  id: number;
  day: number;
  message: string;
  tone: LogTone;
}

export type GameStatus = 'playing' | 'won';

export interface GameState {
  day: number;
  /** Stockpiled resources. `people` counts idle villagers only. */
  resources: Resources;
  tiles: Tile[];
  log: LogEntry[];
  nextLogId: number;
  status: GameStatus;
}

export type GameAction =
  | { type: 'build'; index: number; improvement: ImprovementType }
  | { type: 'upgrade'; index: number }
  | { type: 'demolish'; index: number }
  | { type: 'endDay' }
  | { type: 'newGame' };
