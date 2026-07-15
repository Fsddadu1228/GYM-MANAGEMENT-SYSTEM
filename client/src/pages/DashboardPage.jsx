import React, { useContext } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Users, Plus, CreditCard, BarChart2 } from 'lucide-react';

export default function DashboardPage({ setActivePage, setOpenAddMemberOnLoad, setOpenRecordPaymentOnLoad }) {
  const { members, payments } = useContext(GymContext);

  // Stats calculation
  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === 'active').length;
  const pendingPayments = payments.filter((p) => p.status === 'pending').length;

  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);

  // Plan Mix calculations
  const planCounts = { Premium: 0, Standard: 0, Basic: 0 };
  members.forEach((m) => {
    const p = m.plan || 'Basic';
    const planName = p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    if (planCounts[planName] !== undefined) {
      planCounts[planName]++;
    }
  });

  const totalPlans = Object.values(planCounts).reduce((a, b) => a + b, 0);

  const colors = {
    Premium: '#3b82f6',
    Standard: '#60a5fa',
    Basic: '#93c5fd'
  };

  const conicSlices = [];
  let currentPercentage = 0;

  const planPercentages = Object.entries(planCounts).map(([planName, count]) => {
    const pct = totalPlans > 0 ? (count / totalPlans) * 100 : 0;
    const startAngle = currentPercentage;
    currentPercentage += pct;
    const endAngle = currentPercentage;

    if (pct > 0) {
      conicSlices.push(`${colors[planName]} ${startAngle}% ${endAngle}%`);
    }

    return { planName, count, percentage: Math.round(pct) };
  });

  const donutStyle = conicSlices.length > 0
    ? { background: `conic-gradient(${conicSlices.join(', ')})`, width: '140px' }
    : { background: '#1e293b', width: '140px' };

  // Recent Activities
  const activities = [];
  members.forEach((m) => {
    if (m.joined) {
      activities.push({
        date: new Date(m.joined),
        dateStr: m.joined,
        text: `New member joined: <strong>${m.name}</strong>`,
        detail: `Enrolled in ${m.plan} plan`,
        type: 'member'
      });
    }
  });

  payments.forEach((p) => {
    if (p.status === 'paid' && p.paidISO) {
      activities.push({
        date: new Date(p.paidISO),
        dateStr: p.paidISO,
        text: `Payment of <strong>${p.amount}</strong> received`,
        detail: `From ${p.member} (${(p.method || 'cash').toUpperCase()})`,
        type: 'payment'
      });
    }
  });

  activities.sort((a, b) => b.date - a.date);
  const recentActivities = activities.slice(0, 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingRenewals = members
    .map((member) => {
      const dueDate = member.nextPaymentDue ? new Date(member.nextPaymentDue) : null;
      if (!dueDate || Number.isNaN(dueDate.getTime())) return null;

      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      return {
        id: member.id,
        name: member.name,
        plan: member.plan || 'Basic',
        dueDate,
        daysUntilDue
      };
    })
    .filter(Boolean)
    .filter((renewal) => renewal.daysUntilDue >= -30 && renewal.daysUntilDue <= 30)
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 5);

  const formatRenewalDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRenewalStatus = (daysUntilDue) => {
    if (daysUntilDue < 0) return { text: `${Math.abs(daysUntilDue)}d expired`, className: 'status-inactive' };
    if (daysUntilDue === 0) return { text: 'Due today', className: 'status-pending' };
    return { text: `${daysUntilDue}d left`, className: 'status-active' };
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
        </div>
        <div className="report-actions">
          <button
            onClick={() => setActivePage('members')}
            className="secondary-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Users size={16} /> Manage Members
          </button>
          <button
            onClick={() => {
              setActivePage('payments');
              setOpenRecordPaymentOnLoad(true);
            }}
            className="primary-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <CreditCard size={16} /> Record Payment
          </button>
        </div>
      </header>

      {/* Stats KPI Widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total Members</h3>
          <p className="stat-value">{totalMembers}</p>
        </article>
        <article className="stat-card">
          <h3>Active Members</h3>
          <p className="stat-value active-count">{activeMembers}</p>
        </article>
        <article className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₱{totalRevenue.toLocaleString('en-PH')}</p>
        </article>
        <article className="stat-card">
          <h3>Pending Payments</h3>
          <p className="stat-value pending-count">{pendingPayments}</p>
        </article>
      </section>

      {/* Grid Split Panel Layout */}
      <section className="profile-grid">
        {/* Recent Activities */}
        <div className="profile-column">
        <div className="profile-card">
          <h3>Recent Activities</h3>
          <div className="activity-list" style={{ marginTop: '12px' }}>
            {recentActivities.length === 0 ? (
              <p className="subtle" style={{ textAlign: 'center', padding: '16px' }}>No recent activities found.</p>
            ) : (
              recentActivities.map((act, index) => {
                const icon = act.type === 'member' ? '👤' : '💳';
                const borderLeftColor = act.type === 'member' ? '#3b82f6' : '#10b981';
                const dateDisplay = new Date(act.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={index}
                    className="activity-item"
                    style={{
                      padding: '12px 14px',
                      gap: '12px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${borderLeftColor}`,
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc' }}
                        dangerouslySetInnerHTML={{ __html: act.text }}
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{act.detail}</small>
                    </div>
                    <span className="activity-date" style={{ minWidth: 'auto', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {dateDisplay}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

          <div className="profile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, borderBottom: 0, paddingBottom: 0 }}>Upcoming Renewals</h3>
              <button
                type="button"
                onClick={() => setActivePage('members')}
                className="member-link"
                style={{ background: 'transparent', border: 0, padding: 0, fontSize: '0.85rem', fontWeight: 700 }}
              >
                View All
              </button>
            </div>
            <div className="activity-list" style={{ marginTop: '12px' }}>
              {upcomingRenewals.length === 0 ? (
                <p className="subtle" style={{ textAlign: 'center', padding: '16px' }}>No renewals due in the next 30 days.</p>
              ) : (
                upcomingRenewals.map((renewal) => {
                  const status = getRenewalStatus(renewal.daysUntilDue);

                  return (
                    <div
                      key={renewal.id}
                      className="activity-item"
                      style={{
                        padding: '12px 14px',
                        gap: '12px',
                        marginBottom: '8px',
                        borderLeft: `3px solid ${renewal.daysUntilDue < 0 ? '#ef4444' : '#f59e0b'}`,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#f8fafc', fontWeight: 700 }}>
                          {renewal.name}
                        </p>
                        <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                          {renewal.plan} membership - {formatRenewalDate(renewal.dueDate)}
                        </small>
                      </div>
                      <span className={`status-badge ${status.className}`} style={{ whiteSpace: 'nowrap' }}>
                        {status.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Plan Mix & Quick Actions */}
        <div className="profile-column">
          <div className="profile-card">
            <h3>Plan Mix Distribution</h3>
            <div className="chart-placeholder distribution-chart" style={{ minHeight: 'auto', background: 'transparent', padding: '12px 0', marginTop: '8px' }}>
              <div className="donut-chart" style={donutStyle}>
                <span>
                  {totalPlans}
                  <small>plans</small>
                </span>
              </div>
              <div className="chart-legend" style={{ gap: '6px' }}>
                {planPercentages.map((p) => (
                  <div key={p.planName} className="legend-item" style={{ padding: '6px 10px' }}>
                    <span className="legend-dot" style={{ background: colors[p.planName] }}></span>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>{p.planName}</p>
                    <strong style={{ fontSize: '0.8rem' }}>{p.count} ({p.percentage}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setActivePage('members');
                  setOpenAddMemberOnLoad(true);
                }}
                style={{ padding: '16px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '14px', cursor: 'pointer' }}
              >
                <Plus size={20} color="#3b82f6" /> Add Member
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setActivePage('payments');
                  setOpenRecordPaymentOnLoad(true);
                }}
                style={{ padding: '16px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '14px', cursor: 'pointer' }}
              >
                <CreditCard size={20} color="#10b981" /> Record Payment
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setActivePage('reports')}
                style={{ padding: '16px', fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', borderRadius: '14px', gridColumn: 'span 2', cursor: 'pointer' }}
              >
                <BarChart2 size={20} color="#a855f7" /> View Analytics & Reports
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
