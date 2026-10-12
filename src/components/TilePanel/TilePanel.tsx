import type { Dispatch, ReactNode } from 'react';
import { GRID_SIZE, IMPROVEMENTS, IMPROVEMENT_TYPES, MAX_LEVEL, RESOURCES } from '../../game/config';
import {
  canAfford,
  getCost,
  getDemolishBlocker,
  getResidents,
  getShortfall,
  getTileProduction,
  getWorkers,
  formatAmounts,
} from '../../game/logic';
import type { GameAction, GameState, ImprovementType, ResourceAmounts, Resources } from '../../game/types';
import './TilePanel.css';

interface TilePanelProps {
  state: GameState;
  index: number | null;
  dispatch: Dispatch<GameAction>;
  onClose: () => void;
}

function Shell({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <section className="panel tile-panel" aria-label="Tile details">
      {onClose && (
        <button type="button" className="sheet-close" aria-label="Close tile details" onClick={onClose}>
          ✕
        </button>
      )}
      {children}
    </section>
  );
}

export function TilePanel({ state, index, dispatch, onClose }: TilePanelProps) {
  if (index === null) {
    return (
      <Shell>
        <h2>Select a tile</h2>
        <p className="muted">Tap a square on the map (or use the arrow keys) to build or manage an improvement.</p>
      </Shell>
    );
  }

  const tile = state.tiles[index];
  const position = `Row ${Math.floor(index / GRID_SIZE) + 1}, column ${(index % GRID_SIZE) + 1}`;

  if (!tile) {
    return (
      <Shell onClose={onClose}>
        <h2>Empty land</h2>
        <p className="muted">{position}. Choose something to build.</p>
        <ul className="build-list">
          {IMPROVEMENT_TYPES.map((type) => (
            <BuildOption
              key={type}
              type={type}
              resources={state.resources}
              onBuild={() => dispatch({ type: 'build', index, improvement: type })}
            />
          ))}
        </ul>
      </Shell>
    );
  }

  const def = IMPROVEMENTS[tile.type];
  const nextLevel = tile.level + 1;
  const upgradeCost = nextLevel <= MAX_LEVEL ? getCost(tile.type, nextLevel) : null;
  const demolishBlocker = getDemolishBlocker(state, index);

  return (
    <Shell onClose={onClose}>
      <div className="tile-heading">
        <img className="tile-heading-image" src={def.image} alt="" />
        <div>
          <h2>
            {def.label} <span className="level-badge">Level {tile.level}</span>
          </h2>
          <p className="muted">{position}</p>
        </div>
      </div>
      <p>{def.description}</p>

      <dl className="stats">
        {def.produces && (
          <>
            <dt>Produces</dt>
            <dd>{formatAmounts(getTileProduction(tile), true)} per day</dd>
            <dt>Workers</dt>
            <dd>{getWorkers(tile)}</dd>
          </>
        )}
        {def.housing && (
          <>
            <dt>Residents</dt>
            <dd>{getResidents(tile)} villagers</dd>
          </>
        )}
      </dl>

      {upgradeCost ? (
        <div className="action-block">
          <h3>Upgrade to level {nextLevel}</h3>
          <p className="muted">{describeLevel(tile.type, nextLevel)}</p>
          <CostList cost={upgradeCost} resources={state.resources} />
          <button
            type="button"
            className="button button--primary"
            disabled={!canAfford(state.resources, upgradeCost)}
            onClick={() => dispatch({ type: 'upgrade', index })}
          >
            Upgrade
          </button>
        </div>
      ) : (
        <p className="muted">This {def.label.toLowerCase()} is fully upgraded.</p>
      )}

      <div className="action-block">
        <button
          type="button"
          className="button button--danger"
          disabled={demolishBlocker !== null}
          onClick={() => dispatch({ type: 'demolish', index })}
        >
          Demolish
        </button>
        <p className="muted small">
          {demolishBlocker ??
            (def.housing
              ? 'Residents will leave the village.'
              : 'Workers return to the idle pool. Materials are not refunded.')}
        </p>
      </div>
    </Shell>
  );
}

function BuildOption({
  type,
  resources,
  onBuild,
}: {
  type: ImprovementType;
  resources: Resources;
  onBuild: () => void;
}) {
  const def = IMPROVEMENTS[type];
  const cost = getCost(type, 1);
  const affordable = canAfford(resources, cost);

  return (
    <li className="build-option">
      <img className="build-image" src={def.image} alt="" />
      <div className="build-info">
        <strong>{def.label}</strong>
        <span className="muted small">{describeLevel(type, 1)}</span>
        <CostList cost={cost} resources={resources} />
      </div>
      <button
        type="button"
        className="button button--primary"
        disabled={!affordable}
        onClick={onBuild}
        aria-label={`Build ${def.label}`}
      >
        Build
      </button>
    </li>
  );
}

function CostList({ cost, resources }: { cost: ResourceAmounts; resources: Resources }) {
  const shortfall = getShortfall(resources, cost);
  return (
    <ul className="cost-list" aria-label="Cost">
      {(Object.entries(cost) as [keyof Resources, number][]).map(([type, amount]) => (
        <li
          key={type}
          className={`cost${shortfall[type] ? ' cost--short' : ''}`}
          title={shortfall[type] ? `Need ${shortfall[type]} more ${RESOURCES[type].label.toLowerCase()}` : undefined}
        >
          <span aria-hidden="true">{RESOURCES[type].icon}</span> {amount}
          <span className="visually-hidden"> {RESOURCES[type].label}</span>
        </li>
      ))}
    </ul>
  );
}

function describeLevel(type: ImprovementType, level: number): string {
  const def = IMPROVEMENTS[type];
  if (def.housing) return `+${def.housing[level - 1]} villagers move in`;
  if (def.produces) {
    return `${def.produces.amounts[level - 1]} ${RESOURCES[def.produces.resource].label.toLowerCase()} per day`;
  }
  return '';
}
