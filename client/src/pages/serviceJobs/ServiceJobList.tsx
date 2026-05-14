import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/ui/SearchBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Plus, Eye } from 'lucide-react';
import ServiceJobForm from './ServiceJobForm';
import { format } from 'date-fns';

const statuses = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED'];

export default function ServiceJobList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['service-jobs', search, statusFilter],
    queryFn: () =>
      api
        .get('/service-jobs', {
          params: {
            search: search || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
          },
        })
        .then((r) => r.data),
  });

  const columns = [
    {
      key: 'jobNumber',
      header: 'Job #',
      render: (item: any) => (
        <Link to={`/service-jobs/${item.id}`} className="text-blue-600 font-medium hover:underline">
          {item.jobNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (item: any) => item.customer?.name || '-' },
    { key: 'vehicle', header: 'Vehicle', render: (item: any) => item.vehicle?.registrationNumber || '-' },
    { key: 'serviceDate', header: 'Date', render: (item: any) => format(new Date(item.serviceDate), 'MMM dd, yyyy') },
    { key: 'status', header: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'totalAmount', header: 'Total', render: (item: any) => `$${(item.totalAmount || 0).toFixed(2)}` },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Link to={`/service-jobs/${item.id}`} className="p-1 hover:bg-gray-100 rounded inline-flex">
          <Eye className="w-4 h-4 text-gray-600" />
        </Link>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Service Jobs</h1>
        <Button onClick={() => { setEditingJob(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Job
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="max-w-sm flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search jobs..." />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <Table columns={columns} data={jobs} />
      </Card>

      {showForm && (
        <ServiceJobForm
          job={editingJob}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
