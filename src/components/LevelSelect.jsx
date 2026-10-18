import { ArrowLeft, Lock } from 'lucide-react';
import { MAX_LEVEL } from '@/config/constants';
import { getLevelConfig } from '@/config/levels';
import Stars from './Stars';

export default function LevelSelect({ unlocked, stars, onSelect, onBack }) {
  return (
    <main className="levels card">
      <header className="levels__header">
        <button type="button" className="btn btn--secondary" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back
        </button>
        <h1>Choose a level</h1>
      </header>

      <ul className="levels__grid">
        {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => {
          const locked = level > unlocked;
          const { size } = getLevelConfig(level);
          const earned = stars[level] ?? 0;
          return (
            <li key={level}>
              <button
                type="button"
                className={`level-tile ${locked ? 'level-tile--locked' : ''} ${level === unlocked ? 'level-tile--current' : ''}`}
                disabled={locked}
                onClick={() => onSelect(level)}
                aria-label={locked ? `Level ${level}, locked` : `Level ${level}, ${size} by ${size} maze, ${earned} stars`}
              >
                <span className="level-tile__number">{level}</span>
                {locked ? (
                  <Lock size={18} aria-hidden="true" />
                ) : (
                  <Stars count={earned} size={14} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="levels__note">Win a level to unlock the next one. Earn 3 stars by taking the shortest route.</p>
    </main>
  );
}
