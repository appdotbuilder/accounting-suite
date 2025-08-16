import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type UpdateTransactionInput, type Transaction } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTransaction = async (input: UpdateTransactionInput): Promise<Transaction> => {
  try {
    // First check if transaction exists
    const existing = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error(`Transaction with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.date !== undefined) {
      updateData.date = typeof input.date === 'string' ? new Date(input.date) : input.date;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }
    
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    // Update the transaction
    const result = await db.update(transactionsTable)
      .set(updateData)
      .where(eq(transactionsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const transaction = result[0];
    return {
      ...transaction,
      amount: parseFloat(transaction.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Transaction update failed:', error);
    throw error;
  }
};