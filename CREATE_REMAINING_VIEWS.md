# Creating Remaining Admin CRUD Views

The admin CRUD views for Tech Packages and Organic Products follow the same structure as Seasonal Products. Here's how to create them:

## Pattern Overview

Each product type needs 3 views:
1. **list.ejs** - Display all items in a table
2. **create.ejs** - Form to add new item
3. **edit.ejs** - Form to edit existing item

## Files to Create

### Tech Packages

Copy the seasonal product views and modify:

```
views/admin/tech/
├── list.ejs    (Copy from seasonal/list.ejs)
├── create.ejs  (Copy from seasonal/create.ejs)
└── edit.ejs    (Copy from seasonal/edit.ejs)
```

**Changes needed:**
1. Update sidebar active class to `tech`
2. Change URLs from `/admin/seasonal-products` to `/admin/tech-packages`
3. Add these extra fields in forms:
   ```html
   <!-- In create.ejs and edit.ejs -->
   <div class="col-12 mb-3">
       <label class="form-label">Features</label>
       <div id="featuresContainer">
           <div class="input-group mb-2">
               <input type="text" class="form-control" name="features" placeholder="Enter feature">
               <button type="button" class="btn btn-outline-success" onclick="addField('addFeature', 'featuresContainer', 'features')">
                   <i class="bi bi-plus"></i>
               </button>
           </div>
       </div>
   </div>
   
   <div class="col-md-6 mb-3">
       <label class="form-label">Price Amount</label>
       <input type="number" step="0.01" class="form-control" name="priceAmount" value="0">
   </div>
   
   <div class="col-md-6 mb-3">
       <label class="form-label">Price Display Text</label>
       <input type="text" class="form-control" name="priceDisplay" placeholder="e.g., ₹15,000 - ₹25,000">
   </div>
   
   <div class="col-md-6 mb-3">
       <label class="form-label">Availability</label>
       <div class="form-check form-switch">
           <input class="form-check-input" type="checkbox" name="isAvailable" checked>
           <label class="form-check-label">Available for booking</label>
       </div>
   </div>
   ```

### Organic Products

Copy the seasonal product views and modify:

```
views/admin/organic/
├── list.ejs    (Copy from seasonal/list.ejs)
├── create.ejs  (Copy from seasonal/create.ejs)
└── edit.ejs    (Copy from seasonal/edit.ejs)
```

**Changes needed:**
1. Update sidebar active class to `organic`
2. Change URLs from `/admin/seasonal-products` to `/admin/organic-products`
3. Add these extra fields in forms:
   ```html
   <!-- In create.ejs and edit.ejs -->
   <div class="col-12 mb-3">
       <label class="form-label">Health Benefits</label>
       <div id="benefitsContainer">
           <div class="input-group mb-2">
               <input type="text" class="form-control" name="benefits" placeholder="Enter health benefit">
               <button type="button" class="btn btn-outline-success" onclick="addField('addBenefit', 'benefitsContainer', 'benefits')">
                   <i class="bi bi-plus"></i>
               </button>
           </div>
       </div>
   </div>
   
   <div class="col-md-6 mb-3">
       <label class="form-label">Stock Status</label>
       <div class="form-check form-switch">
           <input class="form-check-input" type="checkbox" name="inStock" checked>
           <label class="form-check-label">In Stock</label>
       </div>
   </div>
   ```

## Quick Copy Commands

You can copy files from seasonal to tech/organic as starting points:

### For Tech Packages:
```bash
# Windows PowerShell
Copy-Item views\admin\seasonal\list.ejs views\admin\tech\list.ejs
Copy-Item views\admin\seasonal\create.ejs views\admin\tech\create.ejs
Copy-Item views\admin\seasonal\edit.ejs views\admin\tech\edit.ejs
```

### For Organic Products:
```bash
# Windows PowerShell
Copy-Item views\admin\seasonal\list.ejs views\admin\organic\list.ejs
Copy-Item views\admin\seasonal\create.ejs views\admin\organic\create.ejs
Copy-Item views\admin\seasonal\edit.ejs views\admin\organic\edit.ejs
```

Then edit each file with the specific changes mentioned above.

## Key Differences by Product Type

### Seasonal Products
- Basic fields: title, category, description, images
- Visibility toggle

### Tech Packages
- All seasonal fields PLUS:
  - Features array (dynamic input)
  - Price information
  - Availability toggle
  - isAvailable instead of isVisible

### Organic Products
- All seasonal fields PLUS:
  - Benefits array (dynamic input)
  - Stock status (inStock toggle)
  - Optional certifications

## Testing Your Views

After creating the views, test:

1. **List View**: `/admin/tech-packages` or `/admin/organic-products`
2. **Create**: Click "Add New" button
3. **Edit**: Click edit icon on any item
4. **Delete**: Click delete icon

## Common Issues

### 404 Error on Routes
- Check route definitions in `routes/admin.js`
- Verify controller file names match

### Form Submit Not Working
- Check form action URL
- Verify enctype="multipart/form-data" for file uploads
- Check name attributes match controller expectations

### Sidebar Not Highlighting
- Update the active class logic in sidebar
- Use: `class="<%= currentPage === 'tech' ? 'active' : '' %>"`

## Alternative: Use the Generator Script

Instead of manually creating each file, you can use the generate script that creates basic list views:

```bash
node generate-admin-views.js
```

This creates the list views automatically. You'll still need to create create.ejs and edit.ejs manually or copy from seasonal.

## File Structure Reference

```
views/admin/
├── seasonal/
│   ├── list.ejs
│   ├── create.ejs
│   └── edit.ejs
├── tech/
│   ├── list.ejs      ← Create this
│   ├── create.ejs    ← Create this
│   └── edit.ejs      ← Create this
├── organic/
│   ├── list.ejs      ← Create this
│   ├── create.ejs    ← Create this
│   └── edit.ejs      ← Create this
├── inquiries/
│   ├── list.ejs      ✓ Already created
│   └── view.ejs      ✓ Already created
├── dashboard.ejs     ✓ Already created
├── login.ejs         ✓ Already created
└── layout.ejs        ✓ Already created
```

## Next Steps

1. Create the remaining CRUD views
2. Test each CRUD operation
3. Add sample data
4. Test public website
5. Deploy!

## Need More Help?

- Review the existing seasonal product views
- Check controller files in `controllers/admin/`
- All routes are defined in `routes/admin.js`
- Forms use standard HTML5 validation
- File uploads handled by Multer + Cloudinary

---

**Pro Tip**: The seasonal product views are complete and working. Use them as templates for tech and organic products. The structure is 90% the same; you just need to add/modify a few fields specific to each type.
