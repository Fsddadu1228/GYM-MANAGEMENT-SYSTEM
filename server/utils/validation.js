const VALID_MEMBER_PLANS = ['Daily', 'Half Month', 'Full Month'];
const VALID_MEMBER_STATUSES = ['active', 'pending', 'inactive'];
const VALID_PAYMENT_STATUSES = ['paid', 'pending', 'overdue'];
const VALID_PAYMENT_METHODS = ['cash', 'gcash'];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertSafeObject(value, label = 'Payload') {
  if (!isPlainObject(value)) {
    throw new Error(`${label} must be an object`);
  }

  const stack = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    Object.entries(current).forEach(([key, nestedValue]) => {
      if (key.startsWith('$') || key.includes('.')) {
        throw new Error(`${label} contains an invalid field name`);
      }
      if (isPlainObject(nestedValue)) stack.push(nestedValue);
    });
  }
}

function cleanString(value, maxLength = 255) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function cleanOptionalString(value, maxLength = 255) {
  return cleanString(value, maxLength);
}

function isISODate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

function parseMoney(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function formatPHP(value) {
  const amount = parseMoney(value);
  return `PHP ${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

function normalizePaymentMethod(value) {
  return String(value || '').toLowerCase() === 'gcash' ? 'gcash' : 'cash';
}

function validateMemberPayload(input, { partial = false } = {}) {
  assertSafeObject(input, 'Member payload');
  const allowed = new Set([
    'name',
    'email',
    'phone',
    'dob',
    'address',
    'plan',
    'status',
    'joined',
    'fee',
    'visitThisMonth',
    'totalVisits',
    'lastVisit',
    'attendanceRate',
    'nextPaymentDue',
    'paymentMethod',
    'lastPayment',
    'paymentStatus',
    'emergencyName',
    'emergencyRelation',
    'emergencyPhone',
    'avatar'
  ]);

  const payload = {};

  Object.keys(input).forEach((key) => {
    if (allowed.has(key)) payload[key] = input[key];
  });

  const requiredFields = ['name', 'email', 'phone', 'plan'];
  if (!partial) {
    requiredFields.forEach((field) => {
      if (!cleanString(payload[field])) throw new Error(`${field} is required`);
    });
  }

  if (payload.name !== undefined) payload.name = cleanString(payload.name, 80);
  if (payload.email !== undefined) {
    payload.email = cleanString(payload.email, 120).toLowerCase();
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      throw new Error('A valid email is required');
    }
  }
  if (payload.phone !== undefined) payload.phone = cleanString(payload.phone, 40);
  if (payload.dob !== undefined) {
    payload.dob = cleanString(payload.dob, 10);
    if (!isISODate(payload.dob)) throw new Error('Date of birth must use YYYY-MM-DD');
  }
  if (payload.address !== undefined) payload.address = cleanOptionalString(payload.address, 160);
  if (payload.plan !== undefined) {
    payload.plan = cleanString(payload.plan, 40);
    if (!VALID_MEMBER_PLANS.includes(payload.plan)) {
      throw new Error(`Plan must be one of: ${VALID_MEMBER_PLANS.join(', ')}`);
    }
  }
  if (payload.status !== undefined) {
    payload.status = cleanString(payload.status, 20).toLowerCase();
    if (!VALID_MEMBER_STATUSES.includes(payload.status)) {
      throw new Error(`Status must be one of: ${VALID_MEMBER_STATUSES.join(', ')}`);
    }
  }
  if (payload.joined !== undefined) {
    payload.joined = cleanString(payload.joined, 10);
    if (!isISODate(payload.joined)) throw new Error('Join date must use YYYY-MM-DD');
  }
  if (payload.nextPaymentDue !== undefined) {
    payload.nextPaymentDue = cleanString(payload.nextPaymentDue, 10);
    if (!isISODate(payload.nextPaymentDue)) throw new Error('Renewal date must use YYYY-MM-DD');
  }
  if (payload.fee !== undefined) payload.fee = formatPHP(payload.fee);
  if (payload.visitThisMonth !== undefined) payload.visitThisMonth = Math.max(0, Number.parseInt(payload.visitThisMonth, 10) || 0);
  if (payload.totalVisits !== undefined) payload.totalVisits = Math.max(0, Number.parseInt(payload.totalVisits, 10) || 0);
  if (payload.lastVisit !== undefined) payload.lastVisit = cleanOptionalString(payload.lastVisit, 40);
  if (payload.attendanceRate !== undefined) payload.attendanceRate = cleanOptionalString(payload.attendanceRate, 10);
  if (payload.paymentMethod !== undefined) payload.paymentMethod = normalizePaymentMethod(payload.paymentMethod) === 'gcash' ? 'GCash' : 'Cash';
  if (payload.lastPayment !== undefined) payload.lastPayment = cleanOptionalString(payload.lastPayment, 80);
  if (payload.paymentStatus !== undefined) payload.paymentStatus = cleanOptionalString(payload.paymentStatus, 20);
  if (payload.emergencyName !== undefined) payload.emergencyName = cleanOptionalString(payload.emergencyName, 80);
  if (payload.emergencyRelation !== undefined) payload.emergencyRelation = cleanOptionalString(payload.emergencyRelation, 40);
  if (payload.emergencyPhone !== undefined) payload.emergencyPhone = cleanOptionalString(payload.emergencyPhone, 40);
  if (payload.avatar !== undefined) payload.avatar = cleanOptionalString(payload.avatar, 4).toUpperCase();

  return payload;
}

function validatePaymentPayload(input, { partial = false } = {}) {
  assertSafeObject(input, 'Payment payload');
  const allowed = new Set([
    'memberId',
    'amount',
    'method',
    'paidISO',
    'paid',
    'status',
    'invoice',
    'ref',
    'notes'
  ]);

  const payload = {};
  Object.keys(input).forEach((key) => {
    if (allowed.has(key)) payload[key] = input[key];
  });

  if (!partial && !Number.isInteger(Number(payload.memberId))) {
    throw new Error('A valid memberId is required');
  }
  if (!partial && parseMoney(payload.amount) <= 0) {
    throw new Error('Payment amount must be greater than zero');
  }

  if (payload.memberId !== undefined) {
    payload.memberId = Number(payload.memberId);
    if (!Number.isInteger(payload.memberId) || payload.memberId <= 0) {
      throw new Error('A valid memberId is required');
    }
  }
  if (payload.amount !== undefined) {
    if (parseMoney(payload.amount) <= 0) throw new Error('Payment amount must be greater than zero');
    payload.amount = formatPHP(payload.amount);
  }
  if (payload.method !== undefined) {
    payload.method = normalizePaymentMethod(payload.method);
    if (!VALID_PAYMENT_METHODS.includes(payload.method)) {
      throw new Error('Payment method must be Cash or GCash');
    }
  }
  if (payload.paidISO !== undefined) {
    payload.paidISO = cleanString(payload.paidISO, 10);
    if (!isISODate(payload.paidISO)) throw new Error('Paid date must use YYYY-MM-DD');
  }
  if (payload.paid !== undefined) {
    payload.paid = cleanOptionalString(payload.paid, 10);
    if (!isISODate(payload.paid)) throw new Error('Paid date must use YYYY-MM-DD');
  }
  if (payload.status !== undefined) {
    payload.status = cleanString(payload.status, 20).toLowerCase();
    if (!VALID_PAYMENT_STATUSES.includes(payload.status)) {
      throw new Error(`Payment status must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`);
    }
  }
  if (payload.invoice !== undefined) payload.invoice = cleanOptionalString(payload.invoice, 20);
  if (payload.ref !== undefined) payload.ref = cleanOptionalString(payload.ref, 40);
  if (payload.notes !== undefined) payload.notes = cleanOptionalString(payload.notes, 300);

  return payload;
}

module.exports = {
  assertSafeObject,
  validateMemberPayload,
  validatePaymentPayload
};
