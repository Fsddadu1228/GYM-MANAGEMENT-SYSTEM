function toISODate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return toISODate(new Date());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addMonths(dateValue, monthCount) {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  const day = date.getDate();
  date.setMonth(date.getMonth() + monthCount, 1);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDayOfTargetMonth));
  return date;
}

function addDays(dateValue, dayCount) {
  const date = dateValue instanceof Date ? new Date(dateValue) : new Date(dateValue);
  date.setDate(date.getDate() + dayCount);
  return date;
}

function getPlanBillingCycle(plan = '') {
  const normalizedPlan = plan.toLowerCase();

  if (/\b(day|daily)\b/.test(normalizedPlan)) return { label: 'daily', days: 1 };
  if (/\b(half|half\s*month|15\s*day)\b/.test(normalizedPlan)) return { label: 'half month', days: 15 };
  if (/\b(full|full\s*month|month|monthly)\b/.test(normalizedPlan)) return { label: 'full month', months: 1 };
  if (/\b(week|weekly)\b/.test(normalizedPlan)) return { label: 'weekly', days: 7 };
  if (/\b(quarter|quarterly|3\s*month)\b/.test(normalizedPlan)) return { label: 'quarterly', months: 3 };
  if (/\b(semiannual|semi-annual|6\s*month)\b/.test(normalizedPlan)) return { label: 'semiannual', months: 6 };
  if (/\b(year|yearly|annual|annually|12\s*month)\b/.test(normalizedPlan)) return { label: 'yearly', months: 12 };

  return { label: 'monthly', months: 1 };
}

function getNextPaymentDue(fromDate = new Date(), plan = '') {
  const billingCycle = getPlanBillingCycle(plan);
  const nextDueDate = billingCycle.days
    ? addDays(fromDate, billingCycle.days)
    : addMonths(fromDate, billingCycle.months);
  return toISODate(nextDueDate);
}

function formatPHP(value) {
  const amount = Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
  return `PHP ${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

function formatShortDate(dateValue) {
  return toISODate(dateValue);
}

function buildRenewalDetails(payment, member) {
  const paidISO = payment.paidISO || toISODate(new Date());
  const plan = payment.plan || member?.plan || 'Full Month';
  const billingCycle = getPlanBillingCycle(plan);
  const coverageEnd = getNextPaymentDue(paidISO, plan);

  return {
    ...payment,
    amount: formatPHP(payment.amount),
    plan,
    paidISO,
    paid: payment.paid || formatShortDate(paidISO),
    due: formatShortDate(coverageEnd),
    billingCycle: billingCycle.label,
    coverageStart: paidISO,
    coverageEnd
  };
}

module.exports = {
  buildRenewalDetails,
  getNextPaymentDue
};
