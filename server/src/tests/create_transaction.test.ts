import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { createTransaction } from '../handlers/create_transaction';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInputWithDate: CreateTransactionInput = {
  date: new Date('2024-01-15'),
  description: 'Test sales transaction',
  amount: 150.75,
  type: 'Income',
  category: 'Sales'
};

const testInputWithStringDate: CreateTransactionInput = {
  date: '2024-02-20',
  description: 'Office rent payment',
  amount: 1200.00,
  type: 'Expense',
  category: 'Rent'
};

describe('createTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a transaction with Date object', async () => {
    const result = await createTransaction(testInputWithDate);

    // Basic field validation
    expect(result.description).toEqual('Test sales transaction');
    expect(result.amount).toEqual(150.75);
    expect(typeof result.amount).toBe('number');
    expect(result.type).toEqual('Income');
    expect(result.category).toEqual('Sales');
    expect(result.id).toBeDefined();
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a transaction with string date', async () => {
    const result = await createTransaction(testInputWithStringDate);

    // Verify date parsing
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString().split('T')[0]).toEqual('2024-02-20');
    expect(result.description).toEqual('Office rent payment');
    expect(result.amount).toEqual(1200.00);
    expect(typeof result.amount).toBe('number');
    expect(result.type).toEqual('Expense');
    expect(result.category).toEqual('Rent');
  });

  it('should save transaction to database correctly', async () => {
    const result = await createTransaction(testInputWithDate);

    // Query the database to verify persistence
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const savedTransaction = transactions[0];
    
    expect(savedTransaction.description).toEqual('Test sales transaction');
    expect(parseFloat(savedTransaction.amount)).toEqual(150.75);
    expect(savedTransaction.type).toEqual('Income');
    expect(savedTransaction.category).toEqual('Sales');
    expect(savedTransaction.date).toBeInstanceOf(Date);
    expect(savedTransaction.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CreateTransactionInput = {
      date: '2024-03-01',
      description: 'Small purchase',
      amount: 12.34,
      type: 'Expense',
      category: 'Office Supplies'
    };

    const result = await createTransaction(decimalInput);

    expect(result.amount).toEqual(12.34);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(transactions[0].amount)).toEqual(12.34);
  });

  it('should handle large amounts correctly', async () => {
    const largeAmountInput: CreateTransactionInput = {
      date: '2024-03-15',
      description: 'Equipment purchase',
      amount: 25000.99,
      type: 'Expense',
      category: 'Equipment'
    };

    const result = await createTransaction(largeAmountInput);

    expect(result.amount).toEqual(25000.99);
    expect(typeof result.amount).toBe('number');

    // Verify in database
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, result.id))
      .execute();

    expect(parseFloat(transactions[0].amount)).toEqual(25000.99);
  });

  it('should handle all transaction categories', async () => {
    const categories: Array<'Sales' | 'Rent' | 'Utilities' | 'Purchases' | 'Salaries' | 'Marketing' | 'Equipment' | 'Insurance' | 'Office Supplies' | 'Travel' | 'Other'> = [
      'Sales', 'Rent', 'Utilities', 'Purchases', 'Salaries', 
      'Marketing', 'Equipment', 'Insurance', 'Office Supplies', 
      'Travel', 'Other'
    ];

    for (const category of categories) {
      const input: CreateTransactionInput = {
        date: '2024-04-01',
        description: `Test ${category} transaction`,
        amount: 100.00,
        type: 'Expense',
        category: category
      };

      const result = await createTransaction(input);
      expect(result.category).toEqual(category);
    }
  });

  it('should handle both transaction types', async () => {
    const incomeInput: CreateTransactionInput = {
      date: '2024-05-01',
      description: 'Revenue',
      amount: 500.00,
      type: 'Income',
      category: 'Sales'
    };

    const expenseInput: CreateTransactionInput = {
      date: '2024-05-02',
      description: 'Cost',
      amount: 200.00,
      type: 'Expense',
      category: 'Purchases'
    };

    const incomeResult = await createTransaction(incomeInput);
    const expenseResult = await createTransaction(expenseInput);

    expect(incomeResult.type).toEqual('Income');
    expect(expenseResult.type).toEqual('Expense');
  });

  it('should create multiple transactions with unique IDs', async () => {
    const input1 = { ...testInputWithDate, description: 'Transaction 1' };
    const input2 = { ...testInputWithDate, description: 'Transaction 2' };

    const result1 = await createTransaction(input1);
    const result2 = await createTransaction(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.description).toEqual('Transaction 1');
    expect(result2.description).toEqual('Transaction 2');

    // Verify both exist in database
    const allTransactions = await db.select()
      .from(transactionsTable)
      .execute();

    expect(allTransactions).toHaveLength(2);
  });
});