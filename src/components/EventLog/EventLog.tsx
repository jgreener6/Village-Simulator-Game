import type { LogEntry } from '../../game/types';
import './EventLog.css';

export function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section className="panel event-log" aria-label="Village chronicle">
      <h2>Chronicle</h2>
      <ol className="log-list" aria-live="polite">
        {entries.map((entry) => (
          <li key={entry.id} className={`log-entry log-entry--${entry.tone}`}>
            <span className="log-day">Day {entry.day}</span>
            <span>{entry.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
