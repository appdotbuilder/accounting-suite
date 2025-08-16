import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type UpdateTransactionInput } from '../schema';
import { updateTransaction } from '../handlers/update_transaction';
import { eq } from 'drizzle-orm';

// Helper function to create a test transaction
const createTestTransaction = async (input?: any) => {
  const defaultInput = {
    date: new Date('2024-01-15'),
    description: 'Test transaction',
    amount: '100.50', // String for numeric column
    type: 'Income' as const,
    category: 'Sales' as const
  };

  const mergedInput = { ...defaultInput, ...input };
  
  // Ensure amount is a string for database insertion
  if (mergedInput.amount && typeof mergedInput.amount === 'number') {
    mergedInput.amount = mergedInput.amount.toString();
  }

  const result = await db.insert(transactionsTable)
    .values(mergedInput)
    .returning()
    .execute();

  return result[0];
};

describe('updateTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a transaction', async () => {
    // Create initial transaction
    const initial = await createTestTransaction();

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      date: new Date('2024-02-01'),
      description: 'Updated transaction',
      amount: 250.75,
      type: 'Expense',
      category: 'Marketing'
    };

    const result = await updateTransaction(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(initial.id);
    expect(result.date).toEqual(new Date('2024-02-01'));
    expect(result.description).toEqual('Updated transaction');
    expect(result.amount).toEqual(250.75);
    expect(result.type).toEqual('Expense');
    expect(result.category).toEqual('Marketing');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial transaction
    const initial = await createTestTransaction({
      description: 'Original description',
      amount: 100.00,
      type: 'Income'
    });

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      description: 'Partial update',
      amount: 150.25
    };

    const result = await updateTransaction(updateInput);

    // Verify only specified fields were updated
    expect(result.id).toEqual(initial.id);
    expect(result.description).toEqual('Partial update');
    expect(result.amount).toEqual(150.25);
    expect(result.type).toEqual('Income'); // Should remain unchanged
    expect(result.category).toEqual('Sales'); // Should remain unchanged
    expect(result.date).toEqual(initial.date); // Should remain unchanged
  });

  it('should handle string date input', async () => {
    const initial = await createTestTransaction();

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      date: '2024-03-15'
    };

    const result = await updateTransaction(updateInput);

    expect(result.date).toEqual(new Date('2024-03-15'));
  });

  it('should handle Date object date input', async () => {
    const initial = await createTestTransaction();
    const testDate = new Date('2024-04-20');

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      date: testDate
    };

    const result = await updateTransaction(updateInput);

    expect(result.date).toEqual(testDate);
  });

  it('should save updated transaction to database', async () => {
    // Create initial transaction
    const initial = await createTestTransaction({
      description: 'Original',
      amount: 50.00
    });

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      description: 'Database update test',
      amount: 75.50
    };

    await updateTransaction(updateInput);

    // Query database directly to verify update
    const transactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, initial.id))
      .execute();

    expect(transactions).toHaveLength(1);
    const dbTransaction = transactions[0];
    expect(dbTransaction.description).toEqual('Database update test');
    expect(parseFloat(dbTransaction.amount)).toEqual(75.50);
  });

  it('should throw error when transaction does not exist', async () => {
    const updateInput: UpdateTransactionInput = {
      id: 99999, // Non-existent ID
      description: 'This should fail'
    };

    await expect(updateTransaction(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    const initial = await createTestTransaction();

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      amount: 123.456789 // High precision number
    };

    const result = await updateTransaction(updateInput);

    // Should handle precision correctly
    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBeCloseTo(123.46, 2); // Should round to 2 decimal places
  });

  it('should update transaction with different categories', async () => {
    const initial = await createTestTransaction({
      category: 'Sales'
    });

    // Test updating to different categories
    const categories = ['Rent', 'Utilities', 'Equipment', 'Travel'] as const;

    for (const category of categories) {
      const updateInput: UpdateTransactionInput = {
        id: initial.id,
        category: category
      };

      const result = await updateTransaction(updateInput);
      expect(result.category).toEqual(category);
    }
  });

  it('should update transaction type from Income to Expense', async () => {
    const initial = await createTestTransaction({
      type: 'Income',
      category: 'Sales'
    });

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      type: 'Expense',
      category: 'Marketing' // Update category to match expense type
    };

    const result = await updateTransaction(updateInput);

    expect(result.type).toEqual('Expense');
    expect(result.category).toEqual('Marketing');
  });

  it('should preserve created_at timestamp', async () => {
    const initial = await createTestTransaction();
    const originalCreatedAt = initial.created_at;

    // Wait a small amount to ensure timestamps would be different
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTransactionInput = {
      id: initial.id,
      description: 'Updated with preserved timestamp'
    };

    const result = await updateTransaction(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});