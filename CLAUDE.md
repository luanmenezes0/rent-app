# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a construction equipment rental management application built with React Router v7 (previously Remix), focusing on scaffolding and construction tool rentals. The app manages the complete rental lifecycle from equipment inventory to customer budgets and delivery tracking.

## Essential Commands

**Development:**
```bash
npm run dev              # Start development server
npm run setup            # Setup database (generate, migrate, seed)
npm run prisma:studio    # Open Prisma database GUI
```

**Testing & Quality:**
```bash
npm test                 # Run unit tests with Vitest
npm run test:e2e:dev     # Run Cypress E2E tests in dev mode
npm run lint             # ESLint with auto-fix
npm run typecheck        # TypeScript type checking
npm run validate         # Run all tests, linting, and type checking
```

**Database:**
```bash
npx prisma migrate dev   # Create and apply new migration
npx prisma db seed       # Seed database with test data
npx prisma generate      # Regenerate Prisma client
```

## Architecture

### Core Domain Models
The application is structured around these key entities with their relationships:

- **Client** → **BuildingSite** → **Budget** (1:many:many)
- **Rentable** (equipment inventory) → **BudgetItem** → **Budget**
- **Delivery** → **DeliveryUnit** → **Rentable** (equipment movement tracking)
- **BuildingSite** ↔ **Inventory** ↔ **Rentable** (current equipment at sites)

### Directory Structure

**Routes:** Follow React Router v7 file-based routing in `app/routes/`
- Admin routes: `admin/inventory.tsx`, `admin/users.tsx`
- Resource routes: `clients/$clientId.tsx`, `budgets/$budgetId.tsx`
- Special routes: `budgets/$budgetId.print.tsx` for PDF generation

**Data Layer:**
- `app/models/*.server.ts` - Server-side data access functions using Prisma
- `app/validators/*.ts` - Zod schemas for form validation
- `prisma/schema.prisma` - Database schema definition

**UI Components:**
- `app/components/` - Reusable UI components using Chakra UI
- Modals for CRUD operations: `ClientModal`, `BuildingSiteModal`, `DeliveryModal`
- Status components: `BuildingSiteStatusLabel` with Portuguese translations

### Key Patterns

**Form Handling:**
- Uses Zod validators for form validation
- Server actions handle form submissions via `request.formData()`
- Form errors returned via `validationError()` utility
- All monetary values stored as integers (cents) and converted for display

**Authentication:**
- Session-based auth using `app/session.server.ts`
- `requireUserId()` function protects routes
- User roles stored in database but basic implementation

**Data Loading:**
- Loaders fetch data with Prisma including related entities
- Analytics calculated in loaders (revenue, counts, etc.)
- Portuguese translations handled via `app/utils/budgetStatus.ts`

**Styling:**
- Chakra UI component library with custom theme
- Color mode support (light/dark)
- Print-specific layouts for budget PDFs using CSS media queries

### Budget Workflow
The core business workflow follows this pattern:
1. **Client Creation** → Contact and billing information
2. **Building Site** → Physical location where equipment is used  
3. **Budget Creation** → Equipment rental quotes with line items
4. **Budget Approval** → Status progression: DRAFT → SENT → APPROVED/REJECTED
5. **Delivery Management** → Equipment check-in/out tracking

### Currency Handling
All monetary values use integer storage (cents) and are converted using:
```typescript
// Storage: multiply by 100
Math.round(Number(value) * 100)

// Display: divide by 100 with Intl formatting
new Intl.NumberFormat("pt-BR", {
  style: "currency", 
  currency: "BRL"
}).format(value / 100)
```

### Portuguese Localization
- Budget statuses use `BUDGET_STATUS_DICTIONARY` in `app/utils/budgetStatus.ts`
- All UI text is in Portuguese
- Date formatting uses Brazilian locale with dayjs

## Development Notes

**Database Relationships:**
- Soft deletes not implemented - uses CASCADE deletes
- Building sites have numeric status (1 = active)
- Budget status uses string enums: DRAFT, SENT, APPROVED, EXPIRED, REJECTED

**Route Patterns:**
- Resource routes follow RESTful conventions
- Print routes use `.print.tsx` suffix for PDF generation
- Admin routes are grouped under `/admin/` prefix

**Component Patterns:**
- Modal components handle create/edit operations
- Cards use simplified HStack layouts for list items
- Icons from `react-icons/fi` (Feather icons)
- Status badges with color coding based on state