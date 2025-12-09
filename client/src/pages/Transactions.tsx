import { useState } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, Pencil, Trash2, X } from 'lucide-react';
import { useApi, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import type { Transaction, Categories } from '../types';
import { format } from 'date-fns';
import './Transactions.css';

export function Transactions() {
  const { data: transactions, refetch } = useApi<Transaction[]>('/transactions');
  const { data: categories } = useApi<Categories>('/categories');
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    await apiDelete(`/transactions/${id}`);
    refetch();
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  return (
    <div className="transactions-page animate-in">
      <header className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Track your income and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Transaction
        </button>
      </header>

      <div className="card">
        {transactions && transactions.length > 0 ? (
          <div className="transactions-table">
            <div className="table-header">
              <span>Type</span>
              <span>Category</span>
              <span>Description</span>
              <span>Date</span>
              <span>Amount</span>
              <span>Actions</span>
            </div>
            <div className="table-body">
              {transactions.map((tx) => (
                <div key={tx.id} className="table-row">
                  <span className="cell-type">
                    <span className={`type-badge ${tx.type}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {tx.type}
                    </span>
                  </span>
                  <span className="cell-category">{tx.category}</span>
                  <span className="cell-description">{tx.description || '-'}</span>
                  <span className="cell-date">{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                  <span className={`cell-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                  <span className="cell-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(tx)}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(tx.id)}>
                      <Trash2 size={16} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Receipt size={48} />
            <p>No transactions yet</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add your first transaction
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categories}
          onClose={handleClose}
          onSave={() => {
            handleClose();
            refetch();
          }}
        />
      )}
    </div>
  );
}

function Receipt({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17V7" />
    </svg>
  );
}

interface TransactionModalProps {
  transaction: Transaction | null;
  categories: Categories | null;
  onClose: () => void;
  onSave: () => void;
}

function TransactionModal({ transaction, categories, onClose, onSave }: TransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [category, setCategory] = useState(transaction?.category || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(transaction?.date || format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);

  const categoryOptions = type === 'income' ? categories?.income || [] : categories?.expense || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description: description || undefined,
      date,
    };

    try {
      if (transaction) {
        await apiPut(`/transactions/${transaction.id}`, data);
      } else {
        await apiPost('/transactions', data);
      }
      onSave();
    } catch (err) {
      alert('Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{transaction ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => { setType('expense'); setCategory(''); }}
              >
                <ArrowDownRight size={18} />
                Expense
              </button>
              <button
                type="button"
                className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => { setType('income'); setCategory(''); }}
              >
                <ArrowUpRight size={18} />
                Income
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
