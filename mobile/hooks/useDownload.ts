import { useDownloadStore } from '../store/downloadStore';

export function useDownload() {
  const store = useDownloadStore();
  return store;
}
