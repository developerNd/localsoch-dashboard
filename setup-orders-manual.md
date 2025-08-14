# Manual Orders Setup Guide

Since the orders API is not yet fully configured, here's how to set up orders manually:

## 1. Access Strapi Admin Panel
- Go to: http://localhost:1337/admin
- Login with your admin credentials

## 2. Check Content Types
- Go to Content-Type Builder
- Verify that "Order" content type exists
- If not, you may need to restart Strapi after schema changes

## 3. Set Permissions
- Go to Settings → Users & Permissions plugin → Roles
- Select "Authenticated" role
- Enable permissions for Orders:
  - `find` - to view orders
  - `findOne` - to view individual orders
  - `create` - to create orders
  - `update` - to update order status
  - `delete` - to delete orders (optional)

## 4. Create Sample Orders Manually
In the Strapi admin panel, go to Content Manager → Orders and create:

### Order 1:
- **Order Number**: ORD-2024-001
- **Customer Name**: John Doe
- **Customer Email**: john.doe@example.com
- **Customer Phone**: +91 98765 43210
- **Total Amount**: 45.99
- **Status**: delivered
- **Vendor**: CityBakery (ID: 26)
- **User**: citybakery (ID: 4)
- **Order Items**: 
  ```json
  [
    {"productId": 1, "quantity": 2, "totalAmount": 30.00, "productName": "Whole Wheat Bread"},
    {"productId": 2, "quantity": 1, "totalAmount": 15.99, "productName": "Croissant"}
  ]
  ```
- **Shipping Address**:
  ```json
  {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
  ```
- **Payment Method**: COD
- **Payment Status**: paid
- **Notes**: Please deliver in the morning

### Order 2:
- **Order Number**: ORD-2024-002
- **Customer Name**: Jane Smith
- **Customer Email**: jane.smith@example.com
- **Customer Phone**: +91 98765 43211
- **Total Amount**: 32.50
- **Status**: confirmed
- **Vendor**: CityBakery (ID: 26)
- **User**: citybakery (ID: 4)
- **Order Items**:
  ```json
  [
    {"productId": 3, "quantity": 1, "totalAmount": 32.50, "productName": "Chocolate Cake"}
  ]
  ```
- **Shipping Address**:
  ```json
  {
    "street": "456 Oak Avenue",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
  ```
- **Payment Method**: Online
- **Payment Status**: paid
- **Notes**: Birthday cake - please add candles

### Order 3:
- **Order Number**: ORD-2024-003
- **Customer Name**: Mike Johnson
- **Customer Email**: mike.johnson@example.com
- **Customer Phone**: +91 98765 43212
- **Total Amount**: 67.25
- **Status**: shipped
- **Vendor**: CityBakery (ID: 26)
- **User**: citybakery (ID: 4)
- **Order Items**:
  ```json
  [
    {"productId": 1, "quantity": 1, "totalAmount": 15.00, "productName": "Whole Wheat Bread"},
    {"productId": 4, "quantity": 2, "totalAmount": 52.25, "productName": "Sourdough Bread"}
  ]
  ```
- **Shipping Address**:
  ```json
  {
    "street": "789 Pine Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001"
  }
  ```
- **Payment Method**: COD
- **Payment Status**: pending
- **Notes**: Fresh bread only

## 5. Test the Orders Page
After creating the orders:
1. Go to your LocalVendorHub application
2. Login as citybakery seller
3. Navigate to Orders page
4. You should see the orders listed with proper filtering and status management

## Troubleshooting
- If orders don't appear, check that the vendor ID matches (26 for CityBakery)
- If permissions are denied, ensure the seller role has proper permissions
- If the API returns 404, restart Strapi after schema changes 