import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type CreateTransactionInput, type Transaction } from '../schema';

export const createTransaction = async (input: CreateTransactionInput): Promise<Transaction> => {
  try {
    // Handle date conversion - string or Date to Date
    const transactionDate = typeof input.date === 'string' ? new Date(input.date) : input.date;
    
    // Insert transaction record
    const result = await db.insert(transactionsTable)
      .values({
        date: transactionDate,
        description: input.description,
        amount: input.amount.toString(), // Convert number to string for numeric column
        type: input.type,
        category: input.category
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction creation failed:', error);
    throw error;
  }
};