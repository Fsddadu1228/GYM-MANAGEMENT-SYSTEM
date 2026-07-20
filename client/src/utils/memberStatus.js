import { toLocalISODate } from './formatters';

export function isExpiredMember(member, todayISO = toLocalISODate()) {
  if (!member?.nextPaymentDue) return false;
  const dueISO = toLocalISODate(member.nextPaymentDue);
  return Boolean(dueISO && dueISO < todayISO);
}

export function getDerivedMemberStatus(member, todayISO = toLocalISODate()) {
  if (isExpiredMember(member, todayISO)) return 'inactive';
  return String(member?.status || 'pending').toLowerCase();
}

export function getDerivedMemberStatusLabel(member, todayISO = toLocalISODate()) {
  const status = getDerivedMemberStatus(member, todayISO);
  if (status === 'inactive' && isExpiredMember(member, todayISO)) return 'Expired';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getMemberDueInfo(member, todayISO = toLocalISODate()) {
  if (!member?.nextPaymentDue) return null;
  const dueDate = new Date(`${toLocalISODate(member.nextPaymentDue)}T00:00:00`);
  if (Number.isNaN(dueDate.getTime())) return null;
  const today = new Date(`${todayISO}T00:00:00`);
  const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  return { dueDate, days };
}
