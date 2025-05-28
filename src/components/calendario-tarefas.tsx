// src/components/calendario-tarefas.tsx
'use client';

import { Calendar, dateFnsLocalizer, Views, type EventProps, type View, type NavigateAction } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tarefa, Categoria as CategoriaInfo } from '@/lib/types';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Dia todo',
  previous: '◄', // Símbolo para anterior
  next: '►',     // Símbolo para próximo
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Tarefa',
  noEventsInRange: 'Não há tarefas com alarme neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Tarefa & { categoriaInfo?: CategoriaInfo };
}

interface CalendarioTarefasProps {
  events: CalendarEvent[];
  currentDate: Date; // Controlado pelo componente pai
  currentView: View; // Controlado pelo componente pai
  onNavigate: (newDate: Date, view: View, action: NavigateAction) => void;
  onView: (view: View) => void;
  onSelectEvent?: (event: CalendarEvent, e: React.SyntheticEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date, end: Date, slots: Date[] | string[], action: 'select' | 'click' | 'doubleClick' }) => void;
}

const EventoDoCalendario = ({ event }: EventProps<CalendarEvent>) => {
  const corEvento = event.resource?.categoriaInfo?.cor || '#3b82f6';
  return (
    <div 
      className="text-xs p-1 rounded text-white overflow-hidden" // Adicionado overflow-hidden
      title={event.title} // Tooltip com o título completo
      style={{ 
        backgroundColor: corEvento, 
        opacity: 0.9,
        borderColor: corEvento,
        borderWidth: '1px',
        borderStyle: 'solid',
        lineHeight: '1.2', // Melhorar espaçamento interno
      }}
    >
      <strong>{event.title}</strong>
      {event.resource?.categoriaInfo && (
        <div className="text-[10px] opacity-80 truncate">{event.resource.categoriaInfo.emoji} {event.resource.categoriaInfo.nome}</div>
      )}
    </div>
  );
};

export function CalendarioTarefas({ 
  events, 
  currentDate,
  currentView,
  onNavigate,
  onView,
  onSelectEvent, 
  onSelectSlot 
}: CalendarioTarefasProps) {
  
  const availableViews: View[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

  return (
    <div className="h-[70vh] min-h-[550px] text-sm md:text-base bg-card p-1 sm:p-2 rounded-md shadow"> 
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay" // Garante que eventos allDay sejam tratados corretamente
        style={{ height: '100%' }}
        culture="pt-BR"
        messages={messages}
        
        date={currentDate} // Prop para controlar a data exibida
        view={currentView}   // Prop para controlar a visualização exibida
        onNavigate={onNavigate} // Handler para mudança de data
        onView={onView}         // Handler para mudança de visualização
        views={availableViews}  // Define quais visualizações estão disponíveis na toolbar

        selectable={true}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        
        dayPropGetter={(date: Date) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return {
                className: `rbc-day-bg ${isToday ? '!bg-blue-50 dark:!bg-blue-900/30' : ''}`,
            };
        }}
        components={{
            event: EventoDoCalendario, 
        }}
        popup // Habilita o pop-up para ver mais eventos se não couberem no dia
        toolbar={true} // Garante que a toolbar de navegação seja exibida
      />
    </div>
  );
}