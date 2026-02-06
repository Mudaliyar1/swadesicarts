# Swadesi Carts

A complete, production-ready dynamic website with admin dashboard for managing seasonal products, tech services, and organic products.

## Tech Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Templating:** EJS
- **UI Framework:** Bootstrap 5
- **Media Storage:** Cloudinary
- **PDF Generation:** PDFKit
- **Authentication:** Session-based

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Update the following in `.env`:
- MongoDB connection string
- Cloudinary credentials
- Session secret
- Admin credentials

### 3. Start MongoDB

Ensure MongoDB is running on your system:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Run the Application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 5. Access the Application

- **Public Website:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3000/admin/login

### Default Admin Credentials

- **Email:** admin@swadesicarts.com
- **Password:** Admin@123

**⚠️ Important:** Change the default admin password after first login!

## Project Structure

```
swadesi-carts/
├── models/           # Mongoose models
├── routes/           # Express routes
├── controllers/      # Route controllers
├── views/            # EJS templates
│   ├── public/       # Public website views
│   ├── admin/        # Admin dashboard views
│   └── partials/     # Reusable components
├── public/           # Static assets
│   ├── css/          # Stylesheets
│   ├── js/           # JavaScript files
│   └── images/       # Static images
├── middleware/       # Custom middleware
├── config/           # Configuration files
└── server.js         # Entry point
```

## Features

### Public Website
- Home, About, Contact pages
- Dynamic product sections:
  - Seasonal Products
  - Tech Services/Packages
  - Organic Products
- Product detail pages
- Inquiry forms with validation
- Fully responsive design

### Admin Dashboard
- Secure authentication
- Responsive sidebar (desktop/tablet/mobile)
- CRUD operations for all product types
- Inquiry management
- Media management (Cloudinary)
- PDF report generation
- Professional UI/UX

## License

ISC
