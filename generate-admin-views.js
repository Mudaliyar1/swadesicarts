// Helper script to generate admin CRUD views
// Run: node generate-admin-views.js

const fs = require('fs');
const path = require('path');

const adminViewsDir = path.join(__dirname, 'views', 'admin');

// Create directories if they don't exist
['seasonal', 'tech', 'organic', 'inquiries'].forEach(dir => {
    const dirPath = path.join(adminViewsDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Template for list views
const listTemplate = (type, title, pluralTitle) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %> - Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/css/admin.css">
</head>
<body class="admin-body">
    <nav class="navbar navbar-dark bg-swadesi d-lg-none">
        <div class="container-fluid">
            <button class="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#sidebar">
                <span class="navbar-toggler-icon"></span>
            </button>
            <span class="navbar-brand mb-0">Swadesi Admin</span>
            <a href="/admin/logout" class="btn btn-sm btn-outline-light">
                <i class="bi bi-box-arrow-right"></i>
            </a>
        </div>
    </nav>

    <div class="admin-sidebar d-none d-lg-flex flex-column" id="sidebarDesktop">
        <div class="sidebar-header">
            <h5 class="mb-0"><i class="bi bi-speedometer2"></i> <span class="sidebar-text">Admin Panel</span></h5>
        </div>
        <ul class="sidebar-nav flex-grow-1">
            <li><a href="/admin/dashboard" title="Dashboard"><i class="bi bi-speedometer2"></i><span class="sidebar-text">Dashboard</span></a></li>
            <li><a href="/admin/seasonal-products" class="<%= '${type}' === 'seasonal' ? 'active' : '' %>" title="Seasonal Products"><i class="bi bi-calendar3"></i><span class="sidebar-text">Seasonal Products</span></a></li>
            <li><a href="/admin/tech-packages" class="<%= '${type}' === 'tech' ? 'active' : '' %>" title="Tech Packages"><i class="bi bi-laptop"></i><span class="sidebar-text">Tech Packages</span></a></li>
            <li><a href="/admin/organic-products" class="<%= '${type}' === 'organic' ? 'active' : '' %>" title="Organic Products"><i class="bi bi-flower2"></i><span class="sidebar-text">Organic Products</span></a></li>
            <li><a href="/admin/inquiries" title="Inquiries"><i class="bi bi-chat-dots"></i><span class="sidebar-text">Inquiries</span></a></li>
        </ul>
        <div class="sidebar-footer">
            <a href="/" target="_blank" title="View Website"><i class="bi bi-globe"></i><span class="sidebar-text">View Website</span></a>
            <a href="/admin/logout" title="Logout"><i class="bi bi-box-arrow-right"></i><span class="sidebar-text">Logout</span></a>
        </div>
        <button class="sidebar-toggle d-none d-lg-block" id="sidebarToggle">
            <i class="bi bi-chevron-left"></i>
        </button>
    </div>

    <div class="offcanvas offcanvas-start bg-swadesi text-white" tabindex="-1" id="sidebar">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title">Admin Panel</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
        </div>
        <div class="offcanvas-body p-0">
            <ul class="sidebar-nav-mobile">
                <li><a href="/admin/dashboard"><i class="bi bi-speedometer2"></i> Dashboard</a></li>
                <li><a href="/admin/seasonal-products"><i class="bi bi-calendar3"></i> Seasonal Products</a></li>
                <li><a href="/admin/tech-packages"><i class="bi bi-laptop"></i> Tech Packages</a></li>
                <li><a href="/admin/organic-products"><i class="bi bi-flower2"></i> Organic Products</a></li>
                <li><a href="/admin/inquiries"><i class="bi bi-chat-dots"></i> Inquiries</a></li>
                <li><a href="/" target="_blank"><i class="bi bi-globe"></i> View Website</a></li>
                <li><a href="/admin/logout"><i class="bi bi-box-arrow-right"></i> Logout</a></li>
            </ul>
        </div>
    </div>

    <div class="admin-content">
        <div class="container-fluid p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="fw-bold mb-0">${title}</h2>
                <a href="/admin/${type}/create" class="btn btn-swadesi">
                    <i class="bi bi-plus-circle"></i> Add New
                </a>
            </div>

            <% if (success && success.length > 0) { %>
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <%= success %>
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            <% } %>

            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <% if (${pluralTitle}.length === 0) { %>
                        <p class="text-center text-muted py-4">No ${pluralTitle.toLowerCase()} found. Click "Add New" to create one.</p>
                    <% } else { %>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <% ${pluralTitle}.forEach(item => { %>
                                    <tr>
                                        <td>
                                            <% if (item.featuredImage && item.featuredImage.url) { %>
                                                <img src="<%= item.featuredImage.url %>" alt="<%= item.title %>" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                                            <% } else { %>
                                                <div style="width: 60px; height: 60px; background: #e9ecef; border-radius: 8px;"></div>
                                            <% } %>
                                        </td>
                                        <td><%= item.title %></td>
                                        <td><span class="badge bg-secondary"><%= item.category %></span></td>
                                        <td>
                                            <% if (item.isVisible || item.isAvailable) { %>
                                                <span class="badge bg-success">Active</span>
                                            <% } else { %>
                                                <span class="badge bg-secondary">Hidden</span>
                                            <% } %>
                                        </td>
                                        <td>
                                            <a href="/admin/${type}/edit/<%= item._id %>" class="btn btn-sm btn-outline-primary">
                                                <i class="bi bi-pencil"></i>
                                            </a>
                                            <button onclick="confirmDelete('<%= item._id %>', '${type}', '/admin/${type}/<%= item._id %>')" class="btn btn-sm btn-outline-danger">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <% }); %>
                                </tbody>
                            </table>
                        </div>
                    <% } %>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/admin.js"></script>
</body>
</html>`;

// Generate list views
fs.writeFileSync(
    path.join(adminViewsDir, 'seasonal', 'list.ejs'),
    listTemplate('seasonal-products', 'Seasonal Products', 'products')
);

fs.writeFileSync(
    path.join(adminViewsDir, 'tech', 'list.ejs'),
    listTemplate('tech-packages', 'Tech Packages', 'packages')
);

fs.writeFileSync(
    path.join(adminViewsDir, 'organic', 'list.ejs'),
    listTemplate('organic-products', 'Organic Products', 'products')
);

console.log('✓ Admin list views generated successfully');
console.log('✓ All essential files have been created');
console.log('');
console.log('Next steps:');
console.log('1. Update the .env file with your MongoDB and Cloudinary credentials');
console.log('2. Run: npm install');
console.log('3. Run: npm start');
console.log('4. Visit: http://localhost:3000');
