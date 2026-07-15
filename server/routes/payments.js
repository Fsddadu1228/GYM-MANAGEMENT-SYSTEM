const express = require('express');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const { buildRenewalDetails } = require('../utils/renewal');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const paymentsMissingMemberId = await Payment.find({
      $or: [{ memberId: { $exists: false } }, { memberId: null }]
    }).lean();
    const paymentsMissingCoverage = await Payment.find({
      $or: [{ coverageEnd: { $exists: false } }, { coverageEnd: '' }, { billingCycle: { $exists: false } }]
    }).lean();

    if (paymentsMissingMemberId.length > 0 || paymentsMissingCoverage.length > 0) {
      const members = await Member.find().lean();
      const memberIdByName = new Map(members.map((member) => [member.name, member.id]));
      const memberById = new Map(members.map((member) => [member.id, member]));
      const memberByName = new Map(members.map((member) => [member.name, member]));
      const writesById = new Map();

      paymentsMissingMemberId
        .map((payment) => ({
          payment,
          memberId: memberIdByName.get(payment.member)
        }))
        .filter(({ memberId }) => Number.isInteger(memberId))
        .forEach(({ payment, memberId }) => {
          writesById.set(String(payment._id), {
            filter: { _id: payment._id },
            update: { $set: { memberId } }
          });
        });

      paymentsMissingCoverage.forEach((payment) => {
        const inferredMemberId = payment.memberId ?? memberIdByName.get(payment.member);
        const member = memberById.get(inferredMemberId) || memberByName.get(payment.member);
        const renewalDetails = buildRenewalDetails(payment, member);
        const existingWrite = writesById.get(String(payment._id)) || {
          filter: { _id: payment._id },
          update: { $set: {} }
        };

        existingWrite.update.$set = {
          ...existingWrite.update.$set,
          due: renewalDetails.due,
          paidISO: renewalDetails.paidISO,
          billingCycle: renewalDetails.billingCycle,
          coverageStart: renewalDetails.coverageStart,
          coverageEnd: renewalDetails.coverageEnd
        };

        if (Number.isInteger(inferredMemberId)) {
          existingWrite.update.$set.memberId = inferredMemberId;
        }

        writesById.set(String(payment._id), existingWrite);
      });

      const writes = Array.from(writesById.values()).map((write) => ({ updateOne: write }));

      if (writes.length > 0) {
        await Payment.bulkWrite(writes);
      }
    }

    const payments = await Payment.find().sort({ id: 1 }).lean();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const payments = req.body;
    if (!Array.isArray(payments)) {
      return res.status(400).json({ error: 'Expected an array of payments' });
    }

    const ids = payments.map((payment) => payment.id);
    if (ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'Every payment must include a numeric id' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'Payment ids must be unique' });
    }

    if (payments.length > 0) {
      await Payment.bulkWrite(
        payments.map((payment) => ({
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
    const payment = await Payment.findOne({ id: Number(req.params.id) }).lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const maxDoc = await Payment.findOne().sort({ id: -1 }).lean();
    const nextId = maxDoc ? maxDoc.id + 1 : 1;
    const member = await Member.findOne({
      $or: [{ id: req.body.memberId }, { name: req.body.member }]
    }).lean();
    const paymentPayload = buildRenewalDetails({ ...req.body, id: nextId }, member);
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
    const existingPayment = await Payment.findOne({ id: Number(req.params.id) }).lean();
    if (!existingPayment) return res.status(404).json({ error: 'Payment not found' });
    const member = await Member.findOne({
      $or: [{ id: req.body.memberId }, { name: req.body.member }]
    }).lean();
    const paymentPayload = buildRenewalDetails({ ...existingPayment, ...req.body }, member);
    const payment = await Payment.findOneAndUpdate(
      { id: Number(req.params.id) },
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

router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({ id: Number(req.params.id) }).lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
