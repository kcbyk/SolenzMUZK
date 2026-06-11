import api from './api';

export async function getAudioUrl(videoId: string): Promise<string> {
  const res = await api.get<{ url: string }>(`/api/stream/${videoId}/audio-url`);
  return res.data.url;
}

export async function getVideoUrl(videoId: string, quality = '720p'): Promise<string> {
  const res = await api.get<{ url: string }>(`/api/stream/${videoId}/video-url`, { params: { quality } });
  return res.data.url;
}
