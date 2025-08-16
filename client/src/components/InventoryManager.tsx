import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Package, AlertTriangle, AlertCircle, DollarSign, Boxes, TrendingUp } from 'lucide-react';
import type { InventoryItem, CreateInventoryItemInput, UpdateInventoryItemInput } from '../../../server/src/schema';

export function InventoryManager() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateInventoryItemInput>({
    itemName: '',
    sku: '',
    quantity: 0,
    unitCost: 0,
    sellingPrice: 0
  });

  const [editFormData, setEditFormData] = useState<Partial<UpdateInventoryItemInput>>({});

  const loadInventoryItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await trpc.getInventoryItems.query();
      setInventoryItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory items');
      console.error('Failed to load inventory items:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

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

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createInventoryItem.mutate(createFormData);
      setInventoryItems((prev: InventoryItem[]) => [...prev, response]);
      setCreateFormData({
        itemName: '',
        sku: '',
        quantity: 0,
        unitCost: 0,
        sellingPrice: 0
      });
      setIsCreateDialogOpen(false);
      showMessage('✅ Inventory item created successfully!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to create inventory item', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsLoading(true);
    try {
      const updateData: UpdateInventoryItemInput = {
        id: editingItem.id,
        ...editFormData
      };
      
      const response = await trpc.updateInventoryItem.mutate(updateData);
      setInventoryItems((prev: InventoryItem[]) => 
        prev.map((item: InventoryItem) => item.id === response.id ? response : item)
      );
      setIsEditDialogOpen(false);
      setEditingItem(null);
      setEditFormData({});
      showMessage('✅ Inventory item updated successfully!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to update inventory item', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}" from inventory? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await trpc.deleteInventoryItem.mutate({ id });
      setInventoryItems((prev: InventoryItem[]) => prev.filter((item: InventoryItem) => item.id !== id));
      showMessage('🗑️ Inventory item deleted successfully!');
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to delete inventory item', true);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
      itemName: item.itemName,
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      sellingPrice: item.sellingPrice
    });
    setIsEditDialogOpen(true);
  };

  // Calculate totals and stats
  const totalItems = inventoryItems.length;
  const totalQuantity = inventoryItems.reduce((sum: number, item: InventoryItem) => sum + item.quantity, 0);
  const totalValue = inventoryItems.reduce((sum: number, item: InventoryItem) => sum + (item.quantity * item.unitCost), 0);
  const totalPotentialRevenue = inventoryItems.reduce((sum: number, item: InventoryItem) => sum + (item.quantity * item.sellingPrice), 0);
  const lowStockItems = inventoryItems.filter((item: InventoryItem) => item.quantity <= 10);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">📦 Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalItems}</div>
            <p className="text-xs text-blue-700">Different products</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">🔢 Total Quantity</CardTitle>
            <Boxes className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{totalQuantity}</div>
            <p className="text-xs text-purple-700">Units in stock</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">💰 Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-green-700">Investment cost</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">📈 Potential Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">${totalPotentialRevenue.toFixed(2)}</div>
            <p className="text-xs text-yellow-700">If all sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            ⚠️ <strong>{lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''}</strong> running low on stock (≤ 10 units).
            Consider restocking: {lowStockItems.slice(0, 3).map((item: InventoryItem) => item.itemName).join(', ')}
            {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">📋 Inventory Items</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateItem}>
              <DialogHeader>
                <DialogTitle>➕ Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new product to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="create-itemName">Item Name</Label>
                  <Input
                    id="create-itemName"
                    placeholder="e.g., Product A, Office Chair"
                    value={createFormData.itemName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateInventoryItemInput) => ({ ...prev, itemName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-sku">SKU</Label>
                  <Input
                    id="create-sku"
                    placeholder="e.g., PROD-001, CHAIR-BLK"
                    value={createFormData.sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateInventoryItemInput) => ({ ...prev, sku: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-quantity">Quantity</Label>
                  <Input
                    id="create-quantity"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createFormData.quantity || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateInventoryItemInput) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-unitCost">Unit Cost ($)</Label>
                  <Input
                    id="create-unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createFormData.unitCost || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateInventoryItemInput) => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-sellingPrice">Selling Price ($)</Label>
                  <Input
                    id="create-sellingPrice"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={createFormData.sellingPrice || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateInventoryItemInput) => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardDescription>
            {inventoryItems.length === 0 
              ? "No inventory items yet. Start by adding your first product!" 
              : `Showing ${inventoryItems.length} item${inventoryItems.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">📦 No inventory items yet</p>
              <p className="text-sm">Click "Add Item" to start building your product catalog!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Profit Margin</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item: InventoryItem) => {
                    const totalValue = item.quantity * item.unitCost;
                    const profitPerUnit = item.sellingPrice - item.unitCost;
                    const profitMargin = item.unitCost > 0 ? (profitPerUnit / item.unitCost) * 100 : 0;
                    const isLowStock = item.quantity <= 10;
                    
                    return (
                      <TableRow key={item.id} className={isLowStock ? 'bg-orange-50' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-xs text-gray-500">
                              Added: {item.created_at.toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {item.sku}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                              {item.quantity}
                            </span>
                            {isLowStock && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${item.unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${item.sellingPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${totalValue.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={profitMargin >= 50 ? 'default' : profitMargin >= 20 ? 'secondary' : 'outline'}
                            className={
                              profitMargin >= 50 ? 'bg-green-100 text-green-800' :
                              profitMargin >= 20 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {profitMargin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id, item.itemName)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditItem}>
            <DialogHeader>
              <DialogTitle>✏️ Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update inventory item details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-itemName">Item Name</Label>
                <Input
                  id="edit-itemName"
                  value={editFormData.itemName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateInventoryItemInput>) => ({ ...prev, itemName: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editFormData.sku || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateInventoryItemInput>) => ({ ...prev, sku: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editFormData.quantity || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateInventoryItemInput>) => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-unitCost">Unit Cost ($)</Label>
                <Input
                  id="edit-unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.unitCost || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateInventoryItemInput>) => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-sellingPrice">Selling Price ($)</Label>
                <Input
                  id="edit-sellingPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editFormData.sellingPrice || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: Partial<UpdateInventoryItemInput>) => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}