import { db } from '../db';
import { transactionsTable } from '../db/schema';
import type { CreateTransactionInput, Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    const result = await db.insert(transactionsTable)
      .values({
        date: new Date(input.date),
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        type: input.type,
        category: input.category
      })
      .returning()
      .execute();

    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      date: new Date(transaction.date),
      created_at: new Date(transaction.created_at)
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};