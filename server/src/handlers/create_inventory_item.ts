import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import type { CreateInventoryItemInput, InventoryItem } from '../schema';

export const createInventoryItem = async (input: CreateInventoryItemInput): Promise<InventoryItem> => {
  try {
    const result = await db.insert(inventoryItemsTable)
      .values({
        itemName: input.itemName,
        sku: input.sku,
        quantity: input.quantity,
        unitCost: input.unitCost.toString(), // Convert number to string for numeric column
        sellingPrice: input.sellingPrice.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const item = result[0];
    return {
      ...item,
      unitCost: parseFloat(item.unitCost), // Convert string back to number
      sellingPrice: parseFloat(item.sellingPrice), // Convert string back to number
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };
  } catch (error) {
    console.error('Inventory item creation failed:', error);
    // Handle unique constraint violation for SKU
    if (error instanceof Error && error.message.includes('inventory_items_sku_unique')) {
      throw new Error(`SKU '${input.sku}' already exists`);
    }
    throw error;
  }
};