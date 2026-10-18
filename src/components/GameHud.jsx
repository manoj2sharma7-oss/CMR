import {
  ChevronLeft, ChevronRight, Footprints, Home, Maximize2, Minimize2,
  MoonStar, Pause, Play, RotateCw, SunMedium, Timer, Volume2, VolumeX,
} from 'lucide-react';
import { formatTime } from '@/engine/scoring';

/** Top bar: navigation on the left, live numbers in the middle, tools on the right. */
export default function GameHud({
  level, theme, onThemeChange, canGoPrev, canGoNext, steps, seconds, paused, muted, fullscreen, canFullscreen,
  onHome, onPrev, onNext, onPause, onMute, onRestart, onFullscreen,
}) {
  return (
    <header className="hud">
      <div className="hud__group">
        <button type="button" className="btn btn--secondary btn--icon" onClick={onHome} aria-label="Back to home" title="Home">
          <Home size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--icon"
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title="Theme"
        >
          {theme === 'light' ? <MoonStar size={18} aria-hidden="true" /> : <SunMedium size={18} aria-hidden="true" />}
        </button>
        <button type="button" className="btn btn--icon" onClick={onPrev} disabled={!canGoPrev} aria-label="Previous level">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <span className="chip chip--level">Level {level}</span>
        <button type="button" className="btn btn--icon" onClick={onNext} disabled={!canGoNext} aria-label="Next level">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="hud__group hud__stats" aria-label="Your score">
        <div className="stat">
          <Footprints size={20} className="stat__icon stat__icon--steps" aria-hidden="true" />
          <div>
            <span className="stat__label">Steps</span>
            <span className="stat__value">{steps}</span>
          </div>
        </div>
        <div className="stat">
          <Timer size={20} className="stat__icon stat__icon--time" aria-hidden="true" />
          <div>
            <span className="stat__label">Time</span>
            <span className="stat__value">{formatTime(seconds)}</span>
          </div>
        </div>
      </div>

      <div className="hud__group">
        <button type="button" className="btn btn--icon" onClick={onPause} aria-label={paused ? 'Resume game' : 'Pause game'} title="Pause (P)">
          {paused ? <Play size={20} aria-hidden="true" /> : <Pause size={20} aria-hidden="true" />}
        </button>
        <button type="button" className="btn btn--icon" onClick={onMute} aria-pressed={muted} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
          {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
        </button>
        <button type="button" className="btn btn--icon" onClick={onRestart} aria-label="Restart level" title="Restart level">
          <RotateCw size={20} aria-hidden="true" />
        </button>
        {canFullscreen && (
          <button type="button" className="btn btn--icon" onClick={onFullscreen} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}>
            {fullscreen ? <Minimize2 size={20} aria-hidden="true" /> : <Maximize2 size={20} aria-hidden="true" />}
          </button>
        )}
      </div>
    </header>
  );
}
