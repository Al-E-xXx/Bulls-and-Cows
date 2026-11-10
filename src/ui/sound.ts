export type SoundEvent = 'play' | 'guess' | 'win';

export interface SoundPlayer {
  play: (event: SoundEvent) => void;
}

export const createSoundPlayer = (
  sources: Record<SoundEvent, string>,
): SoundPlayer => {
  const cache = new Map<SoundEvent, HTMLAudioElement>();

  const play = (event: SoundEvent): void => {
    const audio = cache.get(event) ?? new Audio(sources[event]);
    cache.set(event, audio);
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };

  return { play };
};
