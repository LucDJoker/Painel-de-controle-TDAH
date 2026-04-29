Finance Manager (Python)

Pequeno app CLI para gestão financeira pessoal (transações em JSON).

Setup

1. Criar e ativar virtualenv (Windows):

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Uso

Adicionar uma transação:

```bash
python cli.py add --amount -50 --category Alimentacao --description "Almoço"
```

Listar transações:

```bash
python cli.py list
```

Ver saldo:

```bash
python cli.py balance
```

Resumo por categoria:

```bash
python cli.py summary
```

Arquivo de dados padrão: `data/transactions.json` (criado automaticamente).
