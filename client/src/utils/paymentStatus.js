import { toLocalISODate } from './formatters';

export function getPaymentDueISO(payment) {
  return toLocalISODate(payment?.coverageEnd || payment?.dueISO || payment?.due || '');
}

export function getDerivedPaymentStatus(payment, todayISO = toLocalISODate()) {
  const storedStatus = String(payment?.status || 'pending').toLowerCase();
  if (storedStatus === 'paid') return 'paid';
  if (storedStatus === 'overdue') return 'overdue';

  const dueISO = getPaymentDueISO(payment);
  return dueISO && dueISO < todayISO ? 'overdue' : 'pending';
}

export function hasUnresolvedOverduePayment(memberId, payments, todayISO = toLocalISODate()) {
  const linkedPayments = payments.filter((payment) => payment.memberId === memberId);
  const latestPaidISO = linkedPayments
    .filter((payment) => getDerivedPaymentStatus(payment, todayISO) === 'paid')
    .map((payment) => toLocalISODate(payment.paidISO || payment.createdAt || ''))
    .filter(Boolean)
    .sort()
    .at(-1) || '';

  return linkedPayments.some((payment) => {
    if (getDerivedPaymentStatus(payment, todayISO) !== 'overdue') return false;
    const overdueISO = getPaymentDueISO(payment);
    return !latestPaidISO || !overdueISO || overdueISO > latestPaidISO;
  });
}
