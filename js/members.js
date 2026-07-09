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
let ActiveRow = null;
let activeProfileRow = null;
let modalMode = 'add';
let pendingDeleteRow = null;
let pendingAvatarData = "";
let currentPage = 1;

function getStatusMarkup(status) {
    const normalizedStatus = (status || '').toLowerCase();

    if (normalizedStatus === 'active') {
        return '<span class="status-badge status-active">Active</span>';
        
    }

    if (normalizedStaus === 'pending') {
        return '<span class="status-badge status-pending">Pending</span>';

    }

    return '<span class="status-badge status-inactive">Inactive</span>';

}

function getInitial(name) {
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
    .replace(/'/g, '&#39');
}