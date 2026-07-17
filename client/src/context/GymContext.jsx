import React, { useState, useEffect, useRef } from 'react';
import { GymContext } from './GymContextObject';
import { formatPHP, toLocalISODate } from '../utils/formatters';
import defaultData from '../data/defaultData.json';

const API_BASE = '/api';

const DEFAULT_MEMBERS = defaultData.members;
const DEFAULT_PAYMENTS = defaultData.payments;

function getInitials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function toISODate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return toLocalISODate();
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

  if (/\b(day|daily)\b/.test(normalizedPlan)) {
    return { label: 'daily', days: 1 };
  }
  if (/\b(half|half\s*month|15\s*day)\b/.test(normalizedPlan)) {
    return { label: 'half month', days: 15 };
  }
  if (/\b(full|full\s*month|month|monthly)\b/.test(normalizedPlan)) {
    return { label: 'full month', months: 1 };
  }
  if (/\b(week|weekly)\b/.test(normalizedPlan)) {
    return { label: 'weekly', days: 7 };
  }
  if (/\b(quarter|quarterly|3\s*month)\b/.test(normalizedPlan)) {
    return { label: 'quarterly', months: 3 };
  }
  if (/\b(semiannual|semi-annual|6\s*month)\b/.test(normalizedPlan)) {
    return { label: 'semiannual', months: 6 };
  }
  if (/\b(year|yearly|annual|annually|12\s*month)\b/.test(normalizedPlan)) {
    return { label: 'yearly', months: 12 };
  }

  return { label: 'monthly', months: 1 };
}

function getPlanFee(plan = '') {
  const normalizedPlan = plan.toLowerCase();
  if (/\b(day|daily)\b/.test(normalizedPlan)) return 'PHP 50';
  if (/\b(half|half\s*month|15\s*day)\b/.test(normalizedPlan)) return 'PHP 250';
  return 'PHP 400';
}

function getNextPaymentDue(fromDate = new Date(), plan = '') {
  const billingCycle = getPlanBillingCycle(plan);
  const nextDueDate = billingCycle.days
    ? addDays(fromDate, billingCycle.days)
    : addMonths(fromDate, billingCycle.months);
  return toISODate(nextDueDate);
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
    memberId: member?.id ?? payment.memberId ?? null,
    member: member?.name || payment.member || '',
    plan,
    paidISO,
    paid: payment.paid || formatShortDate(paidISO),
    due: formatShortDate(coverageEnd),
    billingCycle: billingCycle.label,
    coverageStart: paidISO,
    coverageEnd
  };
}

async function requestJson(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

function readStoredList(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export const GymProvider = ({ children, authToken }) => {
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const useApiRef = useRef(false);

  // Initialize data
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [apiMembers, apiPayments] = await Promise.all([
          requestJson('/members', authToken),
          requestJson('/payments', authToken)
        ]);

        if (!isMounted) return;
        useApiRef.current = true;
        setMembers(apiMembers);
        setPayments(apiPayments);
      } catch (err) {
        console.warn('API unavailable, using local storage fallback:', err.message);

        const storedMembers = readStoredList('gym_members', DEFAULT_MEMBERS);
        const storedPayments = readStoredList('gym_payments', DEFAULT_PAYMENTS);

        localStorage.setItem('gym_members', JSON.stringify(storedMembers));
        localStorage.setItem('gym_payments', JSON.stringify(storedPayments));

        if (!isMounted) return;
        useApiRef.current = false;
        setMembers(storedMembers);
        setPayments(storedPayments);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  // Save changes helper
  const updateMembersList = (newList) => {
    setMembers(newList);
    if (!useApiRef.current) {
      localStorage.setItem('gym_members', JSON.stringify(newList));
    }
  };

  const updatePaymentsList = (newList) => {
    setPayments(newList);
    if (!useApiRef.current) {
      localStorage.setItem('gym_payments', JSON.stringify(newList));
    }
  };

  // CRUD Operations
  const addMember = async (memberData) => {
    const nextId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
    const todayStr = toLocalISODate();
    const newMember = {
      id: nextId,
      ...memberData,
      joined: todayStr,
      avatar: getInitials(memberData.name),
      fee: getPlanFee(memberData.plan),
      visitThisMonth: 0,
      totalVisits: 0,
      lastVisit: '-',
      attendanceRate: '0%',
      nextPaymentDue: getNextPaymentDue(todayStr, memberData.plan),
      paymentMethod: 'Cash',
      lastPayment: '-',
      paymentStatus: memberData.status === 'active' ? 'Paid' : 'Pending'
    };
    if (useApiRef.current) {
      try {
        const { id: _id, ...memberPayload } = newMember;
        const createdMember = await requestJson('/members', authToken, {
          method: 'POST',
          body: JSON.stringify(memberPayload)
        });
        updateMembersList([...members, createdMember]);
        return createdMember;
      } catch (err) {
        console.error('Failed to add member:', err);
        return null;
      }
    }

    updateMembersList([...members, newMember]);
    return newMember;
  };

  const updateMember = async (id, updatedFields) => {
    const existingMember = members.find((m) => m.id === id);
    const shouldRenamePayments = Boolean(
      updatedFields.name &&
      existingMember &&
      updatedFields.name !== existingMember.name
    );
    const newList = members.map((m) => {
      if (m.id === id) {
        const merged = { ...m, ...updatedFields };
        merged.avatar = getInitials(merged.name);
        merged.fee = getPlanFee(merged.plan);
        return merged;
      }
      return m;
    });
    const updatedMember = newList.find((m) => m.id === id);

    if (useApiRef.current && updatedMember) {
      try {
        const savedMember = await requestJson(`/members/${id}`, authToken, {
          method: 'PUT',
          body: JSON.stringify(updatedMember)
        });
        updateMembersList(newList.map((m) => (m.id === id ? savedMember : m)));
        if (shouldRenamePayments) {
          const renamedPayments = payments.map((payment) => (
            payment.memberId === id ? { ...payment, member: savedMember.name } : payment
          ));
          updatePaymentsList(renamedPayments);
        }
        return savedMember;
      } catch (err) {
        console.error('Failed to update member:', err);
        return null;
      }
    }

    updateMembersList(newList);
    if (updatedMember && shouldRenamePayments) {
      const renamedPayments = payments.map((payment) => (
        payment.memberId === id ? { ...payment, member: updatedMember.name } : payment
      ));
      updatePaymentsList(renamedPayments);
    }
    return updatedMember || null;
  };

  const deleteMember = async (id) => {
    if (useApiRef.current) {
      try {
        await requestJson(`/members/${id}`, authToken, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete member:', err);
        return false;
      }
    }

    const newList = members.filter(m => m.id !== id);
    updateMembersList(newList);
    // Optionally clean up payments as well, but standard behavior keeps financial history
    return true;
  };

  const syncMemberPaymentInfo = async (payment) => {
    const memberToUpdate = members.find((m) => m.id === payment.memberId) || members.find((m) => m.name === payment.member);
    if (!memberToUpdate) return;

    const paidDate = payment.paidISO ? new Date(payment.paidISO) : new Date();
    const nextPaymentDue = payment.coverageEnd || getNextPaymentDue(paidDate, payment.plan || memberToUpdate.plan);
    await updateMember(memberToUpdate.id, {
      paymentMethod: payment.method,
      lastPayment: `${formatPHP(payment.amount)} on ${payment.paid}`,
      paymentStatus: 'Paid',
      nextPaymentDue
    });
  };

  const recordPayment = async (paymentData) => {
    const nextId = payments.length > 0 ? Math.max(...payments.map(p => p.id)) + 1 : 1;
    const selectedMember = members.find((m) => m.id === paymentData.memberId) || members.find((m) => m.name === paymentData.member);
    const newPayment = buildRenewalDetails({
      id: nextId,
      invoice: `#${Math.floor(Math.random() * 900000) + 100000}`,
      status: 'paid',
      ...paymentData
    }, selectedMember);

    if (useApiRef.current) {
      try {
        const { id: _id, ...paymentPayload } = newPayment;
        const createdPayment = await requestJson('/payments', authToken, {
          method: 'POST',
          body: JSON.stringify(paymentPayload)
        });
        updatePaymentsList([...payments, createdPayment]);
        await syncMemberPaymentInfo(createdPayment);
        return createdPayment;
      } catch (err) {
        console.error('Failed to record payment:', err);
        return null;
      }
    }

    updatePaymentsList([...payments, newPayment]);
    await syncMemberPaymentInfo(newPayment);
    return newPayment;
  };

  const updatePayment = async (id, updatedFields) => {
    const newList = payments.map((p) => {
      if (p.id === id) {
        const selectedMember = members.find((m) => m.id === updatedFields.memberId) || members.find((m) => m.name === updatedFields.member);
        return buildRenewalDetails({ ...p, ...updatedFields, status: 'paid' }, selectedMember);
      }
      return p;
    });

    const updatedPayment = newList.find((p) => p.id === id);

    if (useApiRef.current && updatedPayment) {
      try {
        const savedPayment = await requestJson(`/payments/${id}`, authToken, {
          method: 'PUT',
          body: JSON.stringify(updatedPayment)
        });
        updatePaymentsList(newList.map((p) => (p.id === id ? savedPayment : p)));
        await syncMemberPaymentInfo(savedPayment);
        return savedPayment;
      } catch (err) {
        console.error('Failed to update payment:', err);
        return null;
      }
    }

    updatePaymentsList(newList);
    if (updatedPayment) await syncMemberPaymentInfo(updatedPayment);
    return updatedPayment || null;
  };

  const deletePayment = async (id) => {
    if (useApiRef.current) {
      try {
        await requestJson(`/payments/${id}`, authToken, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete payment:', err);
        return false;
      }
    }

    updatePaymentsList(payments.filter((payment) => payment.id !== id));
    return true;
  };

  return (
    <GymContext.Provider value={{
      members,
      payments,
      loading,
      addMember,
      updateMember,
      deleteMember,
      recordPayment,
      updatePayment,
      deletePayment
    }}>
      {!loading && children}
    </GymContext.Provider>
  );
};




