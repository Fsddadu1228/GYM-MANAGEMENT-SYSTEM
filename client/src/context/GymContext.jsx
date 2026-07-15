import React, { useState, useEffect, useRef } from 'react';
import { GymContext } from './GymContextObject';

const API_BASE = '/api';

const DEFAULT_MEMBERS = [
  {
    id: 1,
    name: 'Amara Nkomo',
    specialty: 'Fitness Coach',
    email: 'amara@example.com',
    phone: '+263 77 123 4567',
    dob: '1990-05-15',
    address: '123 Fitness St, Harare, Zimbabwe',
    plan: 'Premium',
    status: 'active',
    joined: '2025-01-10',
    fee: '₱1,200',
    note: 'Focused on strength and mobility. Strong form, consistent trainer. Monitor knee on squats.',
    visitThisMonth: 12,
    totalVisits: 47,
    lastVisit: 'Today at 10:30 AM',
    attendanceRate: '92%',
    nextPaymentDue: '2026-07-10',
    paymentMethod: 'Credit Card',
    lastPayment: '₱1,200 on Jun 10, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'James Nkomo',
    emergencyRelation: 'Brother',
    emergencyPhone: '+263 77 123 4568',
    avatar: 'AN'
  },
  {
    id: 2,
    name: 'Tendai Moyo',
    specialty: 'Weight Loss',
    email: 'tendai@example.com',
    phone: '+263 78 234 5678',
    dob: '1985-03-22',
    address: '456 Health Ave, Bulawayo, Zimbabwe',
    plan: 'Basic',
    status: 'pending',
    joined: '2025-02-18',
    fee: '₱800',
    note: 'Preparing for weight-loss challenge. Motivated and consistent. Track progress weekly.',
    visitThisMonth: 8,
    totalVisits: 20,
    lastVisit: 'Mar 08, 2025 at 6:30 PM',
    attendanceRate: '80%',
    nextPaymentDue: '2026-07-18',
    paymentMethod: 'Cash',
    lastPayment: '₱800 on Jun 18, 2026',
    paymentStatus: 'Pending',
    emergencyName: 'Tendai Moyo Sr.',
    emergencyRelation: 'Father',
    emergencyPhone: '+263 78 234 5679',
    avatar: 'TM'
  },
  {
    id: 3,
    name: 'Liam Chidyausiku',
    specialty: 'Crossfit',
    email: 'liam@example.com',
    phone: '+263 71 345 6789',
    dob: '1992-07-08',
    address: '789 Power Lane, Mutare, Zimbabwe',
    plan: 'Standard',
    status: 'inactive',
    joined: '2025-03-05',
    fee: '₱1,000',
    note: 'On break for the next month. Will return mid-April. Strong crossfit athlete.',
    visitThisMonth: 2,
    totalVisits: 5,
    lastVisit: 'Mar 06, 2025 at 5:45 AM',
    attendanceRate: '45%',
    nextPaymentDue: '2026-07-05',
    paymentMethod: 'Credit Card',
    lastPayment: '₱1,000 on Jun 05, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'Sarah Chidyausiku',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 71 345 6790',
    avatar: 'LC'
  },
  {
    id: 4,
    name: 'Nadia Bvuma',
    specialty: 'Yoga',
    email: 'nadia@example.com',
    phone: '+263 79 456 7890',
    dob: '1988-09-12',
    address: '321 Zen Lane, Harare, Zimbabwe',
    plan: 'Premium',
    status: 'active',
    joined: '2025-04-12',
    fee: '₱1,200',
    note: 'Yoga and recovery plan. Excellent form, very flexible. Recovering from old injury.',
    visitThisMonth: 10,
    totalVisits: 30,
    lastVisit: 'Mar 09, 2025 at 7:00 AM',
    attendanceRate: '88%',
    nextPaymentDue: '2026-07-12',
    paymentMethod: 'Mobile Money',
    lastPayment: '₱1,200 on Jun 12, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'David Bvuma',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+263 79 456 7891',
    avatar: 'NB'
  }
];

const DEFAULT_PAYMENTS = [
  {
    id: 1,
    memberId: 1,
    member: 'Amara Nkomo',
    plan: 'Premium',
    amount: '₱1,200',
    method: 'credit-card',
    due: 'Jul 10',
    paid: 'Jul 10',
    paidISO: '2026-07-10',
    status: 'paid',
    invoice: '#182394',
    ref: 'TXN-948190',
    notes: 'Monthly fee payment'
  },
  {
    id: 2,
    memberId: 2,
    member: 'Tendai Moyo',
    plan: 'Basic',
    amount: '₱800',
    method: 'cash',
    due: 'Jul 12',
    paid: '—',
    paidISO: '',
    status: 'pending',
    invoice: '#492813',
    ref: '',
    notes: ''
  },
  {
    id: 3,
    memberId: 3,
    member: 'Liam Chidyausiku',
    plan: 'Standard',
    amount: '₱1,000',
    method: 'bank',
    due: 'Jul 08',
    paid: '—',
    paidISO: '',
    status: 'overdue',
    invoice: '#238914',
    ref: '',
    notes: 'Awaiting bank transfer confirmation'
  },
  {
    id: 4,
    memberId: 4,
    member: 'Nadia Bvuma',
    plan: 'Premium',
    amount: '₱1,200',
    method: 'gcash',
    due: 'Jul 15',
    paid: 'Jul 15',
    paidISO: '2026-07-15',
    status: 'paid',
    invoice: '#774218',
    ref: 'GC-2983190',
    notes: 'Paid via GCash'
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
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
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

function getNextPaymentDue(fromDate = new Date(), plan = '') {
  const billingCycle = getPlanBillingCycle(plan);
  const nextDueDate = billingCycle.days
    ? addDays(fromDate, billingCycle.days)
    : addMonths(fromDate, billingCycle.months);
  return toISODate(nextDueDate);
}

function formatShortDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildRenewalDetails(payment, member) {
  const paidISO = payment.paidISO || toISODate(new Date());
  const plan = payment.plan || member?.plan || 'Basic';
  const billingCycle = getPlanBillingCycle(plan);
  const coverageEnd = getNextPaymentDue(paidISO, plan);

  return {
    ...payment,
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
    const todayStr = new Date().toISOString().slice(0, 10);
    const newMember = {
      id: nextId,
      ...memberData,
      joined: todayStr,
      avatar: getInitials(memberData.name),
      fee: memberData.plan.toLowerCase() === 'premium' ? '₱1,200' : memberData.plan.toLowerCase() === 'standard' ? '₱1,000' : '₱800',
      visitThisMonth: 0,
      totalVisits: 0,
      lastVisit: '—',
      attendanceRate: '0%',
      nextPaymentDue: getNextPaymentDue(todayStr, memberData.plan),
      paymentMethod: 'Cash',
      lastPayment: '—',
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
    const newList = members.map((m) => {
      if (m.id === id) {
        const merged = { ...m, ...updatedFields };
        merged.avatar = getInitials(merged.name);
        merged.fee = merged.plan.toLowerCase() === 'premium' ? '₱1,200' : merged.plan.toLowerCase() === 'standard' ? '₱1,000' : '₱800';
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
        const renamedPayments = payments.map((payment) => (
          payment.memberId === id ? { ...payment, member: savedMember.name } : payment
        ));
        updatePaymentsList(renamedPayments);
        return savedMember;
      } catch (err) {
        console.error('Failed to update member:', err);
        return null;
      }
    }

    updateMembersList(newList);
    if (updatedMember) {
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
      lastPayment: `${payment.amount} on ${payment.paid}`,
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

  return (
    <GymContext.Provider value={{
      members,
      payments,
      loading,
      addMember,
      updateMember,
      deleteMember,
      recordPayment,
      updatePayment
    }}>
      {!loading && children}
    </GymContext.Provider>
  );
};
