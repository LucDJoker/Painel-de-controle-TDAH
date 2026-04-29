from finance_manager.core import Transaction, Ledger
from finance_manager.storage import JSONStorage
import tempfile
import os

def test_add_and_balance(tmp_path):
    p = tmp_path / "data.json"
    storage = JSONStorage(str(p))
    ledger = Ledger(storage)
    ledger.add_transaction(Transaction(amount=100, category="Salary", description="Pay"))
    ledger.add_transaction(Transaction(amount=-30, category="Food", description="Lunch"))
    assert ledger.get_balance() == 70
    s = ledger.summary_by_category()
    assert s["Salary"] == 100
    assert s["Food"] == -30
