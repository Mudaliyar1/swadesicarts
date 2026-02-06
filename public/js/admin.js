// Admin Dashboard JavaScript

// Sidebar toggle functionality
const sidebar = document.getElementById('sidebarDesktop');
const sidebarToggle = document.getElementById('sidebarToggle');

if (sidebarToggle) {
    // Check localStorage for sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }

    sidebarToggle.addEventListener('click', () => {
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    });
}

// Auto-hide alerts
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    });
}, 5000);

// Convert flash alerts to toast notifications
document.addEventListener('DOMContentLoaded', () => {
    const alerts = document.querySelectorAll('.alert.alert-success, .alert.alert-danger');
    alerts.forEach(alert => {
        const type = alert.classList.contains('alert-success') ? 'success' : 'danger';
        const message = alert.textContent.trim();
        if (message) {
            showToast(type === 'success' ? 'Success' : 'Error', message, type);
        }
        alert.remove();
    });
});

// Delete confirmation
function confirmDelete(id, type, url) {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', data.message, 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Error', data.message, 'danger');
            }
        })
        .catch(error => {
            showToast('Error', 'An error occurred', 'danger');
            console.error('Error:', error);
        });
    }
}

// Delete gallery item
function deleteGalleryItem(productId, itemId, type) {
    if (confirm('Are you sure you want to delete this gallery item?')) {
        fetch(`/admin/${type}/${productId}/gallery/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', data.message, 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                showToast('Error', data.message, 'danger');
            }
        })
        .catch(error => {
            showToast('Error', 'An error occurred', 'danger');
            console.error('Error:', error);
        });
    }
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}:</strong> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toastEl);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Image preview
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Update inquiry status
function updateInquiryStatus(inquiryId, status) {
    const adminNotes = document.getElementById('adminNotes')?.value || '';
    
    fetch(`/admin/inquiries/${inquiryId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Success', data.message, 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('Error', data.message, 'danger');
        }
    })
    .catch(error => {
        showToast('Error', 'An error occurred', 'danger');
        console.error('Error:', error);
    });
}

// Dynamic feature/benefit fields
function addField(buttonId, containerId, fieldName) {
    const container = document.getElementById(containerId);
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <input type="text" class="form-control" name="${fieldName}" placeholder="Enter ${fieldName}">
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove()">
            <i class="bi bi-trash"></i>
        </button>
    `;
    container.appendChild(newField);
}

// Form validation
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        if (!form.checkValidity()) {
            e.preventDefault();
            e.stopPropagation();
        }
        form.classList.add('was-validated');
    });
});

console.log('Admin dashboard loaded successfully');
