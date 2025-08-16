import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type InventoryReportInput, type InventorySummary } from '../schema';
import { lte, sql } from 'drizzle-orm';

export async function getInventorySummary(input: InventoryReportInput): Promise<InventorySummary> {
  try {
    // Get all inventory items
    const allItems = await db.select()
      .from(inventoryItemsTable)
      .execute();

    // Calculate total items count
    const totalItems = allItems.length;

    // Calculate total inventory value (quantity * unitCost for each item)
    const totalValue = allItems.reduce((sum, item) => {
      const quantity = item.quantity;
      const unitCost = parseFloat(item.unitCost); // Convert numeric to number
      return sum + (quantity * unitCost);
    }, 0);

    // Find low stock items (quantity <= threshold)
    const lowStockItems = await db.select()
      .from(inventoryItemsTable)
      .where(lte(inventoryItemsTable.quantity, input.lowStockThreshold))
      .execute();

    // Convert numeric fields to numbers for low stock items
    const convertedLowStockItems = lowStockItems.map(item => ({
      ...item,
      unitCost: parseFloat(item.unitCost),
      sellingPrice: parseFloat(item.sellingPrice)
    }));

    return {
      totalItems,
      totalValue,
      lowStockItems: convertedLowStockItems,
      lowStockThreshold: input.lowStockThreshold
    };
  } catch (error) {
    console.error('Inventory summary generation failed:', error);
    throw error;
  }
}