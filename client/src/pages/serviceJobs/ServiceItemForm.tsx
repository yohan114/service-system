import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface ServiceItemFormProps {
  jobId: number;
  item?: any;
  onClose: () => void;
}

interface FormData {
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  inventoryItemId: string;
}

export default function ServiceItemForm({ jobId, item, onClose }: ServiceItemFormProps) {
  const queryClient = useQueryClient();

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory').then((r) => r.data),
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: item?.name || '',
      category: item?.category || 'LABOR',
      quantity: item?.quantity?.toString() || '1',
      unitPrice: item?.unitPrice?.toString() || '0',
      inventoryItemId: item?.inventoryItemId?.toString() || '',
    },
  });

  const category = watch('category');
  const inventoryItemId = watch('inventoryItemId');

  useEffect(() => {
    if (inventoryItemId && category !== 'LABOR') {
      const invItem = inventoryItems.find((i: any) => i.id.toString() === inventoryItemId);
      if (invItem) {
        setValue('name', invItem.name);
        setValue('unitPrice', invItem.unitPrice.toString());
      }
    }
  }, [inventoryItemId, inventoryItems, setValue, category]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        name: data.name,
        category: data.category,
        quantity: parseFloat(data.quantity),
        unitPrice: parseFloat(data.unitPrice),
        inventoryItemId: data.inventoryItemId ? parseInt(data.inventoryItemId) : null,
      };
      return item
        ? api.put(`/service-jobs/${jobId}/items/${item.id}`, payload)
        : api.post(`/service-jobs/${jobId}/items`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-job', jobId] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  const filteredInventory = inventoryItems.filter((i: any) => {
    if (category === 'LABOR') return false;
    if (category === 'OTHER') return true;
    return i.category === category;
  });

  return (
    <Modal isOpen={true} onClose={onClose} title={item ? 'Edit Item' : 'Add Item'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Category"
          {...register('category')}
          options={[
            { value: 'LABOR', label: 'Labor' },
            { value: 'FILTER', label: 'Filter' },
            { value: 'OIL', label: 'Oil' },
            { value: 'SPARE_PART', label: 'Spare Part' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
        {category !== 'LABOR' && filteredInventory.length > 0 && (
          <Select
            label="From Inventory (optional)"
            {...register('inventoryItemId')}
            options={filteredInventory.map((i: any) => ({
              value: i.id.toString(),
              label: `${i.name} (Stock: ${i.quantity})`,
            }))}
          />
        )}
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            step="0.01"
            {...register('quantity', { required: 'Required', min: { value: 0.01, message: 'Must be > 0' } })}
            error={errors.quantity?.message}
          />
          <Input
            label="Unit Price"
            type="number"
            step="0.01"
            {...register('unitPrice', { required: 'Required' })}
            error={errors.unitPrice?.message}
          />
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <span className="text-gray-600">Total: </span>
          <span className="font-medium">
            ${((parseFloat(watch('quantity') || '0') * parseFloat(watch('unitPrice') || '0')) || 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {item ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
