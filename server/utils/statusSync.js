const Member = require('../models/Member');
const Payment = require('../models/Payment');

function toLocalISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function syncExpiredStatuses(referenceDate = new Date()) {
  const todayISO = toLocalISODate(referenceDate);

  const [memberResult, paymentResult] = await Promise.all([
    Member.updateMany(
      {
        status: { $in: ['active', 'pending'] },
        nextPaymentDue: { $type: 'string', $ne: '', $lt: todayISO }
      },
      { $set: { status: 'inactive', paymentStatus: 'Overdue' } }
    ),
    Payment.updateMany(
      {
        status: 'pending',
        $or: [
          { coverageEnd: { $type: 'string', $ne: '', $lt: todayISO } },
          { due: { $type: 'string', $ne: '', $lt: todayISO } }
        ]
      },
      { $set: { status: 'overdue' } }
    )
  ]);

  return {
    membersUpdated: memberResult.modifiedCount,
    paymentsUpdated: paymentResult.modifiedCount
  };
}

async function hasUnresolvedOverduePayment(memberId) {
  const payments = await Payment.find({ memberId }).lean();
  const latestPaidISO = payments
    .filter((payment) => payment.status === 'paid')
    .map((payment) => payment.paidISO || '')
    .filter(Boolean)
    .sort()
    .at(-1) || '';

  return payments.some((payment) => {
    if (payment.status !== 'overdue') return false;
    const overdueISO = payment.coverageEnd || payment.due || '';
    return !latestPaidISO || !overdueISO || overdueISO > latestPaidISO;
  });
}

module.exports = { hasUnresolvedOverduePayment, syncExpiredStatuses };
