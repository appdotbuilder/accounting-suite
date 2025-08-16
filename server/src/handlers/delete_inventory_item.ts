import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteInventoryItem = async (id: number): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Inventory item with id ${id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Inventory item deletion failed:', error);
    throw error;
  }
};