/**
 * Formats a duration in seconds to a MM:SS format string
 * @param seconds - Duration in seconds
 * @returns Formatted string in MM:SS format
 */
export const formatDuration = (seconds: number): string => {
    if (!seconds && seconds !== 0) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };