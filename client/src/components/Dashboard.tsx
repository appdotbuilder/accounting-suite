import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { TrendingUp, TrendingDown, Package, AlertTriangle, DollarSign, Wallet, ShoppingCart } from 'lucide-react';
import type { Transaction, InventoryItem, FinancialSummary, InventorySummary } from '../../../server/src/schema';

export function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load all data in parallel
      const [transactionsData, inventoryData] = await Promise.all([
        trpc.getTransactions.query(),
        trpc.getInventoryItems.query()
      ]);

      setTransactions(transactionsData);
      setInventoryItems(inventoryData);

      // Get financial summary for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const [financialData, inventoryData2] = await Promise.all([
        trpc.getFinancialSummary.query({
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        }),
        trpc.getInventorySummary.query({ lowStockThreshold: 10 })
      ]);

      setFinancialSummary(financialData);
      setInventorySummary(inventoryData2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Unable to load dashboard data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate quick stats
  const recentTransactions = transactions.slice(0, 5);
  const lowStockItems = inventoryItems.filter((item: InventoryItem) => item.quantity <= 10);
  const totalInventoryValue = inventoryItems.reduce((sum: number, item: InventoryItem) => 
    sum + (item.quantity * item.unitCost), 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              ${financialSummary?.totalIncome.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-green-700">
              💰 Total revenue this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              ${financialSummary?.totalExpenses.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-red-700">
              💸 Total costs this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Net Profit</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              ${financialSummary?.netProfit.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-blue-700">
              📊 Income minus expenses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              ${totalInventoryValue.toFixed(2)}
            </div>
            <p className="text-xs text-purple-700">
              📦 Total stock value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest financial activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                💼 No transactions yet. Start by adding your first transaction!
              </p>
            ) : (
              recentTransactions.map((transaction: Transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {transaction.date.toLocaleDateString()} • {transaction.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={transaction.type === 'Income' ? 'default' : 'destructive'}
                      className={transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                ✅ All inventory levels look good!
              </p>
            ) : (
              <>
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    ⚠️ {lowStockItems.length} items are running low on stock
                  </AlertDescription>
                </Alert>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lowStockItems.map((item: InventoryItem) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                      <div>
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">SKU: {item.sku}</p>
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        {item.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            Business Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-900">{transactions.length}</p>
              <p className="text-sm text-blue-700">Total Transactions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-900">{inventoryItems.length}</p>
              <p className="text-sm text-green-700">Inventory Items</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-900">
                {inventorySummary?.totalItems || inventoryItems.reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0)}
              </p>
              <p className="text-sm text-purple-700">Total Stock Units</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}