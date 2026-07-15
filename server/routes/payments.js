const express = require('express');
const Payment = require('../models/Payment');
const Member = require('../models/Member');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const paymentsMissingMemberId = await Payment.find({
      $or: [{ memberId: { $exists: false } }, { memberId: null }]
    }).lean();

    if (paymentsMissingMemberId.length > 0) {
      const members = await Member.find().lean();
      const memberIdByName = new Map(members.map((member) => [member.name, member.id]));
      const writes = paymentsMissingMemberId
        .map((payment) => ({
          payment,
          memberId: memberIdByName.get(payment.member)
        }))
        .filter(({ memberId }) => Number.isInteger(memberId))
        .map(({ payment, memberId }) => ({
          updateOne: {
            filter: { _id: payment._id },
            update: { $set: { memberId } }
          }
        }));

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
    const payment = await Payment.create({ ...req.body, id: nextId });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
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
