# LocalVendorHub + Strapi Integration Setup

## Overview
This guide will help you set up the LocalVendorHub admin dashboard to work with your existing Strapi backend.

## Prerequisites
- Strapi backend running on port 1337
- Node.js and npm installed
- LocalVendorHub project cloned

## Setup Steps

### 1. Install Dependencies
```bash
cd LocalVendorHub
npm install
```

### 2. Configure API Endpoints
The integration has been configured to:
- Use Strapi API at `http://10.0.2.2:1337` (for Android emulator)
- Use your Strapi API token for authentication
- Convert Strapi data format to LocalVendorHub format

### 3. Start the Dashboard
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5000`

## Features Available

### Admin Dashboard
- **Products Management**: View, create, edit, delete products
- **Vendors Management**: Manage seller accounts
- **Orders Management**: Track and update order status
- **Analytics**: View platform statistics and reports

### Seller Dashboard
- **Product Management**: Manage their own products
- **Order Processing**: Handle incoming orders
- **Inventory Tracking**: Monitor stock levels
- **Earnings**: Track sales and commissions

## Data Mapping

### Strapi → LocalVendorHub
- `vendors` → `sellers`
- `products` → `products` (with vendor relation)
- `categories` → `categories`
- `orders` → `orders` (with items)

### Authentication
Currently using a mock authentication system. In production, implement:
1. JWT authentication with Strapi
2. User roles and permissions
3. Session management

## API Endpoints Used

### Products
- `GET /api/products?populate=*` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Vendors
- `GET /api/vendors?populate=*` - Get all vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor

### Orders
- `GET /api/orders?populate=*` - Get all orders
- `PUT /api/orders/:id` - Update order status

### Categories
- `GET /api/categories?populate=*` - Get all categories
- `POST /api/categories` - Create category

## Next Steps

1. **Test the Dashboard**: Access http://localhost:5000 and test all features
2. **Customize Styling**: Modify the UI to match your brand
3. **Add More Features**: Implement reviews, notifications, etc.
4. **Production Setup**: Configure proper authentication and security

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure Strapi is running on port 1337
   - Check API token is valid
   - Verify network connectivity

2. **Data Not Loading**
   - Check browser console for errors
   - Verify API endpoints are working
   - Check data transformation in strapi-adapter.ts

3. **Authentication Issues**
   - Clear browser cache
   - Check localStorage for auth token
   - Verify user role permissions

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Support
For issues or questions, check:
1. Browser console for errors
2. Network tab for API calls
3. Strapi admin panel for data
4. LocalVendorHub logs in terminal 