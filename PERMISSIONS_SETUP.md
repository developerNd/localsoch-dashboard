# Strapi Permissions Setup Guide

## What's Missing for Proper Vendor-User Access

### 1. Strapi Admin Panel Permissions Configuration

You need to configure permissions in the Strapi admin panel:

1. **Go to Strapi Admin Panel**: `http://localhost:1337/admin`
2. **Navigate to Settings → Users & Permissions Plugin → Roles**
3. **Select the "seller" role**
4. **Configure Vendor Permissions**:
   - ✅ `find` - Allow sellers to find vendors
   - ✅ `findOne` - Allow sellers to find specific vendors
   - ✅ `update` - Allow sellers to update their own vendor
   - ❌ `create` - Don't allow sellers to create new vendors
   - ❌ `delete` - Don't allow sellers to delete vendors

5. **Configure Product Permissions**:
   - ✅ `find` - Allow sellers to find products
   - ✅ `findOne` - Allow sellers to find specific products
   - ✅ `create` - Allow sellers to create products
   - ✅ `update` - Allow sellers to update their own products
   - ✅ `delete` - Allow sellers to delete their own products

### 2. Custom Vendor Controller (Already Created)

The custom vendor controller has been created at:
`/Users/themacintosh/cityshopping-backend/src/api/vendor/controllers/vendor.js`

This controller:
- Filters vendor results for sellers to only show their own vendor
- Prevents sellers from accessing other vendors' data
- Automatically assigns the seller as the user when creating vendors

### 3. Restart Strapi Server

After updating permissions, restart the Strapi server:

```bash
cd /Users/themacintosh/cityshopping-backend
npm run develop
```

### 4. Test the Solution

1. **Login as a seller** in the frontend
2. **Check browser console** for logs showing:
   - `🔍 Custom vendor API status: 200`
   - `🔍 Found vendor ID from custom endpoint: [vendor_id]`
3. **Verify no hardcoded mapping fallback** is used

### 5. Remove Hardcoded Mapping

Once the custom endpoint works, remove the hardcoded mapping fallback from:
- `client/src/hooks/use-auth.tsx` (both in user data fetch and login mutation)

## Current Status

✅ **Custom Vendor Controller**: Created and ready
✅ **Frontend Logic**: Updated to try custom endpoint first
✅ **Fallback Logic**: Hardcoded mapping as backup
❌ **Strapi Permissions**: Need to be configured in admin panel

## Expected Behavior After Setup

1. **Seller logs in** → System detects seller role
2. **Custom vendor endpoint called** → Returns only seller's vendor
3. **Vendor ID set** → Products filtered correctly
4. **No hardcoded mapping** → Clean, permission-based solution

## Troubleshooting

If the custom endpoint still doesn't work:

1. **Check Strapi logs** for permission errors
2. **Verify seller role permissions** in admin panel
3. **Test with admin token** to confirm vendor relationships exist
4. **Check custom controller** is being used (look for console logs)

## Alternative Approach

If permissions are still problematic, consider:

1. **User-Vendor Relationship**: Add vendor field to user schema
2. **API Token Approach**: Use admin token for vendor lookups
3. **Database Query**: Direct database queries for vendor mapping

The current solution with custom controller + permissions is the most secure and scalable approach. 