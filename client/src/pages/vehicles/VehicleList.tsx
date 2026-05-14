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
import VehicleForm from './VehicleForm';

export default function VehicleList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', search],
    queryFn: () => api.get('/vehicles', { params: { search } }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setDeletingId(null);
    },
  });

  const columns = [
    { key: 'registrationNumber', header: 'Registration' },
    { key: 'brand', header: 'Brand', render: (item: any) => item.brand || '-' },
    { key: 'model', header: 'Model', render: (item: any) => item.model || '-' },
    { key: 'year', header: 'Year', render: (item: any) => item.year || '-' },
    { key: 'type', header: 'Type' },
    { key: 'customer', header: 'Customer', render: (item: any) => item.customer?.name || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingVehicle(item); setShowForm(true); }}
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
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <Button onClick={() => { setEditingVehicle(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      <Card>
        <div className="mb-4 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search vehicles..." />
        </div>
        <Table columns={columns} data={vehicles} />
      </Card>

      {showForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onClose={() => setShowForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
