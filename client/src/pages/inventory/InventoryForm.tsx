import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface InventoryFormProps {
  item?: any;
  onClose: () => void;
}

interface FormData {
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  reorderLevel: string;
  unit: string;
}

export default function InventoryForm({ item, onClose }: InventoryFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: item?.name || '',
      category: item?.category || 'OTHER',
      quantity: item?.quantity?.toString() || '0',
      unitPrice: item?.unitPrice?.toString() || '0',
      reorderLevel: item?.reorderLevel?.toString() || '0',
      unit: item?.unit || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        quantity: parseFloat(data.quantity),
        unitPrice: parseFloat(data.unitPrice),
        reorderLevel: parseFloat(data.reorderLevel),
      };
      return item
        ? api.put(`/inventory/${item.id}`, payload)
        : api.post('/inventory', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal isOpen={true} onClose={onClose} title={item ? 'Edit Item' : 'Add Item'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <Select
          label="Category"
          {...register('category')}
          options={[
            { value: 'FILTER', label: 'Filter' },
            { value: 'OIL', label: 'Oil' },
            { value: 'SPARE_PART', label: 'Spare Part' },
            { value: 'OTHER', label: 'Other' },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            step="0.01"
            {...register('quantity', { required: 'Required' })}
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Reorder Level"
            type="number"
            step="0.01"
            {...register('reorderLevel')}
          />
          <Input label="Unit" {...register('unit')} placeholder="e.g., liters, pcs" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {item ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
