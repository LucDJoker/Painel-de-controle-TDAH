from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Optional, Dict

@dataclass
class Transaction:
    amount: float
    category: str
    description: str = ""
    date: str = None

    def __post_init__(self):
        if self.date is None:
            self.date = datetime.utcnow().isoformat()

class Ledger:
    def __init__(self, storage):
        self.storage = storage
        self._transactions: List[Transaction] = [Transaction(**t) for t in self.storage.load()] if self.storage.exists() else []

    def add_transaction(self, tx: Transaction):
        self._transactions.append(tx)
        self._persist()

    def list_transactions(self) -> List[Transaction]:
        return list(self._transactions)

    def get_balance(self) -> float:
        return sum(t.amount for t in self._transactions)

    def summary_by_category(self) -> Dict[str, float]:
        s: Dict[str, float] = {}
        for t in self._transactions:
            s[t.category] = s.get(t.category, 0.0) + t.amount
        return s

    def _persist(self):
        self.storage.save([asdict(t) for t in self._transactions])
