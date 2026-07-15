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
  StickyNote,
  Clock,
  BadgeCheck,
  ClipboardList
} from 'lucide-react';

export default function ProfilePage({ memberId, setActivePage }) {
  const { members, payments, updateMember, deleteMember } = useContext(GymContext);

  const member = members.find((m) => m.id === memberId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [name, setName] = useState(member?.name || '');
  const [email, setEmail] = useState(member?.email || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [dob, setDob] = useState(member?.dob || '');
  const [address, setAddress] = useState(member?.address || '');
  const [plan, setPlan] = useState(member?.plan || '');
  const [status, setStatus] = useState(member?.status || 'active');
  const [note, setNote] = useState(member?.note || '');
  const [specialty, setSpecialty] = useState(member?.specialty || '');
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

  const formatLongDate = (isoStr) => {
    if (!isoStr) return 'Not recorded';
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return isoStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatMethod = (method) => {
    if (!method) return 'Not recorded';
    if (method === 'gcash') return 'GCash';
    if (method === 'credit-card') return 'Credit Card';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatCycle = (cycle) => {
    if (!cycle) return 'Monthly';
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  const formatStatus = (value) => {
    if (!value) return 'Pending';
    return value.charAt(0).toUpperCase() + value.slice(1);
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
    if (days < 0) return `${Math.abs(days)} days overdue`;
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

  const latestPayment = memberPayments.find((payment) => payment.status === 'paid') || memberPayments[0];
  const joinedDateStr = formatLongDate(member.joined);
  const renewalDays = getDaysUntilRenewal(member.nextPaymentDue);
  const renewalTone = renewalDays === null ? 'neutral' : renewalDays < 0 ? 'danger' : renewalDays <= 7 ? 'warning' : 'good';
  const memberIdStr = `MEM-${String(member.id).padStart(3, '0')}`;

  const triggerEditModal = () => {
    setName(member.name || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setDob(member.dob || '');
    setAddress(member.address || '');
    setPlan(member.plan || '');
    setStatus(member.status || 'active');
    setNote(member.note || '');
    setSpecialty(member.specialty || '');
    setEmergencyName(member.emergencyName || '');
    setEmergencyRelation(member.emergencyRelation || '');
    setEmergencyPhone(member.emergencyPhone || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !plan) {
      alert('Please fill out all required fields');
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
      note,
      specialty,
      emergencyName,
      emergencyRelation,
      emergencyPhone
    });

    if (savedMember) {
      alert('Changes saved successfully.');
      setIsEditOpen(false);
    } else {
      alert('Unable to save changes. Please try again.');
    }
  };

  const handleDeleteConfirm = async () => {
    const deleted = await deleteMember(member.id);
    if (deleted) {
      alert('Member deleted successfully.');
      setIsDeleteOpen(false);
      setActivePage('members');
    } else {
      alert('Unable to delete member. Please try again.');
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
          <button onClick={() => setIsDeleteOpen(true)} className="delete-btn danger-action-btn" type="button">
            <Trash2 size={14} /> Delete Member
          </button>
        </div>
      </header>

      <section className="profile-container member-detail-page">
        <div className="profile-header">
          <div className="profile-avatar-large">
            <div className="avatar-large">
              {member.photo ? <img src={member.photo} alt={member.name} /> : member.avatar || getInitials(member.name)}
            </div>
          </div>
          <div className="profile-header-info">
            <h2>{member.name}</h2>
            <p className="profile-specialty">{member.specialty || 'Gym Member'} · {memberIdStr}</p>
            <div className="profile-status-badge member-profile-badges">
              <span className={`status-badge status-${member.status}`}>{formatStatus(member.status)}</span>
              <span className={`renewal-pill renewal-${renewalTone}`}>
                <Clock size={14} />
                {getRenewalLabel(renewalDays)}
              </span>
            </div>
          </div>
          <div className="profile-hero-meta">
            <span>Current plan</span>
            <strong>{member.plan}</strong>
            <small>{member.fee || 'No fee set'}</small>
          </div>
        </div>

        <section className="profile-stats-grid">
          <div className="stat-card stat-card-compact">
            <h4>Membership Plan</h4>
            <p className="stat-value">{member.plan}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Renewal Date</h4>
            <p className="stat-value">{formatLongDate(member.nextPaymentDue)}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Member Since</h4>
            <p className="stat-value">{joinedDateStr}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Last Payment</h4>
            <p className="stat-value">{latestPayment?.amount || member.lastPayment || 'No payment yet'}</p>
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
              <h3><StickyNote size={18} /> Notes</h3>
              <div className="note-content">
                <p>{member.note || 'No custom goals or coaching notes logged yet.'}</p>
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
                  <span className="history-event">Next renewal - {getRenewalLabel(renewalDays)}</span>
                </div>
                <div className="history-item">
                  <span className="history-date">{latestPayment ? formatLongDate(latestPayment.paidISO) : 'No payment'}</span>
                  <span className="history-event">
                    {latestPayment ? `Latest payment ${latestPayment.amount} (${formatStatus(latestPayment.status)})` : 'No payment history yet'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-column">
            <div className="profile-card">
              <h3><CreditCard size={18} /> Membership & Renewal</h3>
              <div className="membership-summary">
                <div className={`renewal-summary renewal-${renewalTone}`}>
                  <span>Renewal status</span>
                  <strong>{getRenewalLabel(renewalDays)}</strong>
                  <small>{formatLongDate(member.nextPaymentDue)}</small>
                </div>
                <div className="info-row">
                  <span>Membership ID</span>
                  <strong>{memberIdStr}</strong>
                </div>
                <div className="info-row">
                  <span>Plan Type</span>
                  <strong>{member.plan}</strong>
                </div>
                <div className="info-row">
                  <span>Monthly Fee</span>
                  <strong>{member.fee || 'Not set'}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Status</span>
                  <strong className={member.paymentStatus?.toLowerCase() === 'paid' ? 'status-paid' : 'status-badge status-pending'}>
                    {member.paymentStatus || 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3>Attendance Stats</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Visits This Month</span>
                  <strong>{member.visitThisMonth !== undefined ? member.visitThisMonth : 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Total Visits</span>
                  <strong>{member.totalVisits !== undefined ? member.totalVisits : 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Last Visit</span>
                  <strong>{member.lastVisit || 'Not recorded'}</strong>
                </div>
                <div className="stat-row">
                  <span>Attendance Rate</span>
                  <strong>{member.attendanceRate || 'Not recorded'}</strong>
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
                  <strong>{latestPayment ? formatMethod(latestPayment.method) : member.paymentMethod || 'Not recorded'}</strong>
                </div>
                <div className="info-row">
                  <span>Paid Date</span>
                  <strong>{latestPayment ? formatLongDate(latestPayment.paidISO) : 'Not recorded'}</strong>
                </div>
                <div className="info-row">
                  <span>Status</span>
                  <strong className={latestPayment?.status === 'paid' ? 'status-paid' : 'status-badge status-pending'}>
                    {formatStatus(latestPayment?.status || member.paymentStatus)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="profile-card">
              <h3><Shield size={18} /> Emergency Contact</h3>
              <div className="emergency-contact">
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
                  {memberPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.invoice || 'No invoice'}</td>
                      <td>{payment.plan}</td>
                      <td>{payment.amount}</td>
                      <td>{formatCycle(payment.billingCycle)}</td>
                      <td>{formatMethod(payment.method)}</td>
                      <td>{payment.paidISO ? formatLongDate(payment.paidISO) : payment.paid || 'Not recorded'}</td>
                      <td>{payment.coverageEnd ? formatLongDate(payment.coverageEnd) : payment.due || 'Not recorded'}</td>
                      <td>
                        <span className={`status-badge ${payment.status === 'paid' ? 'status-active' : payment.status === 'overdue' ? 'status-inactive' : 'status-pending'}`}>
                          {formatStatus(payment.status)}
                        </span>
                      </td>
                      <td>{payment.notes || 'No notes'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <input type="text" value={plan} onChange={(e) => setPlan(e.target.value)} required />
                </label>
                <label>
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  <span>Specialty</span>
                  <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
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
                <label>
                  <span>Coach's Note</span>
                  <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
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
              This action cannot be undone. All member profile data for <strong>{member.name}</strong> will be permanently removed.
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
