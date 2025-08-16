import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type FinancialReportInput, type FinancialSummary } from '../schema';
import { eq, and, gte, lte, sum } from 'drizzle-orm';

export async function getFinancialSummary(input: FinancialReportInput): Promise<FinancialSummary> {
  try {
    // Convert dates to proper Date objects
    const startDate = typeof input.startDate === 'string' ? new Date(input.startDate) : input.startDate;
    const endDate = typeof input.endDate === 'string' ? new Date(input.endDate) : input.endDate;

    // Build date range conditions
    const dateConditions = and(
      gte(transactionsTable.date, startDate),
      lte(transactionsTable.date, endDate)
    );

    // Get total income (sum of all Income transactions in date range)
    const incomeResult = await db.select({
      total: sum(transactionsTable.amount)
    })
      .from(transactionsTable)
      .where(and(
        dateConditions,
        eq(transactionsTable.type, 'Income')
      ))
      .execute();

    // Get total expenses (sum of all Expense transactions in date range)
    const expenseResult = await db.select({
      total: sum(transactionsTable.amount)
    })
      .from(transactionsTable)
      .where(and(
        dateConditions,
        eq(transactionsTable.type, 'Expense')
      ))
      .execute();

    // Extract totals and convert from string to number (numeric columns return strings)
    const totalIncome = incomeResult[0]?.total ? parseFloat(incomeResult[0].total) : 0;
    const totalExpenses = expenseResult[0]?.total ? parseFloat(expenseResult[0].total) : 0;
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      period: {
        startDate,
        endDate
      }
    };
  } catch (error) {
    console.error('Financial summary calculation failed:', error);
    throw error;
  }
}