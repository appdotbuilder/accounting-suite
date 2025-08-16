import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { getTransactions } from '../handlers/get_transactions';

// Test data for creating transactions
const testTransactions: CreateTransactionInput[] = [
  {
    date: '2024-01-15',
    description: 'Website development services',
    amount: 2500.00,
    type: 'Income',
    category: 'Sales'
  },
  {
    date: '2024-01-10',
    description: 'Office rent payment',
    amount: 1200.50,
    type: 'Expense',
    category: 'Rent'
  },
  {
    date: '2024-01-20',
    description: 'Marketing campaign',
    amount: 500.75,
    type: 'Expense',
    category: 'Marketing'
  }
];

describe('getTransactions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no transactions exist', async () => {
    const result = await getTransactions();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch all transactions from database', async () => {
    // Create test transactions
    await db.insert(transactionsTable)
      .values(testTransactions.map(t => ({
        date: new Date(t.date),
        description: t.description,
        amount: t.amount.toString(), // Convert to string for numeric column
        type: t.type,
        category: t.category
      })))
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // Verify all transactions are returned with proper types
    result.forEach(transaction => {
      expect(transaction.id).toBeDefined();
      expect(typeof transaction.id).toBe('number');
      expect(transaction.date).toBeInstanceOf(Date);
      expect(typeof transaction.description).toBe('string');
      expect(typeof transaction.amount).toBe('number'); // Verify numeric conversion
      expect(['Income', 'Expense']).toContain(transaction.type);
      expect(transaction.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return transactions ordered by date (most recent first)', async () => {
    // Create test transactions
    await db.insert(transactionsTable)
      .values(testTransactions.map(t => ({
        date: new Date(t.date),
        description: t.description,
        amount: t.amount.toString(),
        type: t.type,
        category: t.category
      })))
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].description).toBe('Marketing campaign'); // 2024-01-20
    expect(result[1].description).toBe('Website development services'); // 2024-01-15
    expect(result[2].description).toBe('Office rent payment'); // 2024-01-10
    
    // Verify dates are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].date.getTime()).toBeGreaterThanOrEqual(result[i + 1].date.getTime());
    }
  });

  it('should correctly convert numeric amounts to numbers', async () => {
    // Create a transaction with a specific decimal amount
    await db.insert(transactionsTable)
      .values([{
        date: new Date('2024-01-15'),
        description: 'Test transaction',
        amount: '1234.56', // Insert as string
        type: 'Income',
        category: 'Sales'
      }])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toBe(1234.56);
    // Verify decimal precision with floating point tolerance
    expect(Math.abs(result[0].amount - 1234.56)).toBeLessThan(0.001);
  });

  it('should handle transactions with different categories and types', async () => {
    // Create transactions with various categories and types
    const diverseTransactions = [
      {
        date: new Date('2024-01-01'),
        description: 'Equipment purchase',
        amount: '5000.00',
        type: 'Expense' as const,
        category: 'Equipment' as const
      },
      {
        date: new Date('2024-01-02'),
        description: 'Consulting income',
        amount: '3000.25',
        type: 'Income' as const,
        category: 'Sales' as const
      },
      {
        date: new Date('2024-01-03'),
        description: 'Utility bill',
        amount: '150.75',
        type: 'Expense' as const,
        category: 'Utilities' as const
      }
    ];

    await db.insert(transactionsTable)
      .values(diverseTransactions)
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(3);
    
    // Verify different transaction types are handled
    const incomeTransactions = result.filter(t => t.type === 'Income');
    const expenseTransactions = result.filter(t => t.type === 'Expense');
    
    expect(incomeTransactions).toHaveLength(1);
    expect(expenseTransactions).toHaveLength(2);
    
    // Verify different categories are handled
    const categories = result.map(t => t.category);
    expect(categories).toContain('Equipment');
    expect(categories).toContain('Sales');
    expect(categories).toContain('Utilities');
  });

  it('should return transactions with proper schema structure', async () => {
    await db.insert(transactionsTable)
      .values([{
        date: new Date('2024-01-15'),
        description: 'Schema validation test',
        amount: '100.00',
        type: 'Income',
        category: 'Sales'
      }])
      .execute();

    const result = await getTransactions();

    expect(result).toHaveLength(1);
    const transaction = result[0];
    
    // Verify all required fields are present
    expect(transaction).toHaveProperty('id');
    expect(transaction).toHaveProperty('date');
    expect(transaction).toHaveProperty('description');
    expect(transaction).toHaveProperty('amount');
    expect(transaction).toHaveProperty('type');
    expect(transaction).toHaveProperty('category');
    expect(transaction).toHaveProperty('created_at');
    
    // Verify field types match schema expectations
    expect(typeof transaction.id).toBe('number');
    expect(transaction.date).toBeInstanceOf(Date);
    expect(typeof transaction.description).toBe('string');
    expect(typeof transaction.amount).toBe('number');
    expect(typeof transaction.type).toBe('string');
    expect(typeof transaction.category).toBe('string');
    expect(transaction.created_at).toBeInstanceOf(Date);
  });
});