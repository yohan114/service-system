import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Input } from '../../components/ui/Input';

const tabs = ['Summary', 'Income', 'Labor', 'Parts Usage'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('Summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="flex gap-1 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="w-40">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'Summary' && <SummaryReport startDate={startDate} endDate={endDate} />}
      {activeTab === 'Income' && <IncomeReport startDate={startDate} endDate={endDate} />}
      {activeTab === 'Labor' && <LaborReport startDate={startDate} endDate={endDate} />}
      {activeTab === 'Parts Usage' && <PartsReport startDate={startDate} endDate={endDate} />}
    </div>
  );
}

function SummaryReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'summary', startDate, endDate],
    queryFn: () => api.get('/reports/summary', { params: { startDate, endDate } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Summary Report</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold">{data?.totalJobs ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">${(data?.totalRevenue ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Average Job Value</p>
          <p className="text-2xl font-bold">${(data?.averageJobValue ?? 0).toFixed(2)}</p>
        </div>
      </div>
    </Card>
  );
}

function IncomeReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'income', startDate, endDate],
    queryFn: () => api.get('/reports/income', { params: { startDate, endDate } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Income Report</h3>
      <div className="space-y-2">
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium text-gray-600">Total Income</span>
          <span className="font-bold">${(data?.totalIncome ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2 border-b">
          <span className="font-medium text-gray-600">Total Paid</span>
          <span className="font-bold text-green-600">${(data?.totalPaid ?? 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="font-medium text-gray-600">Outstanding</span>
          <span className="font-bold text-red-600">${(data?.outstanding ?? 0).toFixed(2)}</span>
        </div>
      </div>
    </Card>
  );
}

function LaborReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'labor', startDate, endDate],
    queryFn: () => api.get('/reports/labor', { params: { startDate, endDate } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Labor Report</h3>
      {data?.laborItems?.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Service</th>
              <th className="text-right py-2">Hours</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.laborItems.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No labor data for this period</p>
      )}
    </Card>
  );
}

function PartsReport({ startDate, endDate }: { startDate: string; endDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'parts-usage', startDate, endDate],
    queryFn: () => api.get('/reports/parts-usage', { params: { startDate, endDate } }).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Parts Usage Report</h3>
      {data?.items?.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Part</th>
              <th className="text-left py-2">Category</th>
              <th className="text-right py-2">Qty Used</th>
              <th className="text-right py-2">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.category?.replace(/_/g, ' ')}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No parts data for this period</p>
      )}
    </Card>
  );
}
