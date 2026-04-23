# BEP Authentication & Role Replication Guide

This package contains the complete "Cinematic Precision" authentication system built with Supabase and React.

## 📦 What's included

1.  **Backend (SQL)**: `auth-schema.sql` to set up the profiles table and triggers.
2.  **Infrastructure**: `supabase.ts` client setup.
3.  **Core Logic**: `AuthContext.tsx` and `useRole.ts`.
4.  **UI Components**: `Login.tsx` (the Cinematic UI) and `RoleGuard.tsx` (Route protection).

## 🚀 Step-by-Step Integration

### 1. Database Setup
Run the contents of `sql/auth-schema.sql` in your Supabase SQL Editor. This sets up:
- A `profiles` table that tracks user roles (`admin` or `user`).
- A trigger that automatically creates a profile when a new user signs up.

### 2. Environment Variables
Add these to your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Copy Files
Copy the `src` folder content into your project's `src` directory.

### 4. Provide the Context
Update your `main.tsx` or `App.tsx` to wrap your app in the `AuthProvider`:

```tsx
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourRouter />
    </AuthProvider>
  );
}
```

### 5. Protect Routes
Use the `RoleGuard` component in your router:

```tsx
<Route path="/admin" element={
  <RoleGuard requiredRole="admin">
    <AdminDashboard />
  </RoleGuard>
} />
```

### 6. Design Tokens (CSS)
Add these variables to your `index.css` inside `:root` to preserve the visual style:

```css
:root {
    --bg-app:       #f5f5f7;
    --bg-surface:   #ffffff;
    --primary-container: #0071e3;
    --text-primary:   #1d1d1f;
    --text-secondary: #6e6e73;
    --text-tertiary:  #999999;
    --radius-pill: 9999px;
    --shadow-md:  0 8px 24px rgba(0,0,0,0.08);
}
```

The components in this package are designed to work with **Tailwind CSS** and **Lucide React**. Ensure you have these installed:
`npm install @supabase/supabase-js lucide-react react-router-dom`
