import { POPULATION_GOAL, RESOURCES, RESOURCE_TYPES } from '../../game/config';
import { getDailyNet, getPopulation } from '../../game/logic';
import type { GameState } from '../../game/types';
import './ResourcesView.css';

export function ResourcesView({ state }: { state: GameState }) {
  const net = getDailyNet(state);
  const population = getPopulation(state);
  const progress = Math.min(100, Math.round((population / POPULATION_GOAL) * 100));

  return (
    <section className="resources" aria-label="Resources">
      <div className="population">
        <div className="population-label">
          <span>Population</span>
          <strong>
            {population} / {POPULATION_GOAL}
          </strong>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label="Progress toward population goal"
          aria-valuemin={0}
          aria-valuemax={POPULATION_GOAL}
          aria-valuenow={population}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ul className="resource-list">
        {RESOURCE_TYPES.map((type) => {
          const change = net[type] ?? 0;
          return (
            <li key={type} className="resource">
              <span className="resource-icon" aria-hidden="true">
                {RESOURCES[type].icon}
              </span>
              <span className="resource-label" title={type === 'people' ? 'Idle villagers, not assigned to a building' : undefined}>
                {RESOURCES[type].label}
              </span>
              <span className="resource-amount" data-testid={`resource-${type}`}>
                {state.resources[type]}
              </span>
              {change !== 0 && (
                <span
                  className={`resource-change ${change > 0 ? 'positive' : 'negative'}`}
                  title="Expected change when the day ends"
                >
                  {change > 0 ? '+' : ''}
                  {change}/day
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
