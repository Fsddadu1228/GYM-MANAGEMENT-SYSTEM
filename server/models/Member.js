const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    dob: { type: String, default: '' },
    address: { type: String, default: '', trim: true, maxlength: 160 },
    plan: { type: String, enum: ['Daily', 'Half Month', 'Full Month'], required: true },
    status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' },
    joined: { type: String, default: '' },
    fee: { type: String, default: '' },
    visitThisMonth: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    lastVisit: { type: String, default: '-' },
    attendanceRate: { type: String, default: '0%' },
    nextPaymentDue: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['Cash', 'GCash'], default: 'Cash' },
    lastPayment: { type: String, default: '-' },
    paymentStatus: { type: String, default: 'Pending' },
    emergencyName: { type: String, default: '', trim: true, maxlength: 80 },
    emergencyRelation: { type: String, default: '', trim: true, maxlength: 40 },
    emergencyPhone: { type: String, default: '', trim: true, maxlength: 40 },
    avatar: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
