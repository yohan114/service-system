import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface VehicleFormProps {
  vehicle?: any;
  onClose: () => void;
}

interface FormData {
  registrationNumber: string;
  model: string;
  brand: string;
  year: string;
  mileageOrHours: string;
  type: string;
  customerId: string;
  notes: string;
}

export default function VehicleForm({ vehicle, onClose }: VehicleFormProps) {
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      registrationNumber: vehicle?.registrationNumber || '',
      model: vehicle?.model || '',
      brand: vehicle?.brand || '',
      year: vehicle?.year?.toString() || '',
      mileageOrHours: vehicle?.mileageOrHours?.toString() || '',
      type: vehicle?.type || 'VEHICLE',
      customerId: vehicle?.customerId?.toString() || '',
      notes: vehicle?.notes || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        year: data.year ? parseInt(data.year) : null,
        mileageOrHours: data.mileageOrHours ? parseFloat(data.mileageOrHours) : null,
        customerId: parseInt(data.customerId),
      };
      return vehicle
        ? api.put(`/vehicles/${vehicle.id}`, payload)
        : api.post('/vehicles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal isOpen={true} onClose={onClose} title={vehicle ? 'Edit Vehicle' : 'Add Vehicle'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Customer"
          {...register('customerId', { required: 'Customer is required' })}
          error={errors.customerId?.message}
          options={customers.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
        />
        <Input
          label="Registration Number"
          {...register('registrationNumber', { required: 'Registration is required' })}
          error={errors.registrationNumber?.message}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Brand" {...register('brand')} />
          <Input label="Model" {...register('model')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Year" type="number" {...register('year')} />
          <Input label="Mileage/Hours" type="number" {...register('mileageOrHours')} />
        </div>
        <Select
          label="Type"
          {...register('type')}
          options={[
            { value: 'VEHICLE', label: 'Vehicle' },
            { value: 'EQUIPMENT', label: 'Equipment' },
          ]}
        />
        <Input label="Notes" {...register('notes')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {vehicle ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
