const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const selectAllCheckbox = document.getElementById('selectAll');
const addMemberButton = document.getElementById('addMemberButton');
const memberTableBody = document.getElementById('memberTableBody');
const memberModal = document.getElementById('memberModal');
const profileModal = document.getElementById('profileModal');
const deleteModal = document.getElementById('deleteModal');
const memberForm = document.getElementById('memberForm');
const profileContent = document.getElementById('profileContent');
const profileEditButton = document.getElementById('profileEditButton');
const profileDeleteButton = document.getElementById('profileDeleteButton');
const closeProfileModalButton = document.getElementById('closeProfileModal');
const cancelEditButton = document.getElementById('cancelEdit');
const cancelDeleteButton = document.getElementById('cancelDelete');
const confirmDeleteButton = document.getElementById('confirmDelete');
const modalTitle = document.getElementById('modalTitle');
const activeMemberId = document.getElementById('activeMemberId');
const memberNameInput = document.getElementById('memberName');
const memberEmailInput = document.getElementById('memberEmail');
const memberPhoneInput = document.getElementById('memberPhone');
const memberPlanInput = document.getElementById('memberPlan');
const memberStatusInput = document.getElementById('memberStatus');
const memberNoteInput = document.getElementById('memberNote');
const memberAvatarInput = document.getElementById('memberAvatar');
const avatarPreview = document.getElementById('avatarPreview');
const pagination = document.getElementById('pagination');
const pageInfo = document.getElementById('pageInfo');
const toastContainer = document.getElementById('toastContainer') || document.createElement('div');
if (!document.getElementById('toastContainer')) {
  toastContainer.id = 'toastContainer';
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
}
const pageSizeSelect = document.getElementById('pageSize');
const emptyState = document.getElementById('emptyState');

let pageSize = 10;
let memberRows = Array.from(document.querySelectorAll('.member-row'));
let activeRow = null;
let activeProfileRow = null;
let modalMode = 'add';
let pendingDeleteRow = null;
let pendingAvatarData = '';
let currentPage = 1;

function getStatusMarkup(status) {
  const normalizedStatus = (status || '').toLowerCase();

  if (normalizedStatus === 'active') {
    return '<span class="status-badge status-active">Active</span>';
  }

  if (normalizedStatus === 'pending') {
    return '<span class="status-badge status-pending">Pending</span>';
  }

  return '<span class="status-badge status-inactive">Inactive</span>';
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 200);
  }, 2800);
}

function updateAvatarPreview(source, fallbackName) {
  if (!source) {
    avatarPreview.innerHTML = fallbackName ? getInitials(fallbackName) : 'NA';
    return;
  }

  avatarPreview.innerHTML = `<img src="${source}" alt="Selected avatar preview">`;
}

function syncRowAvatar(row) {
  const avatar = row.querySelector('.avatar');
  if (!avatar) {
    return;
  }

  if (row.dataset.photo) {
    avatar.innerHTML = `<img src="${row.dataset.photo}" alt="${row.dataset.name} avatar">`;
  } else {
    avatar.textContent = getInitials(row.dataset.name);
  }
}

function updateRowDisplay(row) {
  const name = row.dataset.name || 'Unnamed member';
  const email = row.dataset.email || '';
  const phone = row.dataset.phone || '';
  const plan = row.dataset.plan || '';
  const status = row.dataset.status || 'active';
  const note = row.dataset.note || '';
  const joined = row.dataset.joined || '';

  const nameLink = row.querySelector('.member-link');
  if (nameLink) {
    nameLink.textContent = name;
  }

  row.cells[2].textContent = email;
  row.cells[3].textContent = plan;
  row.cells[4].innerHTML = getStatusMarkup(status);
  row.dataset.phone = phone;
  row.dataset.plan = plan;
  row.dataset.status = status;
  row.dataset.note = note;
  row.dataset.joined = joined;
}

function buildMemberRow(member) {
  const joinedDate = member.joined || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const rowMarkup = `
    <tr class="member-row" data-name="${escapeHtml(member.name)}" data-email="${escapeHtml(member.email)}" data-phone="${escapeHtml(member.phone || '')}" data-plan="${escapeHtml(member.plan || '')}" data-status="${escapeHtml(member.status)}" data-note="${escapeHtml(member.note || '')}" data-photo="${escapeHtml(member.photo || '')}" data-member-id="${member.id || ''}" data-joined="${escapeHtml(joinedDate)}">
      <td class="col-checkbox"><input type="checkbox" aria-label="Select ${escapeHtml(member.name)}"></td>
      <td class="col-name"><span class="member-link" role="button" tabindex="0" data-member-id="${member.id || ''}">${escapeHtml(member.name)}</span></td>
      <td>${escapeHtml(member.email)}</td>
      <td>${escapeHtml(member.plan || '')}</td>
      <td>${getStatusMarkup(member.status)}</td>
      <td>
        <div class="action-group">
          <button class="action-btn edit-btn" data-action="edit" type="button">Edit</button>
          <button class="action-btn delete-btn" data-action="delete" type="button">Delete</button>
        </div>
      </td>
    </tr>`;

  return rowMarkup;
}

function updateSummary() {
  const matchingRows = memberRows.filter((row) => row.dataset.matches === 'true');
  const activeCount = matchingRows.filter((row) => row.dataset.status === 'active').length;
  const pendingCount = matchingRows.filter((row) => row.dataset.status === 'pending').length;
  const inactiveCount = matchingRows.filter((row) => row.dataset.status === 'inactive').length;

  document.getElementById('total-members').textContent = matchingRows.length;
  document.getElementById('active-count').textContent = activeCount;
  document.getElementById('pending-count').textContent = pendingCount;
  document.getElementById('inactive-count').textContent = inactiveCount;

  const visibleRows = memberRows.filter((row) => !row.classList.contains('hidden'));
  const visibleCheckboxes = visibleRows.map((row) => row.querySelector('input[type="checkbox"]'));
  selectAllCheckbox.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every((checkbox) => checkbox.checked);
}

function renderPagination(totalMatches) {
  const totalPages = Math.max(1, Math.ceil(totalMatches / pageSize));
  if (totalMatches === 0) {
    pagination.innerHTML = '';
    pageInfo.textContent = 'No members found';
    return;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalMatches);
  pageInfo.textContent = `Showing ${start}–${end} of ${totalMatches} members`;

  if (totalMatches <= pageSize) {
    pagination.innerHTML = `
      <button class="page-btn active" type="button" disabled>1</button>
    `;
    return;
  }

  const buttons = [];
  
  if (currentPage > 1) {
    buttons.push(`<button class="page-btn" data-page="1" type="button">« First</button>`);
    buttons.push(`<button class="page-btn" data-page="${currentPage - 1}" type="button">‹ Prev</button>`);
  }

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    buttons.push(`<span class="page-dots">...</span>`);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    buttons.push(`<button class="page-btn${page === currentPage ? ' active' : ''}" data-page="${page}" type="button">${page}</button>`);
  }

  if (endPage < totalPages) {
    buttons.push(`<span class="page-dots">...</span>`);
  }

  if (currentPage < totalPages) {
    buttons.push(`<button class="page-btn" data-page="${currentPage + 1}" type="button">Next ›</button>`);
    buttons.push(`<button class="page-btn" data-page="${totalPages}" type="button">Last »</button>`);
  }

  pagination.innerHTML = buttons.join('');
}

function renderMemberCards() {
  // Cards are not used in this layout.
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  memberRows.forEach((row) => {
    const name = row.dataset.name.toLowerCase();
    const email = row.dataset.email.toLowerCase();
    const status = row.dataset.status;
    const matchesSearch = !searchTerm || name.includes(searchTerm) || email.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
    row.dataset.matches = matchesSearch && matchesStatus ? 'true' : 'false';
  });

  const matchingRows = memberRows.filter((row) => row.dataset.matches === 'true');
  if (currentPage > Math.max(1, Math.ceil(matchingRows.length / pageSize))) {
    currentPage = 1;
  }

  const start = (currentPage - 1) * pageSize;
  const pageRows = matchingRows.slice(start, start + pageSize);

  memberRows.forEach((row) => {
    const isVisible = row.dataset.matches === 'true' && pageRows.includes(row);
    row.classList.toggle('hidden', !isVisible);
  });

  renderPagination(matchingRows.length);
  renderMemberCards(pageRows);
  updateSummary();
  emptyState.classList.toggle('hidden', matchingRows.length !== 0);
}

function refreshRows() {
  memberRows = Array.from(document.querySelectorAll('.member-row'));
  memberRows.forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.setAttribute('aria-label', `Select ${row.dataset.name}`);
    }
  });
  currentPage = 1;
  // Only apply the members filters if the members controls are present.
  if (searchInput && statusFilter) {
    applyFilters();
  } else {
    // Show all member rows by default on pages that don't use filtering (e.g. payments page)
    memberRows.forEach((r) => r.classList.remove('hidden'));
  }
  // initialize payment view buttons for payments page
  initPaymentViewButtons();
  initPaymentEditButtons();
  // initialize payments pagination
  applyPaymentsPagination();
}

function initPaymentViewButtons() {
  const viewButtons = Array.from(document.querySelectorAll('.view-btn'));
  viewButtons.forEach((btn) => {
    // avoid adding duplicate handlers
    if (btn._hasViewHandler) return;
    btn._hasViewHandler = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('.payment-row');
      if (row) openPaymentDetails(row);
    });
  });
}

function initPaymentEditButtons() {
  const editButtons = Array.from(document.querySelectorAll('.payment-row .edit-btn'));
  editButtons.forEach((btn) => {
    if (btn._hasEditHandler) return;
    btn._hasEditHandler = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const row = btn.closest('.payment-row');
      if (row) openEditPayment(row);
    });
  });
}

// -- Payments pagination ------------------------------------------------
let paymentRows = Array.from(document.querySelectorAll('.payment-row'));
let paymentsPageSize = 5;
let paymentsCurrentPage = 1;

function renderPaymentsPagination(totalMatches) {
  const paymentsPagination = document.getElementById('paymentsPagination');
  const paymentsPageInfo = document.getElementById('paymentsPageInfo');
  if (!paymentsPagination || !paymentsPageInfo) return;

  const totalPages = Math.max(1, Math.ceil(totalMatches / paymentsPageSize));
  if (totalMatches === 0) {
    paymentsPagination.innerHTML = '';
    paymentsPageInfo.textContent = 'No payments found';
    return;
  }

  const start = (paymentsCurrentPage - 1) * paymentsPageSize + 1;
  const end = Math.min(paymentsCurrentPage * paymentsPageSize, totalMatches);
  paymentsPageInfo.textContent = `Showing ${start}–${end} of ${totalMatches} payments`;

  if (totalMatches <= paymentsPageSize) {
    paymentsPagination.innerHTML = `<button class="page-btn active" type="button" disabled>1</button>`;
    return;
  }

  const buttons = [];
  if (paymentsCurrentPage > 1) {
    buttons.push(`<button class="page-btn" data-page="1" type="button">« First</button>`);
    buttons.push(`<button class="page-btn" data-page="${paymentsCurrentPage - 1}" type="button">‹ Prev</button>`);
  }

  const startPage = Math.max(1, paymentsCurrentPage - 2);
  const endPage = Math.min(totalPages, paymentsCurrentPage + 2);
  if (startPage > 1) buttons.push(`<span class="page-dots">...</span>`);
  for (let p = startPage; p <= endPage; p += 1) {
    buttons.push(`<button class="page-btn${p === paymentsCurrentPage ? ' active' : ''}" data-page="${p}" type="button">${p}</button>`);
  }
  if (endPage < totalPages) buttons.push(`<span class="page-dots">...</span>`);
  if (paymentsCurrentPage < totalPages) {
    buttons.push(`<button class="page-btn" data-page="${paymentsCurrentPage + 1}" type="button">Next ›</button>`);
    buttons.push(`<button class="page-btn" data-page="${totalPages}" type="button">Last »</button>`);
  }

  paymentsPagination.innerHTML = buttons.join('');
}

function applyPaymentsPagination() {
  paymentRows = Array.from(document.querySelectorAll('.payment-row'));
  const total = paymentRows.length;
  const totalPages = Math.max(1, Math.ceil(total / paymentsPageSize));
  if (paymentsCurrentPage > totalPages) paymentsCurrentPage = 1;

  const start = (paymentsCurrentPage - 1) * paymentsPageSize;
  const pageRows = paymentRows.slice(start, start + paymentsPageSize);

  paymentRows.forEach((r) => r.classList.add('hidden'));
  pageRows.forEach((r) => r.classList.remove('hidden'));

  renderPaymentsPagination(total);
}

// attach click handler for payments pagination (delegated)
document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('#paymentsPagination .page-btn');
  if (!btn) return;
  const page = Number(btn.dataset.page);
  if (Number.isNaN(page)) return;
  paymentsCurrentPage = page;
  applyPaymentsPagination();
});

const profileDetailsByName = {
  'Amara Nkomo': {
    payments: ['Jan 2025 - Paid', 'Feb 2025 - Paid', 'Mar 2025 - Pending'],
    attendance: ['✓ July 1', '✓ July 2', '✓ July 4']
  },
  'Tendai Moyo': {
    payments: ['Jan 2025 - Pending', 'Feb 2025 - Pending'],
    attendance: ['✓ July 3', '✓ July 5']
  },
  'Liam Chidyausiku': {
    payments: ['Jan 2025 - Paid', 'Feb 2025 - Paid', 'Mar 2025 - Paid'],
    attendance: ['✓ July 1', '✓ July 6']
  },
  'Nadia Bvuma': {
    payments: ['Jan 2025 - Paid', 'Feb 2025 - Paid', 'Mar 2025 - Pending'],
    attendance: ['✓ July 2', '✓ July 4', '✓ July 7']
  }
};

function getMemberProfileDetails(row) {
  const name = row.dataset.name || 'Unnamed member';
  const details = profileDetailsByName[name] || {
    payments: ['No payment history yet'],
    attendance: ['No attendance recorded yet']
  };

  return {
    name,
    email: row.dataset.email || '—',
    phone: row.dataset.phone || '—',
    plan: row.dataset.plan || '—',
    status: row.dataset.status || 'active',
    joined: row.dataset.joined || '—',
    payments: details.payments,
    attendance: details.attendance
  };
}

function openProfileModal(row) {
  activeProfileRow = row;
  const profile = getMemberProfileDetails(row);
  const avatarMarkup = row.dataset.photo
    ? `<img src="${row.dataset.photo}" alt="${profile.name} avatar">`
    : getInitials(profile.name);

  profileContent.innerHTML = `
    <div class="profile-header">
      <div class="avatar profile-avatar">${avatarMarkup}</div>
      <div>
        <h3>${escapeHtml(profile.name)}</h3>
        <p class="profile-subtitle">${escapeHtml(profile.plan)} member</p>
      </div>
    </div>
    <div class="profile-grid">
      <div>
        <span class="profile-label">Email</span>
        <p>${escapeHtml(profile.email)}</p>
      </div>
      <div>
        <span class="profile-label">Phone</span>
        <p>${escapeHtml(profile.phone)}</p>
      </div>
      <div>
        <span class="profile-label">Membership</span>
        <p>${escapeHtml(profile.plan)}</p>
      </div>
      <div>
        <span class="profile-label">Status</span>
        <p>${escapeHtml(profile.status.charAt(0).toUpperCase() + profile.status.slice(1))}</p>
      </div>
      <div>
        <span class="profile-label">Join date</span>
        <p>${escapeHtml(profile.joined)}</p>
      </div>
      <div>
        <span class="profile-label">Coach note</span>
        <p>${escapeHtml(row.dataset.note || 'No note added')}</p>
      </div>
    </div>
    <div class="profile-section">
      <h4>Payment history</h4>
      <ul class="profile-list">
        ${profile.payments.map((payment) => `<li>${escapeHtml(payment)}</li>`).join('')}
      </ul>
    </div>
    <div class="profile-section">
      <h4>Attendance</h4>
      <ul class="profile-list">
        ${profile.attendance.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
      </ul>
    </div>
  `;

  profileModal.classList.remove('hidden');
  profileModal.setAttribute('aria-hidden', 'false');
}

function closeProfileModal() {
  profileModal.classList.add('hidden');
  profileModal.setAttribute('aria-hidden', 'true');
  activeProfileRow = null;
}

function openAddModal() {
  modalMode = 'add';
  modalTitle.textContent = 'Add new member';
  memberForm.reset();
  pendingAvatarData = '';
  updateAvatarPreview('', '');
  memberStatusInput.value = 'active';
  activeMemberId.value = '';
  memberModal.classList.remove('hidden');
  memberModal.setAttribute('aria-hidden', 'false');
  memberNameInput.focus();
}

function openEditModal(row) {
  modalMode = 'edit';
  activeRow = row;
  modalTitle.textContent = `Edit ${row.dataset.name}`;
  activeMemberId.value = row.dataset.name;
  memberNameInput.value = row.dataset.name;
  memberEmailInput.value = row.dataset.email;
  memberPhoneInput.value = row.dataset.phone || '';
  memberPlanInput.value = row.dataset.plan || '';
  memberStatusInput.value = row.dataset.status || 'active';
  memberNoteInput.value = row.dataset.note || '';
  pendingAvatarData = row.dataset.photo || '';
  updateAvatarPreview(pendingAvatarData, row.dataset.name);
  memberModal.classList.remove('hidden');
  memberModal.setAttribute('aria-hidden', 'false');
  memberNameInput.focus();
}

function closeModal() {
  memberModal.classList.add('hidden');
  memberModal.setAttribute('aria-hidden', 'true');
  deleteModal.classList.add('hidden');
  deleteModal.setAttribute('aria-hidden', 'true');
  closeProfileModal();
  activeRow = null;
  pendingDeleteRow = null;
  pendingAvatarData = '';
  modalMode = 'add';
}

function openDeleteModal(row) {
  pendingDeleteRow = row;
  deleteModal.classList.remove('hidden');
  deleteModal.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deleteModal.setAttribute('aria-hidden', 'true');
  pendingDeleteRow = null;
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    applyFilters();
  });
}

if (statusFilter) {
  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });
}

if (selectAllCheckbox) {
  selectAllCheckbox.addEventListener('change', () => {
    memberRows.filter((row) => !row.classList.contains('hidden')).forEach((row) => {
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = selectAllCheckbox.checked;
    });
  });
}

if (memberTableBody) {
  memberTableBody.addEventListener('change', (event) => {
    if (event.target.matches('input[type="checkbox"]')) {
      const currentPageRows = memberRows.filter((row) => !row.classList.contains('hidden'));
      const visibleCheckboxes = currentPageRows.map((row) => row.querySelector('input[type="checkbox"]'));
      if (selectAllCheckbox) selectAllCheckbox.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every((checkbox) => checkbox.checked);
    }
  });

  memberTableBody.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');
    if (actionButton) {
      const row = actionButton.closest('.member-row');

      if (actionButton.dataset.action === 'delete') {
        openDeleteModal(row);
        return;
      }

      if (actionButton.dataset.action === 'edit') {
        openEditModal(row);
      }

      return;
    }

    const memberLink = event.target.closest('.member-link');
    if (memberLink) {
      const memberId = memberLink.dataset.memberId;
      if (memberId) {
        window.location.href = `profile.html?id=${memberId}`;
      }
      return;
    }
  });
}

if (profileEditButton) {
  profileEditButton.addEventListener('click', () => {
    if (!activeProfileRow) return;
    closeProfileModal();
    openEditModal(activeProfileRow);
  });
}

if (profileDeleteButton) {
  profileDeleteButton.addEventListener('click', () => {
    if (!activeProfileRow) return;
    closeProfileModal();
    openDeleteModal(activeProfileRow);
  });
}

if (closeProfileModalButton) closeProfileModalButton.addEventListener('click', closeProfileModal);

if (memberForm) {
  memberForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = memberNameInput.value.trim();
    const email = memberEmailInput.value.trim();
    const phone = memberPhoneInput.value.trim();
    const plan = memberPlanInput.value.trim();
    const note = memberNoteInput.value.trim();
    const status = memberStatusInput.value;

    if (!name || !email || !phone || !plan) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    if (modalMode === 'edit' && activeRow) {
      activeRow.dataset.name = name;
      activeRow.dataset.email = email;
      activeRow.dataset.phone = phone;
      activeRow.dataset.plan = plan;
      activeRow.dataset.status = status;
      activeRow.dataset.note = note;
      activeRow.dataset.photo = pendingAvatarData;
      updateRowDisplay(activeRow);
      applyFilters();
      closeModal();
      showToast('Member updated successfully.', 'success');
      return;
    }

    if (memberTableBody) {
      memberTableBody.insertAdjacentHTML('beforeend', buildMemberRow({
        name,
        email,
        phone,
        plan,
        status,
        note,
        photo: pendingAvatarData
      }));
    }

    refreshRows();
    closeModal();
    showToast('Member added successfully.', 'success');
  });
}

if (cancelEditButton) cancelEditButton.addEventListener('click', closeModal);
if (cancelDeleteButton) cancelDeleteButton.addEventListener('click', closeDeleteModal);
if (confirmDeleteButton) confirmDeleteButton.addEventListener('click', () => {
  if (!pendingDeleteRow) {
    showToast('Failed to delete member.', 'error');
    return;
  }

  pendingDeleteRow.remove();
  refreshRows();
  closeDeleteModal();
  showToast('Member deleted successfully.', 'success');
});

if (memberModal) {
  memberModal.addEventListener('click', (event) => {
    if (event.target === memberModal) {
      closeModal();
    }
  });
}

if (profileModal) {
  profileModal.addEventListener('click', (event) => {
    if (event.target === profileModal) {
      closeProfileModal();
    }
  });
}

if (deleteModal) {
  deleteModal.addEventListener('click', (event) => {
    if (event.target === deleteModal) {
      closeDeleteModal();
    }
  });
}

if (addMemberButton) addMemberButton.addEventListener('click', openAddModal);

const recordPaymentHeaderButton = document.getElementById('recordPaymentHeaderButton');
if (recordPaymentHeaderButton) {
  recordPaymentHeaderButton.addEventListener('click', () => {
    const defaultRow = document.querySelector('.payment-row[data-status="pending"], .payment-row[data-status="overdue"], .payment-row');
    if (defaultRow) openRecordModal(defaultRow);
  });
}

if (pageSizeSelect) {
  pageSizeSelect.addEventListener('change', (event) => {
    pageSize = Number(event.target.value);
    currentPage = 1;
    applyFilters();
  });
}

if (pagination) {
  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('.page-btn');
    if (!button) return;
    currentPage = Number(button.dataset.page);
    applyFilters();
  });
}

if (memberAvatarInput) memberAvatarInput.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    pendingAvatarData = reader.result;
    updateAvatarPreview(pendingAvatarData, memberNameInput.value.trim());
  };
  reader.readAsDataURL(file);
});

// -- Record Payment modal (payments.html) -------------------------------
const recordModal = document.getElementById('recordPaymentModal');
const recordForm = document.getElementById('recordPaymentForm');
const recordMember = document.getElementById('recordMember');
const recordAmount = document.getElementById('recordAmount');
const recordMethod = document.getElementById('recordMethod');
const recordDate = document.getElementById('recordDate');
const recordRef = document.getElementById('recordRef');
const recordNotes = document.getElementById('recordNotes');
const recordCancel = document.getElementById('recordCancel');
const closeRecordModal = document.getElementById('closeRecordModal');

let activePaymentRow = null;
let recordModalMode = 'record'; // 'record' or 'edit'

function formatShortDateFromISO(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function openRecordModal(row) {
  if (!recordModal) return;
  activePaymentRow = row;
  recordModalMode = 'record';
  const paymentRows = Array.from(document.querySelectorAll('.payment-row'));
  recordMember.innerHTML = paymentRows.map((r) => ` <option value="${escapeHtml(r.dataset.member)}" ${r === row ? 'selected' : ''}>${escapeHtml(r.dataset.member)}</option>`).join('');
  const amt = row ? (row.dataset.amount || '').replace(/[₱,]/g, '').trim() : '';
  recordAmount.value = amt || '';
  recordMethod.value = row ? row.dataset.method || 'cash' : 'cash';
  const today = new Date().toISOString().slice(0, 10);
  recordDate.value = row ? row.dataset.paidISO || today : today;
  recordRef.value = '';
  recordNotes.value = '';
  recordModal.classList.remove('hidden');
  recordModal.setAttribute('aria-hidden', 'false');
  recordAmount.focus();
}

function openEditPayment(row) {
  if (!recordModal) return;
  activePaymentRow = row;
  recordModalMode = 'edit';
  const paymentRows = Array.from(document.querySelectorAll('.payment-row'));
  recordMember.innerHTML = paymentRows.map((r) => ` <option value="${escapeHtml(r.dataset.member)}" ${r === row ? 'selected' : ''}>${escapeHtml(r.dataset.member)}</option>`).join('');
  // populate fields from row
  const amt = (row.dataset.amount || '').replace(/[₱,]/g, '').trim();
  recordAmount.value = amt || '';
  recordMethod.value = row.dataset.method || 'cash';
  recordDate.value = row.dataset.paidISO || '';
  recordRef.value = row.dataset.ref || '';
  recordNotes.value = row.dataset.notes || '';
  recordModal.classList.remove('hidden');
  recordModal.setAttribute('aria-hidden', 'false');
  recordAmount.focus();
}

function closeRecordModalFn() {
  if (!recordModal) return;
  recordModal.classList.add('hidden');
  recordModal.setAttribute('aria-hidden', 'true');
  activePaymentRow = null;
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.record-btn');
  if (!btn) return;
  const row = btn.closest('.payment-row');
  if (!row) return;
  openRecordModal(row);
});

if (recordCancel) recordCancel.addEventListener('click', closeRecordModalFn);
if (closeRecordModal) closeRecordModal.addEventListener('click', closeRecordModalFn);
if (recordModal) {
  recordModal.addEventListener('click', (e) => { if (e.target === recordModal) closeRecordModalFn(); });
}

if (recordForm) {
  recordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!activePaymentRow) return;

    const member = recordMember.value;
    const amountNum = Number(recordAmount.value);
    if (Number.isNaN(amountNum)) { showToast('Enter a valid amount', 'error'); return; }
    const method = recordMethod.value;
    const isoDate = recordDate.value;
    const paidShort = isoDate ? formatShortDateFromISO(isoDate) : (activePaymentRow.dataset.paid || '—');
    const ref = recordRef.value.trim();
    const notes = recordNotes.value.trim();

    // common updates
    activePaymentRow.dataset.member = member;
    activePaymentRow.dataset.amount = `₱${Number(amountNum).toLocaleString('en-PH')}`;
    activePaymentRow.dataset.method = method;
    activePaymentRow.dataset.paid = paidShort;
    if (isoDate) activePaymentRow.dataset.paidISO = isoDate;
    if (ref) activePaymentRow.dataset.ref = ref; else delete activePaymentRow.dataset.ref;
    if (notes) activePaymentRow.dataset.notes = notes; else delete activePaymentRow.dataset.notes;

    activePaymentRow.cells[2].textContent = activePaymentRow.dataset.amount;
    const methodDisplay = method === 'gcash' ? 'GCash' : method === 'credit-card' ? 'Credit Card' : method.charAt(0).toUpperCase() + method.slice(1);
    activePaymentRow.cells[3].textContent = methodDisplay;
    activePaymentRow.cells[5].textContent = paidShort;

    if (recordModalMode === 'record') {
      activePaymentRow.dataset.status = 'paid';
      activePaymentRow.cells[6].innerHTML = '<span class="status-badge status-active">Paid</span>';
      showToast('Payment recorded', 'success');
    } else {
      // editing — keep status unless explicitly changed elsewhere
      const status = activePaymentRow.dataset.status || 'pending';
      const statusClass = status === 'paid' ? 'status-active' : status === 'pending' ? 'status-pending' : 'status-inactive';
      activePaymentRow.cells[6].innerHTML = `<span class="status-badge ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
      showToast('Payment updated', 'success');
    }

    closeRecordModalFn();
  });
}

// -----------------------------------------------------------------------
refreshRows();

// -- Payment Details modal (view) ---------------------------------------
const paymentDetailsModal = document.getElementById('paymentDetailsModal');
const paymentDetailsContent = document.getElementById('paymentDetailsContent');
const closePaymentDetails = document.getElementById('closePaymentDetails');
const paymentDetailsClose = document.getElementById('paymentDetailsClose');
const printReceiptBtn = document.getElementById('printReceipt');

function formatCurrency(value) {
  return `₱${Number(value).toLocaleString('en-PH')}`;
}

function generateInvoiceNumber() {
  const n = Math.floor(Math.random() * 900000) + 100000; // 6-digit
  return `#${String(n).slice(0, 6)}`;
}

function openPaymentDetails(row) {
  if (!paymentDetailsModal) return;
  const invoice = row.dataset.invoice || generateInvoiceNumber();
  const member = row.dataset.member || row.cells[0] && row.cells[0].textContent.trim() || 'Unknown';
  const plan = row.dataset.plan || row.cells[1] && row.cells[1].textContent.trim() || '—';
  const amount = row.dataset.amount || row.cells[2] && row.cells[2].textContent.trim() || '—';
  const method = row.dataset.method || row.cells[3] && row.cells[3].textContent.trim() || '—';
  const reference = row.dataset.ref || '—';
  const status = row.dataset.status || '—';
  const paid = row.dataset.paid || row.cells[5] && row.cells[5].textContent.trim() || '—';

  paymentDetailsContent.innerHTML = `
    <div class="payment-invoice">
      <div class="invoice-row"><strong>Invoice</strong><span>${escapeHtml(invoice)}</span></div>
      <div class="invoice-row"><strong>Member</strong><span>${escapeHtml(member)}</span></div>
      <div class="invoice-row"><strong>Membership</strong><span>${escapeHtml(plan)}</span></div>
      <div class="invoice-row"><strong>Amount</strong><span>${escapeHtml(amount)}</span></div>
      <div class="invoice-row"><strong>Method</strong><span>${escapeHtml(method)}</span></div>
      <div class="invoice-row"><strong>Reference</strong><span>${escapeHtml(reference)}</span></div>
      <div class="invoice-row"><strong>Status</strong><span>${escapeHtml(status.charAt(0).toUpperCase() + status.slice(1))}</span></div>
      <div class="invoice-row"><strong>Paid Date</strong><span>${escapeHtml(paid)}</span></div>
    </div>
  `;

  // store active row for printing
  paymentDetailsModal.dataset.activeRowIndex = Array.from(document.querySelectorAll('.payment-row')).indexOf(row);

  paymentDetailsModal.classList.remove('hidden');
  paymentDetailsModal.setAttribute('aria-hidden', 'false');
}

function closePaymentDetailsFn() {
  if (!paymentDetailsModal) return;
  paymentDetailsModal.classList.add('hidden');
  paymentDetailsModal.setAttribute('aria-hidden', 'true');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.view-btn');
  if (!btn) return;
  const row = btn.closest('.payment-row');
  if (!row) return;
  openPaymentDetails(row);
});

if (closePaymentDetails) closePaymentDetails.addEventListener('click', closePaymentDetailsFn);
if (paymentDetailsClose) paymentDetailsClose.addEventListener('click', closePaymentDetailsFn);
if (paymentDetailsModal) paymentDetailsModal.addEventListener('click', (e) => { if (e.target === paymentDetailsModal) closePaymentDetailsFn(); });

function printReceipt() {
  const idx = Number(paymentDetailsModal.dataset.activeRowIndex || -1);
  const rows = Array.from(document.querySelectorAll('.payment-row'));
  if (idx < 0 || idx >= rows.length) return;
  const row = rows[idx];
  const invoice = row.dataset.invoice || generateInvoiceNumber();
  const member = row.dataset.member || row.cells[0] && row.cells[0].textContent.trim() || 'Unknown';
  const plan = row.dataset.plan || row.cells[1] && row.cells[1].textContent.trim() || '—';
  const amount = row.dataset.amount || row.cells[2] && row.cells[2].textContent.trim() || '—';
  const method = row.dataset.method || row.cells[3] && row.cells[3].textContent.trim() || '—';
  const reference = row.dataset.ref || '—';
  const status = row.dataset.status || '—';
  const paid = row.dataset.paid || row.cells[5] && row.cells[5].textContent.trim() || '—';

  const html = `
    <html><head><title>Receipt ${escapeHtml(invoice)}</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;padding:24px} .invoice{max-width:600px;margin:0 auto} .invoice h2{margin-bottom:12px} .invoice-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}</style>
    </head><body>
    <div class="invoice">
      <h2>Receipt ${escapeHtml(invoice)}</h2>
      <div class="invoice-row"><strong>Member</strong><span>${escapeHtml(member)}</span></div>
      <div class="invoice-row"><strong>Membership</strong><span>${escapeHtml(plan)}</span></div>
      <div class="invoice-row"><strong>Amount</strong><span>${escapeHtml(amount)}</span></div>
      <div class="invoice-row"><strong>Method</strong><span>${escapeHtml(method)}</span></div>
      <div class="invoice-row"><strong>Reference</strong><span>${escapeHtml(reference)}</span></div>
      <div class="invoice-row"><strong>Status</strong><span>${escapeHtml(status)}</span></div>
      <div class="invoice-row"><strong>Paid Date</strong><span>${escapeHtml(paid)}</span></div>
      <p style="margin-top:18px">Thank you for your payment.</p>
    </div>
    <script>window.print();</script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    showToast('Pop-up blocked. Please allow pop-ups to print receipt.', 'error');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

if (printReceiptBtn) printReceiptBtn.addEventListener('click', printReceipt);
