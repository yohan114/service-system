import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ServiceItemForm from './ServiceItemForm';
import CostSummary from './CostSummary';

export default function ServiceJobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id!);
  const queryClient = useQueryClient();
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['service-job', jobId],
    queryFn: () => api.get(`/service-jobs/${jobId}`).then((r) => r.data),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: number) => api.delete(`/service-jobs/${jobId}/items/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-job', jobId] });
      setDeletingItemId(null);
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!job) return <div>Job not found</div>;

  const groupedItems = (job.items || []).reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/service-jobs" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{job.jobNumber}</h1>
          <p className="text-gray-500 text-sm">
            {format(new Date(job.serviceDate), 'MMMM dd, yyyy')}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
          <p className="font-medium">{job.customer?.name}</p>
          <p className="text-sm text-gray-500">{job.customer?.phone}</p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicle</h3>
          <p className="font-medium">{job.vehicle?.registrationNumber}</p>
          <p className="text-sm text-gray-500">
            {job.vehicle?.brand} {job.vehicle?.model}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Service Info</h3>
          <p className="font-medium">{job.serviceType || 'General Service'}</p>
          <p className="text-sm text-gray-500">Tech: {job.technician?.name || 'Unassigned'}</p>
        </Card>
      </div>

      {/* Service Items */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Service Items</h3>
          <Button size="sm" onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No items added yet</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-600 mb-2">
                  {category.replace(/_/g, ' ')}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-4">Name</th>
                        <th className="text-right py-2 px-4">Qty</th>
                        <th className="text-right py-2 px-4">Unit Price</th>
                        <th className="text-right py-2 px-4">Total</th>
                        <th className="text-right py-2 pl-4 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: any) => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4">{item.name}</td>
                          <td className="py-2 px-4 text-right">{item.quantity}</td>
                          <td className="py-2 px-4 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right font-medium">${item.totalPrice.toFixed(2)}</td>
                          <td className="py-2 pl-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit className="w-3.5 h-3.5 text-gray-600" />
                              </button>
                              <button
                                onClick={() => setDeletingItemId(item.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CostSummary job={job} />

      {showItemForm && (
        <ServiceItemForm
          jobId={jobId}
          item={editingItem}
          onClose={() => setShowItemForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={deletingItemId !== null}
        onClose={() => setDeletingItemId(null)}
        onConfirm={() => deletingItemId && deleteItemMutation.mutate(deletingItemId)}
        title="Remove Item"
        message="Are you sure you want to remove this item?"
        confirmLabel="Remove"
        loading={deleteItemMutation.isPending}
      />
    </div>
  );
}
