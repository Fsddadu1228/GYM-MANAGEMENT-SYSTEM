const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    specialty: { type: String, default: 'Gym Member' },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    dob: { type: String, default: '' },
    address: { type: String, default: '' },
    plan: { type: String, required: true },
    status: { type: String, enum: ['active', 'pending', 'inactive'], default: 'active' },
    joined: { type: String, default: '' },
    fee: { type: String, default: '' },
    note: { type: String, default: '' },
    visitThisMonth: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
    lastVisit: { type: String, default: '—' },
    attendanceRate: { type: String, default: '0%' },
    nextPaymentDue: { type: String, default: '' },
    paymentMethod: { type: String, default: 'Cash' },
    lastPayment: { type: String, default: '—' },
    paymentStatus: { type: String, default: 'Pending' },
    emergencyName: { type: String, default: '' },
    emergencyRelation: { type: String, default: '' },
    emergencyPhone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    photo: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);
