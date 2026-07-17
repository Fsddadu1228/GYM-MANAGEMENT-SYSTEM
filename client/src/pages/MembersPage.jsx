import React, { useCallback, useContext, useState, useEffect } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Clock3, Download, Printer, Search, UserCheck, Users, UserX, X } from 'lucide-react';
import { notify } from '../utils/toast';
import { formatDisplayDate, toLocalISODate } from '../utils/formatters';

export default function MembersPage({
  setActivePage,
  setSelectedProfileMemberId,
  openAddModalOnLoad,
  setOpenAddModalOnLoad
}) {
  const { members, addMember, updateMember, deleteMember, isAdmin } = useContext(GymContext);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [selectedRenewal, setSelectedRenewal] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingMember, setEditingMember] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('active');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  // Statistics calculation for filtered records
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const inactiveCount = members.filter((m) => m.status === 'inactive').length;
  const todayISO = toLocalISODate();
  const planOptions = [...new Set(members.map((m) => m.plan).filter(Boolean))].sort();
  const paymentMethodOptions = ['Cash', 'GCash'];

  const formatPaymentMethod = (method) => {
    if (!method) return 'No method';
    return String(method).toLowerCase() === 'gcash' ? 'GCash' : 'Cash';
  };

  const isExpired = (member) => {
    if (!member.nextPaymentDue) return false;
    const renewalDate = new Date(member.nextPaymentDue);
    if (Number.isNaN(renewalDate.getTime())) return false;
    return toLocalISODate(renewalDate) < todayISO;
  };

  const isDueSoon = (member) => {
    if (!member.nextPaymentDue || isExpired(member)) return false;
    const renewalDate = new Date(member.nextPaymentDue);
    if (Number.isNaN(renewalDate.getTime())) return false;
    const today = new Date(todayISO);
    const diffDays = Math.ceil((renewalDate - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const compareValues = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base' });
  };

  // Search, filter, and sorting logic
  const filtered = members.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
    const matchesPlan = selectedPlan === 'all' || m.plan === selectedPlan;
    const matchesPaymentStatus =
      selectedPaymentStatus === 'all' ||
      (selectedPaymentStatus === 'pending' && (m.paymentStatus || '').toLowerCase() !== 'paid') ||
      (m.paymentStatus || '').toLowerCase() === selectedPaymentStatus;
    const matchesPaymentMethod = selectedPaymentMethod === 'all' || formatPaymentMethod(m.paymentMethod) === selectedPaymentMethod;
    const matchesRenewal =
      selectedRenewal === 'all' ||
      (selectedRenewal === 'expired' && isExpired(m)) ||
      (selectedRenewal === 'due-soon' && isDueSoon(m)) ||
      (selectedRenewal === 'current' && !isExpired(m));
    return matchesSearch && matchesStatus && matchesPlan && matchesPaymentStatus && matchesPaymentMethod && matchesRenewal;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-desc':
        return compareValues(b.name, a.name);
      case 'join-newest':
        return compareValues(new Date(b.joined).getTime(), new Date(a.joined).getTime());
      case 'join-oldest':
        return compareValues(new Date(a.joined).getTime(), new Date(b.joined).getTime());
      case 'renewal-soon':
        return compareValues(new Date(a.nextPaymentDue || '9999-12-31').getTime(), new Date(b.nextPaymentDue || '9999-12-31').getTime());
      case 'plan':
        return compareValues(a.plan, b.plan);
      case 'status':
        return compareValues(a.status, b.status);
      case 'name-asc':
      default:
        return compareValues(a.name, b.name);
    }
  });

  const totalMatches = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
  
  // Ensure current page is in bounds
  const activeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const startIdx = (activeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalMatches);
  const paginated = filtered.slice(startIdx, endIdx);

  const getInitials = (n) => {
    return (n || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  };

  // Trigger modals
  const triggerAddModal = useCallback(() => {
    setModalMode('add');
    setEditingMember(null);
    setName('');
    setEmail('');
    setPhone('');
    setDob('');
    setAddress('');
    setPlan('Full Month');
    setStatus('active');
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setIsModalOpen(true);
  }, []);

  // Handle open add modal on redirect
  useEffect(() => {
    if (openAddModalOnLoad) {
      triggerAddModal();
      setOpenAddModalOnLoad(false); // reset trigger
    }
  }, [openAddModalOnLoad, setOpenAddModalOnLoad, triggerAddModal]);

  const triggerEditModal = (member) => {
    setModalMode('edit');
    setEditingMember(member);
    setName(member.name || '');
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setDob(member.dob || '');
    setAddress(member.address || '');
    setPlan(member.plan || '');
    setStatus(member.status || 'active');
    setEmergencyName(member.emergencyName || '');
    setEmergencyRelation(member.emergencyRelation || '');
    setEmergencyPhone(member.emergencyPhone || '');
    setIsModalOpen(true);
  };

  const triggerDeleteModal = (member) => {
    setMemberToDelete(member);
    setIsDeleteOpen(true);
  };

  // Submit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone || !plan) {
      notify('Please fill out all required fields.', 'error');
      return;
    }

    const payload = {
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
    };

    if (modalMode === 'edit' && editingMember) {
      const savedMember = await updateMember(editingMember.id, payload);
      if (savedMember) {
        notify('Changes saved successfully.');
      } else {
        notify('Unable to save changes. Please try again.', 'error');
      }
    } else {
      const createdMember = await addMember(payload);
      if (createdMember) {
        notify('Member added successfully.');
      } else {
        notify('Unable to add member. Please try again.', 'error');
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      const deleted = await deleteMember(memberToDelete.id);
      if (deleted) {
        notify('Member deleted successfully.');
      } else {
        notify('Unable to delete member. Please try again.', 'error');
      }
      setIsDeleteOpen(false);
      setMemberToDelete(null);
    }
  };

  // Select Row check helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = paginated.map((m) => m.id);
      setSelectedRowIds(ids);
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleRowCheck = (id) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter((rowId) => rowId !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  // Pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    if (activeCurrentPage > 1) {
      buttons.push(
        <button key="first" onClick={() => setCurrentPage(1)} className="page-btn">First</button>,
        <button key="prev" onClick={() => setCurrentPage(activeCurrentPage - 1)} className="page-btn">Prev</button>
      );
    }

    const startPage = Math.max(1, activeCurrentPage - 2);
    const endPage = Math.min(totalPages, activeCurrentPage + 2);

    if (startPage > 1) buttons.push(<span key="dots1" className="page-dots">...</span>);
    for (let p = startPage; p <= endPage; p++) {
      buttons.push(
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          className={`page-btn ${p === activeCurrentPage ? 'active' : ''}`}
        >
          {p}
        </button>
      );
    }
    if (endPage < totalPages) buttons.push(<span key="dots2" className="page-dots">...</span>);

    if (activeCurrentPage < totalPages) {
      buttons.push(
        <button key="next" onClick={() => setCurrentPage(activeCurrentPage + 1)} className="page-btn">Next</button>,
        <button key="last" onClick={() => setCurrentPage(totalPages)} className="page-btn">Last</button>
      );
    }

    return buttons;
  };

  const csvCell = (value) => {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
  };

  const escapeHtml = (value) => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  const handleExportMembersCsv = () => {
    const headers = [
      'Member ID',
      'Name',
      'Email',
      'Phone',
      'Plan',
      'Status',
      'Join Date',
      'Renewal Date',
      'Payment Status',
      'Payment Method',
      'Address',
      'Emergency Contact',
      'Emergency Phone'
    ];
    const rows = filtered.map((member) => [
      `MEM-${String(member.id).padStart(3, '0')}`,
      member.name,
      member.email,
      member.phone,
      member.plan,
      member.status,
      formatDisplayDate(member.joined, ''),
      formatDisplayDate(member.nextPaymentDue, ''),
      member.paymentStatus,
      formatPaymentMethod(member.paymentMethod),
      member.address,
      member.emergencyName,
      member.emergencyPhone
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
    downloadTextFile(`FitnessGym-members-${todayISO}.csv`, csv);
  };

  const handlePrintMembersReport = () => {
    const rowsHtml = filtered.map((member) => `
      <tr>
        <td>MEM-${String(member.id).padStart(3, '0')}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(member.plan)}</td>
        <td>${escapeHtml(member.status)}</td>
        <td>${escapeHtml(formatDisplayDate(member.nextPaymentDue))}</td>
        <td>${escapeHtml(member.paymentStatus || 'Pending')}</td>
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
        <title>FitnessGym Members Report</title>
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
        <h1>FitnessGym Members Report</h1>
        <p>Generated ${formatDisplayDate(new Date())} - ${filtered.length} filtered members</p>
        <section class="summary">
          <div><strong>${totalCount}</strong>Total members</div>
          <div><strong>${activeCount}</strong>Active</div>
          <div><strong>${pendingCount}</strong>Pending</div>
          <div><strong>${inactiveCount}</strong>Inactive</div>
        </section>
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Renewal</th><th>Payment</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td colspan="7">No members found.</td></tr>'}</tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ width: '100%' }}>
      <header className="topbar">
        <div>
          <p className="eyebrow">Gym management</p>
          <h1>Members</h1>
        </div>
        <div className="report-actions">
          <button onClick={handleExportMembersCsv} className="secondary-btn icon-text-btn" type="button">
            <Download size={16} /> CSV
          </button>
          <button onClick={handlePrintMembersReport} className="secondary-btn icon-text-btn" type="button">
            <Printer size={16} /> PDF
          </button>
          <button onClick={triggerAddModal} className="primary-btn" type="button">
            + Add new member
          </button>
        </div>
      </header>

      {/* Stats KPI Widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card-head">
            <span className="stat-icon stat-icon-total">
              <Users size={20} />
            </span>
            <h3>Total members</h3>
          </div>
          <p className="stat-value">{totalCount}</p>
        </article>
        <article className="stat-card">
          <div className="stat-card-head">
            <span className="stat-icon stat-icon-active">
              <UserCheck size={20} />
            </span>
            <h3>Active</h3>
          </div>
          <p className="stat-value active-count">{activeCount}</p>
        </article>
        <article className="stat-card">
          <div className="stat-card-head">
            <span className="stat-icon stat-icon-pending">
              <Clock3 size={20} />
            </span>
            <h3>Pending</h3>
          </div>
          <p className="stat-value pending-count">{pendingCount}</p>
        </article>
        <article className="stat-card">
          <div className="stat-card-head">
            <span className="stat-icon stat-icon-inactive">
              <UserX size={20} />
            </span>
            <h3>Inactive</h3>
          </div>
          <p className="stat-value inactive-count">{inactiveCount}</p>
        </article>
      </section>

      {/* Main Table Panel */}
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
                placeholder="Search by name or email"
                className="search-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <div className="toolbar-group-inline">
              <label htmlFor="statusFilter">Status:</label>
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
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="planFilter">Plan:</label>
              <select
                id="planFilter"
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
              <label htmlFor="renewalFilter">Renewal:</label>
              <select
                id="renewalFilter"
                value={selectedRenewal}
                onChange={(e) => {
                  setSelectedRenewal(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="expired">Expired</option>
                <option value="due-soon">Due soon</option>
                <option value="current">Current</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="memberPaymentFilter">Payment:</label>
              <select
                id="memberPaymentFilter"
                value={selectedPaymentStatus}
                onChange={(e) => {
                  setSelectedPaymentStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="memberPaymentMethodFilter">Method:</label>
              <select
                id="memberPaymentMethodFilter"
                value={selectedPaymentMethod}
                onChange={(e) => {
                  setSelectedPaymentMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="all">All</option>
                {paymentMethodOptions.map((methodOption) => (
                  <option key={methodOption} value={methodOption}>{methodOption}</option>
                ))}
              </select>
            </div>

            <div className="toolbar-group-inline">
              <label htmlFor="memberSort">Sort:</label>
              <select
                id="memberSort"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="select-inline"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="renewal-soon">Renewal soonest</option>
                <option value="join-newest">Newest joined</option>
                <option value="join-oldest">Oldest joined</option>
                <option value="plan">Plan</option>
                <option value="status">Status</option>
              </select>
            </div>

          </div>
        </div>

        {/* Member Table */}
        <div className="table-wrap">
          <table className="members-table-new">
            <thead>
              <tr>
                <th scope="col" className="col-checkbox">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginated.length > 0 && paginated.every((m) => selectedRowIds.includes(m.id))}
                    aria-label="Select all rows"
                  />
                </th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Membership ID</th>
                <th scope="col">Membership Type</th>
                <th scope="col">Renewal</th>
                <th scope="col">Payment</th>
                <th scope="col">Join Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No members found.
                  </td>
                </tr>
              ) : (
                paginated.map((member) => {
                  const memberIdStr = `MEM-${String(member.id).padStart(3, '0')}`;
                  const joinedDateStr = formatDisplayDate(member.joined, 'Not set');
                  const renewalDateStr = formatDisplayDate(member.nextPaymentDue);
                  const paymentStatus = (member.paymentStatus || 'Pending').toLowerCase();
                  const avatarMarkup = (
                    <div className="avatar">{member.avatar || getInitials(member.name)}</div>
                  );

                  return (
                    <tr key={member.id} className="member-row">
                      <td className="col-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(member.id)}
                          onChange={() => handleRowCheck(member.id)}
                          aria-label={`Select ${member.name}`}
                        />
                      </td>
                      <td className="col-name">
                        <div className="member-cell">
                          {avatarMarkup}
                          <span
                            onClick={() => {
                              setSelectedProfileMemberId(member.id);
                              setActivePage('profile');
                            }}
                            className="member-link"
                            role="button"
                            tabIndex={0}
                          >
                            {member.name}
                          </span>
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>{memberIdStr}</td>
                      <td>{member.plan}</td>
                      <td>
                        <span className={`status-badge ${isExpired(member) ? 'status-inactive' : isDueSoon(member) ? 'status-pending' : 'status-active'}`}>
                          {renewalDateStr}
                        </span>
                      </td>
                      <td>
                        <div className="payment-summary-cell">
                          <strong className={paymentStatus === 'paid' ? 'payment-ok' : 'payment-attention'}>
                            {member.paymentStatus || 'Pending'}
                          </strong>
                          <small>{formatPaymentMethod(member.paymentMethod)}</small>
                        </div>
                      </td>
                      <td>{joinedDateStr}</td>
                      <td>
                        <span className={`status-badge status-${member.status}`}>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div className="action-group">
                          <button
                            onClick={() => triggerEditModal(member)}
                            className="action-btn edit-btn"
                            type="button"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => triggerDeleteModal(member)}
                              className="action-btn delete-btn"
                              type="button"
                            >
                              Delete
                            </button>
                          )}
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
                Showing {startIdx + 1}-{endIdx} of {totalMatches} members
              </span>
              <label htmlFor="pageSize" className="rows-per-page">
                <span>Rows per page</span>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select-inline"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </label>
            </div>
            <div className="pagination">{renderPaginationButtons()}</div>
          </div>
        )}
      </section>

      {/* =========================================================
          ADD/EDIT MEMBER MODAL
          ========================================================= */}
      {isModalOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{modalMode === 'add' ? 'Add new member' : `Edit ${name}`}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
                style={{ position: 'static' }}
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleFormSubmit}>
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
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <label>
                  <span>Emergency Contact Name</span>
                  <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </label>
                <label>
                  <span>Emergency Relationship</span>
                  <input type="text" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
                </label>
                <label>
                  <span>Emergency Phone</span>
                  <input type="text" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="secondary-btn">
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  {modalMode === 'add' ? 'Save member' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DELETE CONFIRMATION MODAL
          ========================================================= */}
      {isDeleteOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card confirm-card">
            <h3>Delete member?</h3>
            <p>
              This action cannot be undone. <strong>{memberToDelete?.name}</strong> will be permanently removed from the records.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className="secondary-btn">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} type="button" className="delete-btn" style={{ border: 0, padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', background: '#ef4444', color: 'white' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
