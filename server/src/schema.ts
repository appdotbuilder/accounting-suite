import { z } from 'zod';

// Transaction type enum
export const transactionTypeSchema = z.enum(['Income', 'Expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Transaction category schema
export const transactionCategorySchema = z.enum([
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
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;

// Financial Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  date: z.coerce.date(),
  description: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  category: transactionCategorySchema,
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  date: z.string().or(z.date()),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  type: transactionTypeSchema,
  category: transactionCategorySchema
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  date: z.string().or(z.date()).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: transactionTypeSchema.optional(),
  category: transactionCategorySchema.optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Inventory Item schema
export const inventoryItemSchema = z.object({
  id: z.number(),
  itemName: z.string(),
  sku: z.string(),
  quantity: z.number().int(),
  unitCost: z.number(),
  sellingPrice: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Input schema for creating inventory items
export const createInventoryItemInputSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  sku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().nonnegative('Quantity must be non-negative'),
  unitCost: z.number().nonnegative('Unit cost must be non-negative'),
  sellingPrice: z.number().positive('Selling price must be positive')
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

// Input schema for updating inventory items
export const updateInventoryItemInputSchema = z.object({
  id: z.number(),
  itemName: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative().optional(),
  unitCost: z.number().nonnegative().optional(),
  sellingPrice: z.number().positive().optional()
});

export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemInputSchema>;

// Financial Report schemas
export const financialSummarySchema = z.object({
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  period: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  })
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

export const inventorySummarySchema = z.object({
  totalItems: z.number().int(),
  totalValue: z.number(),
  lowStockItems: z.array(inventoryItemSchema),
  lowStockThreshold: z.number().int().default(10)
});

export type InventorySummary = z.infer<typeof inventorySummarySchema>;

// Report input schemas
export const financialReportInputSchema = z.object({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date())
});

export type FinancialReportInput = z.infer<typeof financialReportInputSchema>;

export const inventoryReportInputSchema = z.object({
  lowStockThreshold: z.number().int().positive().default(10)
});

export type InventoryReportInput = z.infer<typeof inventoryReportInputSchema>;