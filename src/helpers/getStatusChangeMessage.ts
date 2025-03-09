export function getStatusChangeMessage(status, recipient) {
    if (recipient === 'user') {
      switch (status) {
        case 'confirmed': return 'Your appointment has been confirmed';
        case 'cancelled': return 'Your appointment has been cancelled';
        case 'rescheduled': return 'Your appointment has been rescheduled';
        case 'completed': return 'Your appointment has been marked as completed';
        default: return `Your appointment status has changed to ${status}`;
      }
    } else {
      switch (status) {
        case 'confirmed': return 'An appointment has been confirmed';
        case 'cancelled': return 'An appointment has been cancelled';
        case 'rescheduled': return 'An appointment has been rescheduled';
        case 'completed': return 'An appointment has been marked as completed';
        default: return `An appointment status has changed to ${status}`;
      }
    }
  }