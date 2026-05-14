import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Edit } from 'lucide-react';
import UserForm from './UserForm';

export default function UserList() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const columns = [
    { key: 'username', header: 'Username' },
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
    { key: 'email', header: 'Email', render: (item: any) => item.email || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <button
          onClick={() => { setEditingUser(item); setShowForm(true); }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </button>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => { setEditingUser(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <Card>
        <div className="mb-4 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users..." />
        </div>
        <Table columns={columns} data={users} />
      </Card>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
