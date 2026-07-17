const express = require('express');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const { requireRole } = require('../middleware/auth');
const { validateMemberPayload } = require('../utils/validation');

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
    const members = await Member.find().sort({ id: 1 }).lean();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', requireRole('admin'), async (req, res) => {
  try {
    const members = req.body;
    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Expected an array of members' });
    }

    const sanitizedMembers = members.map((member) => ({
      ...validateMemberPayload(member),
      id: member.id
    }));
    const ids = members.map((member) => member.id);
    if (ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'Every member must include a numeric id' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'Member ids must be unique' });
    }

    if (members.length > 0) {
      await Member.bulkWrite(
        sanitizedMembers.map((member) => ({
          updateOne: {
            filter: { id: member.id },
            update: { $set: member },
            upsert: true
          }
        }))
      );
    }
    await Member.deleteMany({ id: { $nin: ids } });

    const updated = await Member.find().sort({ id: 1 }).lean();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const memberId = parseId(req.params.id);
    const member = await Member.findOne({ id: memberId }).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = validateMemberPayload(req.body);
    const maxDoc = await Member.findOne().sort({ id: -1 }).lean();
    const nextId = maxDoc ? maxDoc.id + 1 : 1;
    const member = await Member.create({ ...payload, id: nextId });
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const memberId = parseId(req.params.id);
    const payload = validateMemberPayload(req.body, { partial: true });
    const existingMember = await Member.findOne({ id: memberId }).lean();
    if (!existingMember) return res.status(404).json({ error: 'Member not found' });

    const member = await Member.findOneAndUpdate(
      { id: memberId },
      payload,
      { new: true, runValidators: true }
    ).lean();

    if (payload.name && payload.name !== existingMember.name) {
      await Payment.updateMany(
        { memberId: member.id },
        { $set: { member: member.name } }
      );
    }

    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const memberId = parseId(req.params.id);
    const member = await Member.findOneAndDelete({ id: memberId }).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
