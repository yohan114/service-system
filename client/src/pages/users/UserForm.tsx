import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface UserFormProps {
  user?: any;
  onClose: () => void;
}

interface FormData {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
}

export default function UserForm({ user, onClose }: UserFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      username: user?.username || '',
      password: '',
      name: user?.name || '',
      email: user?.email || '',
      role: user?.role || 'STAFF',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      if (user) {
        return api.put(`/users/${user.id}`, payload);
      }
      return api.post('/auth/register', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Modal isOpen={true} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Username"
          {...register('username', { required: 'Username is required' })}
          error={errors.username?.message}
          disabled={!!user}
        />
        <Input
          label="Password"
          type="password"
          {...register('password', {
            required: user ? false : 'Password is required',
            minLength: { value: 6, message: 'Min 6 characters' },
          })}
          error={errors.password?.message}
          placeholder={user ? 'Leave blank to keep current' : ''}
        />
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message}
        />
        <Input label="Email" type="email" {...register('email')} />
        <Select
          label="Role"
          {...register('role')}
          options={[
            { value: 'ADMIN', label: 'Admin' },
            { value: 'STAFF', label: 'Staff' },
            { value: 'CASHIER', label: 'Cashier' },
          ]}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {user ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
