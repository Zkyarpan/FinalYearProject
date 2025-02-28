export function formatTime(createdAt: string): React.ReactNode {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    ); // diff in seconds

    // If less than 60 seconds ago
    if (diff < 60) {
      return 'Just now';
    }

    // If less than 1 hour ago, show minutes
    if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    }

    // If less than 24 hours ago, show time
    if (diff < 86400) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }

    // Otherwise show date with year
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }