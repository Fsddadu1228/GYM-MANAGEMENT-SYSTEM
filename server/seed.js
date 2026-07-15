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
    specialty: 'Fitness Coach',
    email: 'amara@example.com',
    phone: '+263 77 123 4567',
    dob: '1990-05-15',
    address: '123 Fitness St, Harare, Zimbabwe',
    plan: 'Premium',
    status: 'active',
    joined: '2025-01-10',
    fee: '₱1,200',
    note: 'Focused on strength and mobility. Strong form, consistent trainer. Monitor knee on squats.',
    visitThisMonth: 12,
    totalVisits: 47,
    lastVisit: 'Today at 10:30 AM',
    attendanceRate: '92%',
    nextPaymentDue: 'Jul 10, 2026',
    paymentMethod: 'Credit Card',
    lastPayment: '₱1,200 on Jun 10, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'James Nkomo',
    emergencyRelation: 'Brother',
    emergencyPhone: '+263 77 123 4568',
    avatar: 'AN'
  },
  {
    id: 2,
    name: 'Tendai Moyo',
    specialty: 'Weight Loss',
    email: 'tendai@example.com',
    phone: '+263 78 234 5678',
    dob: '1985-03-22',
    address: '456 Health Ave, Bulawayo, Zimbabwe',
    plan: 'Basic',
    status: 'pending',
    joined: '2025-02-18',
    fee: '₱800',
    note: 'Preparing for weight-loss challenge. Motivated and consistent. Track progress weekly.',
    visitThisMonth: 8,
    totalVisits: 20,
    lastVisit: 'Mar 08, 2025 at 6:30 PM',
    attendanceRate: '80%',
    nextPaymentDue: 'Jul 18, 2026',
    paymentMethod: 'Cash',
    lastPayment: '₱800 on Jun 18, 2026',
    paymentStatus: 'Pending',
    emergencyName: 'Tendai Moyo Sr.',
    emergencyRelation: 'Father',
    emergencyPhone: '+263 78 234 5679',
    avatar: 'TM'
  },
  {
    id: 3,
    name: 'Liam Chidyausiku',
    specialty: 'Crossfit',
    email: 'liam@example.com',
    phone: '+263 71 345 6789',
    dob: '1992-07-08',
    address: '789 Power Lane, Mutare, Zimbabwe',
    plan: 'Standard',
    status: 'inactive',
    joined: '2025-03-05',
    fee: '₱1,000',
    note: 'On break for the next month. Will return mid-April. Strong crossfit athlete.',
    visitThisMonth: 2,
    totalVisits: 5,
    lastVisit: 'Mar 06, 2025 at 5:45 AM',
    attendanceRate: '45%',
    nextPaymentDue: 'Jul 05, 2026',
    paymentMethod: 'Credit Card',
    lastPayment: '₱1,000 on Jun 05, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'Sarah Chidyausiku',
    emergencyRelation: 'Sister',
    emergencyPhone: '+263 71 345 6790',
    avatar: 'LC'
  },
  {
    id: 4,
    name: 'Nadia Bvuma',
    specialty: 'Yoga',
    email: 'nadia@example.com',
    phone: '+263 79 456 7890',
    dob: '1988-09-12',
    address: '321 Zen Lane, Harare, Zimbabwe',
    plan: 'Premium',
    status: 'active',
    joined: '2025-04-12',
    fee: '₱1,200',
    note: 'Yoga and recovery plan. Excellent form, very flexible. Recovering from old injury.',
    visitThisMonth: 10,
    totalVisits: 30,
    lastVisit: 'Mar 09, 2025 at 7:00 AM',
    attendanceRate: '88%',
    nextPaymentDue: 'Jul 12, 2026',
    paymentMethod: 'Mobile Money',
    lastPayment: '₱1,200 on Jun 12, 2026',
    paymentStatus: 'Paid',
    emergencyName: 'David Bvuma',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+263 79 456 7891',
    avatar: 'NB'
  }
];

const DEFAULT_PAYMENTS = [
  {
    id: 1,
    memberId: 1,
    member: 'Amara Nkomo',
    plan: 'Premium',
    amount: '₱1,200',
    method: 'credit-card',
    due: 'Jul 10',
    paid: 'Jul 10',
    paidISO: '2026-07-10',
    status: 'paid',
    invoice: '#182394',
    ref: 'TXN-948190',
    notes: 'Monthly fee payment'
  },
  {
    id: 2,
    memberId: 2,
    member: 'Tendai Moyo',
    plan: 'Basic',
    amount: '₱800',
    method: 'cash',
    due: 'Jul 12',
    paid: '—',
    paidISO: '',
    status: 'pending',
    invoice: '#492813',
    ref: '',
    notes: ''
  },
  {
    id: 3,
    memberId: 3,
    member: 'Liam Chidyausiku',
    plan: 'Standard',
    amount: '₱1,000',
    method: 'bank',
    due: 'Jul 08',
    paid: '—',
    paidISO: '',
    status: 'overdue',
    invoice: '#238914',
    ref: '',
    notes: 'Awaiting bank transfer confirmation'
  },
  {
    id: 4,
    memberId: 4,
    member: 'Nadia Bvuma',
    plan: 'Premium',
    amount: '₱1,200',
    method: 'gcash',
    due: 'Jul 15',
    paid: 'Jul 15',
    paidISO: '2026-07-15',
    status: 'paid',
    invoice: '#774218',
    ref: 'GC-2983190',
    notes: 'Paid via GCash'
  }
];

async function seed() {
  await connectDB();

  const userCount = await User.countDocuments();
  const memberCount = await Member.countDocuments();
  const paymentCount = await Payment.countDocuments();

  if (userCount === 0) {
    await User.create({
      name: 'GymFitness Admin',
      username: 'coach.amy',
      email: 'admin@gymfitness.local',
      passwordHash: hashPassword('gym1234'),
      role: 'admin'
    });
    console.log('Seeded default admin user: coach.amy / gym1234');
  } else {
    console.log(`Skipped users (${userCount} already exist)`);
  }

  if (memberCount === 0) {
    await Member.insertMany(DEFAULT_MEMBERS);
    console.log(`Seeded ${DEFAULT_MEMBERS.length} members`);
  } else {
    console.log(`Skipped members (${memberCount} already exist)`);
  }

  if (paymentCount === 0) {
    await Payment.insertMany(DEFAULT_PAYMENTS);
    console.log(`Seeded ${DEFAULT_PAYMENTS.length} payments`);
  } else {
    console.log(`Skipped payments (${paymentCount} already exist)`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
