// Admin Dashboard JavaScript

// Global fetch interceptor for CSRF tokens
if (typeof window.originalFetch === 'undefined') {
    window.originalFetch = window.fetch;
    window.fetch = async function() {
        let [resource, config] = arguments;
        if (config && config.method && config.method.toUpperCase() !== 'GET') {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                config.headers = config.headers || {};
                config.headers['x-csrf-token'] = csrfToken;
            }
        }
        return window.originalFetch.apply(this, [resource, config]);
    };
}

// Sidebar toggle functionality
{
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
        // Find row to animate before fetching
        const row = document.getElementById(`row-${id}`);
        
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
                if (row) {
                    row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    row.style.opacity = '0';
                    row.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        row.remove();
                        // If table is empty, reload to show empty state
                        const tbody = document.querySelector('tbody');
                        if (tbody && tbody.querySelectorAll('tr').length === 0) {
                            location.reload();
                        }
                    }, 400);
                } else {
                    setTimeout(() => location.reload(), 1000);
                }
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
window.confirmDelete = confirmDelete;

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

// Bulk Select & Delete Client Logic
document.addEventListener('DOMContentLoaded', () => {
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectedCountText = document.getElementById('selectedCountText');

    function updateBulkActionsBar() {
        const checkedCount = document.querySelectorAll('.product-select-checkbox:checked').length;
        if (checkedCount > 0) {
            if (bulkActionsBar) {
                bulkActionsBar.classList.remove('d-none');
                bulkActionsBar.classList.add('d-flex');
            }
            if (selectedCountText) {
                selectedCountText.textContent = `${checkedCount} items selected`;
            }
        } else {
            if (bulkActionsBar) {
                bulkActionsBar.classList.remove('d-flex');
                bulkActionsBar.classList.add('d-none');
            }
        }
    }

    // Select all checkbox handler
    document.addEventListener('change', (e) => {
        if (e.target.id === 'selectAllCheckbox') {
            const productCheckboxes = document.querySelectorAll('.product-select-checkbox');
            productCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateBulkActionsBar();
        }
    });

    // Individual checkbox handler (Event Delegation)
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('product-select-checkbox')) {
            const productCheckboxes = document.querySelectorAll('.product-select-checkbox');
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            const allChecked = Array.from(productCheckboxes).every(c => c.checked);
            if (selectAllCheckbox) selectAllCheckbox.checked = allChecked;
            updateBulkActionsBar();
        }
    });

    // AJAX Filter & Pagination Handler
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        const searchInput = filterForm.querySelector('input[name="search"]');
        const selects = filterForm.querySelectorAll('select');
        
        let debounceTimer;
        
        function loadContent() {
            const formData = new FormData(filterForm);
            const params = new URLSearchParams();
            
            for (const [key, value] of formData.entries()) {
                if (value) params.append(key, value);
            }
            
            const url = `${filterForm.action}?${params.toString()}`;
            window.history.pushState({}, '', url);
            
            const tableContainer = document.querySelector('.table-responsive');
            if (tableContainer) tableContainer.style.opacity = '0.5';
            
            fetch(url)
                .then(res => res.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    const newTbody = doc.querySelector('tbody');
                    const currentTbody = document.querySelector('tbody');
                    if (newTbody && currentTbody) {
                        currentTbody.innerHTML = newTbody.innerHTML;
                    }
                    
                    const newFooter = doc.querySelector('.card-footer');
                    const currentFooter = document.querySelector('.card-footer');
                    
                    if (newFooter) {
                        if (currentFooter) {
                            currentFooter.outerHTML = newFooter.outerHTML;
                        } else {
                            const card = document.querySelector('.card');
                            if (card) {
                                const footerDiv = document.createElement('div');
                                footerDiv.outerHTML = newFooter.outerHTML;
                                card.appendChild(footerDiv);
                            }
                        }
                    } else if (currentFooter) {
                        currentFooter.remove();
                    }
                    
                    // Uncheck Select All header box and reset bulk bar
                    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
                    if (selectAllCheckbox) selectAllCheckbox.checked = false;
                    updateBulkActionsBar();
                    
                    rebindPaginationLinks();
                    if (tableContainer) tableContainer.style.opacity = '1';
                })
                .catch(err => {
                    console.error('AJAX load error:', err);
                    if (tableContainer) tableContainer.style.opacity = '1';
                });
        }
        
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadContent();
        });
        
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(loadContent, 350);
            });
        }
        
        selects.forEach(select => {
            select.removeAttribute('onchange');
            select.addEventListener('change', loadContent);
        });
        
        window.addEventListener('popstate', () => {
            location.reload();
        });
        
        function rebindPaginationLinks() {
            const paginationLinks = document.querySelectorAll('.pagination .page-link');
            paginationLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const urlObj = new URL(link.href);
                    const pageVal = urlObj.searchParams.get('page') || '1';
                    
                    const pageInput = filterForm.querySelector('input[name="page"]');
                    if (pageInput) {
                        pageInput.value = pageVal;
                        loadContent();
                    }
                });
            });
        }
        
        rebindPaginationLinks();
    }
});

function confirmBulkDelete(url) {
    const selectedCheckboxes = document.querySelectorAll('.product-select-checkbox:checked');
    const ids = Array.from(selectedCheckboxes).map(cb => cb.value);
    
    if (ids.length === 0) return;

    if (confirm(`Are you sure you want to delete these ${ids.length} items?`)) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Success', data.message, 'success');
                // Instantly fade out and remove all selected rows
                ids.forEach(id => {
                    const row = document.getElementById(`row-${id}`);
                    if (row) {
                        row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-20px)';
                        setTimeout(() => row.remove(), 400);
                    }
                });
                
                setTimeout(() => {
                    location.reload();
                }, 500);
            } else {
                showToast('Error', data.message, 'danger');
            }
        })
        .catch(error => {
            showToast('Error', 'An error occurred during bulk deletion', 'danger');
            console.error('Bulk delete error:', error);
        });
    }
}
window.confirmBulkDelete = confirmBulkDelete;

console.log('Admin dashboard loaded successfully');
