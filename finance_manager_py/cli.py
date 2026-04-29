import argparse
from finance_manager import Transaction, Ledger, JSONStorage

DATA_PATH = "data/transactions.json"

def make_parser():
    p = argparse.ArgumentParser(description="Finance Manager CLI")
    sub = p.add_subparsers(dest="cmd")

    add = sub.add_parser("add", help="Add a transaction")
    add.add_argument("--amount", type=float, required=True)
    add.add_argument("--category", required=True)
    add.add_argument("--description", default="")

    sub.add_parser("list", help="List transactions")
    sub.add_parser("balance", help="Show balance")
    sub.add_parser("summary", help="Summary by category")

    return p


def cmd_add(args, ledger: Ledger):
    tx = Transaction(amount=args.amount, category=args.category, description=args.description)
    ledger.add_transaction(tx)
    print("Added:", tx)


def cmd_list(args, ledger: Ledger):
    for t in ledger.list_transactions():
        print(f"{t.date}  {t.amount:10.2f}  {t.category:15}  {t.description}")


def cmd_balance(args, ledger: Ledger):
    print(f"Balance: {ledger.get_balance():.2f}")


def cmd_summary(args, ledger: Ledger):
    s = ledger.summary_by_category()
    for cat, amt in s.items():
        print(f"{cat:15} {amt:10.2f}")


def main():
    parser = make_parser()
    args = parser.parse_args()
    storage = JSONStorage(DATA_PATH)
    ledger = Ledger(storage)

    if args.cmd == "add":
        cmd_add(args, ledger)
    elif args.cmd == "list":
        cmd_list(args, ledger)
    elif args.cmd == "balance":
        cmd_balance(args, ledger)
    elif args.cmd == "summary":
        cmd_summary(args, ledger)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
