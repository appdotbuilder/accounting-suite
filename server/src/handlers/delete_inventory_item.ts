import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteInventoryItem(id: number): Promise<{ success: boolean }> {
  try {
    // First, check if the inventory item exists
    const existingItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Inventory item with id ${id} not found`);
    }

    // Delete the inventory item
    const result = await db.delete(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Inventory item deletion failed:', error);
    throw error;
  }
}