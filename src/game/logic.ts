import {
  GRID_SIZE,
  IMPROVEMENTS,
  MAX_LEVEL,
  MAX_LOG_ENTRIES,
  POPULATION_GOAL,
  RESOURCES,
  RESOURCE_TYPES,
  STARTING_RESOURCES,
  UPKEEP_PER_PERSON,
} from './config';
import type {
  GameAction,
  GameState,
  ImprovementType,
  LogTone,
  ResourceAmounts,
  Resources,
  Tile,
} from './types';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Price of taking an improvement of `type` to `level` (1-based). */
export function getCost(type: ImprovementType, level: number): ResourceAmounts {
  return IMPROVEMENTS[type].costs[level - 1] ?? {};
}

/** The resources still needed to pay `cost`, or an empty object if affordable. */
export function getShortfall(resources: Resources, cost: ResourceAmounts): ResourceAmounts {
  const shortfall: ResourceAmounts = {};
  for (const type of RESOURCE_TYPES) {
    const missing = (cost[type] ?? 0) - resources[type];
    if (missing > 0) shortfall[type] = missing;
  }
  return shortfall;
}

export function canAfford(resources: Resources, cost: ResourceAmounts): boolean {
  return Object.keys(getShortfall(resources, cost)).length === 0;
}

/** Villagers assigned to work an improvement (one per level for producers). */
export function getWorkers(tile: Tile): number {
  if (!tile) return 0;
  let workers = 0;
  for (let level = 1; level <= tile.level; level++) {
    workers += getCost(tile.type, level).people ?? 0;
  }
  return workers;
}

/** Villagers who live in an improvement (houses only). */
export function getResidents(tile: Tile): number {
  const housing = tile && IMPROVEMENTS[tile.type].housing;
  if (!tile || !housing) return 0;
  return housing.slice(0, tile.level).reduce((sum, n) => sum + n, 0);
}

export function getPopulation(state: Pick<GameState, 'resources' | 'tiles'>): number {
  return state.resources.people + state.tiles.reduce((sum, tile) => sum + getWorkers(tile), 0);
}

export function getUpkeep(population: number): number {
  return Math.ceil(population * UPKEEP_PER_PERSON);
}

export function getTileProduction(tile: Tile): ResourceAmounts {
  const produces = tile && IMPROVEMENTS[tile.type].produces;
  if (!tile || !produces) return {};
  return { [produces.resource]: produces.amounts[tile.level - 1] };
}

export function getDailyProduction(tiles: Tile[]): ResourceAmounts {
  const total: ResourceAmounts = {};
  for (const tile of tiles) {
    for (const [type, amount] of entries(getTileProduction(tile))) {
      total[type] = (total[type] ?? 0) + amount;
    }
  }
  return total;
}

/** Expected change to each stockpile when the day ends. */
export function getDailyNet(state: GameState): ResourceAmounts {
  const net = getDailyProduction(state.tiles);
  const upkeep = getUpkeep(getPopulation(state));
  net.grain = (net.grain ?? 0) - upkeep;
  net.water = (net.water ?? 0) - upkeep;
  return net;
}

/** Why a tile can't be demolished, or null if it can. */
export function getDemolishBlocker(state: GameState, index: number): string | null {
  const residents = getResidents(state.tiles[index]);
  if (residents > state.resources.people) {
    return `${residents} idle villagers must be free to move out.`;
  }
  return null;
}

export function formatAmounts(amounts: ResourceAmounts, sign = false): string {
  const parts = entries(amounts)
    .filter(([, amount]) => amount !== 0)
    .map(([type, amount]) => `${sign && amount > 0 ? '+' : ''}${amount} ${RESOURCES[type].label.toLowerCase()}`);
  return parts.length ? parts.join(', ') : 'nothing';
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

export function createInitialState(): GameState {
  return {
    day: 1,
    resources: { ...STARTING_RESOURCES },
    tiles: Array<Tile>(GRID_SIZE * GRID_SIZE).fill(null),
    log: [
      {
        id: 0,
        day: 1,
        tone: 'info',
        message: 'A handful of settlers arrive with a few supplies. Build a house to give them somewhere to live.',
      },
    ],
    nextLogId: 1,
    status: 'playing',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type === 'newGame') return createInitialState();

  // After winning, players can keep building; the victory is only announced once.
  const next = applyAction(state, action);
  if (next === state || next.status === 'won') return next;

  if (getPopulation(next) >= POPULATION_GOAL) {
    return addLog(
      { ...next, status: 'won' },
      `Your village has grown to ${getPopulation(next)} people. You won in ${next.day} days!`,
      'good',
    );
  }
  return next;
}

function applyAction(state: GameState, action: Exclude<GameAction, { type: 'newGame' }>): GameState {
  switch (action.type) {
    case 'build':
      return build(state, action.index, action.improvement);
    case 'upgrade':
      return upgrade(state, action.index);
    case 'demolish':
      return demolish(state, action.index);
    case 'endDay':
      return endDay(state);
  }
}

function build(state: GameState, index: number, type: ImprovementType): GameState {
  if (state.tiles[index] !== null) return state;
  const cost = getCost(type, 1);
  if (!canAfford(state.resources, cost)) return state;

  const def = IMPROVEMENTS[type];
  const resources = addResidents(subtract(state.resources, cost), def.housing?.[0]);
  const tiles = replaceTile(state.tiles, index, { type, level: 1 });
  return addLog({ ...state, resources, tiles }, `Built a ${def.label.toLowerCase()}.`, 'info');
}

function upgrade(state: GameState, index: number): GameState {
  const tile = state.tiles[index];
  if (!tile || tile.level >= MAX_LEVEL) return state;
  const level = tile.level + 1;
  const cost = getCost(tile.type, level);
  if (!canAfford(state.resources, cost)) return state;

  const def = IMPROVEMENTS[tile.type];
  const resources = addResidents(subtract(state.resources, cost), def.housing?.[level - 1]);
  const tiles = replaceTile(state.tiles, index, { ...tile, level });
  return addLog(
    { ...state, resources, tiles },
    `Upgraded a ${def.label.toLowerCase()} to level ${level}.`,
    'info',
  );
}

function demolish(state: GameState, index: number): GameState {
  const tile = state.tiles[index];
  if (!tile || getDemolishBlocker(state, index)) return state;

  // Workers return to the idle pool; residents leave the village.
  const people = state.resources.people + getWorkers(tile) - getResidents(tile);
  const resources = { ...state.resources, people };
  const tiles = replaceTile(state.tiles, index, null);
  return addLog(
    { ...state, resources, tiles },
    `Demolished a ${IMPROVEMENTS[tile.type].label.toLowerCase()}.`,
    'info',
  );
}

function endDay(state: GameState): GameState {
  const production = getDailyProduction(state.tiles);
  const upkeep = getUpkeep(getPopulation(state));
  const resources = add(state.resources, production);

  const short = (['grain', 'water'] as const).filter((type) => resources[type] < upkeep);
  resources.grain = Math.max(0, resources.grain - upkeep);
  resources.water = Math.max(0, resources.water - upkeep);

  // Log under the day that just ended, then advance the calendar.
  let next = addLog(
    { ...state, resources },
    `Day ${state.day} ends. Produced ${formatAmounts(production)}; villagers consumed ${upkeep} grain and ${upkeep} water.`,
    'info',
  );

  if (short.length > 0) {
    const shortages = short.join(' and ');
    if (resources.people > 0) {
      next = addLog(
        { ...next, resources: { ...resources, people: resources.people - 1 } },
        `The village ran out of ${shortages}. A villager left in search of a better life.`,
        'bad',
      );
    } else {
      next = addLog(next, `The village ran out of ${shortages}. Your workers are going hungry.`, 'bad');
    }
  }
  return { ...next, day: state.day + 1 };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entries(amounts: ResourceAmounts) {
  return Object.entries(amounts) as [keyof Resources, number][];
}

function add(resources: Resources, amounts: ResourceAmounts): Resources {
  const result = { ...resources };
  for (const [type, amount] of entries(amounts)) result[type] += amount;
  return result;
}

function subtract(resources: Resources, amounts: ResourceAmounts): Resources {
  const result = { ...resources };
  for (const [type, amount] of entries(amounts)) result[type] -= amount;
  return result;
}

function addResidents(resources: Resources, residents = 0): Resources {
  return { ...resources, people: resources.people + residents };
}

function replaceTile(tiles: Tile[], index: number, tile: Tile): Tile[] {
  return tiles.map((current, i) => (i === index ? tile : current));
}

function addLog(state: GameState, message: string, tone: LogTone): GameState {
  const entry = { id: state.nextLogId, day: state.day, message, tone };
  return {
    ...state,
    log: [entry, ...state.log].slice(0, MAX_LOG_ENTRIES),
    nextLogId: state.nextLogId + 1,
  };
}
