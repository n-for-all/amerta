# Loyalty & Discounts Plugin for Amerta

A native, enterprise-grade **Loyalty & VIP Circle** plugin built for Amerta with modular extensibility, customer metafields persistence, universal event hooks, and zero-prop slot components.

---

## 1. Architectural Highlights

### A. Customer Metafields Array (Namespace: `LoyaltyCircle`)
- In `src/amerta/payload/collections/Customers/index.ts`, added a `metafields` array field:
  - `namespace` (`string`)
  - `key` (`string`)
  - `value` (`json`)
- Each metafield utility function is placed in its own dedicated file:
  - [get-customer-metafield.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/get-customer-metafield.ts)
  - [set-customer-metafield.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/set-customer-metafield.ts)
  - [add-customer-metafield.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/add-customer-metafield.ts)
  - [remove-customer-metafield.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/remove-customer-metafield.ts)
  - [metafield-types.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/metafield-types.ts)
  - Re-exported via [metafields.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/metafields.ts)
- Created [get-active-apps.ts](file:///Users/macuser/github/amerta/src/amerta/core/utilities/get-active-apps.ts) as a standalone file (separated from `get-app-settings.ts`).
- Fixed withGuard import in loyalty endpoints to use `@/amerta/utilities/withGuard`.
- All loyalty balance (`points`, `lifetimePoints`), VIP tier status (`tierSlug`, `tierName`), and transaction audit trail (`history`) are stored inside the customer's `metafields` array under `namespace: "LoyaltyCircle"` and `key: "account"`.

---

### B. Universal App Hook Event Bus (Backend)
- Instead of hardcoding loyalty into order or customer logic, created [appHooks.ts](file:///Users/macuser/github/amerta/src/amerta/apps/appHooks.ts):
  - `processAppOrderHooks(order, previousDoc, payload)`: reads active apps from `apps.activeApps` and triggers `onOrderPaid`, `onOrderCreated`, or `onOrderCancelled`.
  - `processAppCustomerHooks(customer, operation, payload)`: triggers `onCustomerCreated`.
- Registered `processAppOrderHooks` in `Orders.hooks.afterChange` and `processAppCustomerHooks` in `Customers.hooks.afterChange`.

---

### C. Universal App Slots (Frontend)
- Built [AppSlot.tsx](file:///Users/macuser/github/amerta/src/amerta/apps/components/AppSlot.tsx) which registers and renders active app extensions matching a target string without passing props:
  - Extension components consume state cleanly via React hooks (`useCheckoutContext()`, `useEcommerce()`, `useCustomer()`, etc.).
- Placed standard slots across storefront:
  - `<AppSlot target="checkout.order_summary.before_totals" />` in [OrderSummary.tsx](file:///Users/macuser/github/amerta/src/amerta/theme/components/Checkout/OrderSummary.tsx).
  - `<AppSlot target="account.dashboard.cards" />` in [AccountDashboard/index.tsx](file:///Users/macuser/github/amerta/src/amerta/theme/components/Account/AccountDashboard/index.tsx).
  - `<AppSlot target="product.price.after" />` in [ProductContext.tsx](file:///Users/macuser/github/amerta/src/amerta/theme/components/ProductDetail/ProductContext.tsx).

---

### D. Loyalty App Module (`src/amerta/apps/loyalty`)
- **Engine** ([loyaltyEngine.ts](file:///Users/macuser/github/amerta/src/amerta/apps/loyalty/services/loyaltyEngine.ts)):
  - Automatic points earning on paid orders with configurable base rate and VIP tier multipliers.
  - Automatic tier promotion when crossing lifetime point thresholds (Bronze, Silver, Gold, Platinum).
  - Welcome signup bonus points on new customer accounts.
  - Tier upgrade celebration bonus.
  - Point clawback / reversal on cancelled or refunded orders.
  - Admin manual points adjustment with reason note.
- **Storefront Components**:
  - `ProductPointsBadge`: Earning teaser displayed directly beneath product price/reviews.
  - `LoyaltyCheckoutRedemption`: Interactive slider and points balance preview at checkout; login prompt for guests.
  - `CustomerAccountLoyaltyCard`: VIP tier badge, current balance, lifetime points, next tier progress bar, and points activity history table.
- **Admin Portal**:
  - Dedicated admin view at `/admin/loyalty-settings` with 5 tabs:
    1. **Customer Manager**: Live search by name, email, or order ID; strictly filtered to registered members (`hasAccount !== "0"`); displays loyalty cards and `+/-` manual points adjustment modal.
    2. **Orders & Points**: Live search and audit log of store orders showing Order ID, Customer, Subtotal/Total in store currency, Points Earned, Points Redeemed, Status, and Date.
    3. **Rules & Earning**: Configurable earning rate, redemption rate (discount off per 100 points in store currency, e.g. AED), single-order collect limit, min/max redemption.
    4. **VIP Tier Ladder**: Customizable tier ladder (Bronze, Silver, Gold, Platinum) with point thresholds, multipliers, free shipping perk, and badge color picker.
    5. **Rewards & Bonuses**: Welcome bonus points and tier promotion bonus points.
- **Strict Aesthetics**:
  - All admin controls, cards, badges, storefront widgets, and modals strictly adhere to `border-radius: 0;` (`rounded-none`).

---

## 2. Verification & Next Steps

1. **Activate Loyalty App**:
   - In Payload Admin (`/admin/globals/apps`), add `loyalty` to **Active Apps** and save.
2. **Access Loyalty Admin**:
   - Navigate to `/admin/loyalty-settings` to configure earning rules, customize VIP tiers, or search customers and manually adjust points.
3. **Storefront Verification**:
   - Visit any Product Detail page to see the `<ProductPointsBadge>` under the price.
   - Visit Checkout to see `<LoyaltyCheckoutRedemption>` in the order summary.
   - Visit the Customer Account Dashboard (`/account`) to see `<CustomerAccountLoyaltyCard>`.
