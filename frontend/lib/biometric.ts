import { Capacitor } from '@capacitor/core';

const BIOMETRIC_SERVER = 'ch.epidoc.pilot';
const BIOMETRIC_FLAG = 'epidoc_biometric_enabled';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function isBiometricEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(BIOMETRIC_FLAG) === 'true';
}

function setBiometricEnabled(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) {
    window.localStorage.setItem(BIOMETRIC_FLAG, 'true');
  } else {
    window.localStorage.removeItem(BIOMETRIC_FLAG);
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
    const result = await NativeBiometric.isAvailable({ useFallback: false });
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function enableBiometricLogin(email: string, password: string): Promise<void> {
  if (!(await isBiometricAvailable())) {
    throw new Error('Fingerabdruck ist auf diesem Gerät nicht verfügbar.');
  }
  const { NativeBiometric, AccessControl } = await import('@capgo/capacitor-native-biometric');
  await NativeBiometric.setCredentials({
    username: email,
    password,
    server: BIOMETRIC_SERVER,
    accessControl: AccessControl.BIOMETRY_ANY,
    title: 'EpiDoc',
    negativeButtonText: 'Abbrechen',
  });
  setBiometricEnabled(true);
}

export async function disableBiometricLogin(): Promise<void> {
  if (isNativeApp()) {
    try {
      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
      await NativeBiometric.deleteCredentials({ server: BIOMETRIC_SERVER });
    } catch {
      // Keystore-Eintrag war möglicherweise schon leer
    }
  }
  setBiometricEnabled(false);
}

export async function syncBiometricCredentials(email: string, password: string): Promise<void> {
  if (!isBiometricEnabled() || !isNativeApp()) return;
  try {
    await enableBiometricLogin(email, password);
  } catch {
    // Token-Login nicht blockieren
  }
}

export async function loginWithBiometrics(): Promise<{ email: string; password: string }> {
  if (!isBiometricEnabled()) {
    throw new Error('Fingerabdruck-Login ist nicht eingerichtet.');
  }
  const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');
  const credentials = await NativeBiometric.getSecureCredentials({
    server: BIOMETRIC_SERVER,
    title: 'EpiDoc',
    subtitle: 'Mit Fingerabdruck anmelden',
    description: 'Bestätige deine Identität',
    negativeButtonText: 'Abbrechen',
  });
  if (!credentials.username || !credentials.password) {
    throw new Error('Kein gespeichertes Login gefunden.');
  }
  return { email: credentials.username, password: credentials.password };
}
