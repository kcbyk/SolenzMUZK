import { useState } from 'react';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  type Track,
} from 'react-native-track-player';
import { usePlayerStore } from '../store/playerStore';
import { getAudioUrl } from '../services/streamService';
import type { ContentItem } from '../types/index';

export function useTrackPlayer() {
  const playbackState = usePlaybackState();
  const progress = useProgress(1000);
  const store = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isPlaying = playbackState.state === State.Playing;

  const playItem = async (item: ContentItem) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const url = await getAudioUrl(item.videoId);
      const track: Track = {
        id: item.videoId,
        url,
        title: item.title,
        artist: item.channelName,
        artwork: item.thumbnailUrl ?? undefined,
        duration: item.durationSec,
      };
      await TrackPlayer.reset();
      await TrackPlayer.add(track);
      await TrackPlayer.play();
      store.setCurrentItem(item, url, 'audio');
    } catch {
      setLoadError('İçerik yüklenemedi, lütfen tekrar deneyin');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) { await TrackPlayer.pause(); store.setIsPlaying(false); }
    else { await TrackPlayer.play(); store.setIsPlaying(true); }
  };

  const skipToNext = async () => { try { await TrackPlayer.skipToNext(); } catch {} };
  const skipToPrevious = async () => { try { await TrackPlayer.skipToPrevious(); } catch {} };
  const seekTo = async (seconds: number) => TrackPlayer.seekTo(seconds);
  const setVolume = async (vol: number) => TrackPlayer.setVolume(vol / 100);

  return {
    isPlaying, isLoading, loadError, progress,
    playItem, togglePlay, skipToNext, skipToPrevious, seekTo, setVolume,
    currentItem: store.currentItem,
    isShuffle: store.isShuffle,
    toggleShuffle: store.toggleShuffle,
  };
}
