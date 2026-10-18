import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Play, Swords } from 'lucide-react';
import { GAME_MODES, MAX_LEVEL } from '@/config/constants';
import { formatRivalSpeed, getLevelConfig } from '@/config/levels';
import { PHASE } from '@/engine/GameSession';
import { useGameSession } from '@/hooks/useGameSession';
import GameHud from './GameHud';
import ResultModal from './ResultModal';

export default function GameScreen({
  level, mode, theme, onThemeChange, unlocked, muted,
  onToggleMute, onWin, onChangeLevel, onHome, onLevels,
}) {
  const containerRef = useRef(null);
  const [runKey, setRunKey] = useState(0); // bump to restart the same level
  const [fullscreen, setFullscreen] = useState(false);

  const { canvasRef, hud, result, togglePause } = useGameSession({ level, mode, runKey, muted, onWin });
  const config = getLevelConfig(level);
  const paused = hud.phase === PHASE.PAUSED;
  const isTouch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

  const restart = useCallback(() => setRunKey((k) => k + 1), []);

  /* ----- full screen ----- */
  const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else containerRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  /* Screen-reader announcements for things that only happen on the canvas. */
  let announcement = '';
  if (result) announcement = result.won ? 'You caught the mouse!' : 'The black cat caught the mouse first.';
  else if (hud.banner) announcement = hud.banner === 'GO!' ? 'Go!' : hud.banner;
  else if (paused) announcement = 'Game paused.';

  return (
    <div ref={containerRef} className="game">
      <GameHud
        level={level}
        theme={theme}
        onThemeChange={onThemeChange}
        canGoPrev={level > 1}
        canGoNext={level < unlocked && level < MAX_LEVEL}
        steps={hud.steps}
        seconds={hud.seconds}
        paused={paused}
        muted={muted}
        fullscreen={fullscreen}
        canFullscreen={canFullscreen}
        onHome={onHome}
        onPrev={() => onChangeLevel(level - 1)}
        onNext={() => onChangeLevel(level + 1)}
        onPause={togglePause}
        onMute={onToggleMute}
        onRestart={restart}
        onFullscreen={toggleFullscreen}
      />

      <div className="board-frame">
        <div className="board">
          <canvas
            ref={canvasRef}
            className="board__canvas"
            role="img"
            aria-label={`Level ${level} maze, ${config.size} by ${config.size}. Move the orange cat to the mouse using a pointer, touch or the arrow keys.`}
          />

          {hud.banner && (
            <div className="overlay overlay--clear" aria-hidden="true">
              <span key={hud.banner} className={`banner ${hud.banner === 'GO!' ? 'banner--go' : ''}`}>{hud.banner}</span>
            </div>
          )}

          {paused && (
            <div className="overlay overlay--dim">
              <div className="pause card" role="dialog" aria-modal="true" aria-label="Game paused">
                <h2>Paused</h2>
                <p>Take your time. The clock and the rival are waiting.</p>
                <button type="button" autoFocus className="btn btn--primary btn--lg" onClick={togglePause}>
                  <Play size={20} fill="currentColor" aria-hidden="true" /> Resume
                </button>
              </div>
            </div>
          )}

          {result && (
            <ResultModal
              result={result}
              onNext={() => onChangeLevel(Math.min(level + 1, MAX_LEVEL))}
              onRetry={restart}
              onLevels={onLevels}
              onHome={onHome}
            />
          )}
        </div>
      </div>

      <footer className="tips">
        <span className="tips__item">
          <Keyboard size={18} aria-hidden="true" />
          {isTouch
            ? 'Drag your finger from the cat through the maze.'
            : 'Slide over the cells next to the cat, or use the arrow keys.'}
        </span>
        {mode === GAME_MODES.VS && (
          <span className="chip chip--rival">
            <Swords size={16} aria-hidden="true" />
            Rival: {formatRivalSpeed(config.aiIntervalMs)}
          </span>
        )}
        <span className="chip">Shortest route: {hud.optimalSteps} steps</span>
      </footer>

      <p className="sr-only" role="status" aria-live="assertive">{announcement}</p>
    </div>
  );
}
