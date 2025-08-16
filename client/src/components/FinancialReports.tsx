import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { FileText, Calendar, TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';
import type { FinancialSummary, InventorySummary, InventoryItem } from '../../../server/src/schema';

// Format currency to Indonesian Rupiah
function formatRupiah(amount: number): string {
  if (amount % 1 === 0) {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  return `Rp ${amount.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function FinancialReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  
  // Form data for date range selection
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const date = new Date();
      date.setDate(1); // First day of current month
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0]
  });

  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  const generateFinancialReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await trpc.getFinancialSummary.query({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setFinancialSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan keuangan');
      console.error('Financial report generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  const generateInventoryReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await trpc.getInventorySummary.query({
        lowStockThreshold: lowStockThreshold
      });
      setInventorySummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan inventori');
      console.error('Inventory report generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lowStockThreshold]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID');

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Laporan Keuangan
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Laporan Inventori
          </TabsTrigger>
        </TabsList>

        {/* Financial Reports Tab */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                📊 Laporan Kinerja Keuangan
              </CardTitle>
              <CardDescription>
                Buat ringkasan keuangan komprehensif untuk rentang tanggal apapun
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range Selection */}
              <div className="grid gap-4 md:grid-cols-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Tanggal Mulai</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDateRange(prev => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Tanggal Akhir</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDateRange(prev => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </div>
                <Button
                  onClick={generateFinancialReport}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isLoading ? 'Membuat...' : 'Buat Laporan'}
                </Button>
              </div>

              {/* Financial Summary Results */}
              {financialSummary && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📈 Ringkasan Keuangan</h3>
                    <div className="text-sm text-gray-500">
                      Periode: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
                    </div>
                  </div>

                  {/* Key Metrics Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">💰 Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900">
                          {formatRupiah(financialSummary.totalIncome)}
                        </div>
                        <p className="text-xs text-green-700">Pendapatan yang dihasilkan</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">💸 Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-900">
                          {formatRupiah(financialSummary.totalExpenses)}
                        </div>
                        <p className="text-xs text-red-700">Biaya yang terjadi</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">📊 Laba Bersih</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          {formatRupiah(financialSummary.netProfit)}
                        </div>
                        <p className="text-xs text-blue-700">
                          {financialSummary.netProfit >= 0 ? '🎉 Menguntungkan!' : '⚠️ Beroperasi rugi'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Performance Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        Analisis Kinerja
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">💹 Margin Keuntungan</h4>
                          <p className="text-2xl font-bold">
                            {financialSummary.totalIncome > 0 
                              ? ((financialSummary.netProfit / financialSummary.totalIncome) * 100).toFixed(1)
                              : '0.0'
                            }%
                          </p>
                          <p className="text-sm text-gray-600">
                            {financialSummary.totalIncome > 0 && (financialSummary.netProfit / financialSummary.totalIncome) >= 0.2 
                              ? '🌟 Profitabilitas sangat baik!'
                              : financialSummary.totalIncome > 0 && (financialSummary.netProfit / financialSummary.totalIncome) >= 0.1
                              ? '👍 Margin keuntungan yang baik'
                              : '📈 Masih ada ruang untuk perbaikan'
                            }
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">📈 Kesehatan Keuangan</h4>
                          <Badge 
                            variant={financialSummary.netProfit >= 0 ? 'default' : 'destructive'}
                            className={financialSummary.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                          >
                            {financialSummary.netProfit >= 0 ? 'Positif' : 'Negatif'}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-2">
                            {financialSummary.netProfit >= 0 
                              ? 'Bisnis menghasilkan keuntungan' 
                              : 'Bisnis perlu optimalisasi biaya'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Reports Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                📦 Laporan Analisis Inventori
              </CardTitle>
              <CardDescription>
                Dapatkan wawasan tentang status inventori Anda dan identifikasi barang yang membutuhkan perhatian
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Low Stock Threshold Setting */}
              <div className="grid gap-4 md:grid-cols-2 items-end">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Batas Stok Rendah</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLowStockThreshold(parseInt(e.target.value) || 10)
                    }
                    placeholder="10"
                  />
                  <p className="text-xs text-gray-500">
                    Barang dengan kuantitas ≤ angka ini akan ditandai sebagai stok rendah
                  </p>
                </div>
                <Button
                  onClick={generateInventoryReport}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  {isLoading ? 'Membuat...' : 'Buat Laporan'}
                </Button>
              </div>

              {/* Inventory Summary Results */}
              {inventorySummary && (
                <div className="space-y-6 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">📋 Ringkasan Inventori</h3>
                    <div className="text-sm text-gray-500">
                      Dibuat: {new Date().toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  {/* Inventory Metrics Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800">📦 Total Barang</CardTitle>
                        <Package className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900">
                          {inventorySummary.totalItems}
                        </div>
                        <p className="text-xs text-blue-700">Produk berbeda</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-800">💰 Total Nilai</CardTitle>
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-900">
                          {formatRupiah(inventorySummary.totalValue)}
                        </div>
                        <p className="text-xs text-purple-700">Investasi dalam stok</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-800">⚠️ Barang Stok Rendah</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-900">
                          {inventorySummary.lowStockItems.length}
                        </div>
                        <p className="text-xs text-orange-700">Perlu restock</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Low Stock Items Details */}
                  {inventorySummary.lowStockItems.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                          Barang yang Memerlukan Perhatian
                        </CardTitle>
                        <CardDescription>
                          Barang dengan tingkat stok pada atau di bawah {inventorySummary.lowStockThreshold} unit
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {inventorySummary.lowStockItems.map((item: InventoryItem) => {
                            const isVeryLow = item.quantity <= 5;
                            const totalValue = item.quantity * item.unitCost;
                            
                            return (
                              <div 
                                key={item.id} 
                                className={`p-4 rounded-lg border-2 ${
                                  isVeryLow 
                                    ? 'border-red-200 bg-red-50' 
                                    : 'border-orange-200 bg-orange-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-semibold">{item.itemName}</h4>
                                    <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                                    <p className="text-xs text-gray-500">
                                      Nilai: {formatRupiah(totalValue)} • 
                                      Biaya per Unit: {formatRupiah(item.unitCost)} • 
                                      Harga Jual: {formatRupiah(item.sellingPrice)}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <Badge 
                                      variant="destructive"
                                      className={isVeryLow ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}
                                    >
                                      {item.quantity} tersisa
                                    </Badge>
                                    <p className="text-xs mt-1 text-gray-500">
                                      {isVeryLow ? '🚨 Kritis' : '⚠️ Rendah'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory Health Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        📊 Kesehatan Inventori
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">🎯 Status Stok</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Barang stok cukup:</span>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {inventorySummary.totalItems - inventorySummary.lowStockItems.length}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Barang stok rendah:</span>
                              <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                                {inventorySummary.lowStockItems.length}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-2">💡 Rekomendasi</h4>
                          <div className="text-sm space-y-1">
                            {inventorySummary.lowStockItems.length === 0 ? (
                              <p className="text-green-700">✅ Semua level inventori sehat!</p>
                            ) : (
                              <>
                                <p className="text-orange-700">
                                  📋 Tinjau {inventorySummary.lowStockItems.length} barang untuk restock
                                </p>
                                <p className="text-gray-600">
                                  💰 Total nilai berisiko: {formatRupiah(
                                    inventorySummary.lowStockItems.reduce((sum: number, item: InventoryItem) => 
                                      sum + (item.quantity * item.unitCost), 0
                                    )
                                  )}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}