import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput, type InventoryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createInventoryItem = async (input: CreateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // Check if SKU already exists
    const existingItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.sku, input.sku))
      .execute();

    if (existingItem.length > 0) {
      throw new Error(`Item with SKU '${input.sku}' already exists`);
    }

    // Insert new inventory item
    const result = await db.insert(inventoryItemsTable)
      .values({
        itemName: input.itemName,
        sku: input.sku,
        quantity: input.quantity,
        unitCost: input.unitCost.toString(), // Convert number to string for numeric column
        sellingPrice: input.sellingPrice.toString(), // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const inventoryItem = result[0];
    return {
      ...inventoryItem,
      unitCost: parseFloat(inventoryItem.unitCost), // Convert string back to number
      sellingPrice: parseFloat(inventoryItem.sellingPrice) // Convert string back to number
    };
  } catch (error) {
    console.error('Inventory item creation failed:', error);
    throw error;
  }
};