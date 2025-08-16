import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Package, TrendingUp, DollarSign } from 'lucide-react';
import { TransactionManager } from '@/components/TransactionManager';
import { InventoryManager } from '@/components/InventoryManager';
import { FinancialReports } from '@/components/FinancialReports';
import { Dashboard } from '@/components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Calculator className="h-10 w-10 text-indigo-600" />
            📊 Sistem Akuntansi Bisnis
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pelacakan keuangan komprehensif, manajemen inventori, dan pelaporan bisnis dalam satu tempat
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-lg border">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 p-4">
              <TrendingUp className="h-4 w-4" />
              Dasbor
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 p-4">
              <DollarSign className="h-4 w-4" />
              Transaksi
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 p-4">
              <Package className="h-4 w-4" />
              Inventori
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2 p-4">
              <Calculator className="h-4 w-4" />
              Laporan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="transactions" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  💰 Transaksi Keuangan
                </CardTitle>
                <CardDescription>
                  Lacak pendapatan dan pengeluaran, kategorikan transaksi, dan pantau arus kas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-600" />
                  📦 Manajemen Inventori
                </CardTitle>
                <CardDescription>
                  Kelola inventori bisnis, lacak level stok, dan pantau biaya barang
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6 text-purple-600" />
                  📈 Laporan Keuangan
                </CardTitle>
                <CardDescription>
                  Buat laporan komprehensif dan analisis performa bisnis Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FinancialReports />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Dibuat dengan teknologi web modern • Pelacakan data real-time • Pelaporan profesional
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;