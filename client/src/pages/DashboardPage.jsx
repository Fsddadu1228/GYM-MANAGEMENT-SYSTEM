import React, { useContext } from 'react';
import { GymContext } from '../context/GymContextObject';
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CalendarClock,
  CreditCard,
  DollarSign,
  Plus,
  ReceiptText,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react';

export default function DashboardPage({ setActivePage, setOpenAddMemberOnLoad, setOpenRecordPaymentOnLoad }) {
  const { members, payments } = useContext(GymContext);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const parseAmount = (amount) => Number(String(amount || '').replace(/[^0-9.]/g, '')) || 0;
  const formatMoney = (value) => `PHP ${value.toLocaleString('en-PH')}`;
  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatFullDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getDueInfo = (member) => {
    const dueDate = member.nextPaymentDue ? new Date(member.nextPaymentDue) : null;
    if (!dueDate || Number.isNaN(dueDate.getTime())) return null;
    dueDate.setHours(0, 0, 0, 0);
    const days = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return { dueDate, days };
  };

  const totalMembers = members.length;
  const activeMembers = members.filter((member) => member.status === 'active').length;
  const expiredMembers = members
    .map((member) => ({ ...member, due: getDueInfo(member) }))
    .filter((member) => member.due && member.due.days < 0)
    .sort((a, b) => a.due.days - b.due.days);

  const upcomingRenewals = members
    .map((member) => ({ ...member, due: getDueInfo(member) }))
    .filter((member) => member.due && member.due.days >= 0 && member.due.days <= 14)
    .sort((a, b) => a.due.days - b.due.days);

  const pendingPaymentItems = payments
    .filter((payment) => payment.status === 'pending' || payment.status === 'overdue')
    .sort((a, b) => String(a.status).localeCompare(String(b.status)));

  const monthlyRevenue = payments
    .filter((payment) => {
      const paidDate = payment.paidISO ? new Date(payment.paidISO) : null;
      return payment.status === 'paid' && paidDate && paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    })
    .reduce((sum, payment) => sum + parseAmount(payment.amount), 0);

  const newMembersThisMonth = members.filter((member) => {
    const joined = member.joined ? new Date(member.joined) : null;
    return joined && joined.getMonth() === currentMonth && joined.getFullYear() === currentYear;
  });

  const planCounts = members.reduce((acc, member) => {
    const plan = member.plan || 'Basic';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const planColors = ['#4f8cff', '#2dd4bf', '#fbbf24', '#fb7185', '#a78bfa'];
  let currentSlice = 0;
  const planEntries = Object.entries(planCounts).map(([plan, count], index) => {
    const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
    const start = currentSlice;
    currentSlice += percentage;
    return {
      plan,
      count,
      percentage,
      color: planColors[index % planColors.length],
      slice: `${planColors[index % planColors.length]} ${start}% ${currentSlice}%`
    };
  });

  const donutStyle = planEntries.length
    ? { background: `conic-gradient(${planEntries.map((entry) => entry.slice).join(', ')})` }
    : { background: '#1e293b' };

  const alerts = [
    {
      label: 'Expired members',
      value: expiredMembers.length,
      tone: 'danger',
      icon: AlertTriangle,
      action: 'Review',
      onClick: () => setActivePage('members')
    },
    {
      label: 'Upcoming renewals',
      value: upcomingRenewals.length,
      tone: 'warning',
      icon: CalendarClock,
      action: 'Open',
      onClick: () => setActivePage('members')
    },
    {
      label: 'Pending payments',
      value: pendingPaymentItems.length,
      tone: 'warning',
      icon: ReceiptText,
      action: 'Collect',
      onClick: () => setActivePage('payments')
    },
    {
      label: 'New this month',
      value: newMembersThisMonth.length,
      tone: 'good',
      icon: UserPlus,
      action: 'View',
      onClick: () => setActivePage('members')
    }
  ];

  const metricCards = [
    { label: 'Total members', value: totalMembers, sub: `${activeMembers} active`, icon: Users },
    { label: 'Monthly revenue', value: formatMoney(monthlyRevenue), sub: 'Paid payments this month', icon: DollarSign },
    { label: 'Pending payments', value: pendingPaymentItems.length, sub: 'Needs follow-up', icon: CreditCard },
    { label: 'Renewals due', value: upcomingRenewals.length, sub: 'Next 14 days', icon: CalendarClock }
  ];

  const recentPaidPayments = payments
    .filter((payment) => payment.status === 'paid')
    .sort((a, b) => new Date(b.paidISO || b.createdAt || 0) - new Date(a.paidISO || a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="dashboard-pro">
      <header className="topbar dashboard-topbar">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Monitor renewals, revenue, and member risk from one control surface.</p>
        </div>
        <div className="report-actions">
          <button
            type="button"
            className="secondary-btn icon-text-btn"
            onClick={() => {
              setActivePage('members');
              setOpenAddMemberOnLoad(true);
            }}
          >
            <Plus size={16} /> Add Member
          </button>
          <button
            type="button"
            className="primary-btn icon-text-btn"
            onClick={() => {
              setActivePage('payments');
              setOpenRecordPaymentOnLoad(true);
            }}
          >
            <CreditCard size={16} /> Record Payment
          </button>
        </div>
      </header>

      <section className="dashboard-alert-strip">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <button key={alert.label} type="button" className={`alert-tile alert-${alert.tone}`} onClick={alert.onClick}>
              <span className="alert-icon"><Icon size={18} /></span>
              <span>
                <strong>{alert.value}</strong>
                <small>{alert.label}</small>
              </span>
              <span className="alert-action">{alert.action}<ArrowRight size={13} /></span>
            </button>
          );
        })}
      </section>

      <section className="dashboard-metrics">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="metric-panel">
              <div>
                <span className="metric-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.sub}</small>
              </div>
              <span className="metric-icon"><Icon size={20} /></span>
            </article>
          );
        })}
      </section>

      <section className="dashboard-workspace">
        <div className="ops-panel priority-panel renewal-panel">
          <div className="ops-panel-header">
            <div>
              <h2>Renewal Watchlist</h2>
              <p>Expired members and renewals due within 14 days.</p>
            </div>
            <button type="button" className="text-action" onClick={() => setActivePage('members')}>View members</button>
          </div>

          <div className="watchlist-stack">
            {[...expiredMembers.slice(0, 3), ...upcomingRenewals.slice(0, 5)].slice(0, 6).map((member) => {
              const isExpired = member.due.days < 0;
              return (
                <div key={`${member.id}-${member.due.days}`} className="watchlist-row">
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.plan || 'Basic'} plan - {formatFullDate(member.due.dueDate)}</span>
                  </div>
                  <span className={`status-badge ${isExpired ? 'status-inactive' : 'status-pending'}`}>
                    {isExpired ? `${Math.abs(member.due.days)}d expired` : member.due.days === 0 ? 'Due today' : `${member.due.days}d left`}
                  </span>
                </div>
              );
            })}
            {expiredMembers.length + upcomingRenewals.length === 0 && (
              <div className="empty-inline">No expired members or near-term renewals.</div>
            )}
          </div>
        </div>

        <div className="ops-panel payment-panel">
          <div className="ops-panel-header">
            <div>
              <h2>Payment Queue</h2>
              <p>Pending and overdue invoices that need action.</p>
            </div>
            <button type="button" className="text-action" onClick={() => setActivePage('payments')}>View payments</button>
          </div>

          <div className="payment-queue">
            {pendingPaymentItems.slice(0, 6).map((payment) => (
              <div key={payment.id} className="queue-row">
                <div>
                  <strong>{payment.member}</strong>
                  <span>{payment.invoice || 'No invoice'} - {payment.plan}</span>
                </div>
                <div className="queue-amount">
                  <strong>{payment.amount}</strong>
                  <span className={`status-badge ${payment.status === 'overdue' ? 'status-inactive' : 'status-pending'}`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
            {pendingPaymentItems.length === 0 && (
              <div className="empty-inline">No pending payments right now.</div>
            )}
          </div>
        </div>

        <div className="ops-panel plan-panel">
          <div className="ops-panel-header">
            <div>
              <h2>Plan Mix</h2>
              <p>Membership distribution across active records.</p>
            </div>
          </div>
          <div className="dashboard-plan-mix">
            <div className="donut-chart dashboard-donut" style={donutStyle}>
              <span>
                {totalMembers}
                <small>members</small>
              </span>
            </div>
            <div className="plan-list">
              {planEntries.map((entry) => (
                <div key={entry.plan} className="plan-row">
                  <span className="legend-dot" style={{ background: entry.color }}></span>
                  <strong>{entry.plan}</strong>
                  <small>{entry.count} members</small>
                  <b>{entry.percentage}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ops-panel revenue-panel">
          <div className="ops-panel-header">
            <div>
              <h2>Recent Revenue</h2>
              <p>Latest confirmed payment activity.</p>
            </div>
            <TrendingUp size={18} />
          </div>
          <div className="revenue-list">
            {recentPaidPayments.map((payment) => (
              <div key={payment.id} className="queue-row">
                <div>
                  <strong>{payment.member}</strong>
                  <span>{payment.paidISO ? formatDate(new Date(payment.paidISO)) : payment.paid} - {(payment.method || 'cash').toUpperCase()}</span>
                </div>
                <strong>{payment.amount}</strong>
              </div>
            ))}
            {recentPaidPayments.length === 0 && (
              <div className="empty-inline">No paid payments recorded yet.</div>
            )}
          </div>
        </div>
      </section>

      <section className="quick-command-bar">
        <button type="button" onClick={() => setActivePage('members')}>
          <Users size={17} /> Manage members
        </button>
        <button type="button" onClick={() => setActivePage('payments')}>
          <ReceiptText size={17} /> Payment records
        </button>
        <button type="button" onClick={() => setActivePage('reports')}>
          <BarChart2 size={17} /> Reports
        </button>
      </section>
    </div>
  );
}
