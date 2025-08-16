import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { UpdateInventoryItemInput, InventoryItem } from '../schema';

export const updateInventoryItem = async (input: UpdateInventoryItemInput): Promise<InventoryItem> => {
  try {
    const updateData: any = {};
    
    if (input.itemName !== undefined) {
      updateData.itemName = input.itemName;
    }
    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity;
    }
    if (input.unitCost !== undefined) {
      updateData.unitCost = input.unitCost.toString(); // Convert number to string
    }
    if (input.sellingPrice !== undefined) {
      updateData.sellingPrice = input.sellingPrice.toString(); // Convert number to string
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(inventoryItemsTable)
      .set(updateData)
      .where(eq(inventoryItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Inventory item not found');
    }

    const item = result[0];
    return {
      ...item,
      unitCost: parseFloat(item.unitCost), // Convert string back to number
      sellingPrice: parseFloat(item.sellingPrice), // Convert string back to number
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };
  } catch (error) {
    console.error('Inventory item update failed:', error);
    // Handle unique constraint violation for SKU
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
      throw new Error('SKU already exists');
    }
    throw error;
  }
};