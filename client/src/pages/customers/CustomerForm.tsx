import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface CustomerFormProps {
  customer?: any;
  onClose: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export default function CustomerForm({ customer, onClose }: CustomerFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      address: customer?.address || '',
      notes: customer?.notes || '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      customer
        ? api.put(`/customers/${customer.id}`, data)
        : api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal isOpen={true} onClose={onClose} title={customer ? 'Edit Customer' : 'Add Customer'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <Input label="Phone" {...register('phone')} />
        <Input label="Email" type="email" {...register('email')} />
        <Input label="Address" {...register('address')} />
        <Input label="Notes" {...register('notes')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {customer ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
