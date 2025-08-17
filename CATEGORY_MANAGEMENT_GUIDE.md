# Category Management Guide

This guide explains the new category management features added to the admin panel.

## Overview

Two new category management pages have been added to the admin panel:

1. **Business Categories** - Used in seller signup process
2. **Product Categories** - Used for organizing products

## Business Categories 🏢

### Purpose
Business categories are used during the seller registration process to categorize the type of business the seller operates.

### Features
- ✅ **Create/Edit/Delete** business categories
- ✅ **Active/Inactive** status management
- ✅ **Sort Order** for display priority
- ✅ **Search** functionality
- ✅ **Description** field for detailed information

### API Endpoint
- `GET /api/business-categories` - Get all business categories
- `POST /api/business-categories` - Create new business category
- `PUT /api/business-categories/:id` - Update business category
- `DELETE /api/business-categories/:id` - Delete business category

### Database Schema
```json
{
  "name": "string (required, unique)",
  "description": "text",
  "isActive": "boolean (default: true)",
  "sortOrder": "integer (default: 0)",
  "vendors": "relation to vendors"
}
```

### Pre-seeded Categories
The system comes with 15 pre-seeded business categories:
1. Electronics & Gadgets
2. Fashion & Apparel
3. Food & Beverage
4. Home & Garden
5. Health & Beauty
6. Sports & Fitness
7. Books & Education
8. Automotive
9. Jewelry & Watches
10. Toys & Games
11. Pet Supplies
12. Art & Crafts
13. Music & Instruments
14. Travel & Tourism
15. Other

## Product Categories 📦

### Purpose
Product categories are used to organize and filter products in the marketplace.

### Features
- ✅ **Create/Edit/Delete** product categories
- ✅ **Active/Inactive** status management
- ✅ **Sort Order** for display priority
- ✅ **Search** functionality
- ✅ **Description** field for detailed information
- ✅ **Image** support for category icons
- ✅ **Product Count** display

### API Endpoint
- `GET /api/categories` - Get all product categories
- `POST /api/categories` - Create new product category
- `PUT /api/categories/:id` - Update product category
- `DELETE /api/categories/:id` - Delete product category

### Database Schema
```json
{
  "name": "string (required)",
  "description": "text",
  "isActive": "boolean (default: true)",
  "sortOrder": "integer (default: 0)",
  "image": "media (optional)",
  "products": "relation to products"
}
```

## Admin Panel Integration

### Navigation
Both category management pages are accessible from:
- **Sidebar Navigation**: Business Categories & Product Categories
- **Dashboard Quick Actions**: Quick access cards

### Permissions
- Only users with `admin` role can access these pages
- Full CRUD operations available for authenticated admins

## Usage in Seller Signup

### Business Categories
When a seller registers, they can select from the available business categories. This helps:
- Categorize sellers by business type
- Improve search and filtering
- Provide better analytics
- Enable targeted features

### Integration Points
- Seller registration form includes business category selection
- Vendor profile displays the selected business category
- Admin can filter sellers by business category

## Backend Setup

### 1. Database Migration
The business categories API needs to be created in Strapi:
```bash
# Navigate to backend directory
cd cityshopping-backend

# The API structure is already created:
# - src/api/business-category/
# - src/api/business-category/content-types/business-category/schema.json
# - src/api/business-category/controllers/business-category.js
# - src/api/business-category/routes/business-category.js
# - src/api/business-category/services/business-category.js
```

### 2. Seed Data
To populate initial business categories:
```bash
# Set environment variables
export ADMIN_TOKEN="your-admin-jwt-token"
export API_URL="http://localhost:1337"

# Run the seeding script
node scripts/seed-business-categories.js
```

### 3. Permissions Setup
Ensure admin users have permissions to:
- Read business categories
- Create business categories
- Update business categories
- Delete business categories

## Frontend Integration

### API Configuration
The frontend is configured to use these endpoints:
```typescript
// config.ts
BUSINESS_CATEGORIES: '/api/business-categories',
CATEGORIES: '/api/categories',
```

### Components
- `AdminBusinessCategories` - Business category management
- `AdminProductCategories` - Product category management

### Routes
- `/admin/business-categories` - Business category management
- `/admin/product-categories` - Product category management

## Best Practices

### Business Categories
1. **Keep names clear and descriptive**
2. **Use appropriate descriptions** to help sellers choose correctly
3. **Maintain logical sort order** for better UX
4. **Don't delete categories** that are in use by vendors

### Product Categories
1. **Use consistent naming conventions**
2. **Add relevant images** for better visual appeal
3. **Keep categories broad enough** to be useful
4. **Monitor product counts** to identify popular categories

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure user has admin role
2. **API Not Found**: Check if backend is running and API is created
3. **Validation Errors**: Ensure required fields are provided
4. **Relation Errors**: Check if related entities exist

### Debug Steps
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Confirm database schema is correct
4. Test with Postman or similar tool

## Future Enhancements

### Potential Features
- **Category Hierarchies** - Parent/child category relationships
- **Category Analytics** - Usage statistics and trends
- **Bulk Operations** - Import/export categories
- **Category Templates** - Pre-defined category sets
- **Category Validation** - Rules for category assignment

### Integration Opportunities
- **Search Enhancement** - Category-based search filters
- **Recommendation Engine** - Category-based product recommendations
- **Analytics Dashboard** - Category performance metrics
- **Marketing Tools** - Category-specific promotions 