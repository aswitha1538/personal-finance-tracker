import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import './App.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const [summary, setSummary] = useState({ income: 0, expenses: 0, savings: 0, category_expenses: {} });
  const [transactions, setTransactions] = useState([]);
  const [formData, setFormData] = useState({ type: 'income', amount: '', category: '', description: '' });
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [theme, setTheme] = useState('day');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates] = useState({
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    INR: 83.5,
    AUD: 1.35,
    CAD: 1.27,
    JPY: 110.0,
    CNY: 6.45,
    CHF: 0.92,
    SEK: 8.65,
    NZD: 1.42,
    SGD: 1.34,
    HKD: 7.78,
    KRW: 1190.0,
    BRL: 5.2,
    ZAR: 14.5,
    MXN: 20.0,
    RUB: 73.0,
    AED: 3.67,
    SAR: 3.75
  });

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/summary');
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = formData.type === 'income' ? '/api/income' : '/api/expense';
    console.log('Sending data:', formData);
    try {
      const dataToSend = {
        amount: parseFloat(formData.amount) || 0,
        description: formData.description || '',
        category: formData.type === 'expense' ? (formData.category || 'Other') : undefined,
      };
      await axios.post(`http://localhost:5000${endpoint}`, dataToSend);
      fetchSummary();
      fetchTransactions();
      setFormData({ type: 'income', amount: '', category: '', description: '' });
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Error details:', error.response ? error.response.data : error.message);
      alert('Error adding transaction: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      fetchTransactions();
      fetchSummary();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const convertCurrency = (amount) => {
    return currency === 'USD' ? amount.toFixed(2) : (amount * exchangeRates[currency]).toFixed(2);
  };

  const barData = {
    labels: Object.keys(summary.category_expenses),
    datasets: [{
      label: 'Expenses',
      data: Object.values(summary.category_expenses),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
      borderWidth: 1,
    }],
  };

  const trend = transactions.length > 0
    ? transactions.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : -curr.amount), 0) > 0
      ? 'Upward'
      : transactions.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : -curr.amount), 0) < 0
      ? 'Downward'
      : 'Balanced Growth'
    : 'Balanced Growth';

  return (
    <div className={`App ${theme}`}>
      <h1>Personal Finance Tracker</h1>
      <div className="theme-switcher">
        <span className={`theme-icon ${theme === 'day' ? 'active' : ''}`} onClick={() => setTheme('day')}>
          ☀️
        </span>
        <span className={`theme-icon ${theme === 'night' ? 'active' : ''}`} onClick={() => setTheme('night')}>
          🌙
        </span>
        <select value={currency} onChange={e => setCurrency(e.target.value)}>
          {Object.keys(exchangeRates).map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          {formData.type === 'expense' && (
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              <option value="">Select Category</option>
              {['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <button type="submit">Add Transaction</button>
        </form>
      </div>

      <div className="card summary">
        <h2>Summary</h2>
        <p>Total Income: {convertCurrency(summary.income)} {currency}</p>
        <p>Total Expenses: {convertCurrency(summary.expenses)} {currency}</p>
        <p>Savings: {convertCurrency(summary.savings)} {currency}</p>
        <div>
          <input
            type="number"
            placeholder="Set Savings Goal"
            value={savingsGoal}
            onChange={e => setSavingsGoal(e.target.value ? parseFloat(e.target.value) : 0)}
          />
          <p>Savings Goal Progress: {savingsGoal > 0 ? ((summary.savings / savingsGoal) * 100).toFixed(2) : '0'}%</p>
        </div>
      </div>

      <div className="card chart">
        <h2>Expense Distribution</h2>
        {Object.keys(summary.category_expenses).length > 0 ? (
          <div className="chart-container">
            <Bar
              data={barData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Amount (USD)',
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Categories',
                    },
                  },
                },
              }}
            />
          </div>
        ) : (
          <p>No expenses to display yet!</p>
        )}
      </div>

      <div className="card transactions">
        <h2>Recent Transactions <span className={`trend ${trend.toLowerCase().replace(' ', '-')}`}>{trend} Trend</span></h2>
        <ul>
          {transactions.map(t => (
            <li key={t.id}>
              [{t.date}] {t.type.toUpperCase()}: {convertCurrency(t.amount)} {currency} - {t.category} - {t.description}
              <button onClick={() => deleteTransaction(t.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;