export interface PermissionStatusSummary {
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
}

/**
 * Checks the current permission states if the Permissions API is supported
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

/**
 * Actively triggers browser prompts to grant camera, microphone, and notification permissions
 */
export async function requestAllPermissions(): Promise<{
  cameraGranted: boolean;
  microphoneGranted: boolean;
  notificationsGranted: boolean;
  message: string;
}> {
  let cameraGranted = false;
  let microphoneGranted = false;
  let notificationsGranted = false;

  // 1. Request Notification permission
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        notificationsGranted = true;
      } else if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        notificationsGranted = res === 'granted';
      }
    } catch (err) {
      console.warn('Could not request notification permission:', err);
    }
  }

  // 2. Request Camera & Microphone via getUserMedia
  if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      // First try requesting both together
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      cameraGranted = true;
      microphoneGranted = true;
      // Release streams immediately so camera/mic lights don't stay on
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      // Fallback: try requesting individually if one is blocked or unavailable
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraGranted = true;
        camStream.getTracks().forEach((track) => track.stop());
      } catch {
        cameraGranted = false;
      }

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneGranted = true;
        micStream.getTracks().forEach((track) => track.stop());
      } catch {
        microphoneGranted = false;
      }
    }
  }

  let message = 'Uprawnienia zostały pomyślnie zaktualizowane!';
  if (!cameraGranted && !microphoneGranted && !notificationsGranted) {
    message = 'Nie udało się nadać uprawnień lub zostały one odrzucone. Możesz włączyć je w ustawieniach przeglądarki (ikona kłódki 🔒).';
  } else if (!cameraGranted || !microphoneGranted) {
    message = 'Część uprawnień została nadana. Pozostałe możesz odblokować w ustawieniach przeglądarki.';
  }

  return {
    cameraGranted,
    microphoneGranted,
    notificationsGranted,
    message
  };
}
