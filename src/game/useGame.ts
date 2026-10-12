import { useEffect, useReducer } from 'react';
import { GRID_SIZE } from './config';
import { createInitialState, gameReducer } from './logic';
import type { GameState } from './types';

export const SAVE_KEY = 'village-simulator/save-v1';

function isGameState(value: unknown): value is GameState {
  const state = value as GameState;
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof state.day === 'number' &&
    typeof state.resources?.people === 'number' &&
    Array.isArray(state.tiles) &&
    state.tiles.length === GRID_SIZE * GRID_SIZE &&
    Array.isArray(state.log)
  );
}

function loadGame(): GameState {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    if (isGameState(saved)) return saved;
  } catch {
    // Corrupt or inaccessible storage: fall through to a fresh game.
  }
  return createInitialState();
}

/** Game state backed by a reducer and auto-saved to localStorage. */
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadGame);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      // Saving is best-effort (e.g. private browsing or full storage).
    }
  }, [state]);

  return [state, dispatch] as const;
}
