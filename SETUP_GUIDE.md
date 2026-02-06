# 🌿 Swadesi Carts - Complete Setup Guide

## Project Overview

Swadesi Carts is a production-ready, full-featured dynamic website with an advanced admin dashboard. Built with Node.js, Express, MongoDB, and Bootstrap 5.

### Features
- ✅ Fully responsive public website
- ✅ 3 dynamic product sections (Seasonal, Tech, Organic)
- ✅ Product detail pages with inquiry forms
- ✅ Responsive admin dashboard (Desktop/Tablet/Mobile)
- ✅ CRUD operations for all product types
- ✅ Inquiry management system
- ✅ PDF export functionality
- ✅ Cloudinary integration for media
- ✅ Session-based authentication
- ✅ Bootstrap 5 UI with custom theming

## Prerequisites

Before starting, ensure you have:
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- A Cloudinary account (free tier works)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The `.env` file is already created. Update it with your credentials:

```env
# MongoDB - Install MongoDB locally or use MongoDB Atlas (cloud)
MONGODB_URI=mongodb://localhost:27017/swadesi-carts

# Cloudinary - Sign up at https://cloudinary.com (free)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Session Secret - Change this to a random string
SESSION_SECRET=your-unique-secret-key-here

# Admin Credentials
ADMIN_EMAIL=admin@swadesicarts.com
ADMIN_PASSWORD=Admin@123
```

### 3. Get Cloudinary Credentials

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard
4. Copy your **Cloud Name**, **API Key**, and **API Secret**
5. Update the `.env` file with these values

### 4. Start MongoDB

#### Windows:
```bash
net start MongoDB
```

#### macOS/Linux:
```bash
sudo systemctl start mongod
```

#### Using MongoDB Atlas (Cloud):
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create a free cluster
- Get your connection string
- Update `MONGODB_URI` in `.env`

### 5. Generate Remaining Admin Views (Optional)

Some admin CRUD views can be auto-generated:

```bash
node generate-admin-views.js
```

This creates list views for all product types.

### 6. Start the Application

#### Development mode (with auto-restart):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

### 7. Access the Application

- **Public Website**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin/login

**Default Admin Credentials:**
- Email: `admin@swadesicarts.com`
- Password: `Admin@123`

⚠️ **IMPORTANT**: Change the admin password after first login!

## Project Structure

```
swadesi-carts/
├── config/           # Database, Cloudinary, Multer config
├── controllers/      # Route controllers
│   ├── admin/        # Admin controllers (CRUD)
│   └── ...
├── middleware/       # Auth middleware
├── models/           # Mongoose models
├── public/           # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── images/
├── routes/           # Express routes
├── views/            # EJS templates
│   ├── admin/        # Admin dashboard views
│   ├── public/       # Public website views
│   └── partials/     # Reusable components
├── .env              # Environment variables
├── .gitignore
├── package.json
├── server.js         # Main application entry
└── README.md
```

## Admin Dashboard Features

### Responsive Behavior

#### Desktop (≥992px)
- Full sidebar with icons and text
- Toggle button to collapse/expand
- Fixed sidebar with smooth transitions

#### Tablet (768px - 991px)
- Collapsed sidebar (icons only)
- Tooltips on hover
- More screen space for content

#### Mobile (<768px)
- Hidden sidebar by default
- Hamburger menu opens offcanvas
- Auto-closes on navigation

### Product Management

1. **Seasonal Products**
   - Add/Edit/Delete products
   - Upload featured image and gallery
   - Set category and visibility
   - Manage product order

2. **Tech Packages**
   - All seasonal features plus:
   - Add pricing information
   - List features
   - Set availability status

3. **Organic Products**
   - All seasonal features plus:
   - Add health benefits
   - Stock management
   - Organic certifications

### Inquiry Management

- View all inquiries
- Filter by status, type, date
- Update inquiry status (New/Contacted/Closed)
- Add admin notes
- Download inquiry as PDF

## Public Website Features

### Pages
1. **Home** - Hero section, featured products
2. **About** - Company information
3. **Contact** - Contact form
4. **Seasonal Products** - Product listing
5. **Tech Packages** - Service listing
6. **Organic Products** - Product listing
7. **Detail Pages** - Individual product/service details with inquiry forms

### Inquiry Forms
- Client-side validation
- Server-side validation
- Success/error messages
- Loading states
- Linked to specific products

## Customization

### Theme Colors

Edit `public/css/style.css`:

```css
:root {
    --swadesi-green: #1e5631;    /* Primary color */
    --swadesi-brown: #8B4513;    /* Secondary color */
    --swadesi-accent: #FF8C00;   /* Accent color */
}
```

### Logo & Branding

1. Replace logo in navbar (`views/partials/navbar.ejs`)
2. Add favicon in `public/images/`
3. Update footer information

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Cloudinary Upload Error
```
Error: Must supply cloud_name
```
**Solution**: Update Cloudinary credentials in `.env` file

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change PORT in `.env` or kill the process using port 3000

### Session Issues
- Clear browser cookies
- Restart the server
- Check SESSION_SECRET in `.env`

## Deployment

### Heroku
1. Create a Heroku app
2. Add MongoDB Atlas add-on or use external MongoDB
3. Set environment variables in Heroku dashboard
4. Deploy:
```bash
git push heroku main
```

### Vercel/Netlify
Not recommended for this project (requires serverless architecture)

### VPS (Ubuntu)
1. Install Node.js and MongoDB
2. Clone repository
3. Set up environment variables
4. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name swadesi-carts
pm2 save
pm2 startup
```

## Security Best Practices

1. **Change default admin password immediately**
2. **Use strong SESSION_SECRET** (random 32+ character string)
3. **Keep .env file private** (never commit to Git)
4. **Enable HTTPS in production**
5. **Set NODE_ENV=production** in production
6. **Regularly update dependencies**

## Support & Documentation

### Tech Stack Documentation
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [EJS](https://ejs.co/)
- [Bootstrap 5](https://getbootstrap.com/)
- [Cloudinary](https://cloudinary.com/documentation)

### Need Help?
- Check existing issues
- Review code comments
- Test with sample data first

## License

ISC

---

**Built with ❤️ for Swadesi Carts**

🌿 **Authentic Products, Modern Technology**
