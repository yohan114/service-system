import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/ui/SearchBar';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

const statuses = ['ALL', 'DRAFT', 'ISSUED', 'PAID', 'OVERDUE'];

export default function InvoiceList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: () =>
      api
        .get('/invoices', {
          params: {
            search: search || undefined,
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
          },
        })
        .then((r) => r.data),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (item: any) => (
        <Link to={`/invoices/${item.id}`} className="text-blue-600 font-medium hover:underline">
          {item.invoiceNumber}
        </Link>
      ),
    },
    { key: 'jobNumber', header: 'Job #', render: (item: any) => item.serviceJob?.jobNumber || '-' },
    { key: 'customer', header: 'Customer', render: (item: any) => item.serviceJob?.customer?.name || '-' },
    { key: 'issuedDate', header: 'Issued', render: (item: any) => format(new Date(item.issuedDate), 'MMM dd, yyyy') },
    { key: 'status', header: 'Status', render: (item: any) => <StatusBadge status={item.status} /> },
    { key: 'total', header: 'Total', render: (item: any) => `$${(item.serviceJob?.totalAmount || 0).toFixed(2)}` },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <Link to={`/invoices/${item.id}`} className="p-1 hover:bg-gray-100 rounded inline-flex">
          <Eye className="w-4 h-4 text-gray-600" />
        </Link>
      ),
    },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>

      <Card>
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <div className="max-w-sm flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search invoices..." />
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
                {s}
              </button>
            ))}
          </div>
        </div>
        <Table columns={columns} data={invoices} />
      </Card>
    </div>
  );
}
