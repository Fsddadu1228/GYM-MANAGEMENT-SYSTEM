// Member Profile JavaScript

// Sample member database
const membersDatabase = {
    1: {
        id: 1,
        name: 'Amara Nkomo',
        specialty: 'Fitness Coach',
        email: 'amara@example.com',
        phone: '+263 77 123 4567',
        dob: 'May 15, 1990',
        address: '123 Fitness St, Harare, Zimbabwe',
        plan: 'Premium',
        status: 'active',
        joined: 'Jan 10, 2025',
        fee: '$99.99',
        note: 'Focused on strength and mobility. Strong form, consistent trainer. Monitor knee on squats.',
        visitThisMonth: 12,
        totalVisits: 47,
        lastVisit: 'Today at 10:30 AM',
        attendanceRate: '92%',
        nextPaymentDue: 'Apr 10, 2025',
        paymentMethod: 'Credit Card (****1234)',
        lastPayment: '$99.99 on Mar 10, 2025',
        paymentStatus: 'Paid',
        emergencyName: 'James Nkomo',
        emergencyRelation: 'Brother',
        emergencyPhone: '+263 77 123 4568',
        avatar: 'AN'
    },
    2: {
        id: 2,
        name: 'Tendai Moyo',
        specialty: 'Weight Loss',
        email: 'tendai@example.com',
        phone: '+263 78 234 5678',
        dob: 'March 22, 1985',
        address: '456 Health Ave, Bulawayo, Zimbabwe',
        plan: 'Basic',
        status: 'pending',
        joined: 'Feb 18, 2025',
        fee: '$49.99',
        note: 'Preparing for weight-loss challenge. Motivated and consistent. Track progress weekly.',
        visitThisMonth: 8,
        totalVisits: 20,
        lastVisit: 'Mar 08, 2025 at 6:30 PM',
        attendanceRate: '80%',
        nextPaymentDue: 'Mar 18, 2025',
        paymentMethod: 'Bank Transfer',
        lastPayment: '$49.99 on Feb 18, 2025',
        paymentStatus: 'Pending',
        emergencyName: 'Tendai Moyo Sr.',
        emergencyRelation: 'Father',
        emergencyPhone: '+263 78 234 5679',
        avatar: 'TM'
    },
    3: {
        id: 3,
        name: 'Liam Chidyausiku',
        specialty: 'Crossfit',
        email: 'liam@example.com',
        phone: '+263 71 345 6789',
        dob: 'July 8, 1992',
        address: '789 Power Lane, Mutare, Zimbabwe',
        plan: 'Standard',
        status: 'inactive',
        joined: 'Mar 05, 2025',
        fee: '$75.00',
        note: 'On break for the next month. Will return mid-April. Strong crossfit athlete.',
        visitThisMonth: 2,
        totalVisits: 5,
        lastVisit: 'Mar 06, 2025 at 5:45 AM',
        attendanceRate: '45%',
        nextPaymentDue: 'Apr 05, 2025',
        paymentMethod: 'Credit Card (****5678)',
        lastPayment: '$75.00 on Mar 05, 2025',
        paymentStatus: 'Paid',
        emergencyName: 'Sarah Chidyausiku',
        emergencyRelation: 'Sister',
        emergencyPhone: '+263 71 345 6790',
        avatar: 'LC'
    },
    4: {
        id: 4,
        name: 'Nadia Bvuma',
        specialty: 'Yoga',
        email: 'nadia@example.com',
        phone: '+263 79 456 7890',
        dob: 'September 12, 1988',
        address: '321 Zen Lane, Harare, Zimbabwe',
        plan: 'Premium',
        status: 'active',
        joined: 'Apr 12, 2025',
        fee: '$99.99',
        note: 'Yoga and recovery plan. Excellent form, very flexible. Recovering from old injury.',
        visitThisMonth: 10,
        totalVisits: 30,
        lastVisit: 'Mar 09, 2025 at 7:00 AM',
        attendanceRate: '88%',
        nextPaymentDue: 'May 12, 2025',
        paymentMethod: 'Mobile Money',
        lastPayment: '$99.99 on Apr 12, 2025',
        paymentStatus: 'Paid',
        emergencyName: 'David Bvuma',
        emergencyRelation: 'Spouse',
        emergencyPhone: '+263 79 456 7891',
        avatar: 'NB'
    }
};

// Get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Load member profile
function loadMemberProfile() {
    const memberId = getUrlParam('id');
    const member = membersDatabase[memberId];

    if (!member) {
        showNoMemberFound();
        return;
    }

    // Populate profile header
    document.getElementById('profileName').textContent = member.name;
    document.getElementById('profileFullName').textContent = member.name;
    document.getElementById('profileSpecialty').textContent = member.specialty;
    document.getElementById('profileAvatarLarge').textContent = member.avatar;

    // Populate status badge
    const statusBadge = document.getElementById('profileStatusBadge');
    statusBadge.textContent = member.status.charAt(0).toUpperCase() + member.status.slice(1);
    statusBadge.className = `status-badge status-${member.status}`;

    // Populate quick stats
    document.getElementById('profilePlan').textContent = member.plan;
    document.getElementById('profileJoined').textContent = member.joined;
    document.getElementById('profileStatusText').textContent = member.status.charAt(0).toUpperCase() + member.status.slice(1);
    document.getElementById('profileFee').textContent = member.fee;

    // Populate contact information
    document.getElementById('profileEmail').textContent = member.email;
    document.getElementById('profilePhone').textContent = member.phone;
    document.getElementById('profileDOB').textContent = member.dob;
    document.getElementById('profileAddress').textContent = member.address;

    // Populate coach's note
    document.getElementById('profileNote').textContent = member.note;

    // Populate attendance stats
    document.getElementById('visitThisMonth').textContent = member.visitThisMonth;
    document.getElementById('totalVisits').textContent = member.totalVisits;
    document.getElementById('lastVisit').textContent = member.lastVisit;
    document.getElementById('attendanceRate').textContent = member.attendanceRate;

    // Populate payment information
    document.getElementById('nextPaymentDue').textContent = member.nextPaymentDue;
    document.getElementById('paymentMethod').textContent = member.paymentMethod;
    document.getElementById('lastPayment').textContent = member.lastPayment;
    document.getElementById('paymentStatus').textContent = member.paymentStatus;

    // Populate emergency contact
    document.getElementById('emergencyName').textContent = member.emergencyName;
    document.getElementById('emergencyRelation').textContent = member.emergencyRelation;
    document.getElementById('emergencyPhone').textContent = member.emergencyPhone;

    // Store current member ID for edit/delete operations
    document.getElementById('editMemberId').value = memberId;
}

// Show no member found message
function showNoMemberFound() {
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = `
        <div class="empty-state">
            <h2>Member Not Found</h2>
            <p>The member profile you're looking for doesn't exist.</p>
            <a href="members.html" class="primary-btn">Back to Members</a>
        </div>
    `;
}

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Edit member modal
document.getElementById('editProfileButton').addEventListener('click', () => {
    const memberId = document.getElementById('editMemberId').value;
    const member = membersDatabase[memberId];

    if (member) {
        document.getElementById('editMemberName').value = member.name;
        document.getElementById('editMemberEmail').value = member.email;
        document.getElementById('editMemberPhone').value = member.phone;
        document.getElementById('editMemberDOB').value = formatDateForInput(member.dob);
        document.getElementById('editMemberAddress').value = member.address;
        document.getElementById('editMemberPlan').value = member.plan;
        document.getElementById('editMemberStatus').value = member.status;
        document.getElementById('editMemberNote').value = member.note;

        document.getElementById('editMemberModal').classList.remove('hidden');
        document.getElementById('editMemberModal').setAttribute('aria-hidden', 'false');
    }
});

// Format date for input (dd Mon, yyyy to yyyy-mm-dd)
function formatDateForInput(dateStr) {
    // This is a simple conversion - adjust based on your actual date format
    return '1990-05-15'; // Placeholder
}

// Cancel edit
document.getElementById('cancelEditProfile').addEventListener('click', () => {
    document.getElementById('editMemberModal').classList.add('hidden');
    document.getElementById('editMemberModal').setAttribute('aria-hidden', 'true');
});

// Save edit
document.getElementById('editMemberForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const memberId = document.getElementById('editMemberId').value;
    const member = membersDatabase[memberId];

    if (member) {
        member.name = document.getElementById('editMemberName').value;
        member.email = document.getElementById('editMemberEmail').value;
        member.phone = document.getElementById('editMemberPhone').value;
        member.address = document.getElementById('editMemberAddress').value;
        member.plan = document.getElementById('editMemberPlan').value;
        member.status = document.getElementById('editMemberStatus').value;
        member.note = document.getElementById('editMemberNote').value;

        loadMemberProfile();
        document.getElementById('editMemberModal').classList.add('hidden');
        document.getElementById('editMemberModal').setAttribute('aria-hidden', 'true');
        showToast('Member updated successfully');
    }
});

// Delete member
document.getElementById('deleteProfileButton').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.remove('hidden');
    document.getElementById('deleteConfirmModal').setAttribute('aria-hidden', 'false');
});

// Cancel delete
document.getElementById('cancelDeleteProfile').addEventListener('click', () => {
    document.getElementById('deleteConfirmModal').classList.add('hidden');
    document.getElementById('deleteConfirmModal').setAttribute('aria-hidden', 'true');
});

// Confirm delete
document.getElementById('confirmDeleteProfile').addEventListener('click', () => {
    const memberId = document.getElementById('editMemberId').value;
    delete membersDatabase[memberId];
    
    showToast('Member deleted successfully');
    
    setTimeout(() => {
        window.location.href = 'members.html';
    }, 2000);
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadMemberProfile();
});

// Back link
document.querySelector('.back-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
});
