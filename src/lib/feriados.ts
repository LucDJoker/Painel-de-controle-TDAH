export interface FeriadoAPI {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  counties?: string[] | null;
  launchYear?: number | null;
  types?: string[];
}

export async function obterFeriados(year: number, country = 'BR', stateCode?: string) {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`);
    if (!res.ok) return [];
    const data: FeriadoAPI[] = await res.json();

    // Se stateCode informado, filtramos por counties que contenham BR-<UF>
    let feriados = data;
    if (stateCode) {
      const code = `BR-${stateCode.toUpperCase()}`;
      feriados = data.filter((f) => !f.counties || f.counties.length === 0 || f.counties?.includes(code));
    }

    // Procura o Carnaval (Carnival Tuesday)
    const carnavalIdx = feriados.findIndex(f => 
      f.localName?.toLowerCase().includes('carnaval') || 
      f.name?.toLowerCase().includes('carnival')
    );
    
    if (carnavalIdx !== -1) {
      // Parse da data string YYYY-MM-DD de forma segura (sem timezone issues)
      const [ano, mes, dia] = feriados[carnavalIdx].date.split('-').map(Number);
      const carnavalDate = new Date(ano, mes - 1, dia); // mês é 0-indexed no Date
      
      console.log('Carnaval encontrado:', feriados[carnavalIdx].date, 'Dia da semana:', carnavalDate.getDay());
      
      // Segunda de Carnaval (2 dias antes)
      const segunda = new Date(ano, mes - 1, dia - 2);
      
      // Quarta de Cinzas (1 dia depois)
      const quarta = new Date(ano, mes - 1, dia + 1);
      
      // Formata as datas em YYYY-MM-DD
      const formatarData = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      };
      
      // Adiciona Segunda se não existir
      if (!feriados.some(f => f.date === formatarData(segunda))) {
        feriados.push({
          date: formatarData(segunda),
          localName: 'Segunda de Carnaval',
          name: 'Carnival Monday',
          countryCode: 'BR',
          types: ['Public'],
        });
      }
      
      // Adiciona Quarta se não existir
      if (!feriados.some(f => f.date === formatarData(quarta))) {
        feriados.push({
          date: formatarData(quarta),
          localName: 'Quarta de Cinzas',
          name: 'Ash Wednesday',
          countryCode: 'BR',
          types: ['Public'],
        });
      }
    }

    return feriados;
  } catch (e) {
    console.error('Erro ao obter feriados:', e);
    return [];
  }
}
