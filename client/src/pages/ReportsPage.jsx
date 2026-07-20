import React, { useContext, useState } from 'react';
import { Activity, AlertTriangle, CreditCard, Download, PieChart, Printer, TrendingUp, Users } from 'lucide-react';
import { GymContext } from '../context/GymContextObject';
import { formatDisplayDate, formatPHP, parseCurrencyAmount, toLocalISODate } from '../utils/formatters';
import { getDerivedMemberStatus, getDerivedMemberStatusLabel, isExpiredMember } from '../utils/memberStatus';
import { getDerivedPaymentStatus } from '../utils/paymentStatus';

export default function ReportsPage() {
  const { members, payments } = useContext(GymContext);

  const defaultToDate = toLocalISODate();
  const defaultFromDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return toLocalISODate(new Date(d.getFullYear(), d.getMonth(), 1));
  })();

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [planVal, setPlanVal] = useState('all');
  const [paymentStatusVal, setPaymentStatusVal] = useState('all');
  const [memberStatusVal, setMemberStatusVal] = useState('all');

  const reportRangeLabel = `${fromDate || 'Start'} to ${toDate || 'Today'}`;
  const todayISO = toLocalISODate();

  const normalize = (value) => String(value || '').toLowerCase();
  const normalizePlan = (value) => normalize(value || 'Full Month');
  const normalizeMethod = (value) => (normalize(value) === 'gcash' ? 'gcash' : 'cash');
  const formatMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const getPaymentDate = (payment) => payment.paidISO || payment.coverageEnd || payment.dueISO || payment.due || '';

  const dateInRange = (dateValue) => {
    const isoDate = formatDisplayDate(dateValue, '');
    if (!isoDate) return false;
    if (fromDate && isoDate < fromDate) return false;
    if (toDate && isoDate > toDate) return false;
    return true;
  };

  const paymentsInDateRange = payments.filter((payment) => {
    if (!dateInRange(getPaymentDate(payment))) return false;
    if (planVal !== 'all' && normalizePlan(payment.plan) !== planVal) return false;
    if (paymentStatusVal !== 'all' && getDerivedPaymentStatus(payment, todayISO) !== paymentStatusVal) return false;
    return true;
  });

  const reportMembers = members.filter((member) => {
    const derivedStatus = getDerivedMemberStatus(member, todayISO);
    if (planVal !== 'all' && normalizePlan(member.plan) !== planVal) return false;
    if (memberStatusVal !== 'all' && derivedStatus !== memberStatusVal) return false;
    return true;
  });

  const paidPayments = paymentsInDateRange.filter((payment) => getDerivedPaymentStatus(payment, todayISO) === 'paid');
  const totalRevenue = paidPayments.reduce((sum, payment) => sum + parseCurrencyAmount(payment.amount), 0);
  const pendingPayments = paymentsInDateRange.filter((payment) => getDerivedPaymentStatus(payment, todayISO) === 'pending').length;
  const overduePayments = paymentsInDateRange.filter((payment) => getDerivedPaymentStatus(payment, todayISO) === 'overdue').length;
  const paymentCount = paymentsInDateRange.length;
  const paidPaymentCount = paidPayments.length;
  const collectionRate = paymentCount > 0 ? Math.round((paidPaymentCount / paymentCount) * 100) : 0;
  const averagePaidPayment = paidPaymentCount > 0 ? totalRevenue / paidPaymentCount : 0;
  const activeReportMembers = reportMembers.filter((member) => getDerivedMemberStatus(member, todayISO) === 'active');
  const activeMembers = activeReportMembers.length;
  const inactiveMembers = reportMembers.filter((member) => getDerivedMemberStatus(member, todayISO) !== 'active').length;
  const expiredMembers = reportMembers
    .filter((member) => isExpiredMember(member, todayISO) && dateInRange(member.nextPaymentDue))
    .sort((a, b) => String(a.nextPaymentDue).localeCompare(String(b.nextPaymentDue)));

  const monthBuckets = (() => {
    const startDate = fromDate ? new Date(`${fromDate}T00:00:00`) : new Date();
    const endDate = toDate ? new Date(`${toDate}T00:00:00`) : new Date();
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    const buckets = [];
    const cursor = new Date(start);

    while (cursor <= end && buckets.length < 12) {
      buckets.push({
        key: formatMonthKey(cursor),
        label: formatMonthKey(cursor),
        revenue: 0,
        payments: 0
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets.length ? buckets : [{ key: formatMonthKey(new Date()), label: formatMonthKey(new Date()), revenue: 0, payments: 0 }];
  })();

  const revenueByMonth = monthBuckets.map((bucket) => {
    const monthPayments = paidPayments.filter((payment) => formatMonthKey(new Date(`${getPaymentDate(payment)}T00:00:00`)) === bucket.key);
    return {
      ...bucket,
      payments: monthPayments.length,
      revenue: monthPayments.reduce((sum, payment) => sum + parseCurrencyAmount(payment.amount), 0)
    };
  });

  const maxRevenue = Math.max(...revenueByMonth.map((item) => item.revenue), 1000);
  const hasRevenueData = revenueByMonth.some((item) => item.revenue > 0);
  const bestRevenueMonth = revenueByMonth.reduce((best, item) => (item.revenue > best.revenue ? item : best), revenueByMonth[0]);
  const averageMonthlyRevenue = revenueByMonth.length > 0 ? totalRevenue / revenueByMonth.length : 0;

  const methodLabels = {
    cash: 'Cash',
    gcash: 'GCash'
  };

  const paymentsByMethod = Object.entries(methodLabels).map(([method, label]) => {
    const methodPayments = paymentsInDateRange.filter((payment) => normalizeMethod(payment.method) === method);
    const paidMethodPayments = methodPayments.filter((payment) => getDerivedPaymentStatus(payment, todayISO) === 'paid');
    return {
      method,
      label,
      count: methodPayments.length,
      revenue: paidMethodPayments.reduce((sum, payment) => sum + parseCurrencyAmount(payment.amount), 0)
    };
  });

  const maxMethodCount = Math.max(...paymentsByMethod.map((item) => item.count), 1);
  const topPaymentMethod = paymentsByMethod.reduce((top, item) => (item.revenue > top.revenue ? item : top), paymentsByMethod[0]);
  const totalScopedMembers = activeMembers + inactiveMembers;
  const activePercent = totalScopedMembers > 0 ? Math.round((activeMembers / totalScopedMembers) * 100) : 0;
  const inactivePercent = totalScopedMembers > 0 ? 100 - activePercent : 0;
  const statusDonutStyle = totalScopedMembers > 0
    ? { background: `conic-gradient(#14b8a6 0% ${activePercent}%, #f43f5e ${activePercent}% 100%)` }
    : { background: '#1e293b' };
  const planColors = ['#4f8cff', '#2dd4bf', '#fbbf24', '#fb7185'];
  let planCursor = 0;
  const planBreakdown = Object.entries(activeReportMembers.reduce((acc, member) => {
    const plan = member.plan || 'Full Month';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {})).map(([plan, count], index) => {
    const percentage = activeMembers > 0 ? Math.round((count / activeMembers) * 100) : 0;
    const start = planCursor;
    planCursor += percentage;
    return {
      plan,
      count,
      percentage,
      color: planColors[index % planColors.length],
      slice: `${planColors[index % planColors.length]} ${start}% ${planCursor}%`
    };
  });
  const planDonutStyle = planBreakdown.length
    ? { background: `conic-gradient(${planBreakdown.map((item) => item.slice).join(', ')})` }
    : { background: '#1e293b' };

  const insightCards = [
    {
      label: 'Collection rate',
      value: `${collectionRate}%`,
      detail: `${paidPaymentCount} of ${paymentCount} payments collected`,
      icon: Activity,
      tone: collectionRate >= 80 ? 'good' : collectionRate >= 50 ? 'warn' : 'risk'
    },
    {
      label: 'Average paid transaction',
      value: formatPHP(averagePaidPayment),
      detail: `${paidPaymentCount} paid payment${paidPaymentCount === 1 ? '' : 's'}`,
      icon: CreditCard,
      tone: 'neutral'
    },
    {
      label: 'Best revenue month',
      value: bestRevenueMonth ? bestRevenueMonth.label : '-',
      detail: bestRevenueMonth ? `${formatPHP(bestRevenueMonth.revenue)} from ${bestRevenueMonth.payments} paid` : 'No revenue yet',
      icon: TrendingUp,
      tone: 'good'
    },
    {
      label: 'Top payment method',
      value: topPaymentMethod ? topPaymentMethod.label : '-',
      detail: topPaymentMethod ? `${formatPHP(topPaymentMethod.revenue)} collected` : 'No payments yet',
      icon: PieChart,
      tone: 'neutral'
    }
  ];

  const csvCell = (value) => {
    const cleanValue = String(value ?? '');
    return /[",\n]/.test(cleanValue) ? `"${cleanValue.replace(/"/g, '""')}"` : cleanValue;
  };

  const downloadTextFile = (filename, content, type = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const handleExportCsv = () => {
    const summaryRows = [
      ['Section', 'Metric', 'Value'],
      ['Summary', 'Date range', reportRangeLabel],
      ['Summary', 'Total revenue', formatPHP(totalRevenue)],
      ['Summary', 'Payments', paymentsInDateRange.length],
      ['Summary', 'Collection rate', `${collectionRate}%`],
      ['Summary', 'Average paid transaction', formatPHP(averagePaidPayment)],
      ['Summary', 'Active members', activeMembers],
      ['Summary', 'Inactive members', inactiveMembers],
      ['Summary', 'Expired memberships', expiredMembers.length],
      [],
      ['Revenue by month', 'Month', 'Revenue', 'Paid payments'],
      ...revenueByMonth.map((item) => ['Revenue by month', item.label, formatPHP(item.revenue), item.payments]),
      [],
      ['Payments by method', 'Method', 'Payments', 'Paid revenue'],
      ...paymentsByMethod.map((item) => ['Payments by method', item.label, item.count, formatPHP(item.revenue)]),
      [],
      ['Active membership mix', 'Plan', 'Members', 'Share'],
      ...planBreakdown.map((item) => ['Active membership mix', item.plan, item.count, `${item.percentage}%`]),
      [],
      ['Expired memberships', 'Member', 'Plan', 'Renewal date', 'Status'],
      ...expiredMembers.map((member) => ['Expired memberships', member.name, member.plan, formatDisplayDate(member.nextPaymentDue), getDerivedMemberStatusLabel(member, todayISO)])
    ];

    const csv = summaryRows.map((row) => row.map(csvCell).join(',')).join('\n');
    downloadTextFile(`FitnessGym-report-${toLocalISODate()}.csv`, csv);
  };

  const handlePrintPdf = () => {
    const revenueRows = revenueByMonth.map((item) => `
      <tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(formatPHP(item.revenue))}</td><td>${item.payments}</td></tr>
    `).join('');
    const methodRows = paymentsByMethod.map((item) => `
      <tr><td>${escapeHtml(item.label)}</td><td>${item.count}</td><td>${escapeHtml(formatPHP(item.revenue))}</td></tr>
    `).join('');
    const expiredRows = expiredMembers.map((member) => `
      <tr><td>${escapeHtml(member.name)}</td><td>${escapeHtml(member.plan)}</td><td>${escapeHtml(formatDisplayDate(member.nextPaymentDue))}</td><td>${escapeHtml(getDerivedMemberStatusLabel(member, todayISO))}</td></tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>FitnessGym Business Report</title>
        <style>
          body { font-family: Segoe UI, Arial, sans-serif; padding: 32px; color: #172033; }
          h1 { margin: 0 0 6px; }
          h2 { margin: 26px 0 10px; font-size: 18px; }
          p { margin: 0 0 18px; color: #64748b; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 18px 0; }
          .summary div { border: 1px solid #dbe4ef; border-radius: 10px; padding: 12px; }
          .summary strong { display: block; font-size: 20px; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; color: #334155; background: #eef2f7; }
          th, td { padding: 9px 10px; border-bottom: 1px solid #dbe4ef; }
        </style>
      </head>
      <body>
        <h1>FitnessGym Business Report</h1>
        <p>Date range: ${escapeHtml(reportRangeLabel)}. Filters apply to all sections.</p>
        <section class="summary">
          <div><strong>${escapeHtml(formatPHP(totalRevenue))}</strong>Total revenue</div>
          <div><strong>${paymentsInDateRange.length}</strong>Payments</div>
          <div><strong>${activeMembers}</strong>Active members</div>
          <div><strong>${expiredMembers.length}</strong>Expired memberships</div>
        </section>
        <p>Collection rate: ${collectionRate}%. Average paid transaction: ${escapeHtml(formatPHP(averagePaidPayment))}. Top method: ${escapeHtml(topPaymentMethod?.label || '-')}.</p>
        <h2>Revenue by Month</h2>
        <table><thead><tr><th>Month</th><th>Revenue</th><th>Paid payments</th></tr></thead><tbody>${revenueRows}</tbody></table>
        <h2>Payments by Method</h2>
        <table><thead><tr><th>Method</th><th>Payments</th><th>Paid revenue</th></tr></thead><tbody>${methodRows}</tbody></table>
        <h2>Expired Memberships</h2>
        <table><thead><tr><th>Member</th><th>Plan</th><th>Renewal date</th><th>Status</th></tr></thead><tbody>${expiredRows || '<tr><td colspan="4">No expired memberships in this range.</td></tr>'}</tbody></table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="reports-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Business intelligence</p>
          <h1>Reports</h1>
          <p className="dashboard-subtitle">Revenue, payments, membership status, and expiry risk for {reportRangeLabel}.</p>
        </div>
        <div className="report-actions">
          <button type="button" className="secondary-btn icon-text-btn" onClick={handleExportCsv}>
            <Download size={16} /> CSV
          </button>
          <button type="button" className="primary-btn icon-text-btn" onClick={handlePrintPdf}>
            <Printer size={16} /> PDF
          </button>
        </div>
      </header>

      <section className="panel report-filter-panel">
        <div className="panel-header">
          <div>
            <h2>Report filters</h2>
            <p>Date range, plan, payment status, and member status apply to every section below.</p>
          </div>
        </div>

        <div className="panel-toolbar-new report-filter-grid">
          <div className="toolbar-group">
            <label htmlFor="fromDate">From</label>
            <input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="toolbar-group">
            <label htmlFor="toDate">To</label>
            <input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="toolbar-group">
            <label htmlFor="planFilter">Plan</label>
            <select id="planFilter" value={planVal} onChange={(e) => setPlanVal(e.target.value)} className="select-inline">
              <option value="all">All plans</option>
              <option value="daily">Daily</option>
              <option value="half month">Half Month</option>
              <option value="full month">Full Month</option>
            </select>
          </div>
          <div className="toolbar-group">
            <label htmlFor="paymentStatusFilter">Payment status</label>
            <select id="paymentStatusFilter" value={paymentStatusVal} onChange={(e) => setPaymentStatusVal(e.target.value)} className="select-inline">
              <option value="all">All payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="toolbar-group">
            <label htmlFor="memberStatusFilter">Member status</label>
            <select id="memberStatusFilter" value={memberStatusVal} onChange={(e) => setMemberStatusVal(e.target.value)} className="select-inline">
              <option value="all">All members</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </section>

      <section className="stats-grid report-kpi-grid">
        <article className="stat-card report-kpi-card">
          <span className="report-kpi-icon"><TrendingUp size={18} /></span>
          <h3>Total Revenue</h3>
          <p className="stat-value">{formatPHP(totalRevenue)}</p>
          <small className="stat-note">Paid payments only</small>
        </article>
        <article className="stat-card report-kpi-card">
          <span className="report-kpi-icon"><CreditCard size={18} /></span>
          <h3>Payments</h3>
          <p className="stat-value">{paymentsInDateRange.length}</p>
          <small className="stat-note">{pendingPayments} pending, {overduePayments} overdue</small>
        </article>
        <article className="stat-card report-kpi-card">
          <span className="report-kpi-icon"><Users size={18} /></span>
          <h3>Active Members</h3>
          <p className="stat-value">{activeMembers}</p>
          <small className="stat-note">{inactiveMembers} inactive or pending</small>
        </article>
        <article className="stat-card report-kpi-card">
          <span className="report-kpi-icon"><AlertTriangle size={18} /></span>
          <h3>Expired Memberships</h3>
          <p className="stat-value">{expiredMembers.length}</p>
          <small className="stat-note">Renewal date before {todayISO}</small>
        </article>
      </section>

      <section className="report-insight-grid" aria-label="Report insights">
        {insightCards.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.label} className={`report-insight-card insight-${insight.tone}`}>
              <span><Icon size={18} /></span>
              <div>
                <small>{insight.label}</small>
                <strong>{insight.value}</strong>
                <p>{insight.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="charts-grid reports-business-grid">
        <article className="chart-card chart-card-wide report-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Revenue by Month</h3>
              <p>Paid revenue grouped by payment month.</p>
            </div>
            <div className="chart-meta">
              <strong>{formatPHP(totalRevenue)}</strong>
              <span>{paidPayments.length} paid</span>
            </div>
          </div>
          <div className="chart-placeholder chart-bar report-revenue-chart" aria-label="Revenue by month">
            {!hasRevenueData ? (
              <div className="chart-empty-state">No paid revenue in this date range.</div>
            ) : (
              <>
                <div className="axis-lines"></div>
                <div className="chart-y-axis">
                  <span>{formatPHP(maxRevenue)}</span>
                  <span>{formatPHP(averageMonthlyRevenue)}</span>
                  <span>0</span>
                </div>
                <div
                  className="report-average-line"
                  style={{ bottom: `${76 + Math.min((averageMonthlyRevenue / maxRevenue) * 190, 190)}px` }}
                >
                  <span>Avg {formatPHP(averageMonthlyRevenue)}</span>
                </div>
                {revenueByMonth.map((item) => {
                  const heightPercent = item.revenue > 0 ? Math.max((item.revenue / maxRevenue) * 88, 12) : 0;
                  const isBestMonth = bestRevenueMonth && item.key === bestRevenueMonth.key && item.revenue > 0;
                  return (
                    <div key={item.key} className="revenue-bar-wrap report-revenue-bar-wrap" title={`${item.label}: ${formatPHP(item.revenue)}`}>
                      <div className="report-bar-track">
                        <div className={`revenue-bar report-revenue-bar ${item.revenue === 0 ? 'is-empty' : ''} ${isBestMonth ? 'is-peak' : ''}`} style={{ height: `${heightPercent}%` }}>
                          {item.revenue > 0 && <span>{formatPHP(item.revenue)}</span>}
                        </div>
                      </div>
                      <small>
                        <strong>{item.label}</strong>
                        <span>{item.payments} paid</span>
                      </small>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </article>

        <article className="chart-card report-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Payments by Method</h3>
              <p>Volume and collected revenue by payment type.</p>
            </div>
          </div>
          <div className="report-method-list">
            {paymentsByMethod.map((item) => (
              <div key={item.method} className="report-method-row">
                <div>
                  <strong>{item.label}</strong>
                  <span>{formatPHP(item.revenue)} collected</span>
                </div>
                <div className="report-meter">
                  <span style={{ width: `${Math.max((item.count / maxMethodCount) * 100, item.count ? 8 : 0)}%` }}></span>
                </div>
                <b>{item.count}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card report-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Active vs Inactive Members</h3>
              <p>Membership status inside the current member filters.</p>
            </div>
          </div>
          <div className="report-status-layout">
            <div className="donut-chart report-status-donut" style={statusDonutStyle}>
              <span>
                {totalScopedMembers}
                <small>members</small>
              </span>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#14b8a6' }}></span>
                <p>Active</p>
                <strong>{activeMembers} ({activePercent}%)</strong>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f43f5e' }}></span>
                <p>Inactive / pending</p>
                <strong>{inactiveMembers} ({inactivePercent}%)</strong>
              </div>
            </div>
          </div>
        </article>

        <article className="chart-card report-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Active Membership Mix</h3>
              <p>Current active members grouped by membership type.</p>
            </div>
          </div>
          <div className="report-plan-layout">
            <div className="donut-chart report-plan-donut" style={planDonutStyle}>
              <span>
                {activeMembers}
                <small>active</small>
              </span>
            </div>
            <div className="report-plan-list">
              {planBreakdown.length === 0 ? (
                <div className="chart-empty-state">No members match these filters.</div>
              ) : (
                planBreakdown.map((item) => (
                  <div key={item.plan} className="report-plan-row">
                    <span className="legend-dot" style={{ background: item.color }}></span>
                    <strong>{item.plan}</strong>
                    <small>{item.count} {item.count === 1 ? 'member' : 'members'}</small>
                    <b>{item.percentage}%</b>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <article className="chart-card chart-card-wide report-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Expired Memberships</h3>
              <p>Members whose renewal date has already passed.</p>
            </div>
            <div className="chart-meta">
              <strong>{expiredMembers.length} expired</strong>
            </div>
          </div>
          <div className="table-wrap report-expired-table">
            <table className="members-table-new">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Plan</th>
                  <th scope="col">Renewal Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Payment</th>
                </tr>
              </thead>
              <tbody>
                {expiredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state" style={{ textAlign: 'center', padding: '24px' }}>
                      No expired memberships in this date range.
                    </td>
                  </tr>
                ) : (
                  expiredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.plan}</td>
                      <td>{formatDisplayDate(member.nextPaymentDue)}</td>
                      <td>
                        <span className={`status-badge status-${getDerivedMemberStatus(member, todayISO)}`}>
                          {getDerivedMemberStatusLabel(member, todayISO)}
                        </span>
                      </td>
                      <td>{member.lastPayment || 'Not recorded'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
