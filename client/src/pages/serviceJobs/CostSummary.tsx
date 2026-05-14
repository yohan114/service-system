import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';

interface CostSummaryProps {
  job: any;
}

export default function CostSummary({ job }: CostSummaryProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/service-jobs/${job.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-job', job.id] });
    },
  });

  const handleUpdate = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMutation.mutate({ [field]: numValue });
  };

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${(job.subtotal || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Discount</span>
          <input
            type="number"
            step="0.01"
            defaultValue={job.discount || 0}
            onBlur={(e) => handleUpdate('discount', e.target.value)}
            className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tax Rate (%)</span>
          <input
            type="number"
            step="0.01"
            defaultValue={job.taxRate || 0}
            onBlur={(e) => handleUpdate('taxRate', e.target.value)}
            className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tax Amount</span>
          <span className="font-medium">${(job.taxAmount || 0).toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg">${(job.totalAmount || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Paid Amount</span>
          <input
            type="number"
            step="0.01"
            defaultValue={job.paidAmount || 0}
            onBlur={(e) => handleUpdate('paidAmount', e.target.value)}
            className="w-24 text-right border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Balance</span>
          <span className={`font-medium ${(job.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ${(job.balanceAmount || 0).toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
