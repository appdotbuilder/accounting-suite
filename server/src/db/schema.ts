import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for transaction types and categories
export const transactionTypeEnum = pgEnum('transaction_type', ['Income', 'Expense']);

export const transactionCategoryEnum = pgEnum('transaction_category', [
  'Sales',
  'Rent', 
  'Utilities',
  'Purchases',
  'Salaries',
  'Marketing',
  'Equipment',
  'Insurance',
  'Office Supplies',
  'Travel',
  'Other'
]);

// Financial transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  category: transactionCategoryEnum('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Inventory items table
export const inventoryItemsTable = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  itemName: text('item_name').notNull(),
  sku: text('sku').notNull().unique(),
  quantity: integer('quantity').notNull(),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;
export type NewInventoryItem = typeof inventoryItemsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  transactions: transactionsTable,
  inventoryItems: inventoryItemsTable
};