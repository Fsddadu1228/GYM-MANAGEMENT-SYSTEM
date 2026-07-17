const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    memberId: { type: Number, required: true, index: true },
    member: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['Daily', 'Half Month', 'Full Month'], required: true },
    amount: { type: String, required: true },
    method: { type: String, enum: ['cash', 'gcash'], required: true },
    due: { type: String, default: '' },
    paid: { type: String, default: '' },
    paidISO: { type: String, default: '' },
    billingCycle: { type: String, default: 'full month' },
    coverageStart: { type: String, default: '' },
    coverageEnd: { type: String, default: '' },
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    invoice: { type: String, default: '', trim: true, maxlength: 20 },
    ref: { type: String, default: '', trim: true, maxlength: 40 },
    notes: { type: String, default: '', trim: true, maxlength: 300 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
