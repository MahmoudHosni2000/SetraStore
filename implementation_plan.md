# Set up "Setra Store" Prisma Foundation (SQL Server)

This plan outlines the specific steps needed to rename the project to "Setra Store" and establish a robust SQL Server database foundation using Prisma, without implementing authentication, API routes, or full CRUD operations yet.

## User Review Required

> [!IMPORTANT]
> Please review the detailed Prisma schema provided below. It contains all 21 requested models with e-commerce relations. Ensure that the relationships, enums, and fields (especially the snapshot fields in `OrderItem`) meet your exact business requirements. I have also plotted removing Supabase entirely from the dependencies.

## Proposed Changes

### Dependency & Environment Updates
- **Remove Supabase**: `npm uninstall @supabase/supabase-js`
- **Install Prisma**: `npm install -D prisma` and `npm install @prisma/client`
- **Environment**: Add `DATABASE_URL` to `.env` pointing to your SQL Server instance, and replace any Supabase keys.

---
### Global Configuration Updates

#### [MODIFY] package.json
- Update `"name"` to `"setra-store"`.
- Remove `@supabase/supabase-js`.
- Add `prisma` and `@prisma/client` dependencies.
- Add `"prisma": { "seed": "ts-node prisma/seed.ts" }` script configuration.

#### [MODIFY] app/layout.tsx
- Update the page `<title>` and `description` to reflect **Setra Store**.

---
### Database Foundation

#### [NEW] prisma/schema.prisma

The following is the planned structure for the SQL Server schema. It adheres to all constraints: separates Admin/Customer, tracks inventory via ProductInventory, links variants, and keeps snapshot purchase data in OrderItem.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

// ==============================================
// User Accounts (Separated)
// ==============================================
model AdminUser {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  auditLogs AuditLog[]
}

model Customer {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Note: We won't implement auth code, just the schema
  firstName String
  lastName  String
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  addresses     Address[]
  orders        Order[]
  cart          Cart?
  reviews       Review[]
  wishlistItems WishlistItem[]
}

model Address {
  id           String   @id @default(uuid())
  customerId   String
  customer     Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  addressLine1 String
  addressLine2 String?
  city         String
  state        String
  postalCode   String
  country      String
  isDefault    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  orders       Order[]
}

// ==============================================
// Product Catalog
// ==============================================
model Category {
  id          String     @id @default(uuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?
  parent      Category?  @relation("SubCategories", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children    Category[] @relation("SubCategories")
  products    Product[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Brand {
  id          String    @id @default(uuid())
  name        String    @unique
  description String?
  logoUrl     String?
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String
  basePrice   Decimal  @db.Decimal(10, 2)
  isPublished Boolean  @default(false)
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  brandId     String
  brand       Brand    @relation(fields: [brandId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  images      ProductImage[]
  variants    ProductVariant[]
  reviews     Review[]
}

model ProductImage {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  altText   String?
  isPrimary Boolean  @default(false)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProductVariant {
  id          String   @id @default(uuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku         String   @unique
  name        String   // e.g "Large / Red"
  priceDetail Decimal? @db.Decimal(10, 2) // Override or modifier if needed

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventory     ProductInventory?
  cartItems     CartItem[]
  orderItems    OrderItem[]
  wishlistItems WishlistItem[]
}

model ProductInventory {
  id               String         @id @default(uuid())
  productVariantId String         @unique
  variant          ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  quantity         Int            @default(0)
  reserved         Int            @default(0)
  lowStockAlert    Int            @default(5)
  updatedAt        DateTime       @updatedAt
}

// ==============================================
// Shopping Cart
// ==============================================
model Cart {
  id         String     @id @default(uuid())
  customerId String     @unique
  customer   Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  items      CartItem[]
}

model CartItem {
  id               String         @id @default(uuid())
  cartId           String
  cart             Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productVariantId String
  variant          ProductVariant @relation(fields: [productVariantId], references: [id])
  quantity         Int            @default(1)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

// ==============================================
// Order Management
// ==============================================
model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  customerId      String
  customer        Customer    @relation(fields: [customerId], references: [id])
  shippingAddressId String
  address         Address     @relation(fields: [shippingAddressId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  status          OrderStatus @default(PENDING)
  totalAmount     Decimal     @db.Decimal(10, 2)
  taxAmount       Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2)
  
  couponId        String?
  coupon          Coupon?     @relation(fields: [couponId], references: [id], onDelete: SetNull)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  items           OrderItem[]
  payment         Payment?
  shipment        Shipment?
}

model OrderItem {
  id               String         @id @default(uuid())
  orderId          String
  order            Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  productVariantId String?
  variant          ProductVariant? @relation(fields: [productVariantId], references: [id], onDelete: SetNull)
  
  // Snapshots at time of purchase
  productName      String
  variantName      String
  sku              String
  unitPrice        Decimal        @db.Decimal(10, 2)
  quantity         Int
  totalPrice       Decimal        @db.Decimal(10, 2)

  createdAt        DateTime       @default(now())
}

model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  status        PaymentStatus @default(PENDING)
  transactionId String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model Shipment {
  id             String         @id @default(uuid())
  orderId        String         @unique
  order          Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  trackingNumber String?
  carrier        String?
  status         ShipmentStatus @default(PROCESSING)
  shippedAt      DateTime?
  deliveredAt    DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

// ==============================================
// Marketing & Engagement
// ==============================================
model Coupon {
  id            String   @id @default(uuid())
  code          String   @unique
  discountType  DiscountType
  discountValue Decimal  @db.Decimal(10, 2)
  minOrderValue Decimal? @db.Decimal(10, 2)
  validFrom     DateTime
  validUntil    DateTime
  usageLimit    Int?
  usedCount     Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  
  orders        Order[]
}

model Banner {
  id        String   @id @default(uuid())
  title     String
  imageUrl  String
  linkUrl   String?
  isActive  Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Review {
  id         String   @id @default(uuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  rating     Int      @db.SmallInt // 1 to 5
  comment    String?  @db.Text
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model WishlistItem {
  id               String         @id @default(uuid())
  customerId       String
  customer         Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  productVariantId String
  variant          ProductVariant @relation(fields: [productVariantId], references: [id], onDelete: Cascade)
  createdAt        DateTime       @default(now())

  @@unique([customerId, productVariantId])
}

// ==============================================
// System
// ==============================================
model Setting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id          String     @id @default(uuid())
  adminUserId String?
  adminUser   AdminUser? @relation(fields: [adminUserId], references: [id], onDelete: SetNull)
  action      String
  entity      String
  entityId    String
  details     String?    @db.Text
  ipAddress   String?
  createdAt   DateTime   @default(now())
}

// ==============================================
// Enums
// ==============================================
enum Role {
  SUPER_ADMIN
  ADMIN
  MANAGER
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  PAYPAL
  BANK_TRANSFER
  CASH_ON_DELIVERY
}

enum ShipmentStatus {
  PROCESSING
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RETURNED
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

#### [NEW] prisma/seed.ts
Create a base typescript seeding file that cleans the database and seeds initial categories, a brand, an admin user, and some settings using `@prisma/client`. Also installs `ts-node` for execution.

## Open Questions

- We are removing `@supabase/supabase-js`. Does this match your intent, to entirely switch back to Microsoft SQL Server instead of Supabase PostgreSQL/Auth?
- For the `ProductVariant` name (e.g., "Size: M, Color: Blue"), is a string sufficient, or did you require entirely separated Option and OptionValue models? Right now, an independent `ProductVariant` model encapsulates sku, name, and its inventory. 

## Verification Plan
### Automated Tests
- Run `npm run typecheck`
- Format via `npx prisma format`

### Manual Verification
- Manually review `schema.prisma` contents.
- Check database diagram or generated Prisma types to ensure snapshot fields in `OrderItem` remain perfectly disjointed from active models when deleting old items.
