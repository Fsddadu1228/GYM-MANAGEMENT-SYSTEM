import React, { useCallback, useContext, useState, useEffect } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Search, X } from 'lucide-react';

export default function PaymentsPage({
  openRecordModalOnLoad,
  setOpenRecordPaymentOnLoad
}) {
  const { members, payments, recordPayment, updatePayment } = useContext(GymContext);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPageSize = 5;

  // Modal States
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [recordMode, setRecordMode] = useState('record'); // 'record' or 'edit'
  const [editingPayment, setEditingPayment] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);

  // Form Fields State
  const [member, setMember] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('gcash');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState('');
  const [notes, setNotes] = useState('');

  // KPI Calculations
  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);

  const todayISO = new Date().toISOString().slice(0, 10);
  const paidToday = payments
    .filter((p) => p.status === 'paid' && p.paidISO === todayISO)
    .reduce((sum, p) => sum + Number((p.amount || '').replace(/[₱,]/g, '')), 0);

  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;

  // Search & Filtering
  const filtered = payments.filter((p) => {
    const matchesSearch = !searchTerm || (p.member || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || p.method === selectedMethod;
    return matchesSearch && matchesStatus && matchesMethod;
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
      setMember(members[0].name);
    }
    setAmount('');
    setMethod('gcash');
    setDate(new Date().toISOString().slice(0, 10));
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
    if (members.length > 0 && !member) {
      setMember(members[0].name);
    }
  }, [members, member]);

  const triggerEditModal = (payment) => {
    setRecordMode('edit');
    setEditingPayment(payment);
    setMember(payment.member);
    setAmount(payment.amount.replace(/[₱,]/g, '').trim());
    setMethod(payment.method);
    setDate(payment.paidISO || new Date().toISOString().slice(0, 10));
    setRef(payment.ref || '');
    setNotes(payment.notes || '');
    setIsRecordOpen(true);
  };

  const triggerDetailsModal = (payment) => {
    setViewingPayment(payment);
    setIsDetailsOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsOpen(false);
    setViewingPayment(null);
  };

  const formatCycle = (cycle) => {
    if (!cycle) return 'Monthly';
    return cycle.charAt(0).toUpperCase() + cycle.slice(1);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const amtNum = Number(amount);
    if (Number.isNaN(amtNum) || amtNum <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const selectedMember = members.find((m) => m.name === member);
    const plan = selectedMember ? selectedMember.plan : 'Basic';
    const amountStr = `₱${amtNum.toLocaleString('en-PH')}`;

    // Format paid date for short representation
    const formattedPaidDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const payload = {
      memberId: selectedMember ? selectedMember.id : editingPayment?.memberId ?? null,
      member,
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
        alert('Payment updated successfully.');
      } else {
        alert('Unable to update payment. Please try again.');
      }
    } else {
      const createdPayment = await recordPayment(payload);
      if (createdPayment) {
        alert('Payment recorded successfully.');
      } else {
        alert('Unable to record payment. Please try again.');
      }
    }

    setIsRecordOpen(false);
  };

  // Printing logic
  const handlePrint = (p) => {
    if (!p) return;
    const methodDisplay = p.method === 'gcash' ? 'GCash' : p.method === 'credit-card' ? 'Credit Card' : p.method.charAt(0).toUpperCase() + p.method.slice(1);
    
    const printHtml = `
      <html>
      <head>
        <title>Receipt ${p.invoice}</title>
        <style>
          body { font-family: 'Outfit', 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
          .receipt-box { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
          .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .header h2 { margin: 0; color: #2563eb; font-size: 1.8rem; }
          .header p { margin: 0; color: #64748b; font-size: 0.9rem; }
          .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 1rem; }
          .invoice-row strong { color: #475569; }
          .invoice-row span { color: #0f172a; font-weight: 600; }
          .footer { margin-top: 32px; text-align: center; color: #64748b; font-size: 0.9rem; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <h2>FitnessGym</h2>
              <p>Official Payment Receipt</p>
            </div>
            <div>
              <strong>${p.invoice}</strong>
            </div>
          </div>
          <div class="invoice-row"><strong>Member Name</strong><span>${p.member}</span></div>
          <div class="invoice-row"><strong>Membership Plan</strong><span>${p.plan}</span></div>
          <div class="invoice-row"><strong>Amount Paid</strong><span>${p.amount}</span></div>
          <div class="invoice-row"><strong>Payment Method</strong><span>${methodDisplay}</span></div>
          <div class="invoice-row"><strong>Reference ID</strong><span>${p.ref || '—'}</span></div>
          <div class="invoice-row"><strong>Status</strong><span style="color:#10b981;">PAID</span></div>
          <div class="invoice-row"><strong>Payment Date</strong><span>${p.paid}</span></div>
          <p style="margin-top:20px; font-style:italic; color:#64748b;">Notes: ${p.notes || 'No extra notes.'}</p>
          <div class="footer">
            <p>Thank you for choosing FitnessGym. Stay active, stay healthy!</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const w = window.open('', '_blank');
    if (!w) {
      alert('Popup blocker detected. Please allow popups to print receipt.');
      return;
    }
    w.document.open();
    w.document.write(printHtml);
    w.document.close();
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
        <button onClick={triggerRecordModal} className="primary-btn" type="button">
          + Record payment
        </button>
      </header>

      {/* KPI Stats widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">₱{totalRevenue.toLocaleString('en-PH')}</p>
        </article>
        <article className="stat-card">
          <h3>Paid Today</h3>
          <p className="stat-value active-count">₱{paidToday.toLocaleString('en-PH')}</p>
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
                <option value="bank">Bank</option>
                <option value="credit-card">Credit Card</option>
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
                  const methodDisplay = p.method === 'gcash' ? 'GCash' : p.method === 'credit-card' ? 'Credit Card' : p.method.charAt(0).toUpperCase() + p.method.slice(1);
                  const statusClass = p.status === 'paid' ? 'status-active' : p.status === 'pending' ? 'status-pending' : 'status-inactive';
                  const statusText = p.status === 'paid' ? 'Paid' : p.status === 'pending' ? 'Pending' : 'Overdue';

                  return (
                    <tr key={p.id} className="payment-row">
                      <td style={{ fontWeight: 600 }}>{p.member}</td>
                      <td>{p.plan}</td>
                      <td>{p.amount}</td>
                      <td>{methodDisplay}</td>
                      <td>{p.coverageEnd || p.due}</td>
                      <td>{p.paid || '—'}</td>
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
                        </div>
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
                Showing {startIdx + 1}–{endIdx} of {totalMatches} payments
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
                <select value={member} onChange={(e) => setMember(e.target.value)} required>
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
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
                  <option value="bank">Bank</option>
                  <option value="credit-card">Credit Card</option>
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
              <h2 style={{ margin: 0 }}>Payment Details</h2>
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
                  <span>{viewingPayment.member}</span>
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
                  <span>{viewingPayment.amount}</span>
                </div>
                <div className="invoice-row">
                  <strong>Coverage Start</strong>
                  <span>{viewingPayment.coverageStart || viewingPayment.paidISO || 'â€”'}</span>
                </div>
                <div className="invoice-row">
                  <strong>Renewal Date</strong>
                  <span>{viewingPayment.coverageEnd || viewingPayment.due || 'â€”'}</span>
                </div>
                <div className="invoice-row">
                  <strong>Method</strong>
                  <span>
                    {viewingPayment.method === 'gcash'
                      ? 'GCash'
                      : viewingPayment.method === 'credit-card'
                      ? 'Credit Card'
                      : viewingPayment.method.charAt(0).toUpperCase() + viewingPayment.method.slice(1)}
                  </span>
                </div>
                <div className="invoice-row">
                  <strong>Reference</strong>
                  <span>{viewingPayment.ref || '—'}</span>
                </div>
                <div className="invoice-row">
                  <strong>Status</strong>
                  <span>{viewingPayment.status.toUpperCase()}</span>
                </div>
                <div className="invoice-row">
                  <strong>Paid Date</strong>
                  <span>{viewingPayment.paid || '—'}</span>
                </div>
                <div className="invoice-row">
                  <strong>Notes</strong>
                  <span>{viewingPayment.notes || '—'}</span>
                </div>
              </div>
            </div>

            <footer className="modal-actions">
              <button onClick={closeDetailsModal} className="secondary-btn">
                Close
              </button>
              <button onClick={() => handlePrint(viewingPayment)} className="primary-btn">
                Print Receipt
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
