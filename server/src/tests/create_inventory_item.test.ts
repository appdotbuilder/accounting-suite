import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { createInventoryItem } from '../handlers/create_inventory_item';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateInventoryItemInput = {
  itemName: 'Test Widget',
  sku: 'TEST-WIDGET-001',
  quantity: 50,
  unitCost: 12.99,
  sellingPrice: 24.99
};

describe('createInventoryItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an inventory item', async () => {
    const result = await createInventoryItem(testInput);

    // Basic field validation
    expect(result.itemName).toEqual('Test Widget');
    expect(result.sku).toEqual('TEST-WIDGET-001');
    expect(result.quantity).toEqual(50);
    expect(result.unitCost).toEqual(12.99);
    expect(result.sellingPrice).toEqual(24.99);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify numeric types are properly converted
    expect(typeof result.unitCost).toBe('number');
    expect(typeof result.sellingPrice).toBe('number');
  });

  it('should save inventory item to database', async () => {
    const result = await createInventoryItem(testInput);

    // Query using proper drizzle syntax
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, result.id))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].itemName).toEqual('Test Widget');
    expect(items[0].sku).toEqual('TEST-WIDGET-001');
    expect(items[0].quantity).toEqual(50);
    expect(parseFloat(items[0].unitCost)).toEqual(12.99);
    expect(parseFloat(items[0].sellingPrice)).toEqual(24.99);
    expect(items[0].created_at).toBeInstanceOf(Date);
    expect(items[0].updated_at).toBeInstanceOf(Date);
  });

  it('should reject duplicate SKU', async () => {
    // Create first item
    await createInventoryItem(testInput);

    // Try to create another item with same SKU
    const duplicateInput: CreateInventoryItemInput = {
      itemName: 'Another Widget',
      sku: 'TEST-WIDGET-001', // Same SKU
      quantity: 25,
      unitCost: 8.50,
      sellingPrice: 15.99
    };

    await expect(createInventoryItem(duplicateInput))
      .rejects.toThrow(/already exists/i);
    
    // Verify only one item exists in database
    const allItems = await db.select()
      .from(inventoryItemsTable)
      .execute();
    
    expect(allItems).toHaveLength(1);
  });

  it('should handle different SKUs correctly', async () => {
    // Create first item
    const result1 = await createInventoryItem(testInput);

    // Create second item with different SKU
    const secondInput: CreateInventoryItemInput = {
      itemName: 'Different Widget',
      sku: 'TEST-WIDGET-002', // Different SKU
      quantity: 30,
      unitCost: 15.75,
      sellingPrice: 29.99
    };

    const result2 = await createInventoryItem(secondInput);

    // Both should be created successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.sku).toEqual('TEST-WIDGET-001');
    expect(result2.sku).toEqual('TEST-WIDGET-002');

    // Verify both exist in database
    const allItems = await db.select()
      .from(inventoryItemsTable)
      .execute();

    expect(allItems).toHaveLength(2);
  });

  it('should handle zero quantity and cost values', async () => {
    const zeroInput: CreateInventoryItemInput = {
      itemName: 'Free Sample',
      sku: 'FREE-SAMPLE-001',
      quantity: 0,
      unitCost: 0,
      sellingPrice: 1.00 // Must be positive per schema
    };

    const result = await createInventoryItem(zeroInput);

    expect(result.quantity).toEqual(0);
    expect(result.unitCost).toEqual(0);
    expect(result.sellingPrice).toEqual(1.00);
    expect(typeof result.unitCost).toBe('number');
    expect(typeof result.sellingPrice).toBe('number');
  });

  it('should handle decimal precision correctly', async () => {
    const precisionInput: CreateInventoryItemInput = {
      itemName: 'Precision Item',
      sku: 'PRECISION-001',
      quantity: 1,
      unitCost: 123.456,
      sellingPrice: 234.567
    };

    const result = await createInventoryItem(precisionInput);

    // Should maintain reasonable decimal precision
    expect(result.unitCost).toBeCloseTo(123.46, 2);
    expect(result.sellingPrice).toBeCloseTo(234.57, 2);
    
    // Verify the values are properly stored in database
    const savedItem = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.sku, 'PRECISION-001'))
      .execute();
    
    expect(savedItem).toHaveLength(1);
    expect(parseFloat(savedItem[0].unitCost)).toBeCloseTo(123.46, 2);
    expect(parseFloat(savedItem[0].sellingPrice)).toBeCloseTo(234.57, 2);
  });
});