import React, { useState, useEffect, useRef } from 'react';
import { GymContext } from './GymContextObject';
import { formatPHP, toLocalISODate } from '../utils/formatters';

const API_BASE = '/api';

const DEFAULT_MEMBERS = [
  {
    id: 1,
    name: 'Amara Nkomo',
    email: 'amara.nkomo@gymfitness.local',
    phone: '+263 77 123 4567',
    dob: '1990-05-15',
    address: '123 Fitness Street, Harare',
    plan: 'Full Month',
    status: 'active',
    joined: '2026-05-20',
    fee: 'PHP 400',
    visitThisMonth: 14,
    totalVisits: 68,
    lastVisit: '2026-07-15 18:30',
    attendanceRate: '94%',
    nextPaymentDue: '2026-07-20',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 400 on 2026-06-20',
    paymentStatus: 'Paid',
    emergencyName: 'James Nkomo',
    emergencyRelation: 'Brother',
    emergencyPhone: '+263 77 123 4568',
    avatar: 'AN'
  },
  {
    id: 2,
    name: 'Tendai Moyo',
    email: 'tendai.moyo@gymfitness.local',
    phone: '+263 78 234 5678',
    dob: '1985-03-22',
    address: '456 Health Avenue, Bulawayo',
    plan: 'Daily',
    status: 'pending',
    joined: '2026-06-03',
    fee: 'PHP 50',
    visitThisMonth: 7,
    totalVisits: 18,
    lastVisit: '2026-07-14 07:00',
    attendanceRate: '78%',
    nextPaymentDue: '2026-07-18',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 50 on 2026-06-18',
    paymentStatus: 'Pending',
    emergencyName: 'Farai Moyo',
    emergencyRelation: 'Father',
    emergencyPhone: '+263 78 234 5679',
    avatar: 'TM'
  },
  {
    id: 3,
    name: 'Liam Chidyausiku',
    email: 'liam.chidyausiku@gymfitness.local',
    phone: '+263 71 345 6789',
    dob: '1992-07-08',
    address: '789 Power Lane, Mutare',
    plan: 'Half Month',
    status: 'inactive',
    joined: '2026-04-28',
    fee: 'PHP 250',
    visitThisMonth: 3,
    totalVisits: 36,
    lastVisit: '2026-07-04 05:45',
    attendanceRate: '52%',
    nextPaymentDue: '2026-07-05',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 250 on 2026-06-05',
    paymentStatus: 'Overdue',
    emergencyName: 'Sarah Chidyausiku',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 71 345 6790',
    avatar: 'LC'
  },
  {
    id: 4,
    name: 'Nadia Bvuma',
    email: 'nadia.bvuma@gymfitness.local',
    phone: '+263 79 456 7890',
    dob: '1988-09-12',
    address: '321 Zen Lane, Harare',
    plan: 'Full Month',
    status: 'active',
    joined: '2026-07-02',
    fee: 'PHP 400',
    visitThisMonth: 11,
    totalVisits: 42,
    lastVisit: '2026-07-15 08:00',
    attendanceRate: '91%',
    nextPaymentDue: '2026-08-15',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 400 on 2026-07-15',
    paymentStatus: 'Paid',
    emergencyName: 'David Bvuma',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+263 79 456 7891',
    avatar: 'NB'
  },
  {
    id: 5,
    name: 'Rudo Maseko',
    email: 'rudo.maseko@gymfitness.local',
    phone: '+263 73 567 8901',
    dob: '1995-11-02',
    address: '12 Wellness Road, Harare',
    plan: 'Half Month',
    status: 'active',
    joined: '2026-06-24',
    fee: 'PHP 250',
    visitThisMonth: 9,
    totalVisits: 24,
    lastVisit: '2026-07-16 06:15',
    attendanceRate: '86%',
    nextPaymentDue: '2026-07-16',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 250 on 2026-07-01',
    paymentStatus: 'Paid',
    emergencyName: 'Nyasha Maseko',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 73 567 8902',
    avatar: 'RM'
  },
  {
    id: 6,
    name: 'Kuda Nyathi',
    email: 'kuda.nyathi@gymfitness.local',
    phone: '+263 72 678 9012',
    dob: '1998-02-18',
    address: '88 Active Close, Bulawayo',
    plan: 'Daily',
    status: 'active',
    joined: '2026-07-10',
    fee: 'PHP 50',
    visitThisMonth: 4,
    totalVisits: 4,
    lastVisit: '2026-07-16 07:20',
    attendanceRate: '100%',
    nextPaymentDue: '2026-07-18',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 50 on 2026-07-17',
    paymentStatus: 'Paid',
    emergencyName: 'Tariro Nyathi',
    emergencyRelation: 'Mother',
    emergencyPhone: '+263 72 678 9013',
    avatar: 'KN'
  }
];
const DEFAULT_PAYMENTS = [
  {
    id: 1,
    memberId: 1,
    member: 'Amara Nkomo',
    plan: 'Full Month',
    amount: 'PHP 400',
    method: 'gcash',
    due: '2026-07-20',
    paid: '2026-06-20',
    paidISO: '2026-06-20',
    billingCycle: 'full month',
    coverageStart: '2026-06-20',
    coverageEnd: '2026-07-20',
    status: 'paid',
    invoice: '#182394',
    ref: 'GC-948190',
    notes: 'Full-month membership renewal'
  },
  {
    id: 2,
    memberId: 2,
    member: 'Tendai Moyo',
    plan: 'Daily',
    amount: 'PHP 50',
    method: 'cash',
    due: '2026-07-18',
    paid: '',
    paidISO: '',
    billingCycle: 'daily',
    coverageStart: '2026-07-17',
    coverageEnd: '2026-07-18',
    status: 'pending',
    invoice: '#492813',
    ref: '',
    notes: 'Awaiting counter payment'
  },
  {
    id: 3,
    memberId: 3,
    member: 'Liam Chidyausiku',
    plan: 'Half Month',
    amount: 'PHP 250',
    method: 'cash',
    due: '2026-07-05',
    paid: '',
    paidISO: '',
    billingCycle: 'half month',
    coverageStart: '2026-06-20',
    coverageEnd: '2026-07-05',
    status: 'overdue',
    invoice: '#238914',
    ref: '',
    notes: 'Cash payment not yet confirmed'
  },
  {
    id: 4,
    memberId: 4,
    member: 'Nadia Bvuma',
    plan: 'Full Month',
    amount: 'PHP 400',
    method: 'gcash',
    due: '2026-08-15',
    paid: '2026-07-15',
    paidISO: '2026-07-15',
    billingCycle: 'full month',
    coverageStart: '2026-07-15',
    coverageEnd: '2026-08-15',
    status: 'paid',
    invoice: '#774218',
    ref: 'GC-2983190',
    notes: 'Paid via GCash'
  },
  {
    id: 5,
    memberId: 5,
    member: 'Rudo Maseko',
    plan: 'Half Month',
    amount: 'PHP 250',
    method: 'gcash',
    due: '2026-07-16',
    paid: '2026-07-01',
    paidISO: '2026-07-01',
    billingCycle: 'half month',
    coverageStart: '2026-07-01',
    coverageEnd: '2026-07-16',
    status: 'paid',
    invoice: '#681245',
    ref: 'GC-554210',
    notes: 'Half-month membership renewal'
  },
  {
    id: 6,
    memberId: 6,
    member: 'Kuda Nyathi',
    plan: 'Daily',
    amount: 'PHP 50',
    method: 'cash',
    due: '2026-07-18',
    paid: '2026-07-17',
    paidISO: '2026-07-17',
    billingCycle: 'daily',
    coverageStart: '2026-07-17',
    coverageEnd: '2026-07-18',
    status: 'paid',
    invoice: '#915730',
    ref: 'CASH-0710',
    notes: 'Daily access payment'
  }
];

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




