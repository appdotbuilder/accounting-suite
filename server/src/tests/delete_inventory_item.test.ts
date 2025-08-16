import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { deleteInventoryItem } from '../handlers/delete_inventory_item';
import { eq } from 'drizzle-orm';

// Test inventory item data
const testItemData: CreateInventoryItemInput = {
  itemName: 'Test Widget',
  sku: 'TEST-001',
  quantity: 50,
  unitCost: 10.00,
  sellingPrice: 15.99
};

describe('deleteInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing inventory item', async () => {
    // Create a test inventory item first
    const createdItems = await db.insert(inventoryItemsTable)
      .values({
        itemName: testItemData.itemName,
        sku: testItemData.sku,
        quantity: testItemData.quantity,
        unitCost: testItemData.unitCost.toString(),
        sellingPrice: testItemData.sellingPrice.toString()
      })
      .returning()
      .execute();

    const itemId = createdItems[0].id;

    // Delete the inventory item
    const result = await deleteInventoryItem(itemId);

    expect(result.success).toBe(true);

    // Verify the item was actually deleted from the database
    const deletedItems = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, itemId))
      .execute();

    expect(deletedItems).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent inventory item', async () => {
    const nonExistentId = 99999;

    await expect(deleteInventoryItem(nonExistentId))
      .rejects
      .toThrow(/Inventory item with id 99999 not found/i);
  });

  it('should verify item exists before deletion', async () => {
    // Create two inventory items
    const item1Data = { ...testItemData, sku: 'TEST-001' };
    const item2Data = { ...testItemData, sku: 'TEST-002', itemName: 'Another Widget' };

    const createdItems = await db.insert(inventoryItemsTable)
      .values([
        {
          itemName: item1Data.itemName,
          sku: item1Data.sku,
          quantity: item1Data.quantity,
          unitCost: item1Data.unitCost.toString(),
          sellingPrice: item1Data.sellingPrice.toString()
        },
        {
          itemName: item2Data.itemName,
          sku: item2Data.sku,
          quantity: item2Data.quantity,
          unitCost: item2Data.unitCost.toString(),
          sellingPrice: item2Data.sellingPrice.toString()
        }
      ])
      .returning()
      .execute();

    const item1Id = createdItems[0].id;
    const item2Id = createdItems[1].id;

    // Delete the first item
    await deleteInventoryItem(item1Id);

    // Verify first item is gone
    const remainingItems = await db.select()
      .from(inventoryItemsTable)
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toBe(item2Id);
    expect(remainingItems[0].itemName).toBe('Another Widget');
  });

  it('should handle database errors gracefully', async () => {
    // Create and then delete an item
    const createdItems = await db.insert(inventoryItemsTable)
      .values({
        itemName: testItemData.itemName,
        sku: testItemData.sku,
        quantity: testItemData.quantity,
        unitCost: testItemData.unitCost.toString(),
        sellingPrice: testItemData.sellingPrice.toString()
      })
      .returning()
      .execute();

    const itemId = createdItems[0].id;

    // First deletion should succeed
    const result1 = await deleteInventoryItem(itemId);
    expect(result1.success).toBe(true);

    // Second deletion of same item should fail
    await expect(deleteInventoryItem(itemId))
      .rejects
      .toThrow(/Inventory item with id .+ not found/i);
  });
});