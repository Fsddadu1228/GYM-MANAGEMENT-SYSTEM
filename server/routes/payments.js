const express = require('express');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { requireRole } = require('../middleware/auth');
const { buildRenewalDetails } = require('../utils/renewal');
const { validatePaymentPayload } = require('../utils/validation');

const router = express.Router();

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('A valid numeric id is required');
  }
  return id;
}

router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ id: 1 }).lean();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', requireRole('admin'), async (req, res) => {
  try {
    const payments = req.body;
    if (!Array.isArray(payments)) {
      return res.status(400).json({ error: 'Expected an array of payments' });
    }

    const sanitizedPayments = payments.map((payment) => ({
      ...validatePaymentPayload(payment),
      id: payment.id,
      member: payment.member,
      plan: payment.plan,
      due: payment.due,
      billingCycle: payment.billingCycle,
      coverageStart: payment.coverageStart,
      coverageEnd: payment.coverageEnd
    }));
    const ids = payments.map((payment) => payment.id);
    if (ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'Every payment must include a numeric id' });
    }
    if (payments.some((payment) => !Number.isInteger(payment.memberId))) {
      return res.status(400).json({ error: 'Every payment must include a valid memberId' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'Payment ids must be unique' });
    }

    if (payments.length > 0) {
      await Payment.bulkWrite(
        sanitizedPayments.map((payment) => ({
          updateOne: {
            filter: { id: payment.id },
            update: { $set: payment },
            upsert: true
          }
        }))
      );
    }
    await Payment.deleteMany({ id: { $nin: ids } });

    const updated = await Payment.find().sort({ id: 1 }).lean();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const paymentId = parseId(req.params.id);
    const payment = await Payment.findOne({ id: paymentId }).lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = validatePaymentPayload(req.body);
    const maxDoc = await Payment.findOne().sort({ id: -1 }).lean();
    const nextId = maxDoc ? maxDoc.id + 1 : 1;
    const member = await Member.findOne({ id: payload.memberId }).lean();
    if (!member) {
      return res.status(400).json({ error: 'A valid memberId is required to record a payment' });
    }
    const paymentPayload = buildRenewalDetails({
      ...payload,
      id: nextId,
      memberId: member.id,
      member: member.name,
      plan: member.plan
    }, member);
    const payment = await Payment.create(paymentPayload);

    if (member && payment.status === 'paid') {
      await Member.findOneAndUpdate(
        { id: member.id },
        {
          paymentMethod: payment.method,
          lastPayment: `${payment.amount} on ${payment.paid}`,
          paymentStatus: 'Paid',
          nextPaymentDue: payment.coverageEnd
        },
        { new: true }
      );
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const paymentId = parseId(req.params.id);
    const payload = validatePaymentPayload(req.body, { partial: true });
    const existingPayment = await Payment.findOne({ id: paymentId }).lean();
    if (!existingPayment) return res.status(404).json({ error: 'Payment not found' });
    const requestedMemberId = payload.memberId ?? existingPayment.memberId;
    const member = await Member.findOne({ id: Number(requestedMemberId) }).lean();
    if (!member) {
      return res.status(400).json({ error: 'A valid memberId is required to update a payment' });
    }
    const paymentPayload = buildRenewalDetails({
      ...existingPayment,
      ...payload,
      memberId: member.id,
      member: member.name,
      plan: member.plan
    }, member);
    const payment = await Payment.findOneAndUpdate(
      { id: paymentId },
      paymentPayload,
      { new: true, runValidators: true }
    ).lean();

    if (member && payment.status === 'paid') {
      await Member.findOneAndUpdate(
        { id: member.id },
        {
          paymentMethod: payment.method,
          lastPayment: `${payment.amount} on ${payment.paid}`,
          paymentStatus: 'Paid',
          nextPaymentDue: payment.coverageEnd
        },
        { new: true }
      );
    }

    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const paymentId = parseId(req.params.id);
    const payment = await Payment.findOneAndDelete({ id: paymentId }).lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
