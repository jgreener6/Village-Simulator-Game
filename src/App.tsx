import { useEffect, useState } from 'react';
import './App.css';
import { Board } from './components/Board/Board';
import { EventLog } from './components/EventLog/EventLog';
import { HowToPlay } from './components/HowToPlay/HowToPlay';
import { ResourcesView } from './components/ResourcesView/ResourcesView';
import { TilePanel } from './components/TilePanel/TilePanel';
import { POPULATION_GOAL } from './game/config';
import { useGame } from './game/useGame';

function App() {
  const [state, dispatch] = useGame();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const sheetOpen = selectedIndex !== null;

  useEffect(() => {
    if (!sheetOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sheetOpen]);

  function startNewGame() {
    if (window.confirm('Start a new village? Your current progress will be lost.')) {
      dispatch({ type: 'newGame' });
      setSelectedIndex(null);
    }
  }

  return (
    <div className={`app${sheetOpen ? ' app--sheet-open' : ''}`}>
      <header className="app-header">
        <div>
          <h1>
            <span aria-hidden="true">🏡</span> <span className="title-text">
              Village <span className="title-full">Simulator</span>
              <span className="title-short" aria-hidden="true">Sim</span>
            </span>
          </h1>
          <p className="muted app-tagline">Grow your village to {POPULATION_GOAL} people.</p>
        </div>
        <div className="header-actions">
          <span className="day-counter" aria-live="polite" data-testid="day">
            Day {state.day}
          </span>
          <button type="button" className="button button--primary" onClick={() => dispatch({ type: 'endDay' })}>
            End day
          </button>
          <button type="button" className="button new-game" onClick={startNewGame} aria-label="New game" title="New game">
            <span className="new-game-text">New game</span>
            <span className="new-game-icon" aria-hidden="true">
              ↺
            </span>
          </button>
        </div>
      </header>

      {state.status === 'won' && (
        <div className="banner" role="status">
          <strong>🎉 Victory!</strong> Your village is thriving. Keep building, or start a new game to beat your record.
        </div>
      )}

      <main className="layout">
        <div className="layout-main">
          <ResourcesView state={state} />
          <Board tiles={state.tiles} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        </div>
        <aside className="layout-side">
          <div className={`sheet${sheetOpen ? ' sheet--open' : ''}`}>
            <TilePanel state={state} index={selectedIndex} dispatch={dispatch} onClose={() => setSelectedIndex(null)} />
          </div>
          <EventLog entries={state.log} />
        </aside>
      </main>

      <HowToPlay />

      <footer className="app-footer muted small">
        Built with React, TypeScript and Vite. Progress is saved in your browser.
      </footer>
    </div>
  );
}

export default App;
