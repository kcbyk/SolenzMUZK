import TrackPlayer, { Event, Capability } from 'react-native-track-player';

export async function setupTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.getActiveTrackIndex();
  } catch {
    await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play, Capability.Pause,
        Capability.SkipToNext, Capability.SkipToPrevious,
        Capability.Stop, Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    });
  }
}

// PlaybackService — must be registered via TrackPlayer.registerPlaybackService
module.exports = async function () {
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext().catch(() => {}));
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious().catch(() => {}));
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
};
