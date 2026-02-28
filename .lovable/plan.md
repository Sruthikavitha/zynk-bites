

## Build Error Fixes + Multi-Step Enhancement Plan

### Part 1: Fix Build Errors (Immediate)

Five errors in `src/services/api.ts`:

1. **Lines 1923, 2061, 2094**: `'energy-boost'` should be `'energy'` (matching `HealthGoal` type)
2. **Line 2097**: `'improved-digestion'` does not exist in `HealthGoal` — replace with `'maintenance'`
3. **Line 1978**: `skipCount` is undefined — change to `request.skipCount`

### Part 2: Role-Based Route Separation (Step 1)

- Add new routes: `/customer/home`, `/chef/dashboard`, `/delivery/dashboard`, `/admin/dashboard`
- Update `Dashboard.tsx` to redirect based on `user.role` to the correct sub-route
- If role is missing/invalid, call `logout()` and redirect to `/login`
- Each route renders the existing dashboard component (no logic changes)
- Update `Login.tsx` post-login redirect to use role-based paths

### Part 3: Customer Chef Browsing (Steps 2-3)

- In customer home, fetch chefs and filter client-side by `is_active`, `is_verified`, and matching pincode
- Add `// TODO: Move filtering to backend later for optimization` comment
- Empty state UI when no chefs match
- Chef detail page at `/customer/chef/:chefId` showing meal plans, pricing, and a "Subscribe" button (UI only, no payment integration)

### Part 4: Subscription Creation (Step 4)

- Add `subscribeToMealPlan` function in `src/services/api.ts`
- Creates subscription with `status: 'pending'`, `price_snapshot` from meal plan, `start_date: next day`
- Validates customer role before creation
- No payment processing — just record creation in mock DB

### Part 5: Payment Placeholder (Step 5)

- Since this is a frontend-only prototype without a real backend, and Razorpay requires server-side order creation and webhook verification, add a **simulated payment flow**:
  - "Pay Now" button triggers a mock payment confirmation dialog
  - On confirm, subscription status updates from `pending` to `active`
  - Add `// TODO: Integrate Razorpay server-side order creation and webhook verification` comment

### Files to Modify

- `src/services/api.ts` — fix type errors + add subscription/payment functions
- `src/types/index.ts` — add subscription status types if needed
- `src/App.tsx` — add role-based routes
- `src/pages/Dashboard.tsx` — redirect logic by role
- `src/pages/Login.tsx` — update post-login redirect
- `src/components/dashboard/CustomerDashboard.tsx` — chef filtering with pincode
- `src/pages/ChefDetail.tsx` — meal plan display + subscribe button
- `src/pages/Subscribe.tsx` — mock payment flow

