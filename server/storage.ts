import { 
  users, sellerProfiles, products, orders, orderItems, reviews, earnings, notifications, categories,
  type User, type InsertUser, type SellerProfile, type InsertSellerProfile,
  type Product, type InsertProduct, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type Review, type InsertReview,
  type Earning, type Notification, type InsertNotification
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Seller Profiles
  getSellerProfile(userId: number): Promise<SellerProfile | undefined>;
  createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile>;
  updateSellerProfile(userId: number, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined>;
  getAllSellers(): Promise<Array<User & { sellerProfile: SellerProfile }>>;
  
  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Orders
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersBySeller(sellerId: number): Promise<Array<Order & { items: OrderItem[] }>>;
  getAllOrders(): Promise<Array<Order & { items: OrderItem[] }>>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Reviews
  getReviewsByProduct(productId: number): Promise<Review[]>;
  getReviewsBySeller(sellerId: number): Promise<Array<Review & { product: Product }>>;
  createReview(review: InsertReview): Promise<Review>;
  
  // Earnings
  getEarningsBySeller(sellerId: number): Promise<Earning[]>;
  getAllEarnings(): Promise<Array<Earning & { seller: User }>>;
  createEarning(earning: Omit<Earning, 'id' | 'createdAt'>): Promise<Earning>;
  
  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Analytics
  getSellerAnalytics(sellerId: number): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    recentOrders: Array<Order & { items: OrderItem[] }>;
    topProducts: Array<Product & { salesCount: number; revenue: number }>;
  }>;
  
  getAdminAnalytics(): Promise<{
    totalRevenue: number;
    totalSellers: number;
    totalOrders: number;
    totalProducts: number;
    recentOrders: Array<Order & { items: OrderItem[] }>;
    topSellers: Array<User & { revenue: number; orderCount: number }>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private sellerProfiles: Map<number, SellerProfile> = new Map();
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem[]> = new Map();
  private reviews: Map<number, Review> = new Map();
  private earnings: Map<number, Earning> = new Map();
  private notifications: Map<number, Notification> = new Map();
  
  private currentUserId = 1;
  private currentSellerProfileId = 1;
  private currentProductId = 1;
  private currentOrderId = 1;
  private currentReviewId = 1;
  private currentEarningId = 1;
  private currentNotificationId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create admin user
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      email: "admin@sellerhub.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample seller
    const sellerUser: User = {
      id: this.currentUserId++,
      username: "johnseller",
      email: "john@techstore.com",
      password: "seller123",
      firstName: "John",
      lastName: "Seller",
      role: "seller",
      avatar: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(sellerUser.id, sellerUser);

    // Create seller profile
    const sellerProfile: SellerProfile = {
      id: this.currentSellerProfileId++,
      userId: sellerUser.id,
      shopName: "Tech Store Pro",
      shopDescription: "Premium electronics and gadgets",
      shopBanner: null,
      contactPhone: "+91-9876543210",
      address: "123 Tech Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      gstNumber: "27ABCDE1234F1Z5",
      bankAccountNumber: "1234567890",
      ifscCode: "HDFC0000123",
      isApproved: true,
      commissionRate: "5.00",
    };
    this.sellerProfiles.set(sellerProfile.userId, sellerProfile);

    // Create sample products
    const products = [
      {
        id: this.currentProductId++,
        sellerId: sellerUser.id,
        categoryId: 1,
        name: "iPhone 15 Pro Max",
        description: "Latest Apple smartphone with advanced features",
        price: "124999.00",
        costPrice: "110000.00",
        stock: 10,
        sku: "IPH15PM001",
        images: ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&w=400&h=400&fit=crop"],
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
      },
      {
        id: this.currentProductId++,
        sellerId: sellerUser.id,
        categoryId: 1,
        name: "MacBook Air M2",
        description: "Powerful laptop for professionals",
        price: "119900.00",
        costPrice: "105000.00",
        stock: 5,
        sku: "MBA-M2-001",
        images: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&w=400&h=400&fit=crop"],
        isActive: true,
        isApproved: true,
        createdAt: new Date(),
      },
    ];

    products.forEach(product => this.products.set(product.id, product));

    // Create sample orders
    const order: Order = {
      id: this.currentOrderId++,
      orderNumber: "ORD-2024-001",
      customerId: 100,
      customerName: "Jane Customer",
      customerEmail: "jane@example.com",
      customerPhone: "+91-9876543210",
      shippingAddress: {
        street: "456 Customer Lane",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      status: "pending",
      totalAmount: "124999.00",
      createdAt: new Date(),
    };
    this.orders.set(order.id, order);

    const orderItem: OrderItem = {
      id: 1,
      orderId: order.id,
      productId: 1,
      sellerId: sellerUser.id,
      quantity: 1,
      price: "124999.00",
      totalAmount: "124999.00",
    };
    this.orderItems.set(order.id, [orderItem]);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role || 'seller_pending',
      avatar: insertUser.avatar || null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getSellerProfile(userId: number): Promise<SellerProfile | undefined> {
    return this.sellerProfiles.get(userId);
  }

  async createSellerProfile(profile: InsertSellerProfile): Promise<SellerProfile> {
    const sellerProfile: SellerProfile = {
      id: this.currentSellerProfileId++,
      userId: profile.userId,
      shopName: profile.shopName,
      shopDescription: profile.shopDescription || null,
      shopBanner: profile.shopBanner || null,
      contactPhone: profile.contactPhone || null,
      address: profile.address || null,
      city: profile.city || null,
      state: profile.state || null,
      pincode: profile.pincode || null,
      gstNumber: profile.gstNumber || null,
      bankAccountNumber: profile.bankAccountNumber || null,
      ifscCode: profile.ifscCode || null,
      isApproved: profile.isApproved ?? false,
      commissionRate: profile.commissionRate || null,
    };
    this.sellerProfiles.set(profile.userId, sellerProfile);
    return sellerProfile;
  }

  async updateSellerProfile(userId: number, updates: Partial<SellerProfile>): Promise<SellerProfile | undefined> {
    const profile = this.sellerProfiles.get(userId);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...updates };
    this.sellerProfiles.set(userId, updatedProfile);
    return updatedProfile;
  }

  async getAllSellers(): Promise<Array<User & { sellerProfile: SellerProfile }>> {
    const sellers = Array.from(this.users.values()).filter(user => user.role === "seller" || user.role === "seller_pending");
    return sellers.map(seller => ({
      ...seller,
      sellerProfile: this.sellerProfiles.get(seller.id)!,
    })).filter(seller => seller.sellerProfile);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.sellerId === sellerId);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.currentProductId++,
      name: insertProduct.name,
      description: insertProduct.description || null,
      price: insertProduct.price,
      costPrice: insertProduct.costPrice || null,
      stock: insertProduct.stock || 0,
      sku: insertProduct.sku || null,
      images: insertProduct.images as string[] | null,
      isActive: insertProduct.isActive ?? true,
      isApproved: insertProduct.isApproved ?? false,
      sellerId: insertProduct.sellerId,
      categoryId: insertProduct.categoryId || null,
      createdAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersBySeller(sellerId: number): Promise<Array<Order & { items: OrderItem[] }>> {
    const orders = Array.from(this.orders.values());
    const sellerOrders = [];
    
    for (const order of orders) {
      const items = this.orderItems.get(order.id) || [];
      const sellerItems = items.filter(item => item.sellerId === sellerId);
      if (sellerItems.length > 0) {
        sellerOrders.push({ ...order, items: sellerItems });
      }
    }
    
    return sellerOrders;
  }

  async getAllOrders(): Promise<Array<Order & { items: OrderItem[] }>> {
    const orders = Array.from(this.orders.values());
    return orders.map(order => ({
      ...order,
      items: this.orderItems.get(order.id) || [],
    }));
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const order: Order = {
      id: this.currentOrderId++,
      orderNumber: insertOrder.orderNumber,
      customerId: insertOrder.customerId,
      customerName: insertOrder.customerName,
      customerEmail: insertOrder.customerEmail,
      customerPhone: insertOrder.customerPhone || null,
      shippingAddress: insertOrder.shippingAddress,
      status: insertOrder.status || 'pending',
      totalAmount: insertOrder.totalAmount,
      createdAt: new Date(),
    };
    this.orders.set(order.id, order);
    
    const orderItemsWithId = items.map((item, index) => ({
      id: index + 1,
      ...item,
    }));
    this.orderItems.set(order.id, orderItemsWithId);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getReviewsByProduct(productId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.productId === productId);
  }

  async getReviewsBySeller(sellerId: number): Promise<Array<Review & { product: Product }>> {
    const reviews = Array.from(this.reviews.values());
    const sellerReviews = [];
    
    for (const review of reviews) {
      const product = this.products.get(review.productId);
      if (product && product.sellerId === sellerId) {
        sellerReviews.push({ ...review, product });
      }
    }
    
    return sellerReviews;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const review: Review = {
      id: this.currentReviewId++,
      customerId: insertReview.customerId,
      customerName: insertReview.customerName,
      productId: insertReview.productId,
      rating: insertReview.rating,
      comment: insertReview.comment || null,
      createdAt: new Date(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async getEarningsBySeller(sellerId: number): Promise<Earning[]> {
    return Array.from(this.earnings.values()).filter(earning => earning.sellerId === sellerId);
  }

  async getAllEarnings(): Promise<Array<Earning & { seller: User }>> {
    const earnings = Array.from(this.earnings.values());
    return earnings.map(earning => ({
      ...earning,
      seller: this.users.get(earning.sellerId)!,
    })).filter(earning => earning.seller);
  }

  async createEarning(earning: Omit<Earning, 'id' | 'createdAt'>): Promise<Earning> {
    const newEarning: Earning = {
      ...earning,
      id: this.currentEarningId++,
      createdAt: new Date(),
    };
    this.earnings.set(newEarning.id, newEarning);
    return newEarning;
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(notification => notification.userId === userId);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: this.currentNotificationId++,
      message: insertNotification.message,
      type: insertNotification.type || null,
      userId: insertNotification.userId,
      title: insertNotification.title,
      isRead: insertNotification.isRead || null,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return true;
  }

  async getSellerAnalytics(sellerId: number): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    averageRating: number;
    recentOrders: Array<Order & { items: OrderItem[] }>;
    topProducts: Array<Product & { salesCount: number; revenue: number }>;
  }> {
    const products = await this.getProductsBySeller(sellerId);
    const orders = await this.getOrdersBySeller(sellerId);
    const reviews = await this.getReviewsBySeller(sellerId);
    
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;
    
    const recentOrders = orders.slice(-5);
    
    // Calculate top products
    const productSales = new Map<number, { salesCount: number; revenue: number }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productSales.get(item.productId) || { salesCount: 0, revenue: 0 };
        productSales.set(item.productId, {
          salesCount: existing.salesCount + item.quantity,
          revenue: existing.revenue + parseFloat(item.totalAmount),
        });
      });
    });
    
    const topProducts = products
      .map(product => ({
        ...product,
        salesCount: productSales.get(product.id)?.salesCount || 0,
        revenue: productSales.get(product.id)?.revenue || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      averageRating,
      recentOrders,
      topProducts,
    };
  }

  async getAdminAnalytics(): Promise<{
    totalRevenue: number;
    totalSellers: number;
    totalOrders: number;
    totalProducts: number;
    recentOrders: Array<Order & { items: OrderItem[] }>;
    topSellers: Array<User & { revenue: number; orderCount: number }>;
  }> {
    const allOrders = await this.getAllOrders();
    const allProducts = await this.getAllProducts();
    const allSellers = await this.getAllSellers();
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const totalSellers = allSellers.length;
    const totalOrders = allOrders.length;
    const totalProducts = allProducts.length;
    
    const recentOrders = allOrders.slice(-10);
    
    // Calculate top sellers
    const sellerStats = new Map<number, { revenue: number; orderCount: number }>();
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const existing = sellerStats.get(item.sellerId) || { revenue: 0, orderCount: 0 };
        sellerStats.set(item.sellerId, {
          revenue: existing.revenue + parseFloat(item.totalAmount),
          orderCount: existing.orderCount + 1,
        });
      });
    });
    
    const topSellers = Array.from(this.users.values())
      .filter(user => user.role === "seller")
      .map(seller => ({
        ...seller,
        revenue: sellerStats.get(seller.id)?.revenue || 0,
        orderCount: sellerStats.get(seller.id)?.orderCount || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    return {
      totalRevenue,
      totalSellers,
      totalOrders,
      totalProducts,
      recentOrders,
      topSellers,
    };
  }
}

export const storage = new MemStorage();
