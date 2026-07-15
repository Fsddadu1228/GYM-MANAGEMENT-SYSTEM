import React, { useContext, useState } from 'react';
import { GymContext } from '../context/GymContextObject';
import { X, ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function ProfilePage({ memberId, setActivePage }) {
  const { members, updateMember, deleteMember } = useContext(GymContext);

  const member = members.find((m) => m.id === memberId);

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Fields State
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

  // Format Helper
  const formatLongDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (n) => {
    return (n || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !plan) {
      alert('Please fill out all required fields');
      return;
    }

    updateMember(member.id, {
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

    setIsEditOpen(false);
  };

  const handleDeleteConfirm = () => {
    deleteMember(member.id);
    setIsDeleteOpen(false);
    setActivePage('members');
  };

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

  const joinedDateStr = formatLongDate(member.joined);

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
          <button onClick={triggerEditModal} className="secondary-btn" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Edit size={14} /> Edit Member
          </button>
          <button onClick={() => setIsDeleteOpen(true)} className="delete-btn" type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 0, padding: '10px 14px', borderRadius: '10px', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>
            <Trash2 size={14} /> Delete Member
          </button>
        </div>
      </header>

      <section className="profile-container">
        {/* Profile Header card */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            <div className="avatar-large">
              {member.photo ? (
                <img src={member.photo} alt={member.name} />
              ) : (
                member.avatar || getInitials(member.name)
              )}
            </div>
          </div>
          <div className="profile-header-info">
            <h2>{member.name}</h2>
            <p className="profile-specialty">{member.specialty || 'Gym Member'}</p>
            <div className="profile-status-badge">
              <span className={`status-badge status-${member.status}`}>
                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <section className="profile-stats-grid">
          <div className="stat-card stat-card-compact">
            <h4>Membership Plan</h4>
            <p className="stat-value">{member.plan}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Member Since</h4>
            <p className="stat-value">{joinedDateStr}</p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Status</h4>
            <p className="stat-value" style={{ color: member.status === 'active' ? '#10b981' : '#f59e0b' }}>
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </p>
          </div>
          <div className="stat-card stat-card-compact">
            <h4>Monthly Fee</h4>
            <p className="stat-value">{member.fee || '₱800'}</p>
          </div>
        </section>

        {/* Double column layout */}
        <div className="profile-grid">
          {/* Left column */}
          <div className="profile-column">
            {/* Contact details */}
            <div className="profile-card">
              <h3>Contact Information</h3>
              <div className="contact-details">
                <div className="contact-item">
                  <label>Email</label>
                  <p>{member.email}</p>
                </div>
                <div className="contact-item">
                  <label>Phone</label>
                  <p>{member.phone}</p>
                </div>
                <div className="contact-item">
                  <label>Date of Birth</label>
                  <p>{formatLongDate(member.dob)}</p>
                </div>
                <div className="contact-item">
                  <label>Address</label>
                  <p>{member.address || '—'}</p>
                </div>
              </div>
            </div>

            {/* Coach's note */}
            <div className="profile-card">
              <h3>Coach's Note</h3>
              <div className="note-content">
                <p>{member.note || 'No custom goals or coaching notes logged yet.'}</p>
              </div>
            </div>

            {/* Membership history */}
            <div className="profile-card">
              <h3>Membership History</h3>
              <div className="history-timeline">
                <div className="history-item">
                  <span className="history-date">{joinedDateStr}</span>
                  <span className="history-event">Joined - {member.plan} Plan</span>
                </div>
                <div className="history-item">
                  <span className="history-date">Last Month</span>
                  <span className="history-event">Plan auto-renewed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="profile-column">
            {/* Attendance stats */}
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
                  <strong>{member.lastVisit || '—'}</strong>
                </div>
                <div className="stat-row">
                  <span>Attendance Rate</span>
                  <strong>{member.attendanceRate || '—'}</strong>
                </div>
              </div>
            </div>

            {/* Payment information */}
            <div className="profile-card">
              <h3>Payment Information</h3>
              <div className="payment-info">
                <div className="info-row">
                  <span>Next Payment Due</span>
                  <strong>{formatLongDate(member.nextPaymentDue)}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Method</span>
                  <strong>{member.paymentMethod || '—'}</strong>
                </div>
                <div className="info-row">
                  <span>Last Payment</span>
                  <strong>{member.lastPayment || '—'}</strong>
                </div>
                <div className="info-row">
                  <span>Payment Status</span>
                  <strong className={member.paymentStatus?.toLowerCase() === 'paid' ? 'status-paid' : 'status-badge status-pending'}>
                    {member.paymentStatus || 'Pending'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="profile-card">
              <h3>Emergency Contact</h3>
              <div className="emergency-contact">
                <div className="contact-item">
                  <label>Name</label>
                  <p>{member.emergencyName || '—'}</p>
                </div>
                <div className="contact-item">
                  <label>Relationship</label>
                  <p>{member.emergencyRelation || '—'}</p>
                </div>
                <div className="contact-item">
                  <label>Phone</label>
                  <p>{member.emergencyPhone || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          EDIT PROFILE MODAL
          ========================================================= */}
      {isEditOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit Member</h3>
              <button onClick={() => setIsEditOpen(false)} className="modal-close" style={{ position: 'static' }}>
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

      {/* =========================================================
          DELETE PROFILE CONFIRM MODAL
          ========================================================= */}
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
              <button onClick={handleDeleteConfirm} type="button" className="delete-btn" style={{ border: 0, padding: '10px 18px', borderRadius: '12px', background: '#ef4444', color: 'white', cursor: 'pointer' }}>
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
