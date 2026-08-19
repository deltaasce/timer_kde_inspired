export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type SoundType = 'apple-chime' | 'zen-bell' | 'radar' | 'crystal';

export interface SoundOption {
  id: SoundType;
  name: string;
  description: string;
}
