import json
import os
from typing import List

class JSONStorage:
    def __init__(self, path: str):
        self.path = path
        os.makedirs(os.path.dirname(self.path), exist_ok=True)

    def exists(self) -> bool:
        return os.path.exists(self.path)

    def load(self) -> List[dict]:
        if not self.exists():
            return []
        with open(self.path, "r", encoding="utf-8") as f:
            return json.load(f)

    def save(self, data: List[dict]):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
