import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Volume2, Repeat, Check, Bell, Sliders, ChevronDown } from 'lucide-react';
import { playAlertSound } from './utils/audio';
import { SoundType, SoundOption, TimerStatus } from './types';

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'apple-chime', name: 'Apple Chime', description: 'Harmonic bell sequence' },
  { id: 'zen-bell', name: 'Zen Bell', description: 'Warm singing bowl resonance' },
  { id: 'radar', name: 'Digital Radar', description: 'Two-tone brisk alert' },
  { id: 'crystal', name: 'Crystal Ping', description: 'Clean glass chime' },
];

const PRESETS = [
  { label: '1m', mins: 1, secs: 0 },
  { label: '3m', mins: 3, secs: 0 },
  { label: '5m', mins: 5, secs: 0 },
  { label: '10m', mins: 10, secs: 0 },
  { label: '15m', mins: 15, secs: 0 },
  { label: '25m', mins: 25, secs: 0 },
  { label: '45m', mins: 45, secs: 0 },
  { label: '60m', mins: 60, secs: 0 },
];

export default function App() {
  // Input fields for initial duration
  const [inputMinutes, setInputMinutes] = useState<number>(25);
  const [inputSeconds, setInputSeconds] = useState<number>(0);

  // Active state
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1500); // 25 mins
  const [totalSeconds, setTotalSeconds] = useState<number>(1500);

  // Settings
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [selectedSound, setSelectedSound] = useState<SoundType>('apple-chime');
  const [volume, setVolume] = useState<number>(0.85);
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Refs for timing accuracy (avoiding tab drift)
  const timerEndTimestampRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRecurringRef = useRef(isRecurring);
  const selectedSoundRef = useRef(selectedSound);
  const volumeRef = useRef(volume);

  useEffect(() => {
    isRecurringRef.current = isRecurring;
  }, [isRecurring]);

  useEffect(() => {
    selectedSoundRef.current = selectedSound;
  }, [selectedSound]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Compute total duration from inputs
  const computeInputTotalSeconds = useCallback(() => {
    const mins = Math.max(0, Number(inputMinutes) || 0);
    const secs = Math.max(0, Math.min(59, Number(inputSeconds) || 0));
    return mins * 60 + secs;
  }, [inputMinutes, inputSeconds]);

  // Handle countdown tick with performance.now()
  const tick = useCallback(() => {
    if (!timerEndTimestampRef.current) return;

    const now = performance.now();
    const remainingMs = timerEndTimestampRef.current - now;
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    setRemainingSeconds(remainingSec);

    if (remainingMs <= 0) {
      // Completed!
      playAlertSound(selectedSoundRef.current, volumeRef.current);
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 1600);

      if (isRecurringRef.current) {
        // Immediately restart countdown with original duration
        setCycleCount((prev) => prev + 1);
        const originalDuration = computeInputTotalSeconds();
        if (originalDuration > 0) {
          setTotalSeconds(originalDuration);
          setRemainingSeconds(originalDuration);
          timerEndTimestampRef.current = performance.now() + originalDuration * 1000;
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }
      }

      // If not recurring, stop at 00:00
      setStatus('completed');
      setRemainingSeconds(0);
      timerEndTimestampRef.current = null;
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  }, [computeInputTotalSeconds]);

  // Toggle Timer (Start / Pause / Resume)
  const toggleTimer = () => {
    if (status === 'running') {
      // Pause
      if (timerEndTimestampRef.current) {
        const now = performance.now();
        const remainingMs = timerEndTimestampRef.current - now;
        const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
        setRemainingSeconds(remaining);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      timerEndTimestampRef.current = null;
      setStatus('paused');
    } else if (status === 'paused') {
      // Resume
      const durationToRun = remainingSeconds;
      if (durationToRun <= 0) return;

      timerEndTimestampRef.current = performance.now() + durationToRun * 1000;
      setStatus('running');

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    } else {
      // Start fresh
      let durationToRun = remainingSeconds;
      if (status === 'idle' || status === 'completed') {
        const computed = computeInputTotalSeconds();
        if (computed <= 0) {
          setInputMinutes(25);
          setInputSeconds(0);
          durationToRun = 1500;
          setTotalSeconds(1500);
        } else {
          durationToRun = computed;
          setTotalSeconds(computed);
        }
        setCycleCount(1);
      }

      setRemainingSeconds(durationToRun);
      timerEndTimestampRef.current = performance.now() + durationToRun * 1000;
      setStatus('running');

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  // Reset Timer
  const resetTimer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    timerEndTimestampRef.current = null;
    setStatus('idle');
    const computed = computeInputTotalSeconds();
    const fallback = computed || 1500;
    setTotalSeconds(fallback);
    setRemainingSeconds(fallback);
    setCycleCount(0);
  };

  // Handle Input Changes
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    const mins = Math.max(0, Math.min(999, isNaN(raw) ? 0 : raw));
    setInputMinutes(mins);
    if (status === 'idle') {
      const newTotal = mins * 60 + inputSeconds;
      setTotalSeconds(newTotal);
      setRemainingSeconds(newTotal);
    }
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    const secs = Math.max(0, Math.min(59, isNaN(raw) ? 0 : raw));
    setInputSeconds(secs);
    if (status === 'idle') {
      const newTotal = inputMinutes * 60 + secs;
      setTotalSeconds(newTotal);
      setRemainingSeconds(newTotal);
    }
  };

  // Apply quick preset
  const applyPreset = (mins: number, secs: number) => {
    if (status === 'running') return;
    setInputMinutes(mins);
    setInputSeconds(secs);
    const total = mins * 60 + secs;
    setTotalSeconds(total);
    setRemainingSeconds(total);
    setStatus('idle');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'KeyR' || e.code === 'Escape') {
        e.preventDefault();
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, remainingSeconds, inputMinutes, inputSeconds]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Sync tab title
  useEffect(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (status === 'running') {
      document.title = `(${formatted}) Focus Timer`;
    } else if (status === 'paused') {
      document.title = `[Paused] ${formatted} - Focus Timer`;
    } else if (status === 'completed') {
      document.title = `⏰ Time's up! - Focus Timer`;
    } else {
      document.title = 'Focus Timer';
    }
  }, [remainingSeconds, status]);

  // Format display numbers
  const displayHours = Math.floor(remainingSeconds / 3600);
  const displayMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const displaySecs = remainingSeconds % 60;

  const formattedDisplay =
    displayHours > 0
      ? `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`
      : `${String(displayMinutes).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`;

  // Calculate progress percentage for subtle ambient indicator
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-between min-h-screen w-full bg-black text-white font-sans p-6 sm:p-10 md:p-12 overflow-x-hidden selection:bg-[#34C759]/30">
      {/* Top Header Bar */}
      <header className="w-full max-w-4xl flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-widest text-zinc-500 uppercase select-none">
            Focus Timer
          </span>
          {isRecurring && cycleCount > 0 && (
            <span className="text-[11px] font-medium tracking-tight bg-zinc-800/80 border border-zinc-700 text-[#34C759] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              Cycle {cycleCount}
            </span>
          )}
        </div>

        {/* Recurring Toggle (Requirement 3 & Theme Style) */}
        <div className="flex items-center gap-3">
          <label htmlFor="recurringTask" className="text-xs font-medium text-zinc-400 uppercase tracking-tight cursor-pointer select-none">
            Recurring
          </label>
          <label className="switch">
            <input
              id="recurringTask"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      {/* Main Center Countdown & Controls Area */}
      <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl py-6 my-auto z-10">
        {/* Subtle Progress Bar line on top of display */}
        {status !== 'idle' && (
          <div className="w-48 sm:w-72 h-1 bg-zinc-900 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-[#34C759] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Large Ultra-Thin Typography Digital Display */}
        <div
          id="display"
          className={`font-mono-numbers text-7xl sm:text-[140px] md:text-[190px] lg:text-[220px] font-thin tracking-tighter tabular-nums leading-none mb-6 sm:mb-8 select-none transition-colors duration-300 ${
            status === 'completed'
              ? 'text-[#34C759] animate-pulse font-extralight'
              : status === 'paused'
              ? 'text-yellow-400'
              : isFlashing
              ? 'text-[#34C759]'
              : 'text-white'
          }`}
        >
          {formattedDisplay}
        </div>

        {/* Duration Input Container (Minutes & Seconds) */}
        <div id="inputContainer" className="flex items-center gap-4 sm:gap-6 mb-6">
          <div className="flex flex-col items-center">
            <input
              type="number"
              id="minInput"
              min="0"
              max="999"
              disabled={status === 'running'}
              value={inputMinutes}
              onChange={handleMinutesChange}
              className="text-4xl sm:text-5xl w-24 sm:w-28 focus:outline-none transition-opacity disabled:opacity-40"
              aria-label="Set minutes"
            />
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2 select-none">
              Minutes
            </span>
          </div>

          <span className="text-3xl sm:text-4xl font-thin text-zinc-700 mb-6 select-none">:</span>

          <div className="flex flex-col items-center">
            <input
              type="number"
              id="secInput"
              min="0"
              max="59"
              disabled={status === 'running'}
              value={inputSeconds}
              onChange={handleSecondsChange}
              className="text-4xl sm:text-5xl w-24 sm:w-28 focus:outline-none transition-opacity disabled:opacity-40"
              aria-label="Set seconds"
            />
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 mt-2 select-none">
              Seconds
            </span>
          </div>
        </div>

        {/* Preset Duration Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-10 max-w-md">
          {PRESETS.map((preset) => {
            const isActive = inputMinutes === preset.mins && inputSeconds === preset.secs;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.mins, preset.secs)}
                disabled={status === 'running'}
                className={`text-xs px-3 py-1 rounded-full border transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                  isActive
                    ? 'bg-[#34C759]/15 border-[#34C759] text-[#34C759] font-medium'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Apple Circular Control Buttons */}
        <div className="flex items-center gap-8 sm:gap-12">
          {/* Reset Button */}
          <button
            id="resetBtn"
            onClick={resetTimer}
            disabled={status === 'idle' && remainingSeconds === computeInputTotalSeconds()}
            className="control-btn w-20 h-20 rounded-full bg-zinc-800 flex flex-col items-center justify-center text-sm font-medium text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-md select-none"
            aria-label="Reset Timer"
          >
            <RotateCcw className="w-5 h-5 mb-1 opacity-80" />
            <span>Reset</span>
          </button>

          {/* Start / Pause / Resume Button */}
          <button
            id="startBtn"
            onClick={toggleTimer}
            className={`control-btn w-24 h-24 rounded-full flex flex-col items-center justify-center text-lg font-semibold shadow-xl cursor-pointer select-none ${
              status === 'running'
                ? 'bg-[#FF3B30] text-white hover:bg-[#e03429]'
                : 'bg-[#34C759] text-black hover:bg-[#30be54]'
            }`}
            aria-label={status === 'running' ? 'Pause Timer' : status === 'paused' ? 'Resume Timer' : 'Start Timer'}
          >
            <span>
              {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
            </span>
          </button>
        </div>

        {/* Audio Synthesis Settings & Audition Drawer */}
        <div className="mt-10 w-full max-w-sm">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
            <button
              type="button"
              onClick={() => setShowSoundSettings(!showSoundSettings)}
              className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Chime: {SOUND_OPTIONS.find((s) => s.id === selectedSound)?.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSoundSettings ? 'rotate-180' : ''}`} />
            </button>

            <button
              id="test-sound-btn"
              type="button"
              onClick={() => playAlertSound(selectedSound, volume)}
              className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <Volume2 className="w-3 h-3 text-[#34C759]" />
              Test
            </button>
          </div>

          {showSoundSettings && (
            <div className="mt-2 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                Web Audio Chime Tone
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SOUND_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedSound(opt.id);
                      playAlertSound(opt.id, volume);
                    }}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer flex items-center justify-between ${
                      selectedSound === opt.id
                        ? 'bg-[#34C759]/10 border-[#34C759]/40 text-[#34C759]'
                        : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-zinc-200">{opt.name}</div>
                      <div className="text-[10px] text-zinc-500">{opt.description}</div>
                    </div>
                    {selectedSound === opt.id && <Check className="w-3.5 h-3.5 text-[#34C759] shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-zinc-400">Volume:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#34C759] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono-numbers text-zinc-400 w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer Area */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-zinc-900/80 text-zinc-600 text-[11px] font-medium tracking-wide uppercase select-none z-10">
        <p>Apple Design Philosophy • Minimalist Utility</p>
        <div className="flex items-center gap-2 text-zinc-500">
          <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">Space</kbd> Start/Pause</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-400">R</kbd> Reset</span>
        </div>
      </footer>
    </div>
  );
}
