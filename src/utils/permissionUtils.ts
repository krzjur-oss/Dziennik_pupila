export interface PermissionStatusSummary {
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
}

/**
 * Checks the current permission states passively without prompting the user.
 */
export async function checkPermissionsStatus(): Promise<PermissionStatusSummary> {
  const status: PermissionStatusSummary = {
    camera: 'prompt',
    microphone: 'prompt',
    notifications: 'default'
  };

  // Check notifications
  if (typeof window !== 'undefined' && 'Notification' in window) {
    status.notifications = window.Notification.permission as any;
  } else {
    status.notifications = 'unsupported';
  }

  // Check camera & microphone via Permissions API if available
  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      status.camera = cam.state as any;
    } catch {
      // Some browsers don't support camera query in permissions.query
    }

    try {
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      status.microphone = mic.state as any;
    } catch {
      // Some browsers don't support microphone query in permissions.query
    }
  }

  return status;
}
