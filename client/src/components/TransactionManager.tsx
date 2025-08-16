import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionType, TransactionCategory } from '../../../server/src/schema';

const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  'Sales', 'Rent', 'Utilities', 'Purchases', 'Salaries', 'Marketing', 
  'Equipment', 'Insurance', 'Office Supplies', 'Travel', 'Other'
];

// Indonesian category names mapping
const CATEGORY_NAMES: Record<TransactionCategory, string> = {
  'Sales': 'Penjualan',
  'Rent': 'Sewa',
  'Utilities': 'Utilitas',
  'Purchases': 'Pembelian',
  'Salaries': 'Gaji',
  'Marketing': 'Pemasaran',
  'Equipment': 'Peralatan',
  'Insurance': 'Asuransi',
  'Office Supplies': 'Perlengkapan Kantor',
  'Travel': 'Perjalanan',
  'Other': 'Lainnya'
};

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

export function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateTransactionInput>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'Income',
    category: 'Sales'
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateTransactionInput>>({});

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getTransactions.query();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi');
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess(null);
    } else {
      setSuccess(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createTransaction.mutate(createFormData);
      setTransactions((prev: Transaction[]) => [response, ...prev]);
      setCreateFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'Income',
        category: 'Sales'
      });
      setIsCreateDialogOpen(false);
      showMessage('✅ Transaksi berhasil dibuat!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Gagal membuat transaksi', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateTransactionInput = {
        id: editingTransaction.id,
        ...editFormData
      };
      
      const response = await trpc.updateTransaction.mutate(updateData);
      setTransactions((prev: Transaction[]) => 
        prev.map((t: Transaction) => t.id === response.id ? response : t)
      );
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      setEditFormData({});
      showMessage('✅ Transaksi berhasil diperbarui!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Gagal memperbarui transaksi', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: number, description: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi "${description}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await trpc.deleteTransaction.mutate({ id });
      setTransactions((prev: Transaction[]) => prev.filter((t: Transaction) => t.id !== id));
      showMessage('🗑️ Transaksi berhasil dihapus!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Gagal menghapus transaksi', true);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category
    });
    setIsEditDialogOpen(true);
  };

  // Calculate totals
  const totalIncome = transactions
    .filter((t: Transaction) => t.type === 'Income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter((t: Transaction) => t.type === 'Expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
  
  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">💰 Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatRupiah(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">💸 Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{formatRupiah(totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">📊 Laba Bersih</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {formatRupiah(netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">📋 Riwayat Transaksi</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateTransaction}>
              <DialogHeader>
                <DialogTitle>➕ Tambah Transaksi Baru</DialogTitle>
                <DialogDescription>
                  Catat transaksi pemasukan atau pengeluaran baru
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-date">Tanggal</Label>
                  <Input
                    id="create-date"
                    type="date"
                    value={typeof createFormData.date === 'string' ? createFormData.date : createFormData.date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-description">Deskripsi</Label>
                  <Input
                    id="create-description"
                    placeholder="cth., Pendapatan penjualan, Pembelian perlengkapan kantor"
                    value={createFormData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, description: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-amount">Jumlah (Rp)</Label>
                  <Input
                    id="create-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={createFormData.amount || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-type">Jenis</Label>
                  <Select
                    value={createFormData.type}
                    onValueChange={(value: TransactionType) =>
                      setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Income">💰 Pemasukan</SelectItem>
                      <SelectItem value="Expense">💸 Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-category">Kategori</Label>
                  <Select
                    value={createFormData.category}
                    onValueChange={(value: TransactionCategory) =>
                      setCreateFormData((prev: CreateTransactionInput) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_CATEGORIES.map((category: TransactionCategory) => (
                        <SelectItem key={category} value={category}>{CATEGORY_NAMES[category]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Membuat...' : 'Buat Transaksi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardDescription>
            {transactions.length === 0 
              ? "Belum ada transaksi. Mulai dengan menambahkan transaksi pertama Anda!" 
              : `Menampilkan ${transactions.length} transaksi`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">📊 Belum ada transaksi tercatat</p>
              <p className="text-sm">Klik "Tambah Transaksi" untuk mulai melacak keuangan Anda!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction: Transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.date.toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            Ditambahkan: {transaction.created_at.toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{CATEGORY_NAMES[transaction.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'Income' ? 'default' : 'destructive'}
                          className={transaction.type === 'Income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {transaction.type === 'Income' ? '📈' : '📉'} {transaction.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'Income' ? '+' : '-'}{formatRupiah(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(transaction)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id, transaction.description)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditTransaction}>
            <DialogHeader>
              <DialogTitle>✏️ Edit Transaksi</DialogTitle>
              <DialogDescription>
                Perbarui detail transaksi
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Tanggal</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editFormData.date ? (typeof editFormData.date === 'string' ? editFormData.date : editFormData.date.toISOString().split('T')[0]) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTransactionInput>) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Input
                  id="edit-description"
                  value={editFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTransactionInput>) => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Jumlah (Rp)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.amount || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateTransactionInput>) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Jenis</Label>
                <Select
                  value={editFormData.type || ''}
                  onValueChange={(value: TransactionType) =>
                    setEditFormData((prev: Partial<UpdateTransactionInput>) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Income">💰 Pemasukan</SelectItem>
                    <SelectItem value="Expense">💸 Pengeluaran</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select
                  value={editFormData.category || ''}
                  onValueChange={(value: TransactionCategory) =>
                    setEditFormData((prev: Partial<UpdateTransactionInput>) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_CATEGORIES.map((category: TransactionCategory) => (
                      <SelectItem key={category} value={category}>{CATEGORY_NAMES[category]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Memperbarui...' : 'Perbarui Transaksi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}