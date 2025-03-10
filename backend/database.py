 # backend/database.py
import sqlite3
from threading import local

class FinanceDatabase:
    def __init__(self):
        self.db_name = 'finance_tracker.db'
        self.thread_local = local()
        self.init_db()

    def get_connection(self):
        # Use thread-local storage to ensure each thread has its own connection
        if not hasattr(self.thread_local, 'connection'):
            self.thread_local.connection = sqlite3.connect(self.db_name, check_same_thread=False)
        return self.thread_local.connection

    def init_db(self):
        conn = sqlite3.connect(self.db_name, check_same_thread=False)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL
            )
        ''')
        conn.commit()
        conn.close()

    def add_transaction(self, type, amount, category, description):
        date = sqlite3.datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)',
            (type, amount, category, description, date)
        )
        conn.commit()

    def get_summary(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT type, amount, category FROM transactions')
        transactions = cursor.fetchall()

        income = sum(t[1] for t in transactions if t[0] == 'income')
        expenses = sum(t[1] for t in transactions if t[0] == 'expense')
        savings = income - expenses
        category_expenses = {}
        for t in transactions:
            if t[0] == 'expense':
                category = t[2] if t[2] else 'Other'
                category_expenses[category] = category_expenses.get(category, 0) + t[1]

        return {
            'income': income,
            'expenses': expenses,
            'savings': savings,
            'category_expenses': category_expenses
        }

    def get_recent_transactions(self, limit=10):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM transactions ORDER BY date DESC LIMIT ?', (limit,))
        return cursor.fetchall()

    def close(self):
        if hasattr(self.thread_local, 'connection'):
            self.thread_local.connection.close()