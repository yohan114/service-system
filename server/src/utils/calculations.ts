export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calculateJobTotals(items: { totalPrice: number }[], discount: number, taxRate: number, paidAmount: number) {
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100;
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount - discount) * 100) / 100;
  const balanceAmount = Math.round((totalAmount - paidAmount) * 100) / 100;

  return {
    subtotal,
    taxAmount,
    totalAmount,
    balanceAmount,
  };
}
