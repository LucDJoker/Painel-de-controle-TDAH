// src/components/calendario-tarefas.tsx
'use client';

import { Calendar, dateFnsLocalizer, Views, EventProps, View } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ptBR from 'date-fns/locale/pt-BR'; // Importando o locale para Português-Brasil
import type { Tarefa } from '@/lib/types'; // Importe seu tipo Tarefa

// Importe o CSS da biblioteca. Faremos isso na page.tsx para ser carregado globalmente,
// mas se quiser manter o CSS específico do componente, pode importar aqui:
// import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuração do localizador para o date-fns com o locale pt-BR
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

// Definindo as mensagens do calendário em Português
const messages = {
  allDay: 'Dia todo',
  previous: '< Anterior', // Mais visual
  next: 'Próximo >',   // Mais visual
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento', // Ou 'Tarefa' se preferir
  noEventsInRange: 'Não há tarefas com alarme neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

// Interface para os eventos que o calendário espera
export interface CalendarEvent { // Exportando para possível uso externo
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Tarefa; // Para guardar a tarefa original se quisermos interagir depois
}

interface CalendarioTarefasProps {
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent, e: React.SyntheticEvent) => void; // Opcional: para quando clicar num evento
  onSelectSlot?: (slotInfo: { start: Date, end: Date, slots: Date[] | string[], action: 'select' | 'click' | 'doubleClick' }) => void; // Opcional: para quando clicar num dia/horário
}

// Componente customizado para renderizar um evento no calendário
const EventoDoCalendario = ({ event }: EventProps<CalendarEvent>) => {
  return (
    <div className="text-xs p-1">
      <strong>{event.title}</strong>
      {/* Você pode adicionar mais informações aqui se quiser, como a categoria */}
      {/* Ex: <p className="text-xs">{event.resource?.categoriaId}</p> */}
    </div>
  );
};


export function CalendarioTarefas({ events, onSelectEvent, onSelectSlot }: CalendarioTarefasProps) {
  const defaultView = Views.MONTH;
  const availableViews: View[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

  return (
    // O calendário precisa de um container com altura definida para renderizar corretamente
    // A altura pode ser ajustada conforme sua necessidade
    <div className="h-[70vh] min-h-[500px] text-sm md:text-base text-slate-700 dark:text-slate-300"> 
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
        selectable={true} // Permite selecionar slots de tempo
        onSelectEvent={onSelectEvent} // Função chamada ao clicar num evento
        onSelectSlot={onSelectSlot}   // Função chamada ao clicar/selecionar um slot de tempo
        dayPropGetter={(date: Date) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return {
                className: isToday ? 'bg-blue-100 dark:bg-blue-700/30' : '', // Destaca o dia de hoje
                style: {
                    // backgroundColor: isToday ? 'rgba(59, 130, 246, 0.1)' : undefined, // Alternativa
                }
            };
        }}
        eventPropGetter={(event: CalendarEvent) => {
            // Você pode customizar a cor do evento baseado na categoria da tarefa original (event.resource)
            // Exemplo: const corCategoria = event.resource?.corDaCategoria || '#3174ad';
            const style = {
                backgroundColor: '#3b82f6', // Azul padrão para eventos
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            };
            return {
                style: style,
            };
        }}
        components={{
            event: EventoDoCalendario, // Usa o componente customizado para o evento
        }}
      />
    </div>
  );
}