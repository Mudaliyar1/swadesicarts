const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'views', 'admin', 'media', 'index.ejs');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of 'search=<%= encodeURIComponent(filters.search) %>'
// with 'owner=<%= filters.owner %>&search=<%= encodeURIComponent(filters.search) %>'
content = content.replace(/search=<%= encodeURIComponent\(filters\.search\) %>/g, 'owner=<%= filters.owner %>&search=<%= encodeURIComponent(filters.search) %>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated pagination links in index.ejs');
