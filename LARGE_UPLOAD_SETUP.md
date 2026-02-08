# 🚀 Large File Upload Configuration Guide

## ✅ What's Already Fixed

The Node.js/Express server is now configured to handle uploads up to **2GB**:
- Express body parser limit: 2000MB
- Multer file size limit: 2000MB (2GB)
- Server timeouts: 10 minutes
- Request/Response timeouts: 10 minutes

## 🔧 Live Server Configuration Required

The **502 Bad Gateway** error on your live website likely comes from your web server (nginx/Apache) or process manager. Follow the steps below based on your setup:

---

## 📦 Option 1: Using NGINX (Most Common)

### Step 1: Find your nginx configuration
```bash
# Check which config file is active
sudo nginx -t

# Common locations:
# /etc/nginx/nginx.conf
# /etc/nginx/sites-available/your-site
# /etc/nginx/conf.d/your-site.conf
```

### Step 2: Add these settings to your server block
```nginx
server {
    # ... your existing config ...
    
    # ⭐ CRITICAL: Increase max upload size
    client_max_body_size 2000M;
    
    # ⭐ CRITICAL: Increase timeouts (10 minutes)
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;
    
    # Disable buffering for large uploads
    proxy_buffering off;
    proxy_request_buffering off;
    
    location / {
        proxy_pass http://localhost:3000;
        
        # Add these timeout settings here too
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
```

### Step 3: Test and reload
```bash
# Test configuration syntax
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
# OR
sudo service nginx reload
```

---

## 📦 Option 2: Using Apache

### Edit your .htaccess or VirtualHost configuration:
```apache
<IfModule mod_proxy.c>
    # Increase timeout (10 minutes)
    ProxyTimeout 600
    
    # Increase max request body size
    LimitRequestBody 2097152000
</IfModule>

# In php.ini (if using PHP proxy):
upload_max_filesize = 2000M
post_max_size = 2000M
max_execution_time = 600
max_input_time = 600
```

### Reload Apache:
```bash
sudo systemctl reload apache2
# OR
sudo service apache2 reload
```

---

## 📦 Option 3: Using PM2

If using PM2 to manage your Node.js process:

### Update ecosystem.config.js or start command:
```javascript
module.exports = {
  apps: [{
    name: "swadesi-carts",
    script: "./server.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // Important: PM2 options
    max_memory_restart: "2G",
    kill_timeout: 600000
  }]
}
```

### Restart PM2:
```bash
pm2 restart swadesi-carts
# OR
pm2 reload ecosystem.config.js
```

---

## 📦 Option 4: Cloudflare (If using)

If your site is behind Cloudflare:

1. **Free Plan**: Maximum upload size is **100MB** (cannot increase)
2. **Pro Plan**: Maximum upload size is **500MB**
3. **Business/Enterprise**: Can go higher

**Solutions:**
- Upgrade Cloudflare plan
- OR bypass Cloudflare for upload routes by creating a separate subdomain (e.g., `upload.yourdomain.com`) that's not proxied through Cloudflare (DNS only, grey cloud icon)

---

## 🧪 Testing Your Configuration

### 1. Restart your server:
```bash
# If using PM2
pm2 restart swadesi-carts

# If using nodemon/node directly
# Stop with Ctrl+C and restart
npm start
```

### 2. Test with a large file:
- Try uploading a 200MB+ video through admin panel
- Monitor server logs for any errors

### 3. Check server logs:
```bash
# PM2 logs
pm2 logs swadesi-carts

# Or check directly
tail -f /var/log/nginx/error.log
```

---

## 🐛 Still Getting 502 Error?

### Check these:
1. **Nginx error log**: `sudo tail -f /var/log/nginx/error.log`
2. **Node.js running**: `pm2 status` or `ps aux | grep node`
3. **Port accessible**: `netstat -tulpn | grep 3000`
4. **Firewall**: Check if port 3000 is open
5. **Memory**: Ensure server has enough RAM (at least 2GB free)

### Common errors in nginx log:
- `upstream timed out` → Increase proxy_read_timeout
- `client intended to send too large body` → Increase client_max_body_size
- `connection refused` → Node.js server not running

---

## 📝 Quick Checklist

- [ ] Updated Node.js server code (already done ✅)
- [ ] Increased nginx `client_max_body_size` to 2000M
- [ ] Increased nginx timeout settings to 600s
- [ ] Reloaded/restarted nginx
- [ ] Restarted Node.js application
- [ ] Tested with large file upload
- [ ] Checked error logs

---

## 💡 Recommended Production Setup

```bash
# 1. Upload limit: 2GB
# 2. Timeout: 10 minutes  
# 3. Memory: At least 4GB RAM on server
# 4. Storage: SSD recommended for Cloudinary uploads
```

---

## 📞 Need Help?

If still facing issues, provide:
1. Web server type (nginx/Apache)
2. Error from nginx/Apache logs
3. Node.js error logs (PM2 logs)
4. Server specs (RAM, CPU)
