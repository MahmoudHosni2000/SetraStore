# Setup Guide - SetraStore E-Commerce Application

This guide will walk you through setting up the SetraStore application from scratch.

## Prerequisites

Before starting, make sure you have:
- Node.js 18 or higher installed
- npm or yarn package manager
- A Supabase account (free tier works fine)
- Basic knowledge of React and Next.js

## Step-by-Step Setup

### 1. Install Dependencies

First, install all required packages:

```bash
npm install
```

This will install:
- Next.js 13 with App Router
- React and React DOM
- Supabase JavaScript client
- Tailwind CSS and shadcn/ui components
- TypeScript and type definitions
- Other utility libraries

### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: "SetraStore" (or any name you prefer)
   - Database password: Create a strong password
   - Region: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be provisioned (takes 1-2 minutes)

### 3. Get Supabase Credentials

Once your project is ready:

1. Click on the "Settings" icon (gear) in the sidebar
2. Go to "API" section
3. You'll see two important values:
   - **Project URL**: This is your NEXT_PUBLIC_SUPABASE_URL
   - **anon public** key: This is your NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Copy these values

### 4. Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Replace the placeholder values with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Never commit this file to version control!

### 5. Database Setup

The database schema has already been applied through migrations. This includes:

**Tables created:**
- profiles (user information)
- products (cosmetics catalog)
- orders (customer orders)
- order_items (items in orders)
- cart (shopping cart)
- wishlist (saved products)
- reviews (product reviews)
- coupons (discount codes)

**Sample data inserted:**
- 28 cosmetics products
- 4 active coupon codes

All tables have Row Level Security (RLS) enabled automatically.

### 6. Verify Database

To verify everything is set up correctly:

1. Go to your Supabase dashboard
2. Click "Table Editor" in the sidebar
3. You should see all 8 tables listed
4. Click on "products" - you should see 28 sample products
5. Click on "coupons" - you should see 4 coupon codes

### 7. Run Development Server

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 8. Test the Application

**Test User Registration:**
1. Click "Sign Up" in the navbar
2. Create a test account
3. Check your Supabase dashboard > Authentication > Users
4. Your new user should appear there

**Test Product Browsing:**
1. Navigate to the homepage
2. You should see featured products
3. Click "Shop Now" to see all products
4. Try filtering by category
5. Try the search functionality

**Test Shopping Cart:**
1. Click on a product
2. Click "Add to Cart"
3. Check the cart icon - it should show a badge
4. Go to cart page
5. Try updating quantities

### 9. Create Admin User

To access the admin dashboard:

1. Register a new account through the app (or use existing)
2. Go to Supabase Dashboard
3. Click "Table Editor" > "profiles"
4. Find your user row
5. Click the edit icon
6. Change `is_admin` from `false` to `true`
7. Click "Save"
8. Log out and log back in to the application
9. You should now see "Admin Dashboard" in the user menu
10. Access it at `http://localhost:3000/admin`

### 10. Test Complete Flow

**User Journey:**
1. Browse products on homepage
2. Click on a product to view details
3. Add product to cart
4. Add some products to wishlist
5. Go to cart
6. Proceed to checkout
7. Fill in delivery information
8. Try applying a coupon code (e.g., WELCOME10)
9. Place order
10. View order in "My Orders"

**Admin Journey:**
1. Log in as admin user
2. Go to Admin Dashboard
3. View statistics
4. Try adding a new product
5. Try editing an existing product
6. View orders
7. Change an order status

## Troubleshooting

### Environment Variables Not Loading
- Make sure `.env.local` file is in the root directory
- Restart the development server after changing env variables
- Check that variable names start with `NEXT_PUBLIC_`

### Supabase Connection Errors
- Verify your Supabase URL and anon key are correct
- Check that your Supabase project is active
- Ensure you're not hitting rate limits on the free tier

### Database Errors
- Check that all migrations ran successfully
- Verify Row Level Security policies are enabled
- Make sure your user has proper permissions

### Authentication Issues
- Clear browser cookies and local storage
- Check Supabase Auth settings allow email/password
- Verify email confirmation is disabled for testing

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild
- Check Node.js version is 18 or higher

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
6. Click "Deploy"

### Netlify Deployment

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" > "Import an existing project"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add environment variables in Site settings
7. Click "Deploy"

## Environment Variables for Production

When deploying to production, ensure you set:

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## Security Checklist

Before going live:
- [ ] Changed all default passwords
- [ ] Enabled RLS on all tables
- [ ] Tested authentication flows
- [ ] Verified admin access controls
- [ ] Added rate limiting if needed
- [ ] Set up monitoring and logging
- [ ] Configured backup strategy
- [ ] Added proper error handling
- [ ] Tested on multiple devices/browsers

## Next Steps

After setup, you can:
1. Customize the color scheme in `app/globals.css`
2. Replace sample product images with real ones
3. Add your own product data
4. Configure custom domain
5. Set up email notifications
6. Add analytics tracking
7. Implement additional payment methods
8. Enhance SEO with metadata

## Getting Help

If you encounter issues:
1. Check this setup guide
2. Review the main README.md
3. Check Supabase documentation
4. Review Next.js documentation
5. Open an issue in the repository

## Success!

If you've completed all steps, you should now have:
- A fully functional e-commerce application
- Sample products loaded
- Authentication working
- Shopping cart functional
- Admin dashboard accessible
- Ready for customization and deployment

Happy building!
