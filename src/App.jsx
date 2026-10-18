import { useCallback, useState } from 'react';
import { GAME_MODES } from '@/config/constants';
import { clampLevel } from '@/config/levels';
import { useProgress } from '@/hooks/useProgress';
import GameScreen from '@/components/GameScreen';
import HomeScreen from '@/components/HomeScreen';
import LevelSelect from '@/components/LevelSelect';

const SCREEN = { HOME: 'home', LEVELS: 'levels', GAME: 'game' };

/**
 * Top-level screen switcher. All saved data lives in useProgress,
 * all in-round logic lives in useGameSession (inside GameScreen).
 */
export default function App() {
  const { progress, totalStars, recordWin, setMuted, resetProgress } = useProgress();
  const [screen, setScreen] = useState(SCREEN.HOME);
  const [mode, setMode] = useState(GAME_MODES.VS);
  const [level, setLevel] = useState(1);
  const [theme, setTheme] = useState('light');

  const startLevel = useCallback((lvl) => {
    setLevel(clampLevel(lvl));
    setScreen(SCREEN.GAME);
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <div className="backdrop" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      {screen === SCREEN.HOME && (
        <HomeScreen
          mode={mode}
          theme={theme}
          onThemeChange={setTheme}
          onModeChange={setMode}
          unlocked={progress.unlocked}
          totalStars={totalStars}
          onPlay={() => startLevel(progress.unlocked)}
          onChooseLevel={() => setScreen(SCREEN.LEVELS)}
          onReset={resetProgress}
        />
      )}

      {screen === SCREEN.LEVELS && (
        <LevelSelect
          unlocked={progress.unlocked}
          stars={progress.stars}
          onSelect={startLevel}
          onBack={() => setScreen(SCREEN.HOME)}
        />
      )}

      {screen === SCREEN.GAME && (
        <GameScreen
          level={level}
          mode={mode}
          theme={theme}
          onThemeChange={setTheme}
          unlocked={progress.unlocked}
          muted={progress.muted}
          onToggleMute={() => setMuted(!progress.muted)}
          onWin={recordWin}
          onChangeLevel={startLevel}
          onHome={() => setScreen(SCREEN.HOME)}
          onLevels={() => setScreen(SCREEN.LEVELS)}
        />
      )}
    </div>
  );
}
