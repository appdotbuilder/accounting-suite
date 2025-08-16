import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import { getInventoryItems } from '../handlers/get_inventory_items';

// Test inventory items data
const testItems: CreateInventoryItemInput[] = [
  {
    itemName: 'Laptop Computer',
    sku: 'LAP-001',
    quantity: 25,
    unitCost: 800.50,
    sellingPrice: 1200.00
  },
  {
    itemName: 'Wireless Mouse',
    sku: 'MOU-001',
    quantity: 50,
    unitCost: 15.99,
    sellingPrice: 29.99
  },
  {
    itemName: 'Office Chair',
    sku: 'CHR-001',
    quantity: 12,
    unitCost: 150.00,
    sellingPrice: 250.00
  },
  {
    itemName: 'Desk Lamp',
    sku: 'LMP-001',
    quantity: 8,
    unitCost: 35.75,
    sellingPrice: 59.99
  }
];

describe('getInventoryItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no inventory items exist', async () => {
    const result = await getInventoryItems();

    expect(result).toEqual([]);
  });

  it('should fetch all inventory items ordered by name', async () => {
    // Insert test inventory items
    await db.insert(inventoryItemsTable)
      .values(testItems.map(item => ({
        ...item,
        unitCost: item.unitCost.toString(),
        sellingPrice: item.sellingPrice.toString()
      })))
      .execute();

    const result = await getInventoryItems();

    // Should return all items
    expect(result).toHaveLength(4);

    // Verify items are ordered by name (alphabetically)
    const expectedOrder = ['Desk Lamp', 'Laptop Computer', 'Office Chair', 'Wireless Mouse'];
    expect(result.map(item => item.itemName)).toEqual(expectedOrder);

    // Verify first item structure and data types
    const firstItem = result[0];
    expect(firstItem.itemName).toEqual('Desk Lamp');
    expect(firstItem.sku).toEqual('LMP-001');
    expect(firstItem.quantity).toEqual(8);
    expect(firstItem.unitCost).toEqual(35.75);
    expect(typeof firstItem.unitCost).toBe('number');
    expect(firstItem.sellingPrice).toEqual(59.99);
    expect(typeof firstItem.sellingPrice).toBe('number');
    expect(firstItem.id).toBeDefined();
    expect(firstItem.created_at).toBeInstanceOf(Date);
    expect(firstItem.updated_at).toBeInstanceOf(Date);
  });

  it('should convert numeric fields correctly', async () => {
    // Insert single item with precise decimal values
    await db.insert(inventoryItemsTable)
      .values({
        itemName: 'Test Item',
        sku: 'TEST-001',
        quantity: 100,
        unitCost: '99.99',
        sellingPrice: '149.95'
      })
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(1);
    const item = result[0];
    
    // Verify numeric conversion
    expect(typeof item.unitCost).toBe('number');
    expect(item.unitCost).toEqual(99.99);
    expect(typeof item.sellingPrice).toBe('number');
    expect(item.sellingPrice).toEqual(149.95);
  });

  it('should handle items with zero values correctly', async () => {
    // Insert item with zero unit cost
    await db.insert(inventoryItemsTable)
      .values({
        itemName: 'Free Sample',
        sku: 'FREE-001',
        quantity: 0,
        unitCost: '0.00',
        sellingPrice: '5.00'
      })
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(1);
    const item = result[0];
    
    expect(item.itemName).toEqual('Free Sample');
    expect(item.quantity).toEqual(0);
    expect(item.unitCost).toEqual(0.00);
    expect(typeof item.unitCost).toBe('number');
    expect(item.sellingPrice).toEqual(5.00);
  });

  it('should maintain correct ordering with case-insensitive names', async () => {
    // Insert items with mixed case names
    const mixedCaseItems = [
      {
        itemName: 'apple Product',
        sku: 'APP-001',
        quantity: 10,
        unitCost: '50.00',
        sellingPrice: '75.00'
      },
      {
        itemName: 'Banana Item',
        sku: 'BAN-001',
        quantity: 15,
        unitCost: '25.00',
        sellingPrice: '40.00'
      },
      {
        itemName: 'cherry Tool',
        sku: 'CHE-001',
        quantity: 5,
        unitCost: '100.00',
        sellingPrice: '150.00'
      }
    ];

    await db.insert(inventoryItemsTable)
      .values(mixedCaseItems)
      .execute();

    const result = await getInventoryItems();

    expect(result).toHaveLength(3);
    
    // Should be ordered alphabetically (case-sensitive in PostgreSQL by default)
    const orderedNames = result.map(item => item.itemName);
    expect(orderedNames).toEqual(['Banana Item', 'apple Product', 'cherry Tool']);
  });
});