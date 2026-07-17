require('dotenv').config();

const connectDB = require('./config/db');
const Member = require('./models/Member');
const Payment = require('./models/Payment');
const User = require('./models/User');
const { hashPassword } = require('./utils/password');

const DEFAULT_MEMBERS = [
  {
    id: 1,
    name: 'Amara Nkomo',
    email: 'amara.nkomo@gymfitness.local',
    phone: '+263 77 123 4567',
    dob: '1990-05-15',
    address: '123 Fitness Street, Harare',
    plan: 'Full Month',
    status: 'active',
    joined: '2026-05-20',
    fee: 'PHP 400',
    visitThisMonth: 14,
    totalVisits: 68,
    lastVisit: '2026-07-15 18:30',
    attendanceRate: '94%',
    nextPaymentDue: '2026-07-20',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 400 on 2026-06-20',
    paymentStatus: 'Paid',
    emergencyName: 'James Nkomo',
    emergencyRelation: 'Brother',
    emergencyPhone: '+263 77 123 4568',
    avatar: 'AN'
  },
  {
    id: 2,
    name: 'Tendai Moyo',
    email: 'tendai.moyo@gymfitness.local',
    phone: '+263 78 234 5678',
    dob: '1985-03-22',
    address: '456 Health Avenue, Bulawayo',
    plan: 'Daily',
    status: 'pending',
    joined: '2026-06-03',
    fee: 'PHP 50',
    visitThisMonth: 7,
    totalVisits: 18,
    lastVisit: '2026-07-14 07:00',
    attendanceRate: '78%',
    nextPaymentDue: '2026-07-18',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 50 on 2026-06-18',
    paymentStatus: 'Pending',
    emergencyName: 'Farai Moyo',
    emergencyRelation: 'Father',
    emergencyPhone: '+263 78 234 5679',
    avatar: 'TM'
  },
  {
    id: 3,
    name: 'Liam Chidyausiku',
    email: 'liam.chidyausiku@gymfitness.local',
    phone: '+263 71 345 6789',
    dob: '1992-07-08',
    address: '789 Power Lane, Mutare',
    plan: 'Half Month',
    status: 'inactive',
    joined: '2026-04-28',
    fee: 'PHP 250',
    visitThisMonth: 3,
    totalVisits: 36,
    lastVisit: '2026-07-04 05:45',
    attendanceRate: '52%',
    nextPaymentDue: '2026-07-05',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 250 on 2026-06-05',
    paymentStatus: 'Overdue',
    emergencyName: 'Sarah Chidyausiku',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 71 345 6790',
    avatar: 'LC'
  },
  {
    id: 4,
    name: 'Nadia Bvuma',
    email: 'nadia.bvuma@gymfitness.local',
    phone: '+263 79 456 7890',
    dob: '1988-09-12',
    address: '321 Zen Lane, Harare',
    plan: 'Full Month',
    status: 'active',
    joined: '2026-07-02',
    fee: 'PHP 400',
    visitThisMonth: 11,
    totalVisits: 42,
    lastVisit: '2026-07-15 08:00',
    attendanceRate: '91%',
    nextPaymentDue: '2026-08-15',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 400 on 2026-07-15',
    paymentStatus: 'Paid',
    emergencyName: 'David Bvuma',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+263 79 456 7891',
    avatar: 'NB'
  },
  {
    id: 5,
    name: 'Rudo Maseko',
    email: 'rudo.maseko@gymfitness.local',
    phone: '+263 73 567 8901',
    dob: '1995-11-02',
    address: '12 Wellness Road, Harare',
    plan: 'Half Month',
    status: 'active',
    joined: '2026-06-24',
    fee: 'PHP 250',
    visitThisMonth: 9,
    totalVisits: 24,
    lastVisit: '2026-07-16 06:15',
    attendanceRate: '86%',
    nextPaymentDue: '2026-07-16',
    paymentMethod: 'GCash',
    lastPayment: 'PHP 250 on 2026-07-01',
    paymentStatus: 'Paid',
    emergencyName: 'Nyasha Maseko',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 73 567 8902',
    avatar: 'RM'
  },
  {
    id: 6,
    name: 'Kuda Nyathi',
    email: 'kuda.nyathi@gymfitness.local',
    phone: '+263 72 678 9012',
    dob: '1998-02-18',
    address: '88 Active Close, Bulawayo',
    plan: 'Daily',
    status: 'active',
    joined: '2026-07-10',
    fee: 'PHP 50',
    visitThisMonth: 4,
    totalVisits: 4,
    lastVisit: '2026-07-16 07:20',
    attendanceRate: '100%',
    nextPaymentDue: '2026-07-18',
    paymentMethod: 'Cash',
    lastPayment: 'PHP 50 on 2026-07-17',
    paymentStatus: 'Paid',
    emergencyName: 'Tariro Nyathi',
    emergencyRelation: 'Mother',
    emergencyPhone: '+263 72 678 9013',
    avatar: 'KN'
  }
];
const DEFAULT_PAYMENTS = [
  {
    id: 1,
    memberId: 1,
    member: 'Amara Nkomo',
    plan: 'Full Month',
    amount: 'PHP 400',
    method: 'gcash',
    due: '2026-07-20',
    paid: '2026-06-20',
    paidISO: '2026-06-20',
    billingCycle: 'full month',
    coverageStart: '2026-06-20',
    coverageEnd: '2026-07-20',
    status: 'paid',
    invoice: '#182394',
    ref: 'GC-948190',
    notes: 'Full-month membership renewal'
  },
  {
    id: 2,
    memberId: 2,
    member: 'Tendai Moyo',
    plan: 'Daily',
    amount: 'PHP 50',
    method: 'cash',
    due: '2026-07-18',
    paid: '',
    paidISO: '',
    billingCycle: 'daily',
    coverageStart: '2026-07-17',
    coverageEnd: '2026-07-18',
    status: 'pending',
    invoice: '#492813',
    ref: '',
    notes: 'Awaiting counter payment'
  },
  {
    id: 3,
    memberId: 3,
    member: 'Liam Chidyausiku',
    plan: 'Half Month',
    amount: 'PHP 250',
    method: 'cash',
    due: '2026-07-05',
    paid: '',
    paidISO: '',
    billingCycle: 'half month',
    coverageStart: '2026-06-20',
    coverageEnd: '2026-07-05',
    status: 'overdue',
    invoice: '#238914',
    ref: '',
    notes: 'Cash payment not yet confirmed'
  },
  {
    id: 4,
    memberId: 4,
    member: 'Nadia Bvuma',
    plan: 'Full Month',
    amount: 'PHP 400',
    method: 'gcash',
    due: '2026-08-15',
    paid: '2026-07-15',
    paidISO: '2026-07-15',
    billingCycle: 'full month',
    coverageStart: '2026-07-15',
    coverageEnd: '2026-08-15',
    status: 'paid',
    invoice: '#774218',
    ref: 'GC-2983190',
    notes: 'Paid via GCash'
  },
  {
    id: 5,
    memberId: 5,
    member: 'Rudo Maseko',
    plan: 'Half Month',
    amount: 'PHP 250',
    method: 'gcash',
    due: '2026-07-16',
    paid: '2026-07-01',
    paidISO: '2026-07-01',
    billingCycle: 'half month',
    coverageStart: '2026-07-01',
    coverageEnd: '2026-07-16',
    status: 'paid',
    invoice: '#681245',
    ref: 'GC-554210',
    notes: 'Half-month membership renewal'
  },
  {
    id: 6,
    memberId: 6,
    member: 'Kuda Nyathi',
    plan: 'Daily',
    amount: 'PHP 50',
    method: 'cash',
    due: '2026-07-18',
    paid: '2026-07-17',
    paidISO: '2026-07-17',
    billingCycle: 'daily',
    coverageStart: '2026-07-17',
    coverageEnd: '2026-07-18',
    status: 'paid',
    invoice: '#915730',
    ref: 'CASH-0710',
    notes: 'Daily access payment'
  }
];

async function seed() {
  await connectDB();

  await User.updateOne(
    { email: 'admin@gymfitness.local' },
    {
      $set: {
      name: 'GymFitness Admin',
      username: 'admin.gym',
      email: 'admin@gymfitness.local',
      passwordHash: hashPassword('gym1234'),
      role: 'admin'
      }
    },
    { upsert: true }
  );
  console.log('Upserted default admin user: admin.gym / gym1234');

  await Member.bulkWrite(
    DEFAULT_MEMBERS.map((member) => ({
      updateOne: {
        filter: { id: member.id },
        update: {
          $set: member,
          $unset: { specialty: '', note: '' }
        },
        upsert: true
      }
    }))
  );
  console.log(`Upserted ${DEFAULT_MEMBERS.length} demo members`);

  await Payment.bulkWrite(
    DEFAULT_PAYMENTS.map((payment) => ({
      updateOne: {
        filter: { id: payment.id },
        update: { $set: payment },
        upsert: true
      }
    }))
  );
  console.log(`Upserted ${DEFAULT_PAYMENTS.length} demo payments`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});




