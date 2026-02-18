import { useCallback } from 'react';

export const useTimeFormatter = () => {
  const formatTimeAgo = useCallback((dateString: string): string => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / 1000
    );

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }, []);

  return { formatTimeAgo };
};