import { useEffect, useState } from 'react';
import { Flag, Grid3x3, MoonStar, Play, SunMedium, Swords, Timer, Trophy } from 'lucide-react';
import { GAME_MODES, MAX_LEVEL } from '@/config/constants';
import { CatFace, MouseFace } from './Characters';

const MODES = [
  { id: GAME_MODES.VS, title: 'Race the black cat', text: 'Reach the mouse before the rival does.', Icon: Swords },
  { id: GAME_MODES.SOLO, title: 'Solo practice', text: 'No rival. Just you, the maze and the clock.', Icon: Timer },
];

export default function HomeScreen({ mode, theme, onThemeChange, onModeChange, unlocked, totalStars, onPlay, onChooseLevel, onReset }) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  // The confirmation button goes back to normal if nobody taps it.
  useEffect(() => {
    if (!confirmingReset) return undefined;
    const timer = window.setTimeout(() => setConfirmingReset(false), 3500);
    return () => window.clearTimeout(timer);
  }, [confirmingReset]);

  const finished = unlocked >= MAX_LEVEL;
  const doneLevels = finished ? MAX_LEVEL : unlocked - 1;

  return (
    <main className="home">
      <section className="home__hero" aria-labelledby="game-title">
        <div className="hero-art" aria-hidden="true">
          <CatFace variant="black" className="hero-art__rival" />
          <CatFace variant="orange" className="hero-art__hero" />
          <MouseFace className="hero-art__mouse" />
        </div>
        <h1 id="game-title" className="home__title">Cat Maze Race</h1>
        <p className="home__tagline">
          Guide the orange cat through the maze and catch the mouse before the black cat does.
        </p>
        <ol className="howto">
          <li>Slide your mouse or finger, or press the arrow keys, to walk.</li>
          <li>Walls block the way. Look for the shortest path.</li>
          <li>Catch the mouse for stars and unlock new levels.</li>
        </ol>
      </section>

      <section className="home__panel card" aria-label="Start a game">
        <div className="theme-switcher">
          <button
            type="button"
            className="btn btn--secondary btn--lg"
            onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonStar size={18} aria-hidden="true" /> : <SunMedium size={18} aria-hidden="true" />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </div>

        <div role="radiogroup" aria-label="Game mode" className="modes">
          {MODES.map(({ id, title, text, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              className={`mode ${mode === id ? 'mode--active' : ''}`}
              onClick={() => onModeChange(id)}
            >
              <span className="mode__icon"><Icon size={26} aria-hidden="true" /></span>
              <span className="mode__text">
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="progress-card">
          <div className="progress-card__top">
            <span className="progress-card__label">
              <Trophy size={18} aria-hidden="true" />
              {finished ? 'All levels complete!' : `Next up: level ${unlocked}`}
            </span>
            <span className="progress-card__stars">{totalStars} of {MAX_LEVEL * 3} stars</span>
          </div>
          <div
            className="meter"
            role="progressbar"
            aria-label="Levels completed"
            aria-valuemin={0}
            aria-valuemax={MAX_LEVEL}
            aria-valuenow={doneLevels}
          >
            <span style={{ width: `${(doneLevels / MAX_LEVEL) * 100}%` }} />
          </div>
          <p className="progress-card__hint">{doneLevels} of {MAX_LEVEL} levels completed</p>
        </div>

        <div className="home__actions">
          <button type="button" className="btn btn--primary btn--xl" onClick={onPlay}>
            <Play size={24} fill="currentColor" aria-hidden="true" />
            {unlocked > 1 && !finished ? `Play level ${unlocked}` : 'Play'}
          </button>
          <button type="button" className="btn btn--secondary btn--lg" onClick={onChooseLevel}>
            <Grid3x3 size={20} aria-hidden="true" />
            Choose a level
          </button>
        </div>

        {(unlocked > 1 || totalStars > 0) && (
          <button
            type="button"
            className={`link-btn ${confirmingReset ? 'link-btn--danger' : ''}`}
            onClick={() => {
              if (confirmingReset) {
                onReset();
                setConfirmingReset(false);
              } else setConfirmingReset(true);
            }}
          >
            <Flag size={14} aria-hidden="true" />
            {confirmingReset ? 'Tap again to erase all progress' : 'Start over from level 1'}
          </button>
        )}
      </section>
    </main>
  );
}
