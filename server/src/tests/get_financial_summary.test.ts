import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type FinancialReportInput } from '../schema';
import { getFinancialSummary } from '../handlers/get_financial_summary';

// Test input for date range
const testInput: FinancialReportInput = {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
};

describe('getFinancialSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero values when no transactions exist', async () => {
    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(0);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netProfit).toEqual(0);
    expect(result.period.startDate).toBeInstanceOf(Date);
    expect(result.period.endDate).toBeInstanceOf(Date);
  });

  it('should calculate totals with only income transactions', async () => {
    // Create test income transactions
    await db.insert(transactionsTable).values([
      {
        date: new Date('2024-01-15'),
        description: 'Sales Revenue',
        amount: '1500.00',
        type: 'Income',
        category: 'Sales'
      },
      {
        date: new Date('2024-01-20'),
        description: 'Service Income',
        amount: '750.50',
        type: 'Income',
        category: 'Sales'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(2250.50);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netProfit).toEqual(2250.50);
  });

  it('should calculate totals with only expense transactions', async () => {
    // Create test expense transactions
    await db.insert(transactionsTable).values([
      {
        date: new Date('2024-01-10'),
        description: 'Office Rent',
        amount: '800.00',
        type: 'Expense',
        category: 'Rent'
      },
      {
        date: new Date('2024-01-25'),
        description: 'Utility Bill',
        amount: '125.75',
        type: 'Expense',
        category: 'Utilities'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(0);
    expect(result.totalExpenses).toEqual(925.75);
    expect(result.netProfit).toEqual(-925.75);
  });

  it('should calculate totals with mixed income and expense transactions', async () => {
    // Create mixed transactions
    await db.insert(transactionsTable).values([
      {
        date: new Date('2024-01-05'),
        description: 'Sales Revenue',
        amount: '2000.00',
        type: 'Income',
        category: 'Sales'
      },
      {
        date: new Date('2024-01-10'),
        description: 'Office Rent',
        amount: '800.00',
        type: 'Expense',
        category: 'Rent'
      },
      {
        date: new Date('2024-01-15'),
        description: 'Equipment Purchase',
        amount: '450.25',
        type: 'Expense',
        category: 'Equipment'
      },
      {
        date: new Date('2024-01-20'),
        description: 'Consulting Revenue',
        amount: '1200.75',
        type: 'Income',
        category: 'Sales'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(3200.75);
    expect(result.totalExpenses).toEqual(1250.25);
    expect(result.netProfit).toEqual(1950.50);
  });

  it('should only include transactions within the specified date range', async () => {
    // Create transactions both inside and outside date range
    await db.insert(transactionsTable).values([
      // Outside range - before
      {
        date: new Date('2023-12-31'),
        description: 'Previous Year Income',
        amount: '1000.00',
        type: 'Income',
        category: 'Sales'
      },
      // Inside range
      {
        date: new Date('2024-01-15'),
        description: 'January Income',
        amount: '500.00',
        type: 'Income',
        category: 'Sales'
      },
      {
        date: new Date('2024-01-20'),
        description: 'January Expense',
        amount: '200.00',
        type: 'Expense',
        category: 'Utilities'
      },
      // Outside range - after
      {
        date: new Date('2024-02-01'),
        description: 'February Income',
        amount: '800.00',
        type: 'Income',
        category: 'Sales'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    // Only January transactions should be included
    expect(result.totalIncome).toEqual(500.00);
    expect(result.totalExpenses).toEqual(200.00);
    expect(result.netProfit).toEqual(300.00);
  });

  it('should handle Date objects as input parameters', async () => {
    // Create test transaction
    await db.insert(transactionsTable).values({
      date: new Date('2024-01-15'),
      description: 'Test Transaction',
      amount: '100.00',
      type: 'Income',
      category: 'Sales'
    }).execute();

    // Test with Date objects instead of strings
    const inputWithDates: FinancialReportInput = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    };

    const result = await getFinancialSummary(inputWithDates);

    expect(result.totalIncome).toEqual(100.00);
    expect(result.totalExpenses).toEqual(0);
    expect(result.netProfit).toEqual(100.00);
    expect(result.period.startDate).toBeInstanceOf(Date);
    expect(result.period.endDate).toBeInstanceOf(Date);
  });

  it('should handle edge case with boundary dates', async () => {
    // Create transactions on exact boundary dates
    await db.insert(transactionsTable).values([
      {
        date: new Date('2024-01-01'), // Start boundary
        description: 'Start Date Transaction',
        amount: '100.00',
        type: 'Income',
        category: 'Sales'
      },
      {
        date: new Date('2024-01-31'), // End boundary
        description: 'End Date Transaction',
        amount: '50.00',
        type: 'Expense',
        category: 'Other'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(100.00);
    expect(result.totalExpenses).toEqual(50.00);
    expect(result.netProfit).toEqual(50.00);
  });

  it('should handle different transaction categories correctly', async () => {
    // Create transactions with various categories
    await db.insert(transactionsTable).values([
      {
        date: new Date('2024-01-05'),
        description: 'Product Sales',
        amount: '1500.00',
        type: 'Income',
        category: 'Sales'
      },
      {
        date: new Date('2024-01-10'),
        description: 'Office Rent',
        amount: '800.00',
        type: 'Expense',
        category: 'Rent'
      },
      {
        date: new Date('2024-01-15'),
        description: 'Marketing Campaign',
        amount: '300.50',
        type: 'Expense',
        category: 'Marketing'
      },
      {
        date: new Date('2024-01-20'),
        description: 'Employee Salaries',
        amount: '2000.00',
        type: 'Expense',
        category: 'Salaries'
      }
    ]).execute();

    const result = await getFinancialSummary(testInput);

    expect(result.totalIncome).toEqual(1500.00);
    expect(result.totalExpenses).toEqual(3100.50);
    expect(result.netProfit).toEqual(-1600.50); // Negative profit
  });
});