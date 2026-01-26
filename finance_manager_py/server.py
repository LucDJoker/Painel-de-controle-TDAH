from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from finance_manager import Ledger, JSONStorage, Transaction
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)
DATA_PATH = os.path.join(DATA_DIR, "transactions.json")

app = FastAPI(title="Focus ERP - Backend Brain")

ledger = Ledger(JSONStorage(DATA_PATH))


class TxIn(BaseModel):
    amount: float
    category: str
    description: Optional[str] = ""
    date: Optional[str] = None


class TxOut(TxIn):
    id: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/transactions", response_model=List[TxOut])
def list_transactions():
    txs = ledger.list_transactions()
    return [TxOut(id=getattr(t, 'date', ''), amount=t.amount, category=t.category, description=t.description, date=t.date) for t in txs]


@app.post("/transactions", response_model=TxOut, status_code=201)
def add_transaction(tx: TxIn):
    new = Transaction(amount=tx.amount, category=tx.category, description=tx.description, date=tx.date)
    ledger.add_transaction(new)
    return TxOut(id=new.date, **tx.dict())


@app.delete("/transactions/{tx_date}")
def remove_transaction(tx_date: str):
    # remove by date id (simple approach)
    all_tx = ledger.list_transactions()
    kept = [t for t in all_tx if t.date != tx_date]
    if len(kept) == len(all_tx):
        raise HTTPException(status_code=404, detail="transaction not found")
    ledger._transactions = kept
    ledger._persist()
    return {"deleted": tx_date}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
