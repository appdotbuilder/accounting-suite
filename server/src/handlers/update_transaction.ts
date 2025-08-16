import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateTransactionInput, Transaction } from '../schema';

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    const updateData: any = {};
    
    if (input.date !== undefined) {
      updateData.date = new Date(input.date);
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Transaction not found');
    }

    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount), // Convert string back to number
      date: new Date(transaction.date),
      created_at: new Date(transaction.created_at)
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
};