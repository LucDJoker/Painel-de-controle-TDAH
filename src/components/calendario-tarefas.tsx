// src/components/calendario-tarefas.tsx
'use client';

// Não precisa de 'import React from 'react';' com o novo JSX Transform
import { Calendar, dateFnsLocalizer, Views, type EventProps, type View } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { ptBR } from 'date-fns/locale';

import type { Tarefa, Categoria } from '@/lib/types'; // Assumindo que Categoria é sua interface de detalhes

// O CSS deve ser importado uma vez globalmente, por exemplo, no seu page.tsx ou layout.tsx
// import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  previous: '< Anterior',
  next: 'Próximo >',
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
  resource?: Tarefa & { categoriaInfo?: Categoria }; // Adicionando CategoriaInfo ao resource
}

interface CalendarioTarefasProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent, e: React.SyntheticEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date, end: Date, slots: Date[] | string[], action: 'select' | 'click' | 'doubleClick' }) => void;
}

const EventoDoCalendario = ({ event }: EventProps<CalendarEvent>) => {
  const corEvento = event.resource?.categoriaInfo?.cor || '#3b82f6'; // Usa a cor da categoria ou um azul padrão

  return (
    <div 
      className="text-xs p-1 rounded text-white"
      style={{ 
        backgroundColor: corEvento, 
        opacity: 0.9,
        borderColor: corEvento, // Adiciona uma borda da mesma cor para mais definição
        borderWidth: '1px',
        borderStyle: 'solid'
      }}
    >
      <strong>{event.title}</strong>
      {event.resource?.categoriaInfo && (
        <div className="text-xs opacity-80">{event.resource.categoriaInfo.emoji} {event.resource.categoriaInfo.nome}</div>
      )}
    </div>
  );
};

export function CalendarioTarefas({ events, onSelectEvent, onSelectSlot }: CalendarioTarefasProps) {
  const defaultView: View = Views.MONTH;
  const availableViews: View[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

  return (
    <div className="h-[70vh] min-h-[500px] text-sm md:text-base text-slate-700 dark:text-slate-300 bg-card p-2 rounded-md shadow"> 
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        allDayAccessor="allDay"
        style={{ height: '100%' }}
        culture="pt-BR"
        messages={messages}
        views={availableViews}
        defaultView={defaultView}
        selectable={true}
        onSelectEvent={onSelectEvent}
        onSelectSlot={onSelectSlot}
        dayPropGetter={(date: Date) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return {
                className: isToday ? '!bg-blue-100 dark:!bg-blue-800/30' : '',
            };
        }}
        components={{
            event: EventoDoCalendario, 
        }}
      />
    </div>
  );
}