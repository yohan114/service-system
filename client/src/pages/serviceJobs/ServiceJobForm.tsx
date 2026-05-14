import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface ServiceJobFormProps {
  job?: any;
  onClose: () => void;
}

interface FormData {
  customerId: string;
  vehicleId: string;
  serviceDate: string;
  serviceType: string;
  technicianId: string;
  status: string;
  notes: string;
}

export default function ServiceJobForm({ job, onClose }: ServiceJobFormProps) {
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then((r) => r.data),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      customerId: job?.customerId?.toString() || '',
      vehicleId: job?.vehicleId?.toString() || '',
      serviceDate: job?.serviceDate ? new Date(job.serviceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      serviceType: job?.serviceType || '',
      technicianId: job?.technicianId?.toString() || '',
      status: job?.status || 'PENDING',
      notes: job?.notes || '',
    },
  });

  const selectedCustomerId = watch('customerId');

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', selectedCustomerId],
    queryFn: () => api.get('/vehicles', { params: { customerId: selectedCustomerId } }).then((r) => r.data),
    enabled: !!selectedCustomerId,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        customerId: parseInt(data.customerId),
        vehicleId: parseInt(data.vehicleId),
        technicianId: data.technicianId ? parseInt(data.technicianId) : null,
      };
      return job
        ? api.put(`/service-jobs/${job.id}`, payload)
        : api.post('/service-jobs', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-jobs'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal isOpen={true} onClose={onClose} title={job ? 'Edit Service Job' : 'New Service Job'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Customer"
          {...register('customerId', { required: 'Customer is required' })}
          error={errors.customerId?.message}
          options={customers.map((c: any) => ({ value: c.id.toString(), label: c.name }))}
        />
        <Select
          label="Vehicle"
          {...register('vehicleId', { required: 'Vehicle is required' })}
          error={errors.vehicleId?.message}
          options={vehicles.map((v: any) => ({
            value: v.id.toString(),
            label: `${v.registrationNumber} - ${v.brand || ''} ${v.model || ''}`.trim(),
          }))}
        />
        <Input
          label="Service Date"
          type="date"
          {...register('serviceDate', { required: 'Date is required' })}
          error={errors.serviceDate?.message}
        />
        <Input label="Service Type" {...register('serviceType')} placeholder="e.g., Oil Change, Full Service" />
        {job && (
          <Select
            label="Status"
            {...register('status')}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        )}
        <Input label="Notes" {...register('notes')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {job ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
