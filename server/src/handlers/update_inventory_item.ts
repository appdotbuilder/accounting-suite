import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type InventoryItem } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateInventoryItem = async (input: UpdateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // Check if the item exists
    const existingItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Inventory item with id ${input.id} not found`);
    }

    // If SKU is being updated, check for uniqueness
    if (input.sku) {
      const skuConflict = await db.select()
        .from(inventoryItemsTable)
        .where(and(
          eq(inventoryItemsTable.sku, input.sku),
          ne(inventoryItemsTable.id, input.id)
        ))
        .execute();

      if (skuConflict.length > 0) {
        throw new Error(`SKU ${input.sku} already exists for another item`);
      }
    }

    // Prepare update values - only include fields that are being updated
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.itemName !== undefined) updateValues.itemName = input.itemName;
    if (input.sku !== undefined) updateValues.sku = input.sku;
    if (input.quantity !== undefined) updateValues.quantity = input.quantity;
    if (input.unitCost !== undefined) updateValues.unitCost = input.unitCost.toString();
    if (input.sellingPrice !== undefined) updateValues.sellingPrice = input.sellingPrice.toString();

    // Update the inventory item
    const result = await db.update(inventoryItemsTable)
      .set(updateValues)
      .where(eq(inventoryItemsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedItem = result[0];
    return {
      ...updatedItem,
      unitCost: parseFloat(updatedItem.unitCost),
      sellingPrice: parseFloat(updatedItem.sellingPrice)
    };
  } catch (error) {
    console.error('Inventory item update failed:', error);
    throw error;
  }
};