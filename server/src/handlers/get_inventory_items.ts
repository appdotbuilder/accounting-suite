import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { asc } from 'drizzle-orm';
import type { InventoryItem } from '../schema';

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const results = await db.select()
      .from(inventoryItemsTable)
      .orderBy(asc(inventoryItemsTable.itemName))
      .execute();

    return results.map(item => ({
      ...item,
      unitCost: parseFloat(item.unitCost), // Convert string back to number
      sellingPrice: parseFloat(item.sellingPrice), // Convert string back to number
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Get inventory items failed:', error);
    throw error;
  }
};