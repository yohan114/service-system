import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Wrench, Clock, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Jobs</p>
              <p className="text-2xl font-bold">{data?.todaysJobs ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold">{data?.pendingJobs ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold">{data?.completedJobs ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold">${(data?.revenue ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Low Stock Alerts
          </h2>
          {data?.lowStockItems?.length > 0 ? (
            <ul className="space-y-2">
              {data.lowStockItems.map((item: any) => (
                <li key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-red-600 font-medium">
                    {item.quantity} / {item.reorderLevel}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No low stock alerts</p>
          )}
        </Card>

        {/* Recent Service Jobs */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Service Jobs</h2>
          {data?.recentJobs?.length > 0 ? (
            <ul className="space-y-2">
              {data.recentJobs.map((job: any) => (
                <li key={job.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <Link to={`/service-jobs/${job.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {job.jobNumber}
                    </Link>
                    <p className="text-xs text-gray-500">{job.customer?.name}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent jobs</p>
          )}
        </Card>
      </div>
    </div>
  );
}
