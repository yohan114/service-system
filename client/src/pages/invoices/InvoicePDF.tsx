import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e40af' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  section: { width: '48%' },
  sectionTitle: { fontSize: 9, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' },
  bold: { fontWeight: 'bold' },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '25%', textAlign: 'right' },
  categoryTitle: { fontSize: 10, fontWeight: 'bold', marginTop: 12, marginBottom: 6, color: '#374151' },
  totals: { marginTop: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb', alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', width: 200, paddingVertical: 3 },
  totalLabel: { width: 120 },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotal: { fontSize: 14, fontWeight: 'bold', marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#1e40af' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#9ca3af', fontSize: 8 },
});

interface InvoicePDFProps {
  invoice: any;
}

export default function InvoicePDF({ invoice }: InvoicePDFProps) {
  const job = invoice.serviceJob;
  const items = job?.items || [];

  const groupedItems = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ServicePro</Text>
          <Text style={styles.subtitle}>Invoice #{invoice.invoiceNumber}</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.bold}>{job?.customer?.name}</Text>
            <Text>{job?.customer?.phone || ''}</Text>
            <Text>{job?.customer?.email || ''}</Text>
            <Text>{job?.customer?.address || ''}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            <Text style={styles.bold}>{job?.vehicle?.registrationNumber}</Text>
            <Text>{job?.vehicle?.brand} {job?.vehicle?.model}</Text>
            <Text>Year: {job?.vehicle?.year || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Number</Text>
            <Text>{job?.jobNumber}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Issued</Text>
            <Text>{new Date(invoice.issuedDate).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.bold]}>Item</Text>
            <Text style={[styles.col2, styles.bold]}>Qty</Text>
            <Text style={[styles.col3, styles.bold]}>Price</Text>
            <Text style={[styles.col4, styles.bold]}>Total</Text>
          </View>

          {Object.entries(groupedItems).map(([category, catItems]: [string, any]) => (
            <View key={category}>
              <Text style={styles.categoryTitle}>{category.replace(/_/g, ' ')}</Text>
              {catItems.map((item: any) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.col1}>{item.name}</Text>
                  <Text style={styles.col2}>{item.quantity}</Text>
                  <Text style={styles.col3}>${item.unitPrice.toFixed(2)}</Text>
                  <Text style={styles.col4}>${item.totalPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${(job?.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={styles.totalValue}>-${(job?.discount || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({job?.taxRate || 0}%):</Text>
            <Text style={styles.totalValue}>${(job?.taxAmount || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${(job?.totalAmount || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Paid:</Text>
            <Text style={styles.totalValue}>${(job?.paidAmount || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance Due:</Text>
            <Text style={styles.totalValue}>${(job?.balanceAmount || 0).toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Thank you for your business!</Text>
      </Page>
    </Document>
  );
}
