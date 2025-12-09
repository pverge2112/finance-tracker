import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Types
interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface Goal {
  id?: number;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  color?: string;
}

// === TRANSACTIONS ===

// Get all transactions with optional filters
app.get('/api/transactions', (req, res) => {
  const { type, category, startDate, endDate, limit = 100 } = req.query;

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params: (string | number)[] = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type as string);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category as string);
  }
  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate as string);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate as string);
  }

  query += ' ORDER BY date DESC, id DESC LIMIT ?';
  params.push(Number(limit));

  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// Create transaction
app.post('/api/transactions', (req, res) => {
  const { type, amount, category, description, date }: Transaction = req.body;

  const result = db.prepare(
    'INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)'
  ).run(type, amount, category, description || null, date);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(transaction);
});

// Update transaction
app.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, amount, category, description, date }: Transaction = req.body;

  db.prepare(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?'
  ).run(type, amount, category, description || null, date, id);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.json(transaction);
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  res.status(204).send();
});

// === GOALS ===

// Get all goals
app.get('/api/goals', (_req, res) => {
  const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
  res.json(goals);
});

// Create goal
app.post('/api/goals', (req, res) => {
  const { name, target_amount, current_amount = 0, deadline, color = '#6366f1' }: Goal = req.body;

  const result = db.prepare(
    'INSERT INTO goals (name, target_amount, current_amount, deadline, color) VALUES (?, ?, ?, ?, ?)'
  ).run(name, target_amount, current_amount, deadline || null, color);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(goal);
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  const { name, target_amount, current_amount, deadline, color }: Goal = req.body;

  db.prepare(
    'UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, color = ? WHERE id = ?'
  ).run(name, target_amount, current_amount || 0, deadline || null, color || '#6366f1', id);

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json(goal);
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  res.status(204).send();
});

// === ANALYTICS ===

// Get summary stats
app.get('/api/analytics/summary', (req, res) => {
  const { startDate, endDate } = req.query;

  let dateFilter = '';
  const params: string[] = [];

  if (startDate && endDate) {
    dateFilter = 'WHERE date >= ? AND date <= ?';
    params.push(startDate as string, endDate as string);
  }

  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} type = 'income'`
  ).get(...params) as { total: number };

  const expenses = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${dateFilter} ${dateFilter ? 'AND' : 'WHERE'} type = 'expense'`
  ).get(...params) as { total: number };

  res.json({
    totalIncome: income.total,
    totalExpenses: expenses.total,
    netSavings: income.total - expenses.total,
  });
});

// Get spending by category
app.get('/api/analytics/by-category', (req, res) => {
  const { type = 'expense', startDate, endDate } = req.query;

  let query = `
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM transactions
    WHERE type = ?
  `;
  const params: string[] = [type as string];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate as string);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate as string);
  }

  query += ' GROUP BY category ORDER BY total DESC';

  const breakdown = db.prepare(query).all(...params);
  res.json(breakdown);
});

// Get monthly trends
app.get('/api/analytics/monthly', (req, res) => {
  const { months = 6 } = req.query;

  const trends = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions
    WHERE date >= date('now', '-' || ? || ' months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all(Number(months));

  res.json(trends);
});

// Get categories
app.get('/api/categories', (_req, res) => {
  const categories = {
    income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'],
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Other'],
  };
  res.json(categories);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
