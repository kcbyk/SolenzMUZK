import { useState, useCallback } from 'react';
import { search } from '../services/searchService';
import type { ContentItem } from '../types/index';

export function useSearch() {
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await search(query);
      setResults(items);
    } catch {
      setError('Arama gerçekleştirilemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, doSearch };
}
