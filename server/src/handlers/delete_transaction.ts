import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTransaction = async (id: number): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(transactionsTable)
      .where(eq(transactionsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Transaction deletion failed:', error);
    throw error;
  }
};