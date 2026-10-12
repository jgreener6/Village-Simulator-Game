import { useEffect, useRef, type KeyboardEvent } from 'react';
import { GRID_SIZE, IMPROVEMENTS } from '../../game/config';
import type { Tile } from '../../game/types';
import { HEADER_HEIGHT, MOBILE_QUERY, SHEET_HEIGHT } from '../../layout';
import './Board.css';

interface BoardProps {
  tiles: Tile[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

const ARROW_OFFSETS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

function describeTile(tile: Tile, index: number): string {
  const position = `Row ${Math.floor(index / GRID_SIZE) + 1}, column ${(index % GRID_SIZE) + 1}`;
  return tile ? `${position}: ${IMPROVEMENTS[tile.type].label}, level ${tile.level}` : `${position}: empty`;
}

export function Board({ tiles, selectedIndex, onSelect }: BoardProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const focusIndex = selectedIndex ?? 0;

  // On small screens the tile details open as a bottom sheet; keep the
  // selected tile visible above it.
  useEffect(() => {
    const button = selectedIndex === null ? null : buttons.current[selectedIndex];
    if (!button || !window.matchMedia?.(MOBILE_QUERY).matches) return;
    const visibleBottom = window.innerHeight * (1 - SHEET_HEIGHT);
    const { top, bottom } = button.getBoundingClientRect();
    if (bottom > visibleBottom) {
      window.scrollBy({ top: bottom - visibleBottom + 12, behavior: 'smooth' });
    } else if (top < HEADER_HEIGHT) {
      window.scrollBy({ top: top - HEADER_HEIGHT - 12, behavior: 'smooth' });
    }
  }, [selectedIndex]);

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const offset = ARROW_OFFSETS[event.key];
    if (!offset) return;
    event.preventDefault();
    const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(index / GRID_SIZE) + offset[0]));
    const col = Math.min(GRID_SIZE - 1, Math.max(0, (index % GRID_SIZE) + offset[1]));
    const target = row * GRID_SIZE + col;
    onSelect(target);
    buttons.current[target]?.focus();
  }

  return (
    <div className="board" role="grid" aria-label="Village map">
      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <div className="board-row" role="row" key={row}>
          {Array.from({ length: GRID_SIZE }, (_, col) => {
            const index = row * GRID_SIZE + col;
            const tile = tiles[index];
            return (
              <div role="gridcell" key={col}>
                <button
                  ref={(el) => {
                    buttons.current[index] = el;
                  }}
                  type="button"
                  className={`tile${tile ? ` tile--${tile.type}` : ''}`}
                  aria-label={describeTile(tile, index)}
                  aria-pressed={selectedIndex === index}
                  tabIndex={index === focusIndex ? 0 : -1}
                  onClick={() => onSelect(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  {tile ? (
                    <>
                      <img className="tile-image" src={IMPROVEMENTS[tile.type].image} alt="" draggable={false} />
                      <span className="tile-level" aria-hidden="true">
                        {'★'.repeat(tile.level)}
                      </span>
                    </>
                  ) : (
                    <span className="tile-empty" aria-hidden="true">
                      +
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
