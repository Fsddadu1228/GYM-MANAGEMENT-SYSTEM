import React, { useContext, useState } from 'react';
import { GymContext } from '../context/GymContextObject';

export default function ReportsPage() {
  const { members, payments } = useContext(GymContext);

  // Initialize default date filters (last 6 months)
  const defaultToDate = new Date().toISOString().slice(0, 10);
  const defaultFromDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  })();

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
  const [planVal, setPlanVal] = useState('all');
  const [statusVal, setStatusVal] = useState('all');

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    if (planVal !== 'all' && p.plan.toLowerCase() !== planVal) return false;
    if (statusVal !== 'all' && p.status !== statusVal) return false;

    const pDate = p.paidISO || p.dueISO;
    if (pDate) {
      if (fromDate && pDate < fromDate) return false;
      if (toDate && pDate > toDate) return false;
    }
    return true;
  });

  // Filter members
  const filteredMembers = members.filter((m) => {
    if (planVal !== 'all' && m.plan.toLowerCase() !== planVal) return false;
    if (statusVal !== 'all' && m.status !== statusVal) return false;

    if (m.joined) {
      if (fromDate && m.joined < fromDate) return false;
      if (toDate && m.joined > toDate) return false;
    }
    return true;
  });

  // 1. KPI Calculations
  const totalRevenue = filteredPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);

  const currentMonthIndex = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = filteredPayments
    .filter((p) => {
      if (p.status !== 'paid' || !p.paidISO) return false;
      const d = new Date(p.paidISO);
      return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);

  const activeCount = filteredMembers.filter((m) => m.status === 'active').length;
  const totalPaymentsCount = filteredPayments.length;

  // Formatting helpers
  const formatPHP = (amt) => `₱${Number(amt).toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
  const formatShortPHP = (amt) => amt >= 1000 ? `₱${(amt / 1000).toFixed(1)}k` : `₱${amt}`;

  // 2. Bar Chart Data (Last 4 Months)
  const last4Months = (() => {
    const list = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth()
      });
    }
    return list;
  })();

  const barChartData = last4Months.map((m) => {
    const rev = payments
      .filter((p) => {
        if (p.status !== 'paid' || !p.paidISO) return false;
        const d = new Date(p.paidISO);
        const matchesPlan = planVal === 'all' || p.plan.toLowerCase() === planVal;
        return d.getMonth() === m.monthIndex && d.getFullYear() === m.year && matchesPlan;
      })
      .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);
    return { ...m, revenue: rev };
  });

  const maxRevenue = Math.max(...barChartData.map((d) => d.revenue), 1000);

  // 3. Growth Line Data (Last 5 Months)
  const last5Months = (() => {
    const list = [];
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push({
        name: d.toLocaleDateString('en-US', { month: 'short' }),
        year: d.getFullYear(),
        monthIndex: d.getMonth()
      });
    }
    return list;
  })();

  const growthTimeline = (() => {
    // Cumulative calculation
    const startOfTimeline = new Date(last5Months[0].year, last5Months[0].monthIndex, 1);
    let baseCount = members.filter((m) => {
      if (!m.joined) return false;
      const d = new Date(m.joined);
      const matchesPlan = planVal === 'all' || m.plan.toLowerCase() === planVal;
      return d < startOfTimeline && matchesPlan;
    }).length;

    return last5Months.map((m) => {
      const count = members.filter((member) => {
        if (!member.joined) return false;
        const d = new Date(member.joined);
        const matchesPlan = planVal === 'all' || member.plan.toLowerCase() === planVal;
        return d.getMonth() === m.monthIndex && d.getFullYear() === m.year && matchesPlan;
      }).length;
      baseCount += count;
      return { ...m, cumulative: baseCount };
    });
  })();

  const maxGrowthVal = Math.max(...growthTimeline.map((d) => d.cumulative), 5);

  // SVG dimensions
  const xCoords = [18, 112, 206, 300, 402];
  const yCoords = growthTimeline.map((val) => {
    const ratio = val.cumulative / maxGrowthVal;
    return 140 - ratio * 100; // scale between y=140 and y=40
  });

  const pointsPath = xCoords.map((x, idx) => `${x} ${yCoords[idx]}`).join(' L ');
  const growthPathStr = `M ${pointsPath}`;
  const growthAreaStr = `M ${xCoords[0]} 180 L ${pointsPath} L ${xCoords[xCoords.length - 1]} 180 Z`;

  // 4. Plan Mix Distribution Donut
  const planCounts = { Premium: 0, Standard: 0, Basic: 0 };
  filteredMembers.forEach((m) => {
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
    ? { background: `conic-gradient(${conicSlices.join(', ')})` }
    : { background: '#1e293b' };

  return (
    <div style={{ width: '100%' }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Gym management</p>
          <h1>Reports</h1>
        </div>
      </header>

      {/* Stats Widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">{formatPHP(totalRevenue)}</p>
        </article>
        <article className="stat-card">
          <h3>Monthly Revenue</h3>
          <p className="stat-value">{formatPHP(monthlyRevenue)}</p>
        </article>
        <article className="stat-card">
          <h3>Active Members</h3>
          <p className="stat-value">{activeCount}</p>
        </article>
        <article className="stat-card">
          <h3>Total Payments</h3>
          <p className="stat-value">{totalPaymentsCount}</p>
        </article>
      </section>

      {/* Reports Panel */}
      <section className="panel">
        <div className="panel-header">
          <h2>Report filters</h2>
        </div>

        {/* Filter Input controls */}
        <div className="panel-toolbar-new">
          <div className="toolbar-left" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="toolbar-group" style={{ minWidth: '150px' }}>
              <label htmlFor="fromDate">From</label>
              <input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="toolbar-group" style={{ minWidth: '150px' }}>
              <label htmlFor="toDate">To</label>
              <input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <div className="toolbar-group-inline">
              <label htmlFor="planFilter">Membership Plan</label>
              <select
                id="planFilter"
                value={planVal}
                onChange={(e) => setPlanVal(e.target.value)}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="statusFilter">Payment Status</label>
              <select
                id="statusFilter"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charts Grid Layout */}
        <div className="charts-grid">
          {/* Revenue Bar Chart */}
          <article className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Monthly Revenue</h3>
                <p>Last 4 months</p>
              </div>
            </div>
            <div className="chart-placeholder chart-bar" aria-label="Monthly revenue by month" style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around' }}>
              <div className="axis-lines"></div>
              {barChartData.map((d, index) => {
                const heightPercent = (d.revenue / maxRevenue) * 80 + 10;
                return (
                  <div key={index} className="revenue-bar-wrap" style={{ height: '100%' }}>
                    <div className="revenue-bar" style={{ height: `${heightPercent}%` }}>
                      <span>{formatShortPHP(d.revenue)}</span>
                    </div>
                    <small>{d.name}</small>
                  </div>
                );
              })}
            </div>
          </article>

          {/* Member Growth SVG Line Chart */}
          <article className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Member Growth</h3>
                <p>New signups (cumulative)</p>
              </div>
            </div>
            <div className="chart-placeholder chart-line" aria-label="Member growth by month">
              <div className="axis-lines"></div>
              <div className="line-plot" style={{ minHeight: '180px', position: 'relative' }}>
                <svg className="growth-line" viewBox="0 0 420 180" role="img" aria-hidden="true" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="growthArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="growth-area" d={growthAreaStr} fill="url(#growthArea)"></path>
                  <path className="growth-path" d={growthPathStr} fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                {xCoords.map((x, idx) => (
                  <span
                    key={idx}
                    className="line-dot"
                    style={{
                      left: `${(x / 420) * 100}%`,
                      top: `${(yCoords[idx] / 180) * 100}%`,
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <strong>{growthTimeline[idx].cumulative}</strong>
                  </span>
                ))}
              </div>
              <div className="line-labels">
                {last5Months.map((m, idx) => (
                  <span key={idx}>{m.name}</span>
                ))}
              </div>
            </div>
          </article>

          {/* Membership Distribution Donut Chart */}
          <article className="chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Membership Distribution</h3>
                <p>Plan mix</p>
              </div>
            </div>
            <div className="chart-placeholder distribution-chart" aria-label="Membership plan distribution">
              <div className="donut-chart" style={donutStyle}>
                <span>
                  {totalPlans}
                  <small>members</small>
                </span>
              </div>
              <div className="chart-legend" style={{ gap: '8px' }}>
                {planPercentages.map((p) => (
                  <div key={p.planName} className="legend-item">
                    <span className="legend-dot" style={{ background: colors[p.planName] }}></span>
                    <p>{p.planName}</p>
                    <strong>{p.count} ({p.percentage}%)</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
