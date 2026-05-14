import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PDFDownloadLink } from '@react-pdf/renderer';
import api from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePDF from './InvoicePDF';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!invoice) return <div>Invoice not found</div>;

  const job = invoice.serviceJob;
  const items = job?.items || [];

  const groupedItems = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/invoices" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
          <p className="text-gray-500 text-sm">
            Issued: {format(new Date(invoice.issuedDate), 'MMMM dd, yyyy')}
          </p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
        <PDFDownloadLink
          document={<InvoicePDF invoice={invoice} />}
          fileName={`${invoice.invoiceNumber}.pdf`}
        >
          {({ loading }) => (
            <Button variant="primary" size="sm" disabled={loading}>
              <Download className="w-4 h-4 mr-1" /> {loading ? 'Generating...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Customer</h3>
            <p className="font-medium">{job?.customer?.name}</p>
            <p className="text-sm text-gray-600">{job?.customer?.phone}</p>
            <p className="text-sm text-gray-600">{job?.customer?.email}</p>
            <p className="text-sm text-gray-600">{job?.customer?.address}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Vehicle</h3>
            <p className="font-medium">{job?.vehicle?.registrationNumber}</p>
            <p className="text-sm text-gray-600">
              {job?.vehicle?.brand} {job?.vehicle?.model} {job?.vehicle?.year || ''}
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Service Items</h3>
          {Object.entries(groupedItems).map(([category, catItems]: [string, any]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">{category.replace(/_/g, ' ')}</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Item</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right">${item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 max-w-xs ml-auto space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal:</span><span>${(job?.subtotal || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Discount:</span><span>-${(job?.discount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax ({job?.taxRate || 0}%):</span><span>${(job?.taxAmount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total:</span><span>${(job?.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between"><span>Paid:</span><span>${(job?.paidAmount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between font-medium">
            <span>Balance:</span>
            <span className={(job?.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
              ${(job?.balanceAmount || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
