import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { lte } from 'drizzle-orm';
import type { InventoryReportInput, InventorySummary, InventoryItem } from '../schema';

export const getInventorySummary = async (input: InventoryReportInput): Promise<InventorySummary> => {
  try {
    // Get all inventory items
    const allItems = await db.select()
      .from(inventoryItemsTable)
      .execute();

    // Get low stock items
    const lowStockItems = await db.select()
      .from(inventoryItemsTable)
      .where(lte(inventoryItemsTable.quantity, input.lowStockThreshold))
      .execute();

    // Calculate total value
    let totalValue = 0;
    for (const item of allItems) {
      const unitCost = parseFloat(item.unitCost);
      totalValue += item.quantity * unitCost;
    }

    // Convert low stock items to proper format
    const formattedLowStockItems: InventoryItem[] = lowStockItems.map(item => ({
      ...item,
      unitCost: parseFloat(item.unitCost),
      sellingPrice: parseFloat(item.sellingPrice),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));

    return {
      totalItems: allItems.length,
      totalValue,
      lowStockItems: formattedLowStockItems,
      lowStockThreshold: input.lowStockThreshold
    };
  } catch (error) {
    console.error('Inventory summary generation failed:', error);
    throw error;
  }
};