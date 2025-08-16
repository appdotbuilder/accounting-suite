import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { desc } from 'drizzle-orm';

export async function getTransactions(): Promise<Transaction[]> {
  try {
    // Query transactions ordered by date (most recent first)
    const results = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.date))
      .execute();

    // Convert numeric fields to numbers for proper type compliance
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert numeric column to number
    }));
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
}