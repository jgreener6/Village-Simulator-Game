import { POPULATION_GOAL } from './config';
import {
  createInitialState,
  gameReducer,
  getDailyNet,
  getDemolishBlocker,
  getPopulation,
  getShortfall,
  getUpkeep,
} from './logic';
import type { GameAction, GameState, Resources } from './types';

function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

function withResources(resources: Partial<Resources>): GameState {
  const state = createInitialState();
  return { ...state, resources: { ...state.resources, ...resources } };
}

describe('building', () => {
  it('pays the cost and moves residents into a new house', () => {
    const state = play(createInitialState(), { type: 'build', index: 0, improvement: 'house' });

    expect(state.tiles[0]).toEqual({ type: 'house', level: 1 });
    expect(state.resources).toEqual({ lumber: 0, grain: 2, water: 2, sheep: 1, people: 5 });
  });

  it('assigns a worker to production buildings', () => {
    const state = play(withResources({ people: 3 }), { type: 'build', index: 4, improvement: 'field' });

    expect(state.resources.people).toBe(2);
    expect(getPopulation(state)).toBe(3);
  });

  it('ignores builds that cannot be afforded', () => {
    const initial = createInitialState();
    expect(play(initial, { type: 'build', index: 0, improvement: 'field' })).toBe(initial);
  });

  it('ignores builds on occupied tiles', () => {
    const built = play(withResources({ people: 5 }), { type: 'build', index: 0, improvement: 'well' });
    expect(play(built, { type: 'build', index: 0, improvement: 'field' })).toBe(built);
  });
});

describe('upgrading', () => {
  it('raises the level and production of a building', () => {
    const state = play(
      withResources({ people: 5, lumber: 5 }),
      { type: 'build', index: 0, improvement: 'field' },
      { type: 'upgrade', index: 0 },
    );

    expect(state.tiles[0]).toEqual({ type: 'field', level: 2 });
    expect(state.resources).toMatchObject({ people: 3, lumber: 0 });
    expect(getDailyNet(state).grain).toBe(8 - getUpkeep(5));
  });

  it('stops at the maximum level', () => {
    const maxed = play(
      withResources({ people: 10, lumber: 50, sheep: 10 }),
      { type: 'build', index: 0, improvement: 'well' },
      { type: 'upgrade', index: 0 },
      { type: 'upgrade', index: 0 },
    );

    expect(maxed.tiles[0]?.level).toBe(3);
    expect(play(maxed, { type: 'upgrade', index: 0 })).toBe(maxed);
  });
});

describe('demolishing', () => {
  it('returns workers to the idle pool', () => {
    const state = play(
      withResources({ people: 2 }),
      { type: 'build', index: 0, improvement: 'lumberMill' },
      { type: 'demolish', index: 0 },
    );

    expect(state.tiles[0]).toBeNull();
    expect(state.resources.people).toBe(2);
  });

  it('cannot remove a house while its residents are working', () => {
    const state = play(
      createInitialState(),
      { type: 'build', index: 0, improvement: 'house' },
      { type: 'build', index: 1, improvement: 'field' },
    );

    expect(getDemolishBlocker(state, 0)).not.toBeNull();
    expect(play(state, { type: 'demolish', index: 0 })).toBe(state);
  });
});

describe('ending the day', () => {
  it('adds production, subtracts upkeep and advances the day', () => {
    const state = play(
      createInitialState(),
      { type: 'build', index: 0, improvement: 'house' },
      { type: 'build', index: 1, improvement: 'field' },
      { type: 'build', index: 2, improvement: 'well' },
      { type: 'endDay' },
    );

    // 5 villagers consume 3 grain and 3 water; field and well make 4 each.
    expect(state.day).toBe(2);
    expect(state.resources).toMatchObject({ grain: 3, water: 3, people: 3 });
  });

  it('loses a villager when food or water runs out', () => {
    const state = play(
      createInitialState(),
      { type: 'build', index: 0, improvement: 'house' },
      { type: 'endDay' },
    );

    expect(state.resources).toMatchObject({ grain: 0, water: 0, people: 4 });
    expect(state.log[0]).toMatchObject({ tone: 'bad', day: 1 });
  });
});

describe('winning', () => {
  it('announces victory once the population goal is reached', () => {
    const almost = withResources({ people: POPULATION_GOAL - 5, lumber: 5, grain: 50, water: 50 });
    const won = play(almost, { type: 'build', index: 0, improvement: 'house' });

    expect(won.status).toBe('won');
    expect(won.log[0]).toMatchObject({ tone: 'good' });

    // Play continues, but the victory is not announced again.
    const after = play(won, { type: 'endDay' });
    expect(after.log.filter((entry) => entry.tone === 'good')).toHaveLength(1);
  });

  it('resets on a new game', () => {
    const state = play(createInitialState(), { type: 'build', index: 0, improvement: 'house' }, { type: 'newGame' });
    expect(state).toEqual(createInitialState());
  });
});

describe('getShortfall', () => {
  it('reports only the resources that are missing', () => {
    expect(getShortfall(withResources({ lumber: 2 }).resources, { lumber: 5, grain: 1 })).toEqual({ lumber: 3 });
  });
});
