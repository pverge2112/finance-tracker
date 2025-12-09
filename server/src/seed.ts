import db from './db.js';

// Categories (matching those defined in index.ts)
const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
const expenseCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 'Other'];

// Helper to generate a random date within the last N months
function randomDate(monthsBack: number): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = now;
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Sample transactions data
const sampleTransactions = [
  // Income - recurring salary
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-12-01' },
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-11-01' },
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-10-01' },
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-09-01' },
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-08-01' },
  { type: 'income', amount: 5500, category: 'Salary', description: 'Monthly salary', date: '2024-07-01' },

  // Freelance income
  { type: 'income', amount: 1200, category: 'Freelance', description: 'Website redesign project', date: '2024-11-15' },
  { type: 'income', amount: 800, category: 'Freelance', description: 'Logo design', date: '2024-10-20' },
  { type: 'income', amount: 2000, category: 'Freelance', description: 'Mobile app consultation', date: '2024-09-10' },

  // Investment income
  { type: 'income', amount: 350, category: 'Investments', description: 'Dividend payment', date: '2024-12-05' },
  { type: 'income', amount: 275, category: 'Investments', description: 'Stock sale profit', date: '2024-10-25' },

  // Gifts
  { type: 'income', amount: 500, category: 'Gifts', description: 'Birthday gift from family', date: '2024-11-20' },

  // Food & Dining expenses
  { type: 'expense', amount: 85, category: 'Food & Dining', description: 'Weekly groceries', date: '2024-12-07' },
  { type: 'expense', amount: 92, category: 'Food & Dining', description: 'Weekly groceries', date: '2024-11-30' },
  { type: 'expense', amount: 78, category: 'Food & Dining', description: 'Weekly groceries', date: '2024-11-23' },
  { type: 'expense', amount: 45, category: 'Food & Dining', description: 'Dinner at Italian restaurant', date: '2024-12-04' },
  { type: 'expense', amount: 32, category: 'Food & Dining', description: 'Coffee and lunch', date: '2024-12-02' },
  { type: 'expense', amount: 65, category: 'Food & Dining', description: 'Birthday dinner', date: '2024-11-20' },
  { type: 'expense', amount: 28, category: 'Food & Dining', description: 'Fast food', date: '2024-11-15' },
  { type: 'expense', amount: 120, category: 'Food & Dining', description: 'Thanksgiving groceries', date: '2024-11-25' },

  // Transportation
  { type: 'expense', amount: 55, category: 'Transportation', description: 'Gas', date: '2024-12-06' },
  { type: 'expense', amount: 48, category: 'Transportation', description: 'Gas', date: '2024-11-22' },
  { type: 'expense', amount: 52, category: 'Transportation', description: 'Gas', date: '2024-11-08' },
  { type: 'expense', amount: 150, category: 'Transportation', description: 'Car maintenance', date: '2024-11-10' },
  { type: 'expense', amount: 35, category: 'Transportation', description: 'Uber rides', date: '2024-12-03' },
  { type: 'expense', amount: 25, category: 'Transportation', description: 'Parking', date: '2024-11-28' },

  // Shopping
  { type: 'expense', amount: 89, category: 'Shopping', description: 'Winter jacket', date: '2024-12-01' },
  { type: 'expense', amount: 45, category: 'Shopping', description: 'Books', date: '2024-11-18' },
  { type: 'expense', amount: 250, category: 'Shopping', description: 'Holiday gifts', date: '2024-12-05' },
  { type: 'expense', amount: 35, category: 'Shopping', description: 'Household items', date: '2024-10-28' },
  { type: 'expense', amount: 120, category: 'Shopping', description: 'New running shoes', date: '2024-10-15' },

  // Entertainment
  { type: 'expense', amount: 15, category: 'Entertainment', description: 'Netflix subscription', date: '2024-12-01' },
  { type: 'expense', amount: 15, category: 'Entertainment', description: 'Netflix subscription', date: '2024-11-01' },
  { type: 'expense', amount: 15, category: 'Entertainment', description: 'Netflix subscription', date: '2024-10-01' },
  { type: 'expense', amount: 12, category: 'Entertainment', description: 'Spotify subscription', date: '2024-12-01' },
  { type: 'expense', amount: 12, category: 'Entertainment', description: 'Spotify subscription', date: '2024-11-01' },
  { type: 'expense', amount: 45, category: 'Entertainment', description: 'Concert tickets', date: '2024-11-12' },
  { type: 'expense', amount: 28, category: 'Entertainment', description: 'Movie night', date: '2024-12-07' },
  { type: 'expense', amount: 60, category: 'Entertainment', description: 'Video game', date: '2024-10-20' },

  // Bills & Utilities
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-12-01' },
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-11-01' },
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-10-01' },
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-09-01' },
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-08-01' },
  { type: 'expense', amount: 1800, category: 'Bills & Utilities', description: 'Rent', date: '2024-07-01' },
  { type: 'expense', amount: 95, category: 'Bills & Utilities', description: 'Electric bill', date: '2024-12-05' },
  { type: 'expense', amount: 88, category: 'Bills & Utilities', description: 'Electric bill', date: '2024-11-05' },
  { type: 'expense', amount: 75, category: 'Bills & Utilities', description: 'Electric bill', date: '2024-10-05' },
  { type: 'expense', amount: 65, category: 'Bills & Utilities', description: 'Internet', date: '2024-12-03' },
  { type: 'expense', amount: 65, category: 'Bills & Utilities', description: 'Internet', date: '2024-11-03' },
  { type: 'expense', amount: 85, category: 'Bills & Utilities', description: 'Phone bill', date: '2024-12-02' },
  { type: 'expense', amount: 85, category: 'Bills & Utilities', description: 'Phone bill', date: '2024-11-02' },

  // Healthcare
  { type: 'expense', amount: 150, category: 'Healthcare', description: 'Doctor visit copay', date: '2024-11-14' },
  { type: 'expense', amount: 45, category: 'Healthcare', description: 'Prescription medication', date: '2024-11-14' },
  { type: 'expense', amount: 25, category: 'Healthcare', description: 'Vitamins and supplements', date: '2024-12-01' },
  { type: 'expense', amount: 180, category: 'Healthcare', description: 'Dental checkup', date: '2024-10-08' },

  // Travel
  { type: 'expense', amount: 450, category: 'Travel', description: 'Flight tickets - Thanksgiving', date: '2024-11-20' },
  { type: 'expense', amount: 320, category: 'Travel', description: 'Hotel - weekend getaway', date: '2024-10-12' },
  { type: 'expense', amount: 85, category: 'Travel', description: 'Airbnb', date: '2024-09-15' },

  // Education
  { type: 'expense', amount: 199, category: 'Education', description: 'Online course - TypeScript', date: '2024-11-05' },
  { type: 'expense', amount: 35, category: 'Education', description: 'Technical books', date: '2024-10-22' },
  { type: 'expense', amount: 49, category: 'Education', description: 'Udemy course bundle', date: '2024-09-18' },

  // Other expenses
  { type: 'expense', amount: 50, category: 'Other', description: 'Charity donation', date: '2024-12-01' },
  { type: 'expense', amount: 30, category: 'Other', description: 'Pet supplies', date: '2024-11-25' },
  { type: 'expense', amount: 75, category: 'Other', description: 'Haircut and grooming', date: '2024-11-08' },
];

// Sample savings goals
const sampleGoals = [
  { name: 'Emergency Fund', target_amount: 15000, current_amount: 8500, deadline: '2025-06-30', color: '#10b981' },
  { name: 'Vacation to Japan', target_amount: 5000, current_amount: 2200, deadline: '2025-09-01', color: '#f59e0b' },
  { name: 'New Laptop', target_amount: 2500, current_amount: 1800, deadline: '2025-03-15', color: '#6366f1' },
  { name: 'Investment Portfolio', target_amount: 10000, current_amount: 3500, deadline: '2025-12-31', color: '#8b5cf6' },
  { name: 'Home Down Payment', target_amount: 50000, current_amount: 12000, deadline: '2027-01-01', color: '#ec4899' },
];

async function seed() {
  console.log('Starting database seed...\n');

  // Check if data already exists
  const existingTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  const existingGoals = db.prepare('SELECT COUNT(*) as count FROM goals').get() as { count: number };

  if (existingTransactions.count > 0 || existingGoals.count > 0) {
    console.log('Database already contains data:');
    console.log(`  - Transactions: ${existingTransactions.count}`);
    console.log(`  - Goals: ${existingGoals.count}`);
    console.log('\nTo reseed, first clear the existing data or delete the database file.');
    console.log('Run with --force to clear existing data and reseed.\n');

    if (process.argv.includes('--force')) {
      console.log('--force flag detected. Clearing existing data...\n');
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM goals').run();
    } else {
      process.exit(0);
    }
  }

  // Insert transactions
  console.log('Inserting sample transactions...');
  const insertTransaction = db.prepare(
    'INSERT INTO transactions (type, amount, category, description, date) VALUES (?, ?, ?, ?, ?)'
  );

  const insertTransactions = db.transaction((transactions: typeof sampleTransactions) => {
    for (const t of transactions) {
      insertTransaction.run(t.type, t.amount, t.category, t.description, t.date);
    }
  });

  insertTransactions(sampleTransactions);
  console.log(`  Inserted ${sampleTransactions.length} transactions`);

  // Insert goals
  console.log('Inserting sample goals...');
  const insertGoal = db.prepare(
    'INSERT INTO goals (name, target_amount, current_amount, deadline, color) VALUES (?, ?, ?, ?, ?)'
  );

  const insertGoals = db.transaction((goals: typeof sampleGoals) => {
    for (const g of goals) {
      insertGoal.run(g.name, g.target_amount, g.current_amount, g.deadline, g.color);
    }
  });

  insertGoals(sampleGoals);
  console.log(`  Inserted ${sampleGoals.length} goals`);

  // Summary
  console.log('\nSeed completed successfully!');
  console.log('\nSummary of seeded data:');

  const incomeTotal = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'income'").get() as { total: number };
  const expenseTotal = db.prepare("SELECT SUM(amount) as total FROM transactions WHERE type = 'expense'").get() as { total: number };

  console.log(`  Total Income: $${incomeTotal.total.toLocaleString()}`);
  console.log(`  Total Expenses: $${expenseTotal.total.toLocaleString()}`);
  console.log(`  Net Savings: $${(incomeTotal.total - expenseTotal.total).toLocaleString()}`);
  console.log(`  Goals: ${sampleGoals.length}`);
}

seed();
