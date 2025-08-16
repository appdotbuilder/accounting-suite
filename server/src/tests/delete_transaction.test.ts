import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput } from '../schema';
import { deleteTransaction } from '../handlers/delete_transaction';
import { eq } from 'drizzle-orm';

// Test transaction data
const testTransaction: CreateTransactionInput = {
  date: '2024-01-15',
  description: 'Test transaction for deletion',
  amount: 150.00,
  type: 'Income',
  category: 'Sales'
};

const createTestTransaction = async (transactionData: CreateTransactionInput) => {
  const result = await db.insert(transactionsTable)
    .values({
      date: new Date(transactionData.date),
      description: transactionData.description,
      amount: transactionData.amount.toString(),
      type: transactionData.type,
      category: transactionData.category
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteTransaction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing transaction', async () => {
    // Create a test transaction
    const createdTransaction = await createTestTransaction(testTransaction);
    
    // Verify transaction exists
    const existingTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, createdTransaction.id))
      .execute();
    
    expect(existingTransactions).toHaveLength(1);
    
    // Delete the transaction
    const result = await deleteTransaction(createdTransaction.id);
    
    expect(result.success).toBe(true);
    
    // Verify transaction is deleted
    const deletedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, createdTransaction.id))
      .execute();
    
    expect(deletedTransactions).toHaveLength(0);
  });

  it('should throw error for non-existent transaction', async () => {
    const nonExistentId = 99999;
    
    await expect(deleteTransaction(nonExistentId))
      .rejects
      .toThrow(/Transaction with id 99999 not found/i);
  });

  it('should not affect other transactions when deleting one', async () => {
    // Create multiple test transactions
    const transaction1 = await createTestTransaction({
      ...testTransaction,
      description: 'First transaction'
    });
    
    const transaction2 = await createTestTransaction({
      ...testTransaction,
      description: 'Second transaction',
      amount: 200.00,
      type: 'Expense',
      category: 'Rent'
    });
    
    const transaction3 = await createTestTransaction({
      ...testTransaction,
      description: 'Third transaction',
      amount: 75.50,
      category: 'Utilities'
    });
    
    // Verify all transactions exist
    const allTransactions = await db.select()
      .from(transactionsTable)
      .execute();
    
    expect(allTransactions).toHaveLength(3);
    
    // Delete the middle transaction
    const result = await deleteTransaction(transaction2.id);
    
    expect(result.success).toBe(true);
    
    // Verify only the targeted transaction was deleted
    const remainingTransactions = await db.select()
      .from(transactionsTable)
      .execute();
    
    expect(remainingTransactions).toHaveLength(2);
    
    // Check that the remaining transactions are the correct ones
    const remainingIds = remainingTransactions.map(t => t.id);
    expect(remainingIds).toContain(transaction1.id);
    expect(remainingIds).toContain(transaction3.id);
    expect(remainingIds).not.toContain(transaction2.id);
  });

  it('should handle deletion of transaction with different types and categories', async () => {
    // Test with expense transaction
    const expenseTransaction = await createTestTransaction({
      date: '2024-02-01',
      description: 'Office supplies purchase',
      amount: 89.99,
      type: 'Expense',
      category: 'Office Supplies'
    });
    
    // Delete expense transaction
    const result = await deleteTransaction(expenseTransaction.id);
    
    expect(result.success).toBe(true);
    
    // Verify deletion
    const deletedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, expenseTransaction.id))
      .execute();
    
    expect(deletedTransactions).toHaveLength(0);
  });

  it('should validate transaction existence before deletion', async () => {
    // Create and then manually delete a transaction to simulate race condition
    const transaction = await createTestTransaction(testTransaction);
    
    // Manually delete the transaction directly from database
    await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, transaction.id))
      .execute();
    
    // Try to delete the already deleted transaction
    await expect(deleteTransaction(transaction.id))
      .rejects
      .toThrow(/Transaction with id .+ not found/i);
  });
});