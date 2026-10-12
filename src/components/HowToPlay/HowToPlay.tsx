import { IMPROVEMENTS, IMPROVEMENT_TYPES, POPULATION_GOAL } from '../../game/config';

export function HowToPlay() {
  return (
    <details className="panel how-to-play">
      <summary>
        <h2>How to play</h2>
      </summary>
      <ol>
        <li>Select an empty tile and build a <strong>house</strong>. Villagers move in.</li>
        <li>
          Assign villagers to <strong>fields</strong>, <strong>wells</strong>, <strong>lumber mills</strong> and{' '}
          <strong>pastures</strong>. Each level of a production building needs one worker.
        </li>
        <li>
          Press <strong>End day</strong> to collect production. Every two villagers eat one grain and drink one water
          per day. Run short and people start to leave.
        </li>
        <li>Upgrade buildings (up to level 3) to boost output and house more people.</li>
        <li>
          Reach a population of <strong>{POPULATION_GOAL}</strong> to win, in as few days as you can.
        </li>
      </ol>
      <ul className="legend">
        {IMPROVEMENT_TYPES.map((type) => (
          <li key={type}>
            <img className="legend-image" src={IMPROVEMENTS[type].image} alt="" /> <strong>{IMPROVEMENTS[type].label}</strong>:{' '}
            {IMPROVEMENTS[type].description}
          </li>
        ))}
      </ul>
    </details>
  );
}
