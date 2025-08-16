import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type UpdateInventoryItemInput, type CreateInventoryItemInput } from '../schema';
import { updateInventoryItem } from '../handlers/update_inventory_item';
import { eq } from 'drizzle-orm';

// Helper function to create a test inventory item
const createTestItem = async (itemData?: Partial<CreateInventoryItemInput>) => {
  const defaultItem = {
    itemName: 'Test Item',
    sku: 'TEST-001',
    quantity: 50,
    unitCost: 10.00,
    sellingPrice: 20.00,
    ...itemData
  };

  const result = await db.insert(inventoryItemsTable)
    .values({
      itemName: defaultItem.itemName,
      sku: defaultItem.sku,
      quantity: defaultItem.quantity,
      unitCost: defaultItem.unitCost.toString(),
      sellingPrice: defaultItem.sellingPrice.toString()
    })
    .returning()
    .execute();

  const item = result[0];
  return {
    ...item,
    unitCost: parseFloat(item.unitCost),
    sellingPrice: parseFloat(item.sellingPrice)
  };
};

describe('updateInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of an inventory item', async () => {
    // Create a test item first
    const originalItem = await createTestItem();

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      itemName: 'Updated Test Item',
      sku: 'UPDATED-001',
      quantity: 75,
      unitCost: 15.50,
      sellingPrice: 25.99
    };

    const result = await updateInventoryItem(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(originalItem.id);
    expect(result.itemName).toEqual('Updated Test Item');
    expect(result.sku).toEqual('UPDATED-001');
    expect(result.quantity).toEqual(75);
    expect(result.unitCost).toEqual(15.50);
    expect(typeof result.unitCost).toBe('number');
    expect(result.sellingPrice).toEqual(25.99);
    expect(typeof result.sellingPrice).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalItem.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create a test item first
    const originalItem = await createTestItem();

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      itemName: 'Partially Updated Item',
      quantity: 100
    };

    const result = await updateInventoryItem(updateInput);

    // Verify only specified fields were updated
    expect(result.itemName).toEqual('Partially Updated Item');
    expect(result.quantity).toEqual(100);
    // Other fields should remain unchanged
    expect(result.sku).toEqual(originalItem.sku);
    expect(result.unitCost).toEqual(originalItem.unitCost);
    expect(result.sellingPrice).toEqual(originalItem.sellingPrice);
    expect(result.updated_at > originalItem.updated_at).toBe(true);
  });

  it('should update item in database', async () => {
    // Create a test item first
    const originalItem = await createTestItem();

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      itemName: 'Database Updated Item',
      unitCost: 12.75
    };

    await updateInventoryItem(updateInput);

    // Verify the item was updated in database
    const dbItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, originalItem.id))
      .execute();

    expect(dbItem).toHaveLength(1);
    expect(dbItem[0].itemName).toEqual('Database Updated Item');
    expect(parseFloat(dbItem[0].unitCost)).toEqual(12.75);
    expect(dbItem[0].updated_at > originalItem.updated_at).toBe(true);
  });

  it('should throw error when item does not exist', async () => {
    const updateInput: UpdateInventoryItemInput = {
      id: 999999, // Non-existent ID
      itemName: 'Non-existent Item'
    };

    expect(updateInventoryItem(updateInput))
      .rejects
      .toThrow(/not found/i);
  });

  it('should throw error when updating to duplicate SKU', async () => {
    // Create two test items
    const item1 = await createTestItem({ sku: 'UNIQUE-001' });
    const item2 = await createTestItem({ sku: 'UNIQUE-002' });

    const updateInput: UpdateInventoryItemInput = {
      id: item2.id,
      sku: 'UNIQUE-001' // Try to use item1's SKU
    };

    expect(updateInventoryItem(updateInput))
      .rejects
      .toThrow(/already exists/i);
  });

  it('should allow updating item with same SKU', async () => {
    // Create a test item
    const originalItem = await createTestItem({ sku: 'SAME-SKU' });

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      sku: 'SAME-SKU', // Same SKU should be allowed
      itemName: 'Updated Name'
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.sku).toEqual('SAME-SKU');
    expect(result.itemName).toEqual('Updated Name');
  });

  it('should handle zero values correctly', async () => {
    const originalItem = await createTestItem();

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      quantity: 0,
      unitCost: 0
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.quantity).toEqual(0);
    expect(result.unitCost).toEqual(0);
    expect(typeof result.unitCost).toBe('number');
  });

  it('should handle numeric precision correctly', async () => {
    const originalItem = await createTestItem();

    const updateInput: UpdateInventoryItemInput = {
      id: originalItem.id,
      unitCost: 12.345, // Test precision handling
      sellingPrice: 25.678
    };

    const result = await updateInventoryItem(updateInput);

    expect(result.unitCost).toBeCloseTo(12.35, 2); // Rounded to 2 decimal places
    expect(result.sellingPrice).toBeCloseTo(25.68, 2);
    expect(typeof result.unitCost).toBe('number');
    expect(typeof result.sellingPrice).toBe('number');
  });
});