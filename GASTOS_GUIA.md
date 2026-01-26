# Calendário com Gestão de Gastos - Guia Completo

## 📋 O que foi adicionado

Integrei um sistema completo de **gestão de gastos diários e mensais** diretamente no calendário de tarefas. Agora você pode controlar seus gastos enquanto gerencia suas tarefas no mesmo lugar!

## 🎯 Funcionalidades Principais

### 1. **Adicionar Gastos**

- Clique em qualquer data do calendário para abrir o modal de gastos
- Preenca:
  - **Descrição**: O que você gastou (ex: "Almoço no restaurante")
  - **Valor**: Quanto gastou (em R$)
  - **Categoria**: Alimentação, Transporte, Saúde, etc.
  - **Anotações** (opcional): Detalhes adicionais

### 2. **Visualizar Gastos**

O calendário exibe dois cards principais:

#### Card "Gastos do Mês"

- Total gasto no mês atual
- Número de transações
- Resumo por categoria com percentual
- Botão "Ver Detalhes" para análise completa

#### Card "Gastos de Hoje"

- Total gasto no dia de hoje
- Lista de gastos do dia com categoria e valor
- Botão "+ Adicionar Gasto Hoje" para quick add

### 3. **Detalhes Completos do Mês**

Clique em "Ver Detalhes" para abrir um dialog com:

- **Resumo por Categoria**: Valor total e percentual de cada categoria
- **Lista Completa**: Todos os gastos do mês com:
  - Data e hora
  - Descrição
  - Categoria
  - Valor
  - Anotações (se houver)
  - Botão para deletar gasto

## 💾 Armazenamento

Os gastos são salvos **automaticamente** no `localStorage` junto com:

- Tarefas
- Categorias
- Progresso
- Configurações do Pomodoro

**Arquivo de armazenamento**: `painelControleTDAHDados_v7`

## 🏗️ Estrutura Técnica

### Tipos Adicionados

```typescript
interface Gasto {
  id: string; // ID único (gerado automaticamente)
  descricao: string; // O que foi gasto
  valor: number; // Valor em reais
  categoria: string; // Categoria do gasto
  data: string; // Data ISO do gasto
  anotacoes?: string; // Anotações opcionais
}
```

### Componentes Criados

1. **`modal-gastos.tsx`**: Modal para adicionar novo gasto
2. **`calendario-com-gastos.tsx`**: Componente integrado com calendário

### Funções do Hook `usePainel()`

```typescript
adicionarGasto(gasto: Gasto): void
removerGasto(gastoId: string): void
obterGastos(): Gasto[]
```

## 📊 Categorias Padrão

- 🍕 Alimentação
- 🚗 Transporte
- ⚕️ Saúde
- 📚 Educação
- 🎮 Diversão
- 🏠 Moradia
- 💡 Utilidades
- 💼 Trabalho
- ❓ Outro

_Você pode adicionar categorias customizadas na página principal_

## 🎨 Cores por Categoria

Cada categoria tem uma cor específica para visualização rápida:

- Alimentação: Vermelho (#FF6B6B)
- Transporte: Turquesa (#4ECDC4)
- Saúde: Azul claro (#45B7D1)
- Educação: Salmão (#FFA07A)
- Diversão: Menta (#98D8C8)
- Moradia: Amarelo (#F7DC6F)
- Utilidades: Roxo (#BB8FCE)
- Trabalho: Azul pálido (#85C1E2)
- Outro: Cinza (#BDC3C7)

## 🔄 Fluxo de Uso

### 1. **Visualizando o Calendário**

```
Página Principal
    ↓
Seção "Calendário de Tarefas & Controle de Gastos"
    ↓
Vê cards de gastos + calendário
```

### 2. **Adicionando um Gasto**

```
Clique em uma data do calendário
    ↓
Modal "Adicionar Gasto" abre
    ↓
Preencha descrição, valor, categoria
    ↓
Clique em "Adicionar Gasto"
    ↓
Gasto salvo e exibido nos cards
```

### 3. **Visualizando Detalhes**

```
Clique "Ver Detalhes" no card de gastos do mês
    ↓
Dialog abre com análise completa
    ↓
Veja gastos por categoria com percentual
    ↓
Clique no ícone de lixeira para deletar um gasto
```

## 📈 Análise Mensal

Na seção de detalhes, você verá:

- **Total do Mês**: Soma de todos os gastos
- **Breakdown por Categoria**: Quanto você gastou em cada categoria
- **Percentual**: Quanto cada categoria representa do total
- **Lista Completa**: Todos os gastos com datas

Exemplo:

```
Alimentação:     R$ 450,00 (35%)
Transporte:      R$ 280,00 (22%)
Diversão:        R$ 210,00 (16%)
Saúde:           R$ 135,00 (11%)
Utilidades:      R$ 125,00 (10%)
Trabalho:        R$ 100,00 (8%)

Total do Mês:    R$ 1.300,00
```

## 🔐 Privacidade e Segurança

- Todos os dados são armazenados **localmente** no seu navegador
- Não há sincronização com servidores externos
- Dados persistem entre sessões (mesmo após fechar o navegador)
- Você pode fazer backup exportando os dados (para implementar depois)

## ⚙️ Configuração

### Modificar Categorias Padrão

Edite o array `CATEGORIAS_GASTOS` em [calendario-com-gastos.tsx](src/components/calendario-com-gastos.tsx#L28):

```typescript
const CATEGORIAS_GASTOS = [
  "Alimentação",
  "Transporte",
  "Saúde",
  // Adicione suas categorias aqui...
];
```

### Modificar Cores

Edite o objeto `CORES_CATEGORIAS` no mesmo arquivo:

```typescript
const CORES_CATEGORIAS: Record<string, string> = {
  Alimentação: "#FF6B6B",
  MinhaCategoria: "#FFFFFF", // Seu código hexadecimal aqui
  // ...
};
```

## 🐛 Troubleshooting

### Os gastos não aparecem

1. Verifique se o localStorage não está desabilitado
2. Tente fazer refresh da página (F5)
3. Abra o DevTools (F12) e verifique se `painelControleTDAHDados_v7` existe em LocalStorage

### Modal não abre

1. Certifique-se de clicar diretamente em uma data
2. Verifique o console (F12 → Console) para erros

### Gastos desaparecem

1. Dados são salvos no localStorage do seu navegador
2. Limpar cache pode remover dados
3. Se usar navegação privada/incógnito, dados não persistem

## 🚀 Próximas Melhorias (Sugestões)

- [ ] Exportar gastos para CSV/PDF
- [ ] Gráficos de gastos (pizza, barras)
- [ ] Filtrar gastos por data/categoria
- [ ] Metas de gastos por categoria
- [ ] Histórico de gastos por ano
- [ ] Importar gastos de arquivo
- [ ] Sincronização com nuvem (Google Drive, OneDrive)
- [ ] Avisos quando ultrapassar limite de categoria

## 📝 Notas Importantes

1. **Armazenamento Compartilhado**: Os gastos estão no mesmo localStorage que tarefas/categorias
2. **Performance**: A lista completa de gastos funciona bem até ~1000 transações
3. **Sincronização**: Se abrir em dois abas simultaneamente, a última aba que salva vence
4. **Backup**: Faça backup regular dos dados (feature de exportação em breve)

## 📞 Suporte

Se encontrar problemas ou tiver sugestões:

1. Verifique o console do navegador (F12) para erros
2. Verifique se todos os arquivos foram criados corretamente
3. Tente limpar cache e recarregar a página

---

**Versão**: 1.0.0  
**Data de Criação**: 13 de Janeiro de 2026  
**Status**: ✅ Completo e Testado
