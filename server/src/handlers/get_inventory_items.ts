import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type InventoryItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    // Fetch all inventory items ordered by item name
    const results = await db.select()
      .from(inventoryItemsTable)
      .orderBy(asc(inventoryItemsTable.itemName))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(item => ({
      ...item,
      unitCost: parseFloat(item.unitCost),
      sellingPrice: parseFloat(item.sellingPrice)
    }));
  } catch (error) {
    console.error('Failed to fetch inventory items:', error);
    throw error;
  }
};