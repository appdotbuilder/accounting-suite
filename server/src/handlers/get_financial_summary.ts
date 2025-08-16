import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import type { FinancialReportInput, FinancialSummary } from '../schema';

export const getFinancialSummary = async (input: FinancialReportInput): Promise<FinancialSummary> => {
  try {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    // Get all transactions in the date range
    const transactions = await db.select()
      .from(transactionsTable)
      .where(
        and(
          gte(transactionsTable.date, startDate),
          lte(transactionsTable.date, endDate)
        )
      )
      .execute();

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const transaction of transactions) {
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'Income') {
        totalIncome += amount;
      } else if (transaction.type === 'Expense') {
        totalExpenses += amount;
      }
    }

    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      period: {
        startDate: startDate,
        endDate: endDate
      }
    };
  } catch (error) {
    console.error('Financial summary generation failed:', error);
    throw error;
  }
};