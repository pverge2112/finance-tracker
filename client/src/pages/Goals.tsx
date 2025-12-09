import { useState } from 'react';
import { Plus, Target, Pencil, Trash2, X, TrendingUp } from 'lucide-react';
import { useApi, apiPost, apiPut, apiDelete } from '../hooks/useApi';
import type { Goal } from '../types';
import { differenceInDays } from 'date-fns';
import './Goals.css';

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4'];

export function Goals() {
  const { data: goals, refetch } = useApi<Goal[]>('/goals');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    await apiDelete(`/goals/${id}`);
    refetch();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleContribute = (goal: Goal) => {
    setContributingGoal(goal);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingGoal(null);
  };

  const getProgress = (goal: Goal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getDaysLeft = (deadline: string | undefined) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    return days;
  };

  return (
    <div className="goals-page animate-in">
      <header className="page-header">
        <div>
          <h1>Savings Goals</h1>
          <p>Track your progress towards financial goals</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          New Goal
        </button>
      </header>

      {goals && goals.length > 0 ? (
        <div className="goals-grid">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const daysLeft = getDaysLeft(goal.deadline);
            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
                <div className="goal-header">
                  <div className="goal-icon" style={{ background: goal.color + '20', color: goal.color }}>
                    <Target size={24} />
                  </div>
                  <div className="goal-actions">
                    <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(goal)}>
                      <Pencil size={16} />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(goal.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="goal-name">{goal.name}</h3>

                <div className="goal-amounts">
                  <span className="current">{formatCurrency(goal.current_amount)}</span>
                  <span className="target">of {formatCurrency(goal.target_amount)}</span>
                </div>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%`, background: goal.color }}
                    />
                  </div>
                  <span className="progress-percent">{progress.toFixed(0)}%</span>
                </div>

                {goal.deadline && (
                  <div className="goal-deadline">
                    {isCompleted ? (
                      <span className="completed-badge">Goal Reached!</span>
                    ) : daysLeft !== null && daysLeft >= 0 ? (
                      <span>{daysLeft} days left</span>
                    ) : (
                      <span className="overdue">Overdue</span>
                    )}
                  </div>
                )}

                {!isCompleted && (
                  <button
                    className="btn btn-secondary contribute-btn"
                    onClick={() => handleContribute(goal)}
                  >
                    <TrendingUp size={16} />
                    Add Contribution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <Target size={48} />
          <p>No savings goals yet</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create your first goal
          </button>
        </div>
      )}

      {showModal && (
        <GoalModal
          goal={editingGoal}
          onClose={handleClose}
          onSave={() => {
            handleClose();
            refetch();
          }}
        />
      )}

      {contributingGoal && (
        <ContributeModal
          goal={contributingGoal}
          onClose={() => setContributingGoal(null)}
          onSave={() => {
            setContributingGoal(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

interface GoalModalProps {
  goal: Goal | null;
  onClose: () => void;
  onSave: () => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() || '0');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [color, setColor] = useState(goal?.color || COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(currentAmount),
      deadline: deadline || undefined,
      color,
    };

    try {
      if (goal) {
        await apiPut(`/goals/${goal.id}`, data);
      } else {
        await apiPost('/goals', data);
      }
      onSave();
    } catch (err) {
      alert('Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{goal ? 'Edit Goal' : 'New Goal'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Goal Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Emergency Fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="target">Target Amount</label>
            <input
              id="target"
              type="number"
              step="0.01"
              min="0"
              placeholder="10000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="current">Current Amount</label>
            <input
              id="current"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Target Date (optional)</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : goal ? 'Update' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ContributeModalProps {
  goal: Goal;
  onClose: () => void;
  onSave: () => void;
}

function ContributeModal({ goal, onClose, onSave }: ContributeModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newAmount = goal.current_amount + parseFloat(amount);

    try {
      await apiPut(`/goals/${goal.id}`, {
        ...goal,
        current_amount: newAmount,
      });
      onSave();
    } catch (err) {
      alert('Failed to add contribution');
    } finally {
      setLoading(false);
    }
  };

  const remaining = goal.target_amount - goal.current_amount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Contribution</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="contribute-info">
            <p>Contributing to <strong>{goal.name}</strong></p>
            <p className="remaining">
              {formatCurrency(remaining)} remaining to reach your goal
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="contribution">Amount</label>
            <input
              id="contribution"
              type="number"
              step="0.01"
              min="0"
              max={remaining}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
