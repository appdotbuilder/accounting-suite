import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import type { Transaction } from '../schema';

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.created_at))
      .execute();

    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      date: new Date(transaction.date),
      created_at: new Date(transaction.created_at)
    }));
  } catch (error) {
    console.error('Get transactions failed:', error);
    throw error;
  }
};