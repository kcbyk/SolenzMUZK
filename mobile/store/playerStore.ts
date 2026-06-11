import { create } from 'zustand';
import type { ContentItem } from '../types/index';

export type PlayerMode = 'audio' | 'video';

interface PlayerState {
  currentItem: ContentItem | null;
  queue: ContentItem[];
  isPlaying: boolean;
  isShuffle: boolean;
  mode: PlayerMode;
  streamUrl: string | null;
  setCurrentItem: (item: ContentItem, url: string, mode?: PlayerMode) => void;
  setQueue: (items: ContentItem[]) => void;
  toggleShuffle: () => void;
  setIsPlaying: (v: boolean) => void;
  clear: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentItem: null,
  queue: [],
  isPlaying: false,
  isShuffle: false,
  mode: 'audio',
  streamUrl: null,

  setCurrentItem: (item, url, mode = 'audio') =>
    set({ currentItem: item, streamUrl: url, mode, isPlaying: true }),

  setQueue: (items) => set({ queue: items }),

  toggleShuffle: () => {
    const { queue, isShuffle } = get();
    if (!isShuffle) {
      // Fisher-Yates shuffle
      const shuffled = [...queue];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
      }
      set({ isShuffle: true, queue: shuffled });
    } else {
      set({ isShuffle: false });
    }
  },

  setIsPlaying: (v) => set({ isPlaying: v }),
  clear: () => set({ currentItem: null, queue: [], isPlaying: false, streamUrl: null }),
}));
