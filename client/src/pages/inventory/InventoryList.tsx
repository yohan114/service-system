import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import InventoryForm from './InventoryForm';

const categories = ['ALL', 'FILTER', 'OIL', 'SPARE_PART', 'OTHER'];

export default function InventoryList() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory', search, categoryFilter],
    queryFn: () =>
      api
        .get('/inventory', {
          params: {
            search: search || undefined,
            category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          },
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeletingId(null);
    },
  });

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category', render: (item: any) => item.category.replace(/_/g, ' ') },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (item: any) => (
        <span className={item.quantity <= item.reorderLevel ? 'text-red-600 font-medium' : ''}>
          {item.quantity} {item.unit || ''}
        </span>
      ),
    },
    { key: 'unitPrice', header: 'Unit Price', render: (item: any) => `$${item.unitPrice.toFixed(2)}` },
    { key: 'reorderLevel', header: 'Reorder Level' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingItem(item); setShowForm(true); }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setDeletingId(item.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button onClick={() => { setEditingItem(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="max-w-sm flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  categoryFilter === c
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <Table columns={columns} data={items} />
      </Card>

      {showForm && (
        <InventoryForm
          item={editingItem}
          onClose={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
