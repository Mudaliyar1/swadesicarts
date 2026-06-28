const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, '..', 'views', 'public', 'profile.ejs');
const ticketPath = path.join(__dirname, '..', 'views', 'public', 'ticket-detail.ejs');
const ticketDesktopPath = path.join(__dirname, '..', 'views', 'public', 'ticket-detail-desktop.ejs');

const profileHtml = fs.readFileSync(profilePath, 'utf8');
const ticketHtml = fs.readFileSync(ticketPath, 'utf8');

// 1. Extract the Enterprise styles block from profile.ejs
const styleStartStr = '<style>\n                                        :root {\n                                            --ent-bg: #f8f9fa;';
let styleStart = profileHtml.indexOf(':root {\n                                        --ent-bg: #f8f9fa;');
if (styleStart === -1) {
    styleStart = profileHtml.indexOf('--ent-bg: #f8f9fa;');
    styleStart = profileHtml.lastIndexOf('<style>', styleStart);
} else {
    styleStart = profileHtml.lastIndexOf('<style>', styleStart);
}
const styleEnd = profileHtml.indexOf('</style>', styleStart) + 8;
const entStyles = profileHtml.substring(styleStart, styleEnd);

// 2. Extract the ent-sidebar block
const sidebarStart = profileHtml.indexOf('<aside class="ent-sidebar">');
const sidebarEnd = profileHtml.indexOf('</aside>', sidebarStart) + 8;
let sidebarHtml = profileHtml.substring(sidebarStart, sidebarEnd);

// Replace sidebar links to point to /profile
sidebarHtml = sidebarHtml.replace(/href="#" class="ent-nav-link tab-link active" data-target="account-tab"/g, 'href="/profile?tab=account" class="ent-nav-link"');
sidebarHtml = sidebarHtml.replace(/href="#" class="ent-nav-link tab-link" data-target="tickets-tab"/g, 'href="/profile?tab=tickets" class="ent-nav-link active"');
// Make the tickets tab active
sidebarHtml = sidebarHtml.replace('href="/profile?tab=account" class="ent-nav-link active"', 'href="/profile?tab=account" class="ent-nav-link"');
sidebarHtml = sidebarHtml.replace('href="/profile?tab=tickets" class="ent-nav-link"', 'href="/profile?tab=tickets" class="ent-nav-link active"');

// 3. Extract the chat container from ticket-detail.ejs
const chatBoxMatch = ticketHtml.match(/<div class="chat-box">[\s\S]*?<\/form>\s*<%\s*} else {\s*%>[\s\S]*?<\/div>\s*<%\s*}\s*%>\s*<\/div>/);
let chatBoxHtml = chatBoxMatch ? chatBoxMatch[0] : '<div class="chat-box">Failed to match</div>';

// 4. Extract the existing ticket styles (chat bubble, etc)
const ticketStyleStart = ticketHtml.indexOf('<style>');
const ticketStyleEnd = ticketHtml.indexOf('</style>', ticketStyleStart) + 8;
const ticketStyles = ticketHtml.substring(ticketStyleStart, ticketStyleEnd);

// Strip out the html/body 100% height from ticketStyles because we are putting it in a card
let customTicketStyles = ticketStyles.replace(/body, html \{ height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; \}/g, '');
customTicketStyles = customTicketStyles.replace(/\.sc-page-bg \{[^\}]+\}/g, '');
customTicketStyles = customTicketStyles.replace(/\.chat-container \{[^\}]+\}/g, '');
customTicketStyles = customTicketStyles.replace(/\.chat-box \{[^\}]+\}/g, '.chat-box { background: transparent; display: flex; flex-direction: column; flex: 1; height: 100%; overflow: hidden; border-radius: 0 16px 16px 0; }');

// Increase font sizes for desktop view
customTicketStyles = customTicketStyles.replace(/font-size: 0.95rem;/g, 'font-size: 1.15rem;'); // bubble text
customTicketStyles = customTicketStyles.replace(/font-size: 0.75rem;/g, 'font-size: 0.9rem;'); // author name
customTicketStyles = customTicketStyles.replace(/font-size: 0.68rem;/g, 'font-size: 0.8rem;'); // meta time

// 5. Build the new ticket-detail.ejs
const newTicketHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css/style-new.css">
    
    <%- include('../partials/dynamic-styles') %>
    <% if (typeof seo !=='undefined' ) { %>
        <%- include('../partials/seo-meta') %>
    <% } %>
    
    <% 
        let isDarkTheme = false; 
        let btnTextColor = '#111111'; 
        if (typeof siteSettings !== 'undefined' && siteSettings.colors) { 
            let accentValue = siteSettings.colors.accent || '#FFD700';
            accentValue = accentValue.trim();
            if (accentValue.startsWith('#')) {
                let hex = accentValue.replace('#', '');
                if (hex.length === 6) {
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
                    if (brightness < 128) btnTextColor = '#ffffff'; 
                } 
            } 
        } 
    %>
    
    ${entStyles}
    ${customTicketStyles}
</head>
<body>
    <%- include('../partials/navbar-new') %>

    <div class="glass-page-bg">
        <div class="glass-container">
            <div class="ent-layout">
                <!-- Sidebar Navigation -->
                ${sidebarHtml}

                <!-- Main Content (Chat) -->
                <main class="ent-content" style="padding: 0; display: flex; flex-direction: column; height: calc(100vh - 250px); min-height: 600px; background: #efeae2;">
                    <% if (locals.success && locals.success.length > 0) { %>
                        <div class="alert alert-success alert-dismissible fade show m-0 rounded-0 flex-shrink-0" role="alert" style="z-index: 100;">
                            <%= locals.success %>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <% } %>
                    <% if (locals.error && locals.error.length > 0) { %>
                        <div class="alert alert-danger alert-dismissible fade show m-0 rounded-0 flex-shrink-0" role="alert" style="z-index: 100;">
                            <%= locals.error %>
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    <% } %>
                    
                    ${chatBoxHtml}
                </main>
            </div>
        </div>
    </div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script>
    const ticketNumber = '<%= ticket.ticketNumber %>';
    const chatBody = document.getElementById('chatBody');
    const replyForm = document.getElementById('replyForm');
    const messageInput = document.getElementById('messageInput');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Auto-scroll chat to bottom
    const scrollToBottom = () => chatBody.scrollTop = chatBody.scrollHeight;
    scrollToBottom();
    
    // Socket.io Integration
    const socket = io();
    socket.emit('joinTicket', ticketNumber);
    
    // Handle incoming messages
    socket.on('newMessage', (msg) => {
        const isUser = msg.sender === 'user';
        const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { timeStyle: 'short' });
        
        let html = \`
            <div class="chat-message \${isUser ? 'user' : 'admin'}">
                <div class="msg-bubble">
                    \${!isUser ? '<div class="msg-author-name">Support Team</div>' : ''}
                    <div class="msg-text">\${msg.message}</div>
                    <div class="msg-meta">
                        \${msg.isEmailSync ? '<i class="bi bi-envelope"></i>' : ''}
                        \${timeStr}
                        \${isUser ? '<i class="bi bi-check-all text-primary ms-1" style="font-size: 1rem;"></i>' : ''}
                    </div>
                </div>
            </div>
        \`;
        
        typingIndicator.insertAdjacentHTML('beforebegin', html);
        scrollToBottom();
    });
    
    // Handle typing indicator
    socket.on('typing', (data) => {
        if (data.sender === 'admin') {
            typingIndicator.style.display = 'flex';
            scrollToBottom();
        }
    });
    
    socket.on('stopTyping', (data) => {
        if (data.sender === 'admin') {
            typingIndicator.style.display = 'none';
        }
    });
    
    if (replyForm) {
        let typingTimer;
        messageInput.addEventListener('input', () => {
            socket.emit('typing', { ticketNumber, sender: 'user' });
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                socket.emit('stopTyping', { ticketNumber, sender: 'user' });
            }, 2000);
        });
        
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = messageInput.value.trim();
            if(!text) return;
            
            messageInput.value = '';
            socket.emit('stopTyping', { ticketNumber, sender: 'user' });
            
            try {
                await fetch('/tickets/' + ticketNumber + '/reply', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ message: text })
                });
            } catch (err) {
                console.error('Failed to send message:', err);
                alert('Failed to send message. Please try again.');
            }
        });
        
        // Enter to send (Shift+Enter for newline)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                replyForm.dispatchEvent(new Event('submit'));
            }
        });
    }
</script>
</body>
</html>`;

fs.writeFileSync(ticketDesktopPath, newTicketHtml, 'utf8');
console.log('Successfully generated ticket-detail-desktop.ejs');
