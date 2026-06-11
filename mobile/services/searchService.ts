import api from './api';
import type { ContentItem } from '../types/index';

export async function search(query: string, limit = 50): Promise<ContentItem[]> {
  const res = await api.get<{ items: ContentItem[] }>('/api/search', { params: { q: query, limit } });
  return res.data.items;
}

export async function getTrending(category = 'muzik', page = 1): Promise<ContentItem[]> {
  const res = await api.get<{ items: ContentItem[] }>('/api/trending', { params: { category, page } });
  return res.data.items;
}

export async function getChannelVideos(channelId: string, page = 1): Promise<ContentItem[]> {
  const res = await api.get<{ items: ContentItem[] }>(`/api/channels/${channelId}/videos`, { params: { page } });
  return res.data.items;
}
