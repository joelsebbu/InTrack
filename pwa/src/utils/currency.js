const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
});

export function formatINR(amount) {
  return inr.format(amount ?? 0);
}
