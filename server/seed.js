require('dotenv').config();

const connectDB = require('./config/db');
const Member = require('./models/Member');
const Payment = require('./models/Payment');
const User = require('./models/User');
const { hashPassword } = require('./utils/password');
const { members: DEFAULT_MEMBERS, payments: DEFAULT_PAYMENTS } = require('../client/src/data/defaultData.json');

async function seed() {
  await connectDB();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const staffPassword = process.env.SEED_STAFF_PASSWORD;

  if (!adminPassword || !staffPassword) {
    throw new Error('SEED_ADMIN_PASSWORD and SEED_STAFF_PASSWORD are required to seed users');
  }

  await User.updateOne(
    { email: 'admin@gymfitness.local' },
    {
      $set: {
        name: 'GymFitness Admin',
        username: 'admin.gym',
        email: 'admin@gymfitness.local',
        passwordHash: hashPassword(adminPassword),
        role: 'admin'
      }
    },
    { upsert: true }
  );
  console.log('Upserted default admin user: admin.gym');

  await User.updateOne(
    { email: 'staff@gymfitness.local' },
    {
      $set: {
        name: 'GymFitness Staff',
        username: 'staff.gym',
        email: 'staff@gymfitness.local',
        passwordHash: hashPassword(staffPassword),
        role: 'staff'
      }
    },
    { upsert: true }
  );
  console.log('Upserted default staff user: staff.gym');

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




