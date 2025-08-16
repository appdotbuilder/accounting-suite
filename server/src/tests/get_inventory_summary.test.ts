import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type InventoryReportInput } from '../schema';
import { getInventorySummary } from '../handlers/get_inventory_summary';

// Test input with default threshold
const testInput: InventoryReportInput = {
  lowStockThreshold: 10
};

describe('getInventorySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary when no inventory items exist', async () => {
    const result = await getInventorySummary(testInput);

    expect(result.totalItems).toEqual(0);
    expect(result.totalValue).toEqual(0);
    expect(result.lowStockItems).toHaveLength(0);
    expect(result.lowStockThreshold).toEqual(10);
  });

  it('should calculate correct summary with multiple inventory items', async () => {
    // Create test inventory items
    await db.insert(inventoryItemsTable).values([
      {
        itemName: 'Product A',
        sku: 'SKU-A',
        quantity: 20,
        unitCost: '15.50',
        sellingPrice: '25.00'
      },
      {
        itemName: 'Product B',
        sku: 'SKU-B',
        quantity: 5,
        unitCost: '10.00',
        sellingPrice: '18.00'
      },
      {
        itemName: 'Product C',
        sku: 'SKU-C',
        quantity: 15,
        unitCost: '8.75',
        sellingPrice: '14.50'
      }
    ]).execute();

    const result = await getInventorySummary(testInput);

    // Verify total items count
    expect(result.totalItems).toEqual(3);

    // Verify total value calculation: (20 * 15.50) + (5 * 10.00) + (15 * 8.75) = 310 + 50 + 131.25 = 491.25
    expect(result.totalValue).toEqual(491.25);

    // Verify low stock items (quantity <= 10): only Product B with quantity 5
    expect(result.lowStockItems).toHaveLength(1);
    expect(result.lowStockItems[0].itemName).toEqual('Product B');
    expect(result.lowStockItems[0].quantity).toEqual(5);
    expect(result.lowStockItems[0].unitCost).toEqual(10.00);
    expect(result.lowStockItems[0].sellingPrice).toEqual(18.00);

    expect(result.lowStockThreshold).toEqual(10);
  });

  it('should handle different low stock thresholds correctly', async () => {
    // Create inventory items with various quantities
    await db.insert(inventoryItemsTable).values([
      {
        itemName: 'High Stock Item',
        sku: 'SKU-HIGH',
        quantity: 50,
        unitCost: '12.00',
        sellingPrice: '20.00'
      },
      {
        itemName: 'Medium Stock Item',
        sku: 'SKU-MED',
        quantity: 15,
        unitCost: '8.00',
        sellingPrice: '15.00'
      },
      {
        itemName: 'Low Stock Item',
        sku: 'SKU-LOW',
        quantity: 3,
        unitCost: '5.00',
        sellingPrice: '10.00'
      }
    ]).execute();

    // Test with higher threshold (20)
    const highThresholdInput: InventoryReportInput = {
      lowStockThreshold: 20
    };

    const result = await getInventorySummary(highThresholdInput);

    expect(result.totalItems).toEqual(3);
    // Verify low stock items (quantity <= 20): Medium Stock (15) and Low Stock (3)
    expect(result.lowStockItems).toHaveLength(2);
    expect(result.lowStockItems.find(item => item.itemName === 'Medium Stock Item')).toBeDefined();
    expect(result.lowStockItems.find(item => item.itemName === 'Low Stock Item')).toBeDefined();
    expect(result.lowStockThreshold).toEqual(20);
  });

  it('should handle items with zero quantity as low stock', async () => {
    // Create items including one with zero quantity
    await db.insert(inventoryItemsTable).values([
      {
        itemName: 'Out of Stock Item',
        sku: 'SKU-OUT',
        quantity: 0,
        unitCost: '10.00',
        sellingPrice: '18.00'
      },
      {
        itemName: 'Normal Item',
        sku: 'SKU-NORMAL',
        quantity: 25,
        unitCost: '7.50',
        sellingPrice: '12.00'
      }
    ]).execute();

    const result = await getInventorySummary(testInput);

    expect(result.totalItems).toEqual(2);
    // Total value: (0 * 10.00) + (25 * 7.50) = 0 + 187.50 = 187.50
    expect(result.totalValue).toEqual(187.50);
    
    // Zero quantity item should be in low stock
    expect(result.lowStockItems).toHaveLength(1);
    expect(result.lowStockItems[0].itemName).toEqual('Out of Stock Item');
    expect(result.lowStockItems[0].quantity).toEqual(0);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create item with decimal values
    await db.insert(inventoryItemsTable).values({
      itemName: 'Decimal Test Item',
      sku: 'SKU-DECIMAL',
      quantity: 8,
      unitCost: '12.99',
      sellingPrice: '19.99'
    }).execute();

    const result = await getInventorySummary(testInput);

    // Verify numeric types are correctly converted
    expect(typeof result.totalValue).toBe('number');
    expect(result.totalValue).toEqual(8 * 12.99); // 103.92

    expect(result.lowStockItems).toHaveLength(1);
    expect(typeof result.lowStockItems[0].unitCost).toBe('number');
    expect(typeof result.lowStockItems[0].sellingPrice).toBe('number');
    expect(result.lowStockItems[0].unitCost).toEqual(12.99);
    expect(result.lowStockItems[0].sellingPrice).toEqual(19.99);
  });

  it('should return all items as low stock when threshold is very high', async () => {
    // Create test items
    await db.insert(inventoryItemsTable).values([
      {
        itemName: 'Item 1',
        sku: 'SKU-1',
        quantity: 100,
        unitCost: '5.00',
        sellingPrice: '10.00'
      },
      {
        itemName: 'Item 2',
        sku: 'SKU-2',
        quantity: 50,
        unitCost: '8.00',
        sellingPrice: '15.00'
      }
    ]).execute();

    const highThresholdInput: InventoryReportInput = {
      lowStockThreshold: 200
    };

    const result = await getInventorySummary(highThresholdInput);

    expect(result.totalItems).toEqual(2);
    expect(result.lowStockItems).toHaveLength(2); // All items should be low stock
    expect(result.lowStockThreshold).toEqual(200);
  });
});