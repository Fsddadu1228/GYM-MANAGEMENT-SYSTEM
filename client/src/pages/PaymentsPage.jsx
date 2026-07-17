import React, { useCallback, useContext, useState, useEffect } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Download, Printer, ReceiptText, Search, Trash2, X } from 'lucide-react';
import { notify } from '../utils/toast';
import { formatDisplayDate, formatPHP, parseCurrencyAmount, toLocalISODate } from '../utils/formatters';

export default function PaymentsPage({
  openRecordModalOnLoad,
  setOpenRecordPaymentOnLoad
}) {
  const { members, payments, recordPayment, updatePayment, deletePayment } = useContext(GymContext);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [sortBy, setSortBy] = useState('paid-newest');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPageSize = 5;

  // Modal States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordMode, setRecordMode] = useState('record'); // 'record' or 'edit'
  const [editingPayment, setEditingPayment] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Form Fields State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('gcash');
  const [date, setDate] = useState(toLocalISODate());
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  // KPI Calculations
  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + parseCurrencyAmount(p.amount), 0);

  const todayISO = toLocalISODate();
  const paidToday = payments
    .filter((p) => p.status === 'paid' && p.paidISO === todayISO)
    .reduce((sum, p) => sum + parseCurrencyAmount(p.amount), 0);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;
  const planOptions = [...new Set(payments.map((p) => p.plan).filter(Boolean))].sort();

  const compareValues = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base' });
  };

  const normalizePaymentMethod = (paymentMethod) => (
    String(paymentMethod || '').toLowerCase() === 'gcash' ? 'gcash' : 'cash'
  );

  // Search & Filtering
  const filtered = payments.filter((p) => {
    const linkedMember = members.find((member) => member.id === p.memberId);
    const displayName = linkedMember?.name || p.member || '';
    const matchesSearch = !searchTerm || displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || normalizePaymentMethod(p.method) === selectedMethod;
    const matchesPlan = selectedPlan === 'all' || p.plan === selectedPlan;
    return matchesSearch && matchesStatus && matchesMethod && matchesPlan;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'paid-oldest':
        return compareValues(new Date(a.paidISO || a.createdAt || 0).getTime(), new Date(b.paidISO || b.createdAt || 0).getTime());
      case 'amount-high':
        return compareValues(parseCurrencyAmount(b.amount), parseCurrencyAmount(a.amount));
      case 'amount-low':
        return compareValues(parseCurrencyAmount(a.amount), parseCurrencyAmount(b.amount));
      case 'member-asc':
        return compareValues(a.member, b.member);
      case 'renewal-soon':
        return compareValues(new Date(a.coverageEnd || '9999-12-31').getTime(), new Date(b.coverageEnd || '9999-12-31').getTime());
      case 'status':
        return compareValues(a.status, b.status);
      case 'paid-newest':
      default:
        return compareValues(new Date(b.paidISO || b.createdAt || 0).getTime(), new Date(a.paidISO || a.createdAt || 0).getTime());
    }
  });

  const totalMatches = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / paymentsPageSize));
  const activeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const startIdx = (activeCurrentPage - 1) * paymentsPageSize;
  const endIdx = Math.min(startIdx + paymentsPageSize, totalMatches);
  const paginated = filtered.slice(startIdx, endIdx);

  // Form Trigger
  const triggerRecordModal = useCallback(() => {
    setRecordMode('record');
    setEditingPayment(null);
    if (members.length > 0) {
      setSelectedMemberId(String(members[0].id));
    }
    setAmount('');
    setMethod('gcash');
    setDate(toLocalISODate());
    setRef('');
    setNotes('');
    setIsRecordOpen(true);
  }, [members]);

  // Handle open record modal on redirect
  useEffect(() => {
    if (openRecordModalOnLoad) {
      triggerRecordModal();
      setOpenRecordPaymentOnLoad(false); // reset
    }
  }, [openRecordModalOnLoad, setOpenRecordPaymentOnLoad, triggerRecordModal]);

  // Set default member in dropdown if members exist
  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(String(members[0].id));
    }
  }, [members, selectedMemberId]);

  const triggerEditModal = (payment) => {
    setRecordMode('edit');
    setEditingPayment(payment);
    const linkedMember = members.find((m) => m.id === payment.memberId) || members.find((m) => m.name === payment.member);
    setSelectedMemberId(linkedMember ? String(linkedMember.id) : '');
    setAmount(String(payment.amount || '').replace(/[^0-9.]/g, '').trim());
    setMethod(normalizePaymentMethod(payment.method));
    setDate(payment.paidISO || toLocalISODate());
    setRef(payment.ref || '');
    setNotes(payment.notes || '');
    setIsRecordOpen(true);
  };

  const triggerDetailsModal = (payment) => {
    setViewingPayment(payment);
    setIsDetailsOpen(true);
  };

  const triggerDeleteModal = (payment) => {
    setPaymentToDelete(payment);
    setIsDeleteOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsOpen(false);
    setViewingPayment(null);
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    const deleted = await deletePayment(paymentToDelete.id);
    if (deleted) {
      notify('Payment deleted successfully.');
      setIsDeleteOpen(false);
      setPaymentToDelete(null);
      if (viewingPayment?.id === paymentToDelete.id) {
        closeDetailsModal();
      }
    } else {
      notify('Unable to delete payment. Please try again.', 'error');
    }
  };

  const formatCycle = (cycle) => {
    if (!cycle) return 'Monthly';
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  const formatMethod = (paymentMethod) => {
    if (!paymentMethod) return 'Not recorded';
    if (normalizePaymentMethod(paymentMethod) === 'gcash') return 'GCash';
    return 'Cash';
  };

  const getPaymentMember = (payment) => {
    return members.find((memberRecord) => memberRecord.id === payment.memberId) || null;
  };

  const getPaymentMemberName = (payment) => {
    return getPaymentMember(payment)?.name || payment.member || 'Unknown member';
  };

  const csvCell = (value) => {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
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

  const handleExportPaymentsCsv = () => {
    const headers = [
      'Payment ID',
      'Invoice',
      'Member ID',
      'Member Name',
      'Plan',
      'Amount',
      'Method',
      'Status',
      'Paid Date',
      'Renewal Date',
      'Reference',
      'Notes'
    ];
    const rows = filtered.map((payment) => [
      payment.id,
      payment.invoice,
      payment.memberId ? `MEM-${String(payment.memberId).padStart(3, '0')}` : '',
      getPaymentMemberName(payment),
      payment.plan,
      formatPHP(payment.amount),
      formatMethod(payment.method),
      payment.status,
      formatDisplayDate(payment.paidISO, payment.paid || ''),
      formatDisplayDate(payment.coverageEnd, payment.due || ''),
      payment.ref,
      payment.notes
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadTextFile(`FitnessGym-payments-${todayISO}.csv`, csv);
  };

  const handlePrintPaymentsReport = () => {
    const rowsHtml = filtered.map((payment) => `
      <tr>
        <td>${escapeHtml(payment.invoice)}</td>
        <td>${payment.memberId ? `MEM-${String(payment.memberId).padStart(3, '0')}` : ''}</td>
        <td>${escapeHtml(getPaymentMemberName(payment))}</td>
        <td>${escapeHtml(payment.plan)}</td>
        <td>${escapeHtml(formatPHP(payment.amount))}</td>
        <td>${escapeHtml(formatMethod(payment.method))}</td>
        <td>${escapeHtml(payment.status)}</td>
        <td>${escapeHtml(formatDisplayDate(payment.paidISO, payment.paid || ''))}</td>
        <td>${escapeHtml(formatDisplayDate(payment.coverageEnd, payment.due || ''))}</td>
      </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      notify('Popup blocker detected. Please allow popups to print the report.', 'error');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>FitnessGym Payments Report</title>
        <style>
          body { font-family: Segoe UI, Arial, sans-serif; padding: 32px; color: #172033; }
          h1 { margin: 0 0 6px; }
          p { margin: 0 0 22px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { text-align: left; color: #334155; background: #eef2f7; }
          th, td { padding: 9px 10px; border-bottom: 1px solid #dbe4ef; }
          .summary { display: flex; gap: 18px; margin: 18px 0; }
          .summary div { border: 1px solid #dbe4ef; border-radius: 10px; padding: 10px 14px; }
          .summary strong { display: block; font-size: 20px; }
        </style>
      </head>
      <body>
        <h1>FitnessGym Payments Report</h1>
        <p>Generated ${formatDisplayDate(new Date())} - ${filtered.length} filtered payments</p>
        <section class="summary">
          <div><strong>${formatPHP(totalRevenue)}</strong>Total revenue</div>
          <div><strong>${formatPHP(paidToday)}</strong>Paid today</div>
          <div><strong>${pendingCount}</strong>Pending</div>
          <div><strong>${overdueCount}</strong>Overdue</div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Invoice</th><th>Member ID</th><th>Member</th><th>Plan</th><th>Amount</th><th>Method</th><th>Status</th><th>Paid</th><th>Renewal</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td colspan="9">No payments found.</td></tr>'}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getReceiptHtml = (payment, shouldAutoPrint = false) => {
    const paidDate = formatDisplayDate(payment.paidISO, payment.paid || 'Not recorded');
    const renewalDate = formatDisplayDate(payment.coverageEnd, payment.due || 'Not recorded');

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt ${escapeHtml(payment.invoice || '')}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 36px; color: #172033; background: #f8fafc; }
          .receipt-box { max-width: 680px; margin: 0 auto; background: white; border: 1px solid #dbe4ef; padding: 34px; border-radius: 18px; box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08); }
          .header { border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
          .brand h1 { margin: 0; color: #0f172a; font-size: 2rem; letter-spacing: 0; }
          .brand p, .meta p { margin: 4px 0 0; color: #64748b; font-size: 0.95rem; }
          .meta { text-align: right; }
          .meta strong { display: block; color: #2563eb; font-size: 1.1rem; }
          .status { display: inline-block; margin-top: 10px; color: #166534; background: #dcfce7; padding: 6px 12px; border-radius: 999px; font-weight: 800; font-size: 0.8rem; }
          .amount { margin: 24px 0; padding: 20px; border-radius: 14px; background: #eff6ff; display: flex; justify-content: space-between; align-items: center; }
          .amount span { color: #1d4ed8; font-weight: 800; }
          .amount strong { color: #0f172a; font-size: 1.8rem; }
          .row { display: flex; justify-content: space-between; gap: 24px; padding: 13px 0; border-bottom: 1px solid #edf2f7; }
          .row span:first-child { color: #64748b; font-weight: 700; }
          .row span:last-child { color: #0f172a; font-weight: 800; text-align: right; }
          .notes { margin-top: 18px; color: #475569; line-height: 1.6; }
          .footer { margin-top: 30px; text-align: center; color: #64748b; font-size: 0.9rem; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          @media print {
            body { background: white; padding: 0; }
            .receipt-box { box-shadow: none; border: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <main class="receipt-box">
          <section class="header">
            <div class="brand">
              <h1>FitnessGym</h1>
              <p>Official Payment Receipt</p>
            </div>
            <div class="meta">
              <strong>${escapeHtml(payment.invoice || 'No invoice')}</strong>
              <p>${escapeHtml(paidDate)}</p>
              <span class="status">${escapeHtml((payment.status || 'paid').toUpperCase())}</span>
            </div>
          </section>
          <section class="amount">
            <span>Amount Paid</span>
            <strong>${escapeHtml(formatPHP(payment.amount))}</strong>
          </section>
          <section>
            <div class="row"><span>Member Name</span><span>${escapeHtml(getPaymentMemberName(payment))}</span></div>
            <div class="row"><span>Membership Plan</span><span>${escapeHtml(payment.plan)}</span></div>
            <div class="row"><span>Billing Cycle</span><span>${escapeHtml(formatCycle(payment.billingCycle))}</span></div>
            <div class="row"><span>Payment Method</span><span>${escapeHtml(formatMethod(payment.method))}</span></div>
            <div class="row"><span>Payment Date</span><span>${escapeHtml(paidDate)}</span></div>
            <div class="row"><span>Renewal Date</span><span>${escapeHtml(renewalDate)}</span></div>
            <div class="row"><span>Reference No.</span><span>${escapeHtml(payment.ref || 'Not recorded')}</span></div>
          </section>
          <p class="notes"><strong>Notes:</strong> ${escapeHtml(payment.notes || 'No extra notes.')}</p>
          <footer class="footer">Thank you for choosing FitnessGym. Stay active, stay healthy.</footer>
        </main>
        ${shouldAutoPrint ? '<script>window.onload = function() { window.print(); }</script>' : ''}
      </body>
      </html>
    `;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const amtNum = Number(amount);
    if (Number.isNaN(amtNum) || amtNum <= 0) {
      notify('Please enter a valid amount.', 'error');
      return;
    }

    const selectedMember = members.find((m) => m.id === Number(selectedMemberId));
    if (!selectedMember) {
      notify('Please choose a valid member.', 'error');
      return;
    }
    const plan = selectedMember ? selectedMember.plan : 'Full Month';
    const amountStr = formatPHP(amtNum);

    // Format paid date for short representation
    const formattedPaidDate = formatDisplayDate(date);

    const payload = {
      memberId: selectedMember.id,
      member: selectedMember.name,
      plan,
      amount: amountStr,
      method,
      due: formattedPaidDate,
      paid: formattedPaidDate,
      paidISO: date,
      ref,
      notes
    };

    if (recordMode === 'edit' && editingPayment) {
      const savedPayment = await updatePayment(editingPayment.id, payload);
      if (savedPayment) {
        notify('Payment updated successfully.');
      } else {
        notify('Unable to update payment. Please try again.', 'error');
      }
    } else {
      const createdPayment = await recordPayment(payload);
      if (createdPayment) {
        notify('Payment recorded successfully.');
        setViewingPayment(createdPayment);
        setIsDetailsOpen(true);
      } else {
        notify('Unable to record payment. Please try again.', 'error');
      }
    }

    setIsRecordOpen(false);
  };

  // Printing logic
  const handlePrint = (p) => {
    if (!p) return;
    const w = window.open('', '_blank');
    if (!w) {
      notify('Popup blocker detected. Please allow popups to print receipt.', 'error');
      return;
    }
    w.document.open();
    w.document.write(getReceiptHtml(p, true));
    w.document.close();
  };

  const handleDownloadReceipt = (p) => {
    if (!p) return;
    const blob = new Blob([getReceiptHtml(p)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeInvoice = String(p.invoice || `receipt-${p.id || Date.now()}`).replace(/[^a-z0-9-]/gi, '');
    link.href = url;
    link.download = `FitnessGym-${safeInvoice}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    if (activeCurrentPage > 1) {
      buttons.push(
        <button key="first" onClick={() => setCurrentPage(1)} className="page-btn">« First</button>,
        <button key="prev" onClick={() => setCurrentPage(activeCurrentPage - 1)} className="page-btn">‹ Prev</button>
      );
    }

    const startPage = Math.max(1, activeCurrentPage - 2);
    const endPage = Math.min(totalPages, activeCurrentPage + 2);
    if (startPage > 1) buttons.push(<span key="dots1" className="page-dots">...</span>);
    for (let page = startPage; page <= endPage; page++) {
      buttons.push(
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`page-btn ${page === activeCurrentPage ? 'active' : ''}`}
        >
          {page}
        </button>
      );
    }
    if (endPage < totalPages) buttons.push(<span key="dots2" className="page-dots">...</span>);

    if (activeCurrentPage < totalPages) {
      buttons.push(
        <button key="next" onClick={() => setCurrentPage(activeCurrentPage + 1)} className="page-btn">Next ›</button>,
        <button key="last" onClick={() => setCurrentPage(totalPages)} className="page-btn">Last »</button>
      );
    }

    return buttons;
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Gym management</p>
          <h1>Payments</h1>
        </div>
        <div className="report-actions">
          <button onClick={handleExportPaymentsCsv} className="secondary-btn icon-text-btn" type="button">
            <Download size={16} /> CSV
          </button>
          <button onClick={handlePrintPaymentsReport} className="secondary-btn icon-text-btn" type="button">
            <Printer size={16} /> PDF
          </button>
          <button onClick={triggerRecordModal} className="primary-btn" type="button">
            + Record payment
          </button>
        </div>
      </header>

      {/* KPI Stats widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">{formatPHP(totalRevenue)}</p>
        </article>
        <article className="stat-card">
          <h3>Paid Today</h3>
          <p className="stat-value active-count">{formatPHP(paidToday)}</p>
        </article>
        <article className="stat-card">
          <h3>Pending Payments</h3>
          <p className="stat-value pending-count">{pendingCount}</p>
        </article>
        <article className="stat-card">
          <h3>Overdue Payments</h3>
          <p className="stat-value inactive-count">{overdueCount}</p>
        </article>
      </section>

      {/* Payments list panel */}
      <section className="panel">
        <div className="panel-toolbar-new">
          <div className="toolbar-left">
            <div className="search-box" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="search-input"
                placeholder="Search Member"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <div className="toolbar-group-inline">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="paymentMethodFilter">Payment Method</label>
              <select
                id="paymentMethodFilter"
                value={selectedMethod}
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="paymentPlanFilter">Plan</label>
              <select
                id="paymentPlanFilter"
                value={selectedPlan}
                onChange={(e) => {
                  setSelectedPlan(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                {planOptions.map((planOption) => (
                  <option key={planOption} value={planOption}>{planOption}</option>
                ))}
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="paymentSort">Sort</label>
              <select
                id="paymentSort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="paid-newest">Newest paid</option>
                <option value="paid-oldest">Oldest paid</option>
                <option value="renewal-soon">Renewal soonest</option>
                <option value="amount-high">Amount high-low</option>
                <option value="amount-low">Amount low-high</option>
                <option value="member-asc">Member A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="members-table-new payments-table">
            <thead>
              <tr>
                <th scope="col">Member</th>
                <th scope="col">Plan</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Renewal Date</th>
                <th scope="col">Paid Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state" style={{ textAlign: 'center', padding: '24px' }}>
                    No payments found.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const memberDisplay = getPaymentMemberName(p);
                  const statusClass = p.status === 'paid' ? 'status-active' : p.status === 'pending' ? 'status-pending' : 'status-inactive';
                  const statusText = p.status === 'paid' ? 'Paid' : p.status === 'pending' ? 'Pending' : 'Overdue';

                  return (
                    <tr key={p.id} className="payment-row">
                      <td style={{ fontWeight: 600 }}>
                        {memberDisplay}
                        <small className="table-subtext">MEM-{String(p.memberId || '').padStart(3, '0')}</small>
                      </td>
                      <td>{p.plan}</td>
                      <td>{formatPHP(p.amount)}</td>
                      <td>{formatMethod(p.method)}</td>
                      <td>{formatDisplayDate(p.coverageEnd, p.due || 'Not recorded')}</td>
                      <td>{formatDisplayDate(p.paidISO, p.paid || 'Not recorded')}</td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>{statusText}</span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            onClick={() => triggerDetailsModal(p)}
                            className="action-btn view-btn"
                            type="button"
                          >
                            👁 View
                          </button>
                          <button
                            onClick={() => triggerEditModal(p)}
                            className="action-btn edit-btn"
                            type="button"
                          >
                            ✏ Edit
                          </button>
                          <button
                            onClick={() => triggerDeleteModal(p)}
                            className="action-btn delete-btn"
                            type="button"
                          >
                            <Trash2 size={14} /> Delete
                          </button>                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalMatches > 0 && (
          <div className="pagination-footer">
            <div className="pagination-info">
              <span>
                Showing {startIdx + 1}-{endIdx} of {totalMatches} payments
              </span>
            </div>
            <div className="pagination">{renderPaginationButtons()}</div>
          </div>
        )}
      </section>

      {/* =========================================================
          RECORD / EDIT PAYMENT MODAL
          ========================================================= */}
      {isRecordOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-panel">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>{recordMode === 'record' ? 'Record Payment' : 'Edit Payment'}</h2>
              <button onClick={() => setIsRecordOpen(false)} className="modal-close" style={{ position: 'static' }}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="modal-body">
              <label className="form-row">
                <span>Member</span>
                <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required>
                  {members.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      MEM-{String(m.id).padStart(3, '0')} - {m.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-row">
                <span>Amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>

              <label className="form-row">
                <span>Method</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)} required>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                </select>
              </label>

              <label className="form-row">
                <span>Date Paid</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>

              <label className="form-row">
                <span>Reference No.</span>
                <input
                  type="text"
                  placeholder="(Optional)"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                />
              </label>

              <label className="form-row">
                <span>Notes</span>
                <textarea
                  rows={3}
                  placeholder="Optional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              <footer className="modal-actions">
                <button type="button" onClick={() => setIsRecordOpen(false)} className="secondary-btn">
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Save
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          PAYMENT DETAILS MODAL
          ========================================================= */}
      {isDetailsOpen && viewingPayment && (
        <div className="modal" aria-hidden="false">
          <div className="modal-panel">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <ReceiptText size={22} /> Payment Receipt
              </h2>
              <button onClick={closeDetailsModal} className="modal-close" style={{ position: 'static' }}>
                <X size={20} />
              </button>
            </header>

            <div className="modal-body">
              <div className="payment-invoice">
                <div className="invoice-row">
                  <strong>Invoice</strong>
                  <span>{viewingPayment.invoice}</span>
                </div>
                <div className="invoice-row">
                  <strong>Member</strong>
                  <span>{getPaymentMemberName(viewingPayment)}</span>
                </div>
                <div className="invoice-row">
                  <strong>Membership</strong>
                  <span>{viewingPayment.plan}</span>
                </div>
                <div className="invoice-row">
                  <strong>Billing Cycle</strong>
                  <span>{formatCycle(viewingPayment.billingCycle)}</span>
                </div>
                <div className="invoice-row">
                  <strong>Amount</strong>
                  <span>{formatPHP(viewingPayment.amount)}</span>
                </div>
                <div className="invoice-row">
                  <strong>Coverage Start</strong>
                  <span>{formatDisplayDate(viewingPayment.coverageStart || viewingPayment.paidISO, 'Not recorded')}</span>
                </div>
                <div className="invoice-row">
                  <strong>Renewal Date</strong>
                  <span>{formatDisplayDate(viewingPayment.coverageEnd, viewingPayment.due || 'Not recorded')}</span>
                </div>
                <div className="invoice-row">
                  <strong>Method</strong>
                  <span>
                    {formatMethod(viewingPayment.method)}
                  </span>
                </div>
                <div className="invoice-row">
                  <strong>Reference</strong>
                  <span>{viewingPayment.ref || '-'}</span>
                </div>
                <div className="invoice-row">
                  <strong>Status</strong>
                  <span>{viewingPayment.status.toUpperCase()}</span>
                </div>
                <div className="invoice-row">
                  <strong>Paid Date</strong>
                  <span>{formatDisplayDate(viewingPayment.paidISO, viewingPayment.paid || 'Not recorded')}</span>
                </div>
                <div className="invoice-row">
                  <strong>Notes</strong>
                  <span>{viewingPayment.notes || '-'}</span>
                </div>
              </div>
            </div>

            <footer className="modal-actions">
              <button onClick={closeDetailsModal} className="secondary-btn">
                Close
              </button>
              <button onClick={() => handleDownloadReceipt(viewingPayment)} className="secondary-btn icon-text-btn">
                <Download size={16} /> Download
              </button>
              <button onClick={() => handlePrint(viewingPayment)} className="primary-btn icon-text-btn">
                <Printer size={16} /> Print Receipt
              </button>
            </footer>
          </div>
        </div>
      )}

      {isDeleteOpen && paymentToDelete && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card confirm-card">
            <h3>Delete payment?</h3>
            <p>
              This action cannot be undone. Invoice <strong>{paymentToDelete.invoice || `#${paymentToDelete.id}`}</strong> for{' '}
              <strong>{getPaymentMemberName(paymentToDelete)}</strong> will be removed from payment records.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className="secondary-btn">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} type="button" className="delete-btn danger-action-btn">
                Delete payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
