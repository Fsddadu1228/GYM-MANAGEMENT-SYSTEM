const express = require('express');
const Member = require('../models/Member');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const members = await Member.find().sort({ id: 1 }).lean();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const members = req.body;
    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Expected an array of members' });
    }

    const ids = members.map((member) => member.id);
    if (ids.some((id) => !Number.isInteger(id))) {
      return res.status(400).json({ error: 'Every member must include a numeric id' });
    }
    if (new Set(ids).size !== ids.length) {
      return res.status(400).json({ error: 'Member ids must be unique' });
    }

    if (members.length > 0) {
      await Member.bulkWrite(
        members.map((member) => ({
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
    const member = await Member.findOne({ id: Number(req.params.id) }).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const maxDoc = await Member.findOne().sort({ id: -1 }).lean();
    const nextId = maxDoc ? maxDoc.id + 1 : 1;
    const member = await Member.create({ ...req.body, id: nextId });
    res.status(201).json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const member = await Member.findOneAndUpdate(
      { id: Number(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ id: Number(req.params.id) }).lean();
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
