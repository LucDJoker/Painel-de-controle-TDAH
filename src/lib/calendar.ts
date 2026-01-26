import { Capacitor } from '@capacitor/core';
import { Calendar } from '@awesome-cordova-plugins/calendar';

type CalendarEventOptions = {
  title: string;
  location: string;
  notes: string;
  startDate: Date;
  endDate: Date;
  reminders?: { first?: number; second?: number };
};

export async function criarEventoCalendario(titulo: string, local: string | undefined, descricao: string, inicio: Date, fim?: Date): Promise<void> {
  try {
    if (!Capacitor.isNativePlatform()) return;
    const end = fim || new Date(inicio.getTime() + 30 * 60 * 1000);
    await Calendar.createEvent(titulo, local || '', descricao, inicio, end);
  } catch (e) {
    // silencioso
  }
}
