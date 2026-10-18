import { useCallback, useEffect, useRef, useState } from 'react';
import { GameSession, PHASE } from '@/engine/GameSession';
import { Effects } from '@/engine/effects';
import { renderScene, getBoardLayout } from '@/engine/renderer';
import { SoundEngine } from '@/engine/sound';

const MAX_FRAME_MS = 50; // a long frame (slow tab) never makes the game jump ahead
const RESULT_DELAY_MS = 900; // let the player enjoy the catch before the result card
const KEY_REPEAT_MS = 85;

const KEY_TO_DIRECTION = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

const EMPTY_HUD = { phase: PHASE.READY, steps: 0, seconds: 0, banner: null, optimalSteps: 0 };

/**
 * Connects a GameSession to the screen:
 *  - runs the animation loop (it keeps running after the game ends,
 *    so the catch and the confetti are always drawn)
 *  - turns pointer, touch and keyboard input into session calls
 *  - plays sounds and spawns effects for session events
 *
 * Changing `level`, `mode` or `runKey` starts a fresh round and cleans up the old one.
 */
export function useGameSession({ level, mode, runKey, muted, onWin }) {
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const soundRef = useRef(null);
  if (soundRef.current === null) soundRef.current = new SoundEngine();

  const onWinRef = useRef(onWin);
  useEffect(() => {
    onWinRef.current = onWin;
  }, [onWin]);

  // Every round gets an id. HUD numbers and the result card remember which round
  // they belong to, so a leftover from the previous round can never be shown.
  const roundKey = `${level}|${mode}|${runKey}`;
  const [hudState, setHudState] = useState({ key: null, value: EMPTY_HUD });
  const [resultState, setResultState] = useState({ key: null, value: null });

  useEffect(() => {
    soundRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const sound = soundRef.current;
    const effects = new Effects();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let resultTimer = 0;
    let frameId = 0;
    let cssSize = 0;

    const setHud = (value) => setHudState({ key: roundKey, value });

    const session = new GameSession({
      level,
      mode,
      onEvent: (type, payload) => {
        if (type === 'countdown') sound.playCountdown();
        else if (type === 'go') sound.playGo();
        else if (type === 'step') {
          sound.playStep();
          effects.burst(payload.c + 0.5, payload.r + 0.5, ['#ff9d3d', '#ffd23f'], reducedMotion ? 0 : 3);
        } else if (type === 'end') {
          // Save progress right away, even if the player leaves before the result card.
          if (payload.won) onWinRef.current?.(level, payload.stars);
        } else if (type === 'catch') {
          if (payload.playerWon) {
            sound.playMeow();
            sound.playWinJingle();
            effects.burst(payload.x, payload.y, ['#ff7eb6', '#ffd23f', '#3ddc97', '#5cc8ff'], reducedMotion ? 8 : 36);
          } else {
            sound.playLose();
            effects.burst(payload.x, payload.y, ['#8f86bd', '#3a3358'], reducedMotion ? 4 : 16);
          }
          resultTimer = window.setTimeout(() => {
            setResultState({ key: roundKey, value: { ...session.result, level } });
          }, RESULT_DELAY_MS);
        }
      },
    });
    sessionRef.current = session;
    // Handy for debugging in the browser console (removed from production builds).
    if (import.meta.env.DEV) window.__catMazeSession = session;
    setHud(session.snapshot());

    /* ----- canvas size (sharp on retina screens) ----- */
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssSize = Math.max(1, Math.round(rect.width));
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    /* ----- animation loop ----- */
    let last = performance.now();
    let shown = session.snapshot();
    const frame = (now) => {
      const dt = Math.min(now - last, MAX_FRAME_MS);
      last = now;

      session.update(dt);
      effects.update(dt / 1000);
      if (session.phase === PHASE.PLAYING) effects.addTrail(session.view.player.x, session.view.player.y);
      renderScene(ctx, { cssSize, session, effects, time: now, reducedMotion });

      // Only touch React state when something the HUD shows has changed.
      const snap = session.snapshot();
      if (
        snap.phase !== shown.phase || snap.steps !== shown.steps ||
        snap.seconds !== shown.seconds || snap.banner !== shown.banner
      ) {
        shown = snap;
        setHud(snap);
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);

    /* ----- pointer / touch input ----- */
    const toGrid = (event) => {
      const rect = canvas.getBoundingClientRect();
      const { pad, cs } = getBoardLayout(rect.width, session.maze.cols);
      return { x: (event.clientX - rect.left - pad) / cs, y: (event.clientY - rect.top - pad) / cs };
    };
    const onPointerMove = (event) => {
      const { x, y } = toGrid(event);
      session.pointerMove(x, y);
    };
    const onPointerLeave = () => session.pointerLeave();
    canvas.addEventListener('pointerdown', onPointerMove);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointercancel', onPointerLeave);
    canvas.addEventListener('pointerup', onPointerLeave);

    /* ----- keyboard input ----- */
    let lastKeyMove = 0;
    const onKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const direction = KEY_TO_DIRECTION[event.key];
      if (direction) {
        event.preventDefault(); // stop the page from scrolling
        const now = performance.now();
        if (now - lastKeyMove >= KEY_REPEAT_MS) {
          lastKeyMove = now;
          session.movePlayer(direction);
        }
      } else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (session.phase === PHASE.PAUSED) session.resume();
        else session.pause();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    /* ----- pause automatically when the tab is hidden ----- */
    const onVisibility = () => {
      if (document.hidden) session.pause();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(resultTimer);
      observer?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerMove);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointercancel', onPointerLeave);
      canvas.removeEventListener('pointerup', onPointerLeave);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [level, mode, runKey, roundKey]);

  const togglePause = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (session.phase === PHASE.PAUSED) session.resume();
    else session.pause();
  }, []);

  const hud = hudState.key === roundKey ? hudState.value : EMPTY_HUD;
  const result = resultState.key === roundKey ? resultState.value : null;

  return { canvasRef, hud, result, togglePause };
}
