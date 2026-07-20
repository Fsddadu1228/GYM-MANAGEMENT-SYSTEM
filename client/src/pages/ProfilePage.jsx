import React, { useContext, useState } from 'react';
import { GymContext } from '../context/GymContextObject';
import {
  X,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Clock,
  BadgeCheck,
  ClipboardList
} from 'lucide-react';
import { notify } from '../utils/toast';
import { formatDisplayDate, formatPHP } from '../utils/formatters';
import { getDerivedMemberStatus, getDerivedMemberStatusLabel } from '../utils/memberStatus';
import { getDerivedPaymentStatus, hasUnresolvedOverduePayment } from '../utils/paymentStatus';

export default function ProfilePage({ memberId, setActivePage }) {
  const { members, payments, updateMember, deleteMember, isAdmin } = useContext(GymContext);

  const member = members.find((m) => m.id === memberId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [visiblePaymentCount, setVisiblePaymentCount] = useState(5);

  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [dob, setDob] = useState(member?.dob || '');
  const [address, setAddress] = useState(member?.address || '');
  const [plan, setPlan] = useState(member?.plan || '');
  const [status, setStatus] = useState(member?.status || 'active');
  const [emergencyName, setEmergencyName] = useState(member?.emergencyName || '');
  const [emergencyRelation, setEmergencyRelation] = useState(member?.emergencyRelation || '');
  const [emergencyPhone, setEmergencyPhone] = useState(member?.emergencyPhone || '');

  if (!member) {
    return (
      <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Member Not Found</h2>
        <p>The member profile you are looking for does not exist or has been removed.</p>
        <br />
        <button onClick={() => setActivePage('members')} className="primary-btn" type="button">
          Back to Members
        </button>
      </div>
    );
  }

  const formatLongDate = (isoStr) => formatDisplayDate(isoStr, 'Not recorded');

  const formatMethod = (method) => {
    if (!method) return 'Not recorded';
    if (String(method).toLowerCase() === 'gcash') return 'GCash';
    return 'Cash';
  };

  const formatCycle = (cycle) => {
    if (!cycle) return 'Monthly';
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  const formatStatus = (value) => {
    if (!value) return 'Pending';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const getPaymentStatusClass = (value) => {
    const normalizedStatus = String(value || 'pending').toLowerCase();
    if (normalizedStatus === 'paid') return 'status-paid';
    if (normalizedStatus === 'overdue') return 'status-badge status-inactive';
    return 'status-badge status-pending';
  };

  const getInitials = (value) => {
    return (value || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  const getDaysUntilRenewal = (dateValue) => {
    if (!dateValue) return null;
    const renewalDate = new Date(dateValue);
    if (Number.isNaN(renewalDate.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    renewalDate.setHours(0, 0, 0, 0);
    return Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
  };

  const getRenewalLabel = (days) => {
    if (days === null) return 'No renewal date';
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days remaining`;
  };

  const memberPayments = payments
    .filter((payment) => payment.memberId === member.id || (!payment.memberId && payment.member === member.name))
    .sort((a, b) => {
      const aDate = new Date(a.paidISO || a.createdAt || 0).getTime();
      const bDate = new Date(b.paidISO || b.createdAt || 0).getTime();
      return bDate - aDate;
    });

  const latestPayment = memberPayments.find((payment) => getDerivedPaymentStatus(payment) === 'paid') || memberPayments[0];
  const visibleMemberPayments = memberPayments.slice(0, visiblePaymentCount);
  const joinedDateStr = formatLongDate(member.joined);
  const renewalDays = getDaysUntilRenewal(member.nextPaymentDue);
  const renewalTone = renewalDays === null ? 'neutral' : renewalDays < 0 ? 'danger' : renewalDays <= 7 ? 'warning' : 'good';
  const memberIdStr = `MEM-${String(member.id).padStart(3, '0')}`;
  const derivedStatus = getDerivedMemberStatus(member);
  const derivedStatusLabel = getDerivedMemberStatusLabel(member);
  const isMembershipExpired = derivedStatus === 'inactive' && renewalDays !== null && renewalDays < 0;
  const memberHasUnresolvedOverdue = hasUnresolvedOverduePayment(member.id, payments);
  const latestPaymentStatus = latestPayment ? getDerivedPaymentStatus(latestPayment) : '';

  const triggerEditModal = () => {
    setName(member.name || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setDob(member.dob || '');
    setAddress(member.address || '');
    setPlan(member.plan || '');
    setStatus(memberHasUnresolvedOverdue ? 'inactive' : member.status || 'active');
    setEmergencyName(member.emergencyName || '');
    setEmergencyRelation(member.emergencyRelation || '');
    setEmergencyPhone(member.emergencyPhone || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !plan) {
      notify('Please fill out all required fields.', 'error');
      return;
    }

    if (status === 'active' && memberHasUnresolvedOverdue) {
      notify('This member has an unresolved overdue payment. Record a new payment before activating the membership.', 'error');
      return;
    }

    const savedMember = await updateMember(member.id, {
      name,
      email,
      phone,
      dob,
      address,
      plan,
      status,
      emergencyName,
      emergencyRelation,
      emergencyPhone
    });

    if (savedMember) {
      notify('Changes saved successfully.');
      setIsEditOpen(false);
    } else {
      notify('Unable to save changes. Please try again.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    const deleted = await deleteMember(member.id);
    if (deleted) {
      notify('Member deleted successfully.');
      setIsDeleteOpen(false);
      setActivePage('members');
    } else {
      notify('Unable to delete member. Please try again.', 'error');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="topbar">
        <div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActivePage('members');
            }}
            className="back-link"
          >
            <ArrowLeft size={16} /> Back to Members
          </a>
          <h1>Member Profile</h1>
        </div>
        <div className="header-actions">
          <button onClick={triggerEditModal} className="secondary-btn icon-text-btn" type="button">
            <Edit size={14} /> Edit Member
          </button>
          {isAdmin && (
            <button onClick={() => setIsDeleteOpen(true)} className="delete-btn danger-action-btn" type="button">
              <Trash2 size={14} /> Delete Member
            </button>
          )}
        </div>
      </header>

      <section className="profile-container member-detail-page">
        <div className="profile-header">
          <div className="profile-avatar-large">
            <div className="avatar-large">
              {member.avatar || getInitials(member.name)}
            </div>
          </div>
          <div className="profile-header-info">
            <h2>{member.name}</h2>
            <p className="profile-member-id">{memberIdStr}</p>
            <div className="profile-status-badge member-profile-badges">
              <span className={`status-badge status-${derivedStatus}`}>{derivedStatusLabel}</span>
              <span className={`renewal-pill renewal-${renewalTone}`}>
                <Clock size={14} />
                {getRenewalLabel(renewalDays)}
              </span>
            </div>
          </div>
        </div>

        <section className="profile-stats-grid">
          <div className="stat-card stat-card-compact">
            <h4>{isMembershipExpired ? 'Expired Date' : 'Renewal Date'}</h4>
            <p className="stat-value">{formatLongDate(member.nextPaymentDue)}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Member Since</h4>
            <p className="stat-value">{joinedDateStr}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Last Payment</h4>
            <p className="stat-value">{latestPayment?.amount ? formatPHP(latestPayment.amount) : member.lastPayment || 'No payment yet'}</p>
          </div>
        </section>

        <div className="profile-grid">
          <div className="profile-column">
            <div className="profile-card">
              <h3><ClipboardList size={18} /> Personal Information</h3>
              <div className="contact-details">
                <div className="contact-item profile-detail-item">
                  <Mail size={16} />
                  <label>Email</label>
                  <p>{member.email}</p>
                </div>
                <div className="contact-item profile-detail-item">
                  <Phone size={16} />
                  <label>Phone</label>
                  <p>{member.phone}</p>
                </div>
                <div className="contact-item profile-detail-item">
                  <Calendar size={16} />
                  <label>Date of Birth</label>
                  <p>{formatLongDate(member.dob)}</p>
                </div>
                <div className="contact-item profile-detail-item">
                  <MapPin size={16} />
                  <label>Address</label>
                  <p>{member.address || 'Not recorded'}</p>
                </div>
              </div>
            </div>
            <div className="profile-card">
              <h3><BadgeCheck size={18} /> Membership Timeline</h3>
              <div className="history-timeline">
                <div className="history-item">
                  <span className="history-date">{joinedDateStr}</span>
                  <span className="history-event">Joined - {member.plan} Plan</span>
                </div>
                <div className="history-item">
                  <span className="history-date">{formatLongDate(member.nextPaymentDue)}</span>
                  <span className="history-event">
                    {isMembershipExpired
                      ? `Membership expired on ${formatLongDate(member.nextPaymentDue)} (${Math.abs(renewalDays)} days ago)`
                      : `Next renewal - ${getRenewalLabel(renewalDays)}`}
                  </span>
                </div>
                <div className="history-item">
                  <span className="history-date">
                    {latestPaymentStatus === 'paid' ? formatLongDate(latestPayment?.paidISO) : formatLongDate(latestPayment?.coverageEnd || latestPayment?.due)}
                  </span>
                  <span className="history-event">
                    {latestPayment
                      ? latestPaymentStatus === 'paid'
                        ? `Latest payment ${formatPHP(latestPayment.amount)} (Paid)`
                        : `Outstanding invoice ${formatPHP(latestPayment.amount)} (${formatStatus(latestPaymentStatus)})`
                      : 'No payment history yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-column">
            <div className="profile-card">
              <h3><Shield size={18} /> Emergency Contact</h3>
              <div className="emergency-contact emergency-contact-priority">
                <div className="contact-item">
                  <label>Name</label>
                  <p>{member.emergencyName || 'Not recorded'}</p>
                </div>
                <div className="contact-item">
                  <label>Relationship</label>
                  <p>{member.emergencyRelation || 'Not recorded'}</p>
                </div>
                <div className="contact-item">
                  <label>Phone</label>
                  <p>{member.emergencyPhone || 'Not recorded'}</p>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <div className="profile-card-heading membership-card-heading">
                <h3><CreditCard size={18} /> Membership & Renewal</h3>
                <span className="membership-plan-badge">{member.plan}</span>
              </div>
              <div className="membership-summary">
                <div className={`renewal-summary renewal-${renewalTone}`}>
                  <span>{isMembershipExpired ? 'Membership status' : 'Renewal status'}</span>
                  <strong>{getRenewalLabel(renewalDays)}</strong>
                  <small>{formatLongDate(member.nextPaymentDue)}</small>
                </div>
                <div className="info-row">
                  <span>Membership ID</span>
                  <strong>{memberIdStr}</strong>
                </div>
                <div className="info-row">
                  <span>Membership Fee</span>
                  <strong>{member.fee ? formatPHP(member.fee) : 'Not set'}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Status</span>
                  <strong className={getPaymentStatusClass(member.paymentStatus)}>
                    {member.paymentStatus || 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3>Latest Payment</h3>
              <div className="payment-info">
                <div className="info-row">
                  <span>Invoice</span>
                  <strong>{latestPayment?.invoice || 'No invoice yet'}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Method</span>
                  <strong>{latestPayment ? formatMethod(latestPayment.method) : formatMethod(member.paymentMethod)}</strong>
                </div>
                <div className="info-row">
                  <span>Paid Date</span>
                  <strong>{latestPayment ? formatLongDate(latestPayment.paidISO) : 'Not recorded'}</strong>
                </div>
                <div className="info-row">
                  <span>Status</span>
                  <strong className={getPaymentStatusClass(latestPaymentStatus || member.paymentStatus)}>
                    {formatStatus(latestPaymentStatus || member.paymentStatus)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-card full-width">
          <div className="profile-card-heading">
            <h3><CreditCard size={18} /> Payment History</h3>
            <button type="button" className="secondary-btn" onClick={() => setActivePage('payments')}>
              View all payments
            </button>
          </div>

          {memberPayments.length === 0 ? (
            <div className="empty-inline">No payment records are linked to this member yet.</div>
          ) : (
            <div className="table-wrap compact-history-table">
              <table className="members-table-new payments-table">
                <thead>
                  <tr>
                    <th scope="col">Invoice</th>
                    <th scope="col">Plan</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Cycle</th>
                    <th scope="col">Method</th>
                    <th scope="col">Paid Date</th>
                    <th scope="col">Renewal Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMemberPayments.map((payment) => {
                    const paymentStatus = getDerivedPaymentStatus(payment);
                    return (
                      <tr key={payment.id}>
                        <td data-label="Invoice">{payment.invoice || 'No invoice'}</td>
                        <td data-label="Plan">{payment.plan}</td>
                        <td data-label="Amount">{formatPHP(payment.amount)}</td>
                        <td data-label="Cycle">{formatCycle(payment.billingCycle)}</td>
                        <td data-label="Method">{formatMethod(payment.method)}</td>
                        <td data-label="Paid Date">{payment.paidISO ? formatLongDate(payment.paidISO) : payment.paid || 'Not recorded'}</td>
                        <td data-label="Expiry Date">{payment.coverageEnd ? formatLongDate(payment.coverageEnd) : payment.due || 'Not recorded'}</td>
                        <td data-label="Status">
                          <span className={`status-badge ${paymentStatus === 'paid' ? 'status-active' : paymentStatus === 'overdue' ? 'status-inactive' : 'status-pending'}`}>
                            {formatStatus(paymentStatus)}
                          </span>
                        </td>
                        <td data-label="Notes">{payment.notes || 'No notes'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {memberPayments.length > 0 && (
            <div className="profile-history-footer">
              <span>Showing {Math.min(visiblePaymentCount, memberPayments.length)} of {memberPayments.length} payments</span>
              {visiblePaymentCount < memberPayments.length && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setVisiblePaymentCount((count) => count + 5)}
                >
                  Load 5 more
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {isEditOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit Member</h3>
              <button onClick={() => setIsEditOpen(false)} className="modal-close" style={{ position: 'static' }} type="button">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <label>
                  <span>Name *</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                  <span>Email *</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                  <span>Phone *</span>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
                <label>
                  <span>Date of Birth</span>
                  <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                </label>
                <label>
                  <span>Address</span>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />
                </label>
                <label>
                  <span>Plan *</span>
                  <select value={plan} onChange={(e) => setPlan(e.target.value)} required>
                    <option value="Daily">Daily - PHP 50</option>
                    <option value="Half Month">Half Month - PHP 250</option>
                    <option value="Full Month">Full Month - PHP 400</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active" disabled={memberHasUnresolvedOverdue}>Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {memberHasUnresolvedOverdue && (
                    <small className="field-help field-help-danger">Record a new payment to reactivate this member.</small>
                  )}
                </label>
                <label>
                  <span>Emergency Name</span>
                  <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </label>
                <label>
                  <span>Emergency Relation</span>
                  <input type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
                </label>
                <label>
                  <span>Emergency Phone</span>
                  <input type="text" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsEditOpen(false)} className="secondary-btn">
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card confirm-card">
            <h3>Delete Member?</h3>
            <p>
              <strong>{member.name}</strong> will be permanently removed from member records. Existing payment history will be retained for reports.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className="secondary-btn">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} type="button" className="delete-btn danger-action-btn">
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

