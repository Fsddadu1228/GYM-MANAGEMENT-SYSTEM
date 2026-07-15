const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    memberId: { type: Number, required: true, index: true },
    member: { type: String, required: true },
    plan: { type: String, required: true },
    amount: { type: String, required: true },
    method: { type: String, required: true },
    due: { type: String, default: '' },
    paid: { type: String, default: '—' },
    paidISO: { type: String, default: '' },
    billingCycle: { type: String, default: 'monthly' },
    coverageStart: { type: String, default: '' },
    coverageEnd: { type: String, default: '' },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    invoice: { type: String, default: '' },
    ref: { type: String, default: '' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
