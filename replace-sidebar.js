const fs = require('fs');
const path = require('path');

const adminViewsDir = path.join(__dirname, 'views', 'admin');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (f.endsWith('.ejs') && f !== 'login.ejs') {
                callback(dirPath);
            }
        }
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // We want to find the start of the mobile nav
    // It usually looks like: <nav class="navbar navbar-dark bg-swadesi d-lg-none">
    // Sometimes there might be variations. Let's look for "<nav class="navbar"
    let startIndex = content.indexOf('<nav class="navbar navbar-dark bg-swadesi d-lg-none">');
    if (startIndex === -1) {
        startIndex = content.indexOf('<nav class="navbar ');
    }

    // If still not found, check if it has the sidebarDesktop
    if (startIndex === -1) {
        startIndex = content.indexOf('<div class="admin-sidebar');
    }

    if (startIndex === -1) {
        console.log(`Skipping ${filePath} - No sidebar found.`);
        return;
    }

    // Now find the end of the offcanvas sidebar
    // Look for: <div class="offcanvas offcanvas-start bg-swadesi text-white" tabindex="-1" id="sidebar">
    let offcanvasIndex = content.indexOf('id="sidebar"');
    if (offcanvasIndex === -1) {
        console.log(`Warning: offcanvas id="sidebar" not found in ${filePath}, skipping...`);
        return;
    }

    // The offcanvas ends when we find the closing div of the offcanvas.
    // Let's find the string: "</div>\n\n    <div class=\"admin-content\">" or similar.
    // A safer way: Find <div class="admin-content"> and everything before it is the sidebar!
    let adminContentIndex = content.indexOf('<div class="admin-content">');
    if (adminContentIndex === -1) {
        // sometimes it might be <main class="admin-content">
        adminContentIndex = content.indexOf('<main class="admin-content"');
    }

    if (adminContentIndex !== -1) {
        // Calculate the relative path from this file to the partials folder
        const relativeToViews = path.relative(path.dirname(filePath), path.join(__dirname, 'views', 'partials'));
        // convert Windows backslashes to forward slashes for EJS include
        const includePath = relativeToViews.replace(/\\/g, '/') + '/admin-sidebar';
        
        const includeStr = `\n    <%- include('${includePath}') %>\n\n    `;
        
        const newContent = content.substring(0, startIndex) + includeStr + content.substring(adminContentIndex);
        
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`Warning: admin-content not found in ${filePath}`);
    }
}

walkDir(adminViewsDir, processFile);
console.log('Sidebar replacement complete.');
