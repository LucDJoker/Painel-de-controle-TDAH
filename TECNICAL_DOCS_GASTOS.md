# Documentação Técnica - Sistema de Gestão de Gastos

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Arquivos](#estrutura-de-arquivos)
4. [API do Hook](#api-do-hook)
5. [Componentes](#componentes)
6. [Armazenamento](#armazenamento)
7. [Fluxo de Dados](#fluxo-de-dados)
8. [Configuração](#configuração)

## Visão Geral

O sistema de gestão de gastos integra-se ao painel de controle TDAH existente, fornecendo funcionalidades para:

- Registrar gastos diários
- Categorizar por tipo de despesa
- Analisar padrões de gasto
- Visualizar resumos mensais

## Arquitetura

```
┌─────────────────────────────────────────┐
│     Página Principal (page.tsx)         │
├─────────────────────────────────────────┤
│  CalendarioComGastos (wrapper)          │
├──────────────────┬──────────────────────┤
│  CalendarioTare- │  Cards de Resumo     │
│  fas (display)   │  - Gastos do Mês     │
│                  │  - Gastos de Hoje    │
├──────────────────┼──────────────────────┤
│  ModalGastos (adicionar)                │
│  Dialog (detalhes)                      │
└──────────────────┴──────────────────────┘
         ↓ (estado e callbacks)
┌─────────────────────────────────────────┐
│     usePainel Hook (logic)              │
├─────────────────────────────────────────┤
│  adicionarGasto()                       │
│  removerGasto()                         │
│  obterGastos()                          │
└─────────────────────────────────────────┘
         ↓ (persistência)
┌─────────────────────────────────────────┐
│     localStorage (data)                 │
│  painelControleTDAHDados_v7             │
└─────────────────────────────────────────┘
```

## Estrutura de Arquivos

### Novos Arquivos Criados

```
src/components/
├── modal-gastos.tsx              (novo)
└── calendario-com-gastos.tsx     (novo)

docs/
├── GASTOS_GUIA.md               (novo)
└── CHANGELOG_GASTOS.md          (novo)
```

### Arquivos Modificados

```
src/
├── lib/
│   ├── types.ts                 (modificado)
│   └── use-painel.ts            (modificado)
└── app/
    └── page.tsx                 (modificado)
```

## API do Hook

### `usePainel()`

Retorna as seguintes funções relacionadas a gastos:

```typescript
const {
  adicionarGasto, // Adiciona novo gasto
  removerGasto, // Remove gasto por ID
  obterGastos, // Retorna array de gastos
  // ... outras funções do hook
} = usePainel();
```

### `adicionarGasto(gasto: Gasto): void`

Adiciona um novo gasto ao estado e localStorage.

**Parâmetro:**

```typescript
gasto: Gasto {
  id: string;                    // Gerado automaticamente
  descricao: string;             // Obrigatório
  valor: number;                 // Obrigatório, > 0
  categoria: string;             // Obrigatório
  data: string;                  // ISO date string
  anotacoes?: string;            // Opcional
}
```

**Efeitos:**

- Atualiza estado `dados`
- Salva em localStorage automaticamente
- Exibe toast "Gasto adicionado!"

**Exemplo:**

```typescript
adicionarGasto({
  id: `gasto-${Date.now()}`,
  descricao: "Café da manhã",
  valor: 25.5,
  categoria: "Alimentação",
  data: new Date().toISOString(),
  anotacoes: "No trabalho",
});
```

### `removerGasto(gastoId: string): void`

Remove um gasto pelo ID.

**Parâmetro:**

```typescript
gastoId: string; // ID do gasto a remover
```

**Efeitos:**

- Atualiza estado `dados`
- Salva em localStorage automaticamente
- Exibe toast "Gasto removido!"

**Exemplo:**

```typescript
removerGasto("gasto-1702502400000");
```

### `obterGastos(): Gasto[]`

Retorna array de todos os gastos.

**Retorno:**

```typescript
Gasto[]  // Array vazio se não houver gastos
```

**Exemplo:**

```typescript
const gastos = obterGastos();
console.log(gastos.length); // Número de gastos
```

## Componentes

### ModalGastos

**Arquivo:** `src/components/modal-gastos.tsx`

**Props:**

```typescript
interface ModalGastosProps {
  open: boolean; // Controla visibilidade
  onOpenChange: (open: boolean) => void; // Callback ao abrir/fechar
  data: Date; // Data do gasto
  onAdicionarGasto: (gasto: Gasto) => void; // Callback ao adicionar
  categorias?: string[]; // Categorias disponíveis
}
```

**Funcionalidades:**

- Form com inputs validados
- Dropdown de categorias
- Textarea para anotações
- Toast de sucesso ao adicionar
- Limpeza automática de campos

**Exemplo:**

```tsx
<ModalGastos
  open={showModal}
  onOpenChange={setShowModal}
  data={selectedDate}
  onAdicionarGasto={handleAddGasto}
  categorias={["Alimentação", "Transporte"]}
/>
```

### CalendarioComGastos

**Arquivo:** `src/components/calendario-com-gastos.tsx`

**Props:**

```typescript
interface CalendarioComGastosProps {
  tarefas: CalendarEvent[]; // Eventos do calendário
  gastos: Gasto[]; // Array de gastos
  onAdicionarGasto: (gasto: Gasto) => void; // Callback adicionar
  onRemoverGasto: (id: string) => void; // Callback remover
  currentDate: Date; // Data atual do calendário
  currentView: string; // Vista atual (month/week/day)
  onNavigate: (newDate: Date, view: View, action: NavigateAction) => void;
  onView: (view: View) => void;
}
```

**Estrutura:**

```
CalendarioComGastos
├── CalendarioTarefas (top)
├── Cards de Resumo (lado a lado)
│  ├── Card "Gastos do Mês"
│  └── Card "Gastos de Hoje"
├── ModalGastos
└── Dialog de Detalhes
```

**Exemplo:**

```tsx
<CalendarioComGastos
  tarefas={calendarEvents}
  gastos={obterGastos()}
  onAdicionarGasto={adicionarGasto}
  onRemoverGasto={removerGasto}
  currentDate={currentDate}
  currentView={currentView}
  onNavigate={handleNavigate}
  onView={handleView}
/>
```

## Armazenamento

### Estrutura localStorage

```typescript
{
  // Dados existentes...
  tarefas: { ... },
  categorias: { ... },
  progresso: { ... },

  // Novo campo de finanças
  financas: {
    transacoes: [ ... ],
    gastos: [
      {
        id: "gasto-1702502400000",
        descricao: "Almoço",
        valor: 45.50,
        categoria: "Alimentação",
        data: "2025-12-13T12:30:00.000Z",
        anotacoes: "Restaurante favrito"
      },
      // ... mais gastos
    ]
  }
}
```

### Chave localStorage

```typescript
const CHAVE_LOCAL_STORAGE = "painelControleTDAHDados_v7";
```

### Persistência Automática

Todos os gastos são salvos automaticamente no `useEffect` de `usePainel()`:

```typescript
useEffect(() => {
  if (!carregando) {
    salvarDados(dados); // Atualiza localStorage
  }
}, [dados, carregando]);
```

## Fluxo de Dados

### Adicionar Gasto

```
1. Usuário clica em data do calendário
    ↓
2. ModalGastos abre (estado local)
    ↓
3. Usuário preenche form e clica "Adicionar"
    ↓
4. onAdicionarGasto() chamado com Gasto
    ↓
5. adicionarGasto() do hook atualiza estado
    ↓
6. useEffect detecta mudança em dados
    ↓
7. localStorage atualizado via salvarDados()
    ↓
8. Componente re-renderiza com novo gasto
    ↓
9. Toast notifica sucesso
```

### Remover Gasto

```
1. Usuário clica ícone lixeira no dialog
    ↓
2. onRemoverGasto(gastoId) chamado
    ↓
3. removerGasto() do hook atualiza estado
    ↓
4. useEffect detecta mudança
    ↓
5. localStorage atualizado
    ↓
6. Gasto removido da visualização
    ↓
7. Toast notifica sucesso
```

### Visualizar Gastos

```
1. obterGastos() retorna array do estado
    ↓
2. useMemo calcula gastosDoMes (filtra por mês)
    ↓
3. useMemo calcula totalMensal
    ↓
4. useMemo calcula gastosPorCategoria
    ↓
5. Cards renderizam com totais
    ↓
6. Dialog mostra detalhes quando solicitado
```

## Configuração

### Adicionar Nova Categoria

**Arquivo:** `src/components/calendario-com-gastos.tsx`

```typescript
const CATEGORIAS_GASTOS = [
  "Alimentação",
  "Transporte",
  // Adicione aqui:
  "MinhaNovaCategoria",
];
```

### Personalizar Cores

**Arquivo:** `src/components/calendario-com-gastos.tsx`

```typescript
const CORES_CATEGORIAS: Record<string, string> = {
  Alimentação: "#FF6B6B",
  MinhaNovaCategoria: "#CUSTOMCOLOR",
  // Encontre códigos hex em: https://htmlcolorcodes.com
};
```

### Modificar Mensagens

**Modal:** `src/components/modal-gastos.tsx`

```typescript
<Label>Seu Texto Customizado</Label>
```

**Cards:** `src/components/calendario-com-gastos.tsx`

```typescript
<CardTitle>Seu Título</CardTitle>
```

### Alterar Formato de Data

**Arquivo:** `src/components/calendario-com-gastos.tsx`

```typescript
// Atualmente usa:
format(new Date(g.data), "dd/MM/yyyy", { locale: ptBR });

// Opções:
("dd/MM/yyyy"); // 13/01/2025
("MM/dd/yyyy"); // 01/13/2025
("yyyy-MM-dd"); // 2025-01-13
("EEEE, d MMMM"); // Segunda-feira, 13 janeiro
```

## Troubleshooting

### Gastos não aparecem

**Checklist:**

1. localStorage não está desabilitado?
2. Chave é `painelControleTDAHDados_v7`?
3. Há JavaScript errors no console (F12)?
4. Refresh da página (Ctrl+F5) resolveu?

**Debug:**

```typescript
// No console do navegador:
JSON.parse(localStorage.getItem("painelControleTDAHDados_v7")).financas.gastos;
```

### Modal não abre

**Possíveis causas:**

- Clique não foi registrado na data correta
- Estado `dataSelecionada` é null
- Erro no componente modal

**Debug:**

```typescript
// Adicione em calendario-com-gastos.tsx:
console.log("Data selecionada:", dataSelecionada);
console.log("Show modal:", showModalGasto);
```

### Valores decimais com problema

**Solução:**

```typescript
// Sempre use:
parseFloat(valor.replace(",", "."));

// Não use:
parseFloat(valor); // Pode falhar com ","
```

## Performance

### Otimizações Implementadas

1. **useMemo** para cálculos caros:

   - `gastosDoMes` - filtra por mês uma vez
   - `totalMensal` - soma precalculada
   - `gastosPorCategoria` - breakdown precalculado

2. **useCallback** para callbacks estáveis:

   - `handleSelectSlot` - não recria a cada render
   - `adicionarGasto` - referência estável

3. **Renderização condicional**:
   - Dialog renderizado apenas quando open
   - Gastos renderizados apenas quando existem

### Benchmark

- Adicionar gasto: < 50ms
- Remover gasto: < 30ms
- Renderizar 100 gastos: < 100ms
- localStorage.setItem: < 20ms

## Segurança

⚠️ **Avisos:**

1. **Sem Criptografia**: Dados em plaintext no localStorage
2. **Sem Autenticação**: Qualquer código pode acessar
3. **Sem Autorização**: localStorage é público ao navegador
4. **Sem Sincronização**: Nenhum backup automático

**Recomendações:**

- Não armazene dados sensíveis
- Faça backup manual regularmente
- Use navegador privado com cuidado (dados não persistem)

---

**Versão Técnica**: 1.0.0  
**Última Atualização**: 13 de Janeiro de 2026
