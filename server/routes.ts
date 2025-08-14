import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthRequest extends Request {
  user?: any;
}

// JWT middleware - Modified for Strapi integration
const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // For demo purposes, bypass authentication for Strapi API token
  if (token && token.includes('e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5')) {
    // Mock admin user for Strapi integration
    req.user = {
      id: 1,
      username: "admin",
      email: "admin@cityshopping.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      avatar: undefined,
      isActive: true,
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Role-based access control
const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const sellerProfile = user.role === 'seller' ? await storage.getSellerProfile(user.id) : null;

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          sellerProfile,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "seller_pending",
        avatar: null,
        isActive: true,
      });

      const sellerProfile = await storage.createSellerProfile({
        userId: user.id,
        shopName: data.shopName,
        shopDescription: data.shopDescription || null,
        shopBanner: null,
        contactPhone: data.contactPhone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstNumber: null,
        bankAccountNumber: null,
        ifscCode: null,
        isApproved: false,
        commissionRate: "5.00",
      });

      res.status(201).json({
        message: "Registration successful. Waiting for admin approval.",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          sellerProfile,
        }
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    const sellerProfile = req.user.role === 'seller' ? await storage.getSellerProfile(req.user.id) : null;
    res.json({
      user: {
        ...req.user,
        sellerProfile,
      }
    });
  });

  // Products routes
  app.get("/api/products", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let products;
      if (req.user.role === 'admin') {
        products = await storage.getAllProducts();
      } else {
        products = await storage.getProductsBySeller(req.user.id);
      }
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", authenticateToken, requireRole(['seller']), async (req: AuthRequest, res) => {
    try {
      const product = await storage.createProduct({
        ...req.body,
        sellerId: req.user.id,
      });
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const existingProduct = await storage.getProduct(productId);
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (req.user.role !== 'admin' && existingProduct.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const product = await storage.updateProduct(productId, req.body);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = parseInt(req.params.id);
      const existingProduct = await storage.getProduct(productId);
      
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (req.user.role !== 'admin' && existingProduct.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      const deleted = await storage.deleteProduct(productId);
      res.json({ success: deleted });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete product" });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let orders;
      if (req.user.role === 'admin') {
        orders = await storage.getAllOrders();
      } else {
        orders = await storage.getOrdersBySeller(req.user.id);
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/orders/:id/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Reviews routes
  app.get("/api/reviews", authenticateToken, requireRole(['seller']), async (req: AuthRequest, res) => {
    try {
      const reviews = await storage.getReviewsBySeller(req.user.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Earnings routes
  app.get("/api/earnings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let earnings;
      if (req.user.role === 'admin') {
        earnings = await storage.getAllEarnings();
      } else {
        earnings = await storage.getEarningsBySeller(req.user.id);
      }
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      let analytics;
      if (req.user.role === 'admin') {
        analytics = await storage.getAdminAnalytics();
      } else {
        analytics = await storage.getSellerAnalytics(req.user.id);
      }
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      res.json({ success });
    } catch (error) {
      res.status(400).json({ message: "Failed to mark notification as read" });
    }
  });

  // Admin routes
  app.get("/api/admin/sellers", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const sellers = await storage.getAllSellers();
      res.json(sellers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sellers" });
    }
  });

  app.put("/api/admin/sellers/:id/approve", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const sellerId = parseInt(req.params.id);
      const user = await storage.updateUser(sellerId, { role: 'seller' });
      const profile = await storage.updateSellerProfile(sellerId, { isApproved: true });
      
      if (!user || !profile) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Create welcome notification
      await storage.createNotification({
        userId: sellerId,
        title: "Welcome to SellerHub!",
        message: "Your seller account has been approved. You can now start adding products.",
        type: "success",
        isRead: false,
      });

      res.json({ user, profile });
    } catch (error) {
      res.status(400).json({ message: "Failed to approve seller" });
    }
  });

  app.put("/api/admin/sellers/:id/reject", authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const sellerId = parseInt(req.params.id);
      const user = await storage.updateUser(sellerId, { isActive: false });
      
      if (!user) {
        return res.status(404).json({ message: "Seller not found" });
      }

      await storage.createNotification({
        userId: sellerId,
        title: "Application Rejected",
        message: "Your seller application has been rejected. Please contact support for more information.",
        type: "error",
        isRead: false,
      });

      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Failed to reject seller" });
    }
  });

  // Profile routes
  app.get("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sellerProfile = await storage.getSellerProfile(req.user.id);
      res.json({
        user: req.user,
        sellerProfile,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { user: userData, sellerProfile: profileData } = req.body;
      
      let updatedUser = req.user;
      if (userData) {
        updatedUser = await storage.updateUser(req.user.id, userData);
      }

      let updatedProfile = null;
      if (profileData && req.user.role === 'seller') {
        updatedProfile = await storage.updateSellerProfile(req.user.id, profileData);
      }

      res.json({
        user: updatedUser,
        sellerProfile: updatedProfile,
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
