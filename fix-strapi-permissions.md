# Fixing Strapi Permissions for Vendor-User Relationships

## Current Issue
The seller users cannot access vendor data with their JWT tokens, causing the frontend to fall back to hardcoded mapping.

## Root Cause
Strapi permissions are not properly configured to allow seller users to:
1. Access vendor data
2. Filter vendors by user relationship
3. Access their own vendor record

## Solution Steps

### 1. Configure Strapi Permissions

#### For the "seller" role:

**Vendor Permissions:**
- `find` - Allow sellers to find vendors
- `findOne` - Allow sellers to find specific vendors
- Add custom permission for filtering by user

**Product Permissions:**
- `find` - Allow sellers to find products
- `findOne` - Allow sellers to find specific products
- `update` - Allow sellers to update their own products
- `create` - Allow sellers to create products
- `delete` - Allow sellers to delete their own products

### 2. Create Custom Vendor Controller

Create a custom controller that allows sellers to access only their own vendor data:

```javascript
// src/api/vendor/controllers/vendor.js
'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vendor.vendor', ({ strapi }) => ({
  async find(ctx) {
    // If user is seller, only return their own vendor
    if (ctx.state.user && ctx.state.user.role.name === 'seller') {
      ctx.query.filters = {
        ...ctx.query.filters,
        user: ctx.state.user.id
      };
    }
    
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    // If user is seller, check if they own this vendor
    if (ctx.state.user && ctx.state.user.role.name === 'seller') {
      const vendor = await strapi.entityService.findOne('api::vendor.vendor', ctx.params.id, {
        populate: ['user']
      });
      
      if (!vendor || vendor.user.id !== ctx.state.user.id) {
        return ctx.forbidden('Access denied');
      }
    }
    
    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  }
}));
```

### 3. Update Frontend to Use Proper API Calls

Replace the hardcoded mapping with proper API calls:

```typescript
// In use-auth.tsx
const fetchVendorForUser = async (userId: number, token: string) => {
  try {
    // Use the custom vendor endpoint that respects permissions
    const response = await fetch('http://localhost:1337/api/vendors?populate=user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // The API should only return the user's own vendor
      if (data.data && data.data.length > 0) {
        return data.data[0].id;
      }
    }
  } catch (error) {
    console.error('Error fetching vendor:', error);
  }
  return null;
};
```

### 4. Alternative: Use User-Vendor Relationship

Instead of vendors having a user relationship, make users have a vendor relationship:

```javascript
// Update user schema to include vendor relationship
// src/extensions/users-permissions/content-types/user/schema.json
{
  "attributes": {
    // ... existing attributes
    "vendor": {
      "type": "relation",
      "relation": "oneToOne",
      "target": "api::vendor.vendor"
    }
  }
}
```

Then fetch vendor data through the user:
```typescript
const userResponse = await fetch('http://localhost:1337/api/users/me?populate=vendor', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 5. Test the Solution

1. Update Strapi permissions
2. Restart Strapi server
3. Test seller login
4. Verify vendor data access
5. Remove hardcoded mapping from frontend

## Current Workaround

Until permissions are properly configured, the hardcoded mapping is a functional workaround, but it's not scalable and doesn't follow security best practices.

## Next Steps

1. Configure Strapi permissions properly
2. Implement custom controllers if needed
3. Update frontend to use proper API calls
4. Remove hardcoded mapping
5. Test with multiple seller accounts 