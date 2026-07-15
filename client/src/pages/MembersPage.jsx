import React, { useCallback, useContext, useState, useEffect } from 'react';
import { GymContext } from '../context/GymContextObject';
import { Search, X } from 'lucide-react';

export default function MembersPage({
  setActivePage,
  setSelectedProfileMemberId,
  openAddModalOnLoad,
  setOpenAddModalOnLoad
}) {
  const { members, addMember, updateMember, deleteMember } = useContext(GymContext);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
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
  const [note, setNote] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');

  // Statistics calculation for filtered records
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'active').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;
  const inactiveCount = members.filter((m) => m.status === 'inactive').length;

  // Search & Status Filter logic
  const filtered = members.filter((m) => {
    const matchesSearch =
      !searchTerm ||
      (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalMatches = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
  
  // Ensure current page is in bounds
  const activeCurrentPage = currentPage > totalPages ? 1 : currentPage;

  const startIdx = (activeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalMatches);
  const paginated = filtered.slice(startIdx, endIdx);

  // Avatar conversion helper
  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
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
    setPlan('Premium');
    setStatus('active');
    setNote('');
    setSpecialty('');
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setPhoto('');
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
    setNote(member.note || '');
    setSpecialty(member.specialty || '');
    setEmergencyName(member.emergencyName || '');
    setEmergencyRelation(member.emergencyRelation || '');
    setEmergencyPhone(member.emergencyPhone || '');
    setPhoto(member.photo || '');
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
      alert('Please fill out all required fields');
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
      note,
      specialty,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      photo
    };

    if (modalMode === 'edit' && editingMember) {
      const savedMember = await updateMember(editingMember.id, payload);
      if (savedMember) {
        alert('Changes saved successfully.');
      } else {
        alert('Unable to save changes. Please try again.');
      }
    } else {
      const createdMember = await addMember(payload);
      if (createdMember) {
        alert('Member added successfully.');
      } else {
        alert('Unable to add member. Please try again.');
      }
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      const deleted = await deleteMember(memberToDelete.id);
      if (deleted) {
        alert('Member deleted successfully.');
      } else {
        alert('Unable to delete member. Please try again.');
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
        <button key="first" onClick={() => setCurrentPage(1)} className="page-btn">« First</button>,
        <button key="prev" onClick={() => setCurrentPage(activeCurrentPage - 1)} className="page-btn">‹ Prev</button>
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
          <h1>Members</h1>
        </div>
        <button onClick={triggerAddModal} className="primary-btn" type="button">
          + Add new member
        </button>
      </header>

      {/* Stats KPI Widgets */}
      <section className="stats-grid">
        <article className="stat-card">
          <h3>Total members</h3>
          <p className="stat-value">{totalCount}</p>
        </article>
        <article className="stat-card">
          <h3>Active</h3>
          <p className="stat-value active-count">{activeCount}</p>
        </article>
        <article className="stat-card">
          <h3>Pending</h3>
          <p className="stat-value pending-count">{pendingCount}</p>
        </article>
        <article className="stat-card">
          <h3>Inactive</h3>
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
              <label htmlFor="pageSize">Show:</label>
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
                  const joinedDateStr = member.joined
                    ? new Date(member.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';
                  const avatarMarkup = member.photo ? (
                    <div className="avatar">
                      <img src={member.photo} alt={member.name} />
                    </div>
                  ) : (
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
                          <button
                            onClick={() => triggerDeleteModal(member)}
                            className="action-btn delete-btn"
                            type="button"
                          >
                            Delete
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
                Showing {startIdx + 1}–{endIdx} of {totalMatches} members
              </span>
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
                  <input
                    type="text"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="e.g. Premium, Basic, Standard"
                    required
                  />
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
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Yoga, Crossfit"
                  />
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
                <label>
                  <span>Coach / Goal note</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Add coaching note"
                  />
                </label>
                <label>
                  <span>Profile Photo</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
                {photo && (
                  <div className="avatar-preview-wrap" style={{ marginTop: '8px' }}>
                    <div className="avatar-preview" style={{ border: 'none' }}>
                      <img src={photo} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                )}
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
