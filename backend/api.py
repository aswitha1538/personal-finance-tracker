 # backend/api.py
from flask import Flask, request, jsonify
from database import FinanceDatabase
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})  # Allow requests from localhost:3000
db = FinanceDatabase()

@app.route('/api/income', methods=['POST'])
def add_income():
    data = request.json
    try:
        if not all(key in data for key in ['amount', 'description']):
            return jsonify({'error': 'Missing required fields: amount and description are required'}), 400
        amount = float(data['amount'])
        description = data['description']
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        db.add_transaction('income', amount, 'Income', description)
        return jsonify({'message': 'Income added successfully'}), 201
    except ValueError as e:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expense', methods=['POST'])
def add_expense():
    data = request.json
    try:
        if not all(key in data for key in ['amount', 'description', 'category']):
            return jsonify({'error': 'Missing required fields: amount, category, and description are required'}), 400
        amount = float(data['amount'])
        category = data['category'] if data['category'] in ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping'] else 'Other'
        description = data['description']
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        db.add_transaction('expense', amount, category, description)
        return jsonify({'message': 'Expense added successfully'}), 201
    except ValueError as e:
        return jsonify({'error': 'Invalid amount format'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/summary', methods=['GET'])
def get_summary():
    summary = db.get_summary()
    return jsonify(summary)

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = db.get_recent_transactions()
    return jsonify([{
        'id': t[0],
        'type': t[1],
        'amount': t[2],
        'category': t[3],
        'description': t[4],
        'date': t[5]
    } for t in transactions])

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (id,))
        conn.commit()
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)