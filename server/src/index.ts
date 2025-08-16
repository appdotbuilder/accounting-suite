import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createTransactionInputSchema,
  updateTransactionInputSchema,
  createInventoryItemInputSchema,
  updateInventoryItemInputSchema,
  financialReportInputSchema,
  inventoryReportInputSchema
} from './schema';

// Import handlers
import { createTransaction } from './handlers/create_transaction';
import { getTransactions } from './handlers/get_transactions';
import { updateTransaction } from './handlers/update_transaction';
import { deleteTransaction } from './handlers/delete_transaction';
import { createInventoryItem } from './handlers/create_inventory_item';
import { getInventoryItems } from './handlers/get_inventory_items';
import { updateInventoryItem } from './handlers/update_inventory_item';
import { deleteInventoryItem } from './handlers/delete_inventory_item';
import { getFinancialSummary } from './handlers/get_financial_summary';
import { getInventorySummary } from './handlers/get_inventory_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Transaction management routes
  createTransaction: publicProcedure
    .input(createTransactionInputSchema)
    .mutation(({ input }) => createTransaction(input)),
  
  getTransactions: publicProcedure
    .query(() => getTransactions()),
  
  updateTransaction: publicProcedure
    .input(updateTransactionInputSchema)
    .mutation(({ input }) => updateTransaction(input)),
  
  deleteTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTransaction(input.id)),

  // Inventory management routes
  createInventoryItem: publicProcedure
    .input(createInventoryItemInputSchema)
    .mutation(({ input }) => createInventoryItem(input)),
  
  getInventoryItems: publicProcedure
    .query(() => getInventoryItems()),
  
  updateInventoryItem: publicProcedure
    .input(updateInventoryItemInputSchema)
    .mutation(({ input }) => updateInventoryItem(input)),
  
  deleteInventoryItem: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInventoryItem(input.id)),

  // Financial reporting routes
  getFinancialSummary: publicProcedure
    .input(financialReportInputSchema)
    .query(({ input }) => getFinancialSummary(input)),
  
  getInventorySummary: publicProcedure
    .input(inventoryReportInputSchema)
    .query(({ input }) => getInventorySummary(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Accounting Server listening at port: ${port}`);
}

start();