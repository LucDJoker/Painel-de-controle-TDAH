import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  try {
    if (!Capacitor.isNativePlatform()) return false;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch {
    return false;
  }
}

export async function agendarNotificacao(id: number, titulo: string, corpo: string, quando: Date): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    const granted = await solicitarPermissaoNotificacoes();
    if (!granted) return;
    const schedule: ScheduleOptions['notifications'] = [{
      id,
      title: titulo,
      body: corpo,
      schedule: { at: quando },
      sound: 'alarm',
      smallIcon: 'ic_stat_icon',
      ongoing: false,
      autoCancel: true,
    }];
    await LocalNotifications.schedule({ notifications: schedule });
  } catch (e) {
    // Silencioso
  }
}

export async function cancelarNotificacao(id: number): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {}
}
