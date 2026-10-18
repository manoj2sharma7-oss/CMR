import { useEffect, useRef } from 'react';
import { Grid3x3, Home, Play, RotateCw } from 'lucide-react';
import { MAX_LEVEL } from '@/config/constants';
import { formatTime } from '@/engine/scoring';
import { CatFace, MouseFace } from './Characters';
import Stars from './Stars';

/** Win / lose card shown on top of the board (inside it, so it also works in full screen). */
export default function ResultModal({ result, onNext, onRetry, onLevels, onHome }) {
  const primaryRef = useRef(null);
  const { won, level, steps, seconds, optimalSteps, stars } = result;
  const finalLevel = won && level >= MAX_LEVEL;

  // Move keyboard focus into the card so Enter / Space works straight away.
  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  return (
    <div className="overlay overlay--dim">
      <div
        className={`result card ${won ? 'result--win' : 'result--lose'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
      >
        <div className="result__art" aria-hidden="true">
          {won ? (
            <>
              <CatFace variant="orange" className="result__cat" />
              <MouseFace className="result__mouse" />
            </>
          ) : (
            <CatFace variant="black" className="result__cat result__cat--rival" />
          )}
        </div>

        <h2 id="result-title" className="result__title">
          {won
            ? finalLevel ? 'All 30 levels complete!' : 'You caught the mouse!'
            : 'The black cat got there first'}
        </h2>
        <p className="result__text">
          {won
            ? finalLevel ? 'You are a maze champion. Replay any level to earn more stars.' : 'Nice running. The orange cat is very proud.'
            : 'Try again. Plan the shortest path before you start moving.'}
        </p>

        {won && <Stars count={stars} size={38} className="result__stars" />}

        <dl className="result__stats">
          <div>
            <dt>Steps</dt>
            <dd>{steps}</dd>
            <small>shortest route: {optimalSteps}</small>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatTime(seconds)}</dd>
          </div>
        </dl>

        <div className="result__actions">
          {won && !finalLevel ? (
            <button ref={primaryRef} type="button" className="btn btn--primary btn--lg" onClick={onNext}>
              Next level <Play size={18} fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button ref={primaryRef} type="button" className="btn btn--primary btn--lg" onClick={onRetry}>
              <RotateCw size={18} aria-hidden="true" /> Try again
            </button>
          )}
          {won && !finalLevel && (
            <button type="button" className="btn btn--secondary" onClick={onRetry}>
              <RotateCw size={18} aria-hidden="true" /> Replay
            </button>
          )}
          <button type="button" className="btn btn--secondary" onClick={onLevels}>
            <Grid3x3 size={18} aria-hidden="true" /> Levels
          </button>
          <button type="button" className="btn btn--secondary" onClick={onHome}>
            <Home size={18} aria-hidden="true" /> Home
          </button>
        </div>
      </div>
    </div>
  );
}
