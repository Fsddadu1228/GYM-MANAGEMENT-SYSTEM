export function formatDisplayDate(dateValue, fallback = 'Not set') {
  if (!dateValue) return fallback;
  if (typeof dateValue === 'string') {
    const isoMatch = dateValue.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return fallback;
  return toLocalISODate(date);
}

export function toLocalISODate(dateValue = new Date()) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDisplayDate(dateValue, fallback = 'Not set') {
  return formatDisplayDate(dateValue, fallback);
}

export function parseCurrencyAmount(value) {
  return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
}

export function formatPHP(value, fallback = 'PHP 0') {
  const amount = parseCurrencyAmount(value);
  if (!amount && (value === null || value === undefined || value === '')) return fallback;
  return `PHP ${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}
