"""
Force-load pysqlite3 as the stdlib sqlite3
------------------------------------------
Drop this file on PYTHONPATH and Python will execute it on every
interpreter start-up, before any of your code runs.
"""
import importlib, sys

pysqlite3 = importlib.import_module("pysqlite3")

# Expose it under the canonical names expected by stdlib
sys.modules["sqlite3"] = pysqlite3
sys.modules["_sqlite3"] = pysqlite3
