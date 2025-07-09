# Seller & Admin Panel Web Application

## Overview

This is a comprehensive seller and admin dashboard application built for an e-commerce marketplace. The application provides role-based access control with separate interfaces for sellers to manage their shops and administrators to oversee the entire platform.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state, React Context for authentication
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication with role-based access control
- **API Pattern**: RESTful API structure with middleware for authentication and authorization

### Database Design
The application uses a PostgreSQL database with the following core entities:
- **Users**: Base user accounts with role assignment (seller, admin, seller_pending)
- **Seller Profiles**: Extended seller information including shop details and payment info
- **Products**: Product catalog with seller association and category management
- **Orders**: Order management with line items and status tracking
- **Reviews**: Customer feedback system for products and sellers
- **Earnings**: Financial tracking for sellers including commission calculations
- **Notifications**: System messaging for users

## Key Components

### Authentication System
- JWT token-based authentication stored in localStorage
- Role-based access control (RBAC) with three roles: admin, seller, seller_pending
- Protected route components that redirect based on user roles
- Automatic token validation and user session management

### Dashboard Interfaces
**Seller Dashboard Features:**
- Product management (CRUD operations)
- Order tracking and status updates
- Inventory management
- Earnings overview with commission tracking
- Review management
- Shop profile settings

**Admin Dashboard Features:**
- Seller approval and management
- Platform-wide analytics
- Product oversight and moderation
- Order monitoring
- Commission rate management

### UI/UX Architecture
- Responsive design with mobile-first approach
- Dark mode support through CSS variables
- Component-based architecture using shadcn/ui
- Mobile navigation with bottom tab bar
- Desktop sidebar navigation
- Toast notifications for user feedback

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Server validates credentials and generates JWT
3. Client stores token and updates authentication context
4. Protected routes check user role and redirect accordingly
5. API requests include token in Authorization header

### Product Management Flow
1. Seller creates/updates product through form
2. Client validates data and sends to API
3. Server processes request with seller authorization
4. Database updated with optimistic UI updates
5. React Query invalidates cache and refetches data

### Order Processing Flow
1. Orders created through external system (not in current scope)
2. Sellers view orders in dashboard
3. Status updates trigger notifications
4. Earnings calculated based on commission rates
5. Analytics updated in real-time

## External Dependencies

### Key Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives for shadcn/ui components
- **drizzle-orm**: Type-safe SQL database toolkit
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **react-hook-form**: Form validation and management
- **zod**: Schema validation for forms and API
- **wouter**: Lightweight React router
- **jsonwebtoken**: JWT token handling
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast bundling for production
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Build Process
- Frontend builds to `dist/public` directory using Vite
- Backend builds to `dist` directory using ESBuild
- Single deployment artifact containing both frontend and backend

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- JWT secret via `JWT_SECRET` environment variable
- Development/production mode switching via `NODE_ENV`

### Database Management
- Drizzle Kit for schema migrations
- PostgreSQL database with connection pooling
- Automated schema synchronization with `db:push` command

### Production Considerations
- Express serves static files in production
- Vite dev server only in development
- Error handling middleware for API endpoints
- CORS and security headers (to be implemented)
- Session management for authentication persistence

The application is designed to be deployed as a monolithic application with the Express server serving both API endpoints and static frontend assets, making it suitable for platforms like Replit, Heroku, or similar hosting services.