const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'admin', 'media', 'index.ejs');
let content = fs.readFileSync(filePath, 'utf8');

// I will just download the original file from github/git or I'll just fix it manually.
// Wait, the file is currently destroyed from line 351 to 413.
// Let's just fix it by replacing the entire corrupted section from:
//             <div class="row g-3 mb-4">
// ... down to ...
//                             <div class="fw-semibold mb-2">Most Used Media</div>

const newSection = `            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="card media-stat-card p-3">
                        <div class="text-muted small">Remaining Storage</div>
                        <div class="fw-bold fs-5"><%= stats.totalStorageLimit ? formatBytes(stats.remainingStorageBytes) : 'N/A' %></div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card media-stat-card p-3">
                        <div class="text-muted small">Used Bandwidth</div>
                        <div class="fw-bold fs-5"><%= formatBytes(stats.bandwidthBytes) %></div>
                        <%
                            const bandwidthPct = stats.totalBandwidthLimit ? Math.round((stats.bandwidthBytes / stats.totalBandwidthLimit) * 100) : 0;
                        %>
                        <div class="small text-muted mt-1"><%= bandwidthPct %>% of credit limit</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card media-stat-card p-3">
                        <div class="text-muted small">Unused Media</div>
                        <div class="fw-bold fs-5"><%= stats.unusedCount %></div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card media-stat-card p-3">
                        <div class="text-muted small">Documents</div>
                        <div class="fw-bold fs-5"><%= stats.documentCount %></div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm mb-4 media-toolbar">
                <div class="card-body">
                    <form method="GET" action="/admin/media" class="row g-3 align-items-end">
                        <input type="hidden" name="view" value="<%= filters.view %>">
                        <div class="col-12 col-md-6 col-lg-3">
                            <label class="form-label">Search</label>
                            <input type="text" class="form-control" name="search" value="<%= filters.search %>" placeholder="File name, public ID, page">
                        </div>
                        <div class="col-6 col-md-3 col-lg-2">
                            <label class="form-label">Type</label>
                            <select class="form-select" name="type">
                                <option value="all" <%= filters.type === 'all' ? 'selected' : '' %>>All</option>
                                <option value="image" <%= filters.type === 'image' ? 'selected' : '' %>>Image</option>
                                <option value="video" <%= filters.type === 'video' ? 'selected' : '' %>>Video</option>
                                <option value="pdf" <%= filters.type === 'pdf' ? 'selected' : '' %>>PDF</option>
                                <option value="document" <%= filters.type === 'document' ? 'selected' : '' %>>Document</option>
                            </select>
                        </div>
                        <div class="col-6 col-md-3 col-lg-2">
                            <label class="form-label">Usage</label>
                            <select class="form-select" name="usage">
                                <option value="all" <%= filters.usage === 'all' ? 'selected' : '' %>>All</option>
                                <option value="used" <%= filters.usage === 'used' ? 'selected' : '' %>>Used</option>
                                <option value="unused" <%= filters.usage === 'unused' ? 'selected' : '' %>>Unused</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-4 col-lg-2">
                            <label class="form-label">Section</label>
                            <input type="text" class="form-control" name="section" value="<%= filters.section %>" placeholder="Homepage, Company..." list="sectionOptions">
                            <datalist id="sectionOptions">
                                <option value="Site Logo"></option>
                                <option value="Homepage Carousel"></option>
                                <option value="About Page"></option>
                                <option value="Company Logo"></option>
                                <option value="Story Media"></option>
                                <option value="Featured Image"></option>
                                <option value="Gallery Item"></option>
                                <option value="Profile Avatar"></option>
                            </datalist>
                        </div>
                        <div class="col-6 col-md-3 col-lg-1">
                            <label class="form-label">From</label>
                            <input type="date" class="form-control" name="dateFrom" value="<%= filters.dateFrom %>">
                        </div>
                        <div class="col-6 col-md-3 col-lg-1">
                            <label class="form-label">To</label>
                            <input type="date" class="form-control" name="dateTo" value="<%= filters.dateTo %>">
                        </div>
                        <div class="col-12 col-md-2 col-lg-1">
                            <button class="btn btn-swadesi w-100" type="submit"><i class="bi bi-funnel"></i></button>
                        </div>
                    </form>
                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <a class="btn btn-sm <%= filters.view === 'grid' ? 'btn-swadesi' : 'btn-outline-secondary' %>" href="?view=grid&search=<%= encodeURIComponent(filters.search) %>&type=<%= filters.type %>&usage=<%= filters.usage %>&section=<%= encodeURIComponent(filters.section) %>&dateFrom=<%= filters.dateFrom %>&dateTo=<%= filters.dateTo %>"><i class="bi bi-grid-3x3-gap"></i> Grid</a>
                        <a class="btn btn-sm <%= filters.view === 'table' ? 'btn-swadesi' : 'btn-outline-secondary' %>" href="?view=table&search=<%= encodeURIComponent(filters.search) %>&type=<%= filters.type %>&usage=<%= filters.usage %>&section=<%= encodeURIComponent(filters.section) %>&dateFrom=<%= filters.dateFrom %>&dateTo=<%= filters.dateTo %>"><i class="bi bi-list"></i> Table</a>
                        <div class="ms-auto small text-muted align-self-center">Page <%= pagination.page %> of <%= pagination.totalPages %></div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h5 class="fw-bold mb-3">Media Analytics</h5>
                <div class="row g-3">
                    <div class="col-lg-4">
                        <div class="card media-stat-card p-3">
                            <div class="fw-semibold mb-2">Most Used Media</div>`;

// Find everything from '<div class="row g-3 mb-4">' down to 'Most Used Media</div>'
const regex = /<div class="row g-3 mb-4">[\s\S]*?<div class="fw-semibold mb-2">Most Used Media<\/div>/;
content = content.replace(regex, newSection);

fs.writeFileSync(filePath, content);
console.log('Fixed index.ejs!');
