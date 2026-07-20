import React, { useCallback, useContext, useState, useEffect } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Clock3, Download, Printer, Search, UserCheck, Users, UserX, X } from 'lucide-react';
import { notify } from '../utils/toast';
import { formatDisplayDate, toLocalISODate } from '../utils/formatters';
import { getDerivedMemberStatus, getDerivedMemberStatusLabel } from '../utils/memberStatus';
import { hasUnresolvedOverduePayment } from '../utils/paymentStatus';

const defaultMemberFilters = {
  search: '',
  status: 'all',
  plan: 'all',
  dateFrom: '',
  dateTo: ''
};

function calculateMembershipExpiry(startDate, plan) {
  if (!startDate) return '';
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return '';
  const durationDays = plan === 'Daily' ? 1 : plan === 'Half Month' ? 15 : 30;
  start.setDate(start.getDate() + durationDays);
  return toLocalISODate(start);
}

export default function MembersPage({
  setActivePage,
  setSelectedProfileMemberId,
  openAddModalOnLoad,
  setOpenAddModalOnLoad
}) {
  const {
    members,
    payments,
    addMember,
    updateMember,
    deleteMember,
    bulkUpdateMemberStatus,
    bulkDeleteMembers,
    isAdmin
  } = useContext(GymContext);

  // Filter States
  const [filters, setFilters] = useState(defaultMemberFilters);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingMember, setEditingMember] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

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
  const [startDate, setStartDate] = useState(toLocalISODate());

  // Statistics calculation for filtered records
  const todayISO = toLocalISODate();
  const visibleMembers = members;
  const totalCount = visibleMembers.length;
  const activeCount = visibleMembers.filter((m) => getDerivedMemberStatus(m, todayISO) === 'active').length;
  const pendingCount = visibleMembers.filter((m) => getDerivedMemberStatus(m, todayISO) === 'pending').length;
  const inactiveCount = visibleMembers.filter((m) => getDerivedMemberStatus(m, todayISO) === 'inactive').length;
  const planOptions = [...new Set(members.map((m) => m.plan).filter(Boolean))].sort();

  const compareValues = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity: 'base' });
  };

  // Search and filter logic
  const filtered = visibleMembers.filter((m) => {
    const searchTerm = filters.search.trim().toLowerCase();
    const joinedISO = toLocalISODate(m.joined);
    const derivedStatus = getDerivedMemberStatus(m, todayISO);
    const matchesSearch =
      !searchTerm ||
      (m.name || '').toLowerCase().includes(searchTerm) ||
      (m.email || '').toLowerCase().includes(searchTerm) ||
      (m.phone || '').toLowerCase().includes(searchTerm);
    const matchesStatus = filters.status === 'all' || derivedStatus === filters.status;
    const matchesPlan = filters.plan === 'all' || m.plan === filters.plan;
    const matchesDateFrom = !filters.dateFrom || (joinedISO && joinedISO >= filters.dateFrom);
    const matchesDateTo = !filters.dateTo || (joinedISO && joinedISO <= filters.dateTo);
    return matchesSearch && matchesStatus && matchesPlan && matchesDateFrom && matchesDateTo;
  }).sort((a, b) => {
    return compareValues(a.name, b.name);
  });

  const totalMatches = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
  
  // Ensure current page is in bounds
  const activeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const startIdx = (activeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalMatches);
  const paginated = filtered.slice(startIdx, endIdx);
  const selectedMembers = members.filter((member) => selectedRowIds.includes(member.id));
  const editingMemberLocked = Boolean(editingMember && hasUnresolvedOverduePayment(editingMember.id, payments));

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
    setSelectedRowIds([]);
    setBulkAction('');
  };

  const handleClearFilters = () => {
    setFilters(defaultMemberFilters);
    setCurrentPage(1);
    setSelectedRowIds([]);
    setBulkAction('');
  };

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
    setStartDate(toLocalISODate());
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
    setStatus(hasUnresolvedOverduePayment(member.id, payments) ? 'inactive' : member.status || 'active');
    setStartDate(member.joined || toLocalISODate());
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

    if (modalMode === 'edit' && status === 'active' && editingMemberLocked) {
      notify('Record a new payment before reactivating this member.', 'error');
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
      ...(modalMode === 'add' ? { joined: startDate } : {}),
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

  const handleBulkApply = async () => {
    if (!bulkAction) {
      notify('Choose a bulk action first.', 'error');
      return;
    }
    if (selectedRowIds.length === 0) {
      notify('Select at least one member first.', 'error');
      return;
    }

    if (bulkAction === 'export') {
      handleExportSelectedMembersCsv();
      notify(`Exported ${selectedRowIds.length} selected member${selectedRowIds.length === 1 ? '' : 's'}.`);
      setBulkAction('');
      return;
    }

    if (bulkAction === 'delete') {
      if (!isAdmin) {
        notify('Only admins can delete selected members.', 'error');
        return;
      }
      setIsBulkDeleteOpen(true);
      return;
    }

    const statusMap = {
      'mark-active': 'active',
      'mark-pending': 'pending',
      'mark-inactive': 'inactive'
    };
    const nextStatus = statusMap[bulkAction];
    if (!nextStatus) return;

    const updated = await bulkUpdateMemberStatus(selectedRowIds, nextStatus);
    if (updated) {
      notify(`${selectedRowIds.length} selected member${selectedRowIds.length === 1 ? '' : 's'} updated.`);
      setSelectedRowIds([]);
      setBulkAction('');
    } else {
      notify('Unable to update selected members. Please try again.', 'error');
    }
  };

  const handleBulkDeleteConfirm = async () => {
    const deleted = await bulkDeleteMembers(selectedRowIds);
    if (deleted) {
      notify(`${selectedRowIds.length} selected member${selectedRowIds.length === 1 ? '' : 's'} deleted.`);
      setSelectedRowIds([]);
      setBulkAction('');
    } else {
      notify('Unable to delete selected members. Please try again.', 'error');
    }
    setIsBulkDeleteOpen(false);
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

  const buildMembersCsv = (memberList) => {
    const headers = [
      'Member ID',
      'Name',
      'Email',
      'Phone',
      'Plan',
      'Status',
      'Join Date',
      'Address',
      'Emergency Contact',
      'Emergency Phone'
    ];
    const rows = memberList.map((member) => [
      `MEM-${String(member.id).padStart(3, '0')}`,
      member.name,
      member.email,
      member.phone,
      member.plan,
      getDerivedMemberStatusLabel(member, todayISO),
      formatDisplayDate(member.joined, ''),
      member.address,
      member.emergencyName,
      member.emergencyPhone
    ]);
    return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  };

  const handleExportMembersCsv = () => {
    const csv = buildMembersCsv(filtered);
    downloadTextFile(`FitnessGym-members-${todayISO}.csv`, csv);
  };

  const handleExportSelectedMembersCsv = () => {
    const csv = buildMembersCsv(selectedMembers);
    downloadTextFile(`FitnessGym-selected-members-${todayISO}.csv`, csv);
  };

  const handlePrintMembersReport = () => {
    const rowsHtml = filtered.map((member) => `
      <tr>
        <td>MEM-${String(member.id).padStart(3, '0')}</td>
        <td>${escapeHtml(member.name)}</td>
        <td>${escapeHtml(member.email)}</td>
        <td>${escapeHtml(member.plan)}</td>
        <td>${escapeHtml(getDerivedMemberStatusLabel(member, todayISO))}</td>
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
              <th>ID</th><th>Name</th><th>Email</th><th>Plan</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td colspan="5">No members found.</td></tr>'}</tbody>
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

      <section className="member-filter-card" aria-label="Member filters">
        <div className="member-filter-grid">
          <div className="toolbar-group">
            <label htmlFor="statusFilter">Membership Status</label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="select-inline"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="toolbar-group">
            <label htmlFor="planFilter">Membership Type</label>
            <select
              id="planFilter"
              value={filters.plan}
              onChange={(e) => updateFilter('plan', e.target.value)}
              className="select-inline"
            >
              <option value="all">All types</option>
              {planOptions.map((planOption) => (
                <option key={planOption} value={planOption}>{planOption}</option>
              ))}
            </select>
          </div>

          <div className="toolbar-group member-date-range" role="group" aria-labelledby="memberDateRangeLabel">
            <span id="memberDateRangeLabel" className="filter-label">Date Range</span>
            <div className="date-range-fields">
              <input
                id="memberDateFrom"
                type="date"
                aria-label="Date range start"
                value={filters.dateFrom}
                max={filters.dateTo || undefined}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="select-inline date-inline"
              />
              <input
                id="memberDateTo"
                type="date"
                aria-label="Date range end"
                value={filters.dateTo}
                min={filters.dateFrom || undefined}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="select-inline date-inline"
              />
            </div>
          </div>

          <div className="filter-actions member-filter-actions">
            <button className="secondary-btn" type="button" onClick={handleClearFilters}>
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {/* Main Table Panel */}
      <section className="panel">
        <div className="panel-toolbar-new members-table-toolbar">
          <div className="toolbar-left">
            <div className="search-box" style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Search by name or email"
                className="search-input"
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <div className="bulk-action-bar">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="select-inline bulk-action-select"
                aria-label="Bulk action"
              >
                <option value="">Bulk action</option>
                <option value="mark-active">Mark as Active</option>
                <option value="mark-pending">Mark as Pending</option>
                <option value="mark-inactive">Mark as Inactive</option>
                <option value="export">Export selected CSV</option>
                {isAdmin && <option value="delete">Delete selected</option>}
              </select>
              <button
                type="button"
                className="secondary-btn bulk-action-apply"
                onClick={handleBulkApply}
                disabled={!bulkAction || selectedRowIds.length === 0}
              >
                Apply
              </button>
              <span className="bulk-selected-count">
                {selectedRowIds.length} selected
              </span>
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
                <th scope="col">Join Date</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No members found.
                  </td>
                </tr>
              ) : (
                paginated.map((member) => {
                  const memberIdStr = `MEM-${String(member.id).padStart(3, '0')}`;
                  const joinedDateStr = formatDisplayDate(member.joined, 'Not set');
                  const derivedStatus = getDerivedMemberStatus(member, todayISO);
                  const derivedStatusLabel = getDerivedMemberStatusLabel(member, todayISO);
                  const avatarMarkup = (
                    <div className="avatar">{member.avatar || getInitials(member.name)}</div>
                  );

                  return (
                    <tr key={member.id} className="member-row">
                      <td className="col-checkbox" data-label="Select">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(member.id)}
                          onChange={() => handleRowCheck(member.id)}
                          aria-label={`Select ${member.name}`}
                        />
                      </td>
                      <td className="col-name" data-label="Name">
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
                      <td data-label="Email">{member.email}</td>
                      <td data-label="Membership ID">{memberIdStr}</td>
                      <td data-label="Membership Type">{member.plan}</td>
                      <td data-label="Join Date">{joinedDateStr}</td>
                      <td data-label="Status">
                        <span className={`status-badge status-${derivedStatus}`}>
                          {derivedStatusLabel}
                        </span>
                      </td>
                      <td data-label="Actions">
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
                Showing {startIdx + 1}-{endIdx} of {totalMatches} members - Page {activeCurrentPage} of {totalPages}
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
                {modalMode === 'add' && (
                  <label>
                    <span>Start Date *</span>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                    <small className="renewal-date-preview">
                      Membership expires on {formatDisplayDate(calculateMembershipExpiry(startDate, plan), 'Select a start date')}
                    </small>
                  </label>
                )}
                <label>
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active" disabled={modalMode === 'edit' && editingMemberLocked}>Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {modalMode === 'edit' && editingMemberLocked && (
                    <small className="field-help field-help-danger">Record a new payment to reactivate this member.</small>
                  )}
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
              <strong>{memberToDelete?.name}</strong> will be permanently removed from member records. Existing payment history will be retained for reports.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsDeleteOpen(false)} className="secondary-btn">
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} type="button" className="delete-btn" style={{ border: 0, padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', background: '#ef4444', color: 'white' }}>
                Delete member
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteOpen && (
        <div className="modal" aria-hidden="false">
          <div className="modal-card confirm-card">
            <h3>Delete selected members?</h3>
            <p>
              <strong>{selectedRowIds.length}</strong> selected member{selectedRowIds.length === 1 ? '' : 's'} will be permanently removed. Existing payment history will be retained for reports.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button type="button" onClick={() => setIsBulkDeleteOpen(false)} className="secondary-btn">
                Cancel
              </button>
              <button onClick={handleBulkDeleteConfirm} type="button" className="delete-btn" style={{ border: 0, padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', background: '#ef4444', color: 'white' }}>
                Delete selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
