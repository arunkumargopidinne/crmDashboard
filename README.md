# CRM Pro - Contact Management System

A production-ready Contact Management System built with Next.js 15, React, TypeScript, TanStack Query, Recharts, and MongoDB.

## Features

✅ **Complete Contact Management**
- CRUD operations (Create, Read, Update, Delete)
- Advanced search with text indexing
- Tag-based filtering
- Bulk import from CSV
- Bulk delete operations
- Pagination with server-side sorting

✅ **Dashboard & Analytics**
- Summary cards (total contacts, new this week, tags, activities)
- Charts:
  - Bar chart: Contacts by company
  - Line chart: Contact timeline (30-day)
  - Pie chart: Tag distribution

✅ **User Management**
- Firebase Email/Password Authentication
- Google OAuth Sign-in
- User profile management
- Session persistence
- Protected routes

✅ **Data Management**
- MongoDB integration with Mongoose
- Full-text search on contact name, email, company
- Tag management with custom colors
- Proper indexing and aggregation pipelines

✅ **Developer Experience**
- TypeScript strict mode
- TanStack React Query for state management
- Reusable custom hooks
- Clean folder structure
- Comprehensive error handling
- Loading states with Skeleton loaders

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- Lucide React Icons
- Recharts (Charts)
- TanStack React Query (State Management)
- Papaparse (CSV Parsing)

**Backend:**
- Node.js (Next.js API Routes)
- MongoDB
- Mongoose ORM
- Firebase Admin SDK

**Authentication:**
- Firebase Authentication
- JWT Tokens

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB connection string
- Firebase project with credentials

### Installation

```bash
# Clone and install
git clone https://github.com/arunkumargopidinne/CRM.git
cd CRM
npm install
```

### Environment Setup

Create `.env.local` with the following:

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Firebase Admin (server-only - keep secret!)
FIREBASE_ADMIN_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Admin Key (for migrations)
ADMIN_KEY=your_secure_admin_key
```

### Running the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Database Migration

If you encounter MongoDB duplicate key errors:

```bash
# Run the migration endpoint once
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "x-admin-key: your_admin_key"
```

See [MIGRATION.md](./MIGRATION.md) for detailed instructions.

## Project Structure

```
app/
├── (dashboard)/           # Protected routes layout
│   ├── layout.tsx
│   ├── dashboard/         # Dashboard page with charts
│   ├── contacts/          # Contacts list and detail pages
│   ├── tags/              # Tag management
├── api/
│   ├── auth/              # Authentication routes
│   ├── contacts/          # Contact CRUD & bulk operations
│   ├── tags/              # Tag management
│   ├── admin/migrate/     # Database migration
├── lib/                   # Shared utilities
│   ├── db.ts              # MongoDB connection
│   ├── firebase.ts        # Firebase client init
│   ├── firebaseAdmin.ts   # Firebase Admin SDK
│   ├── api.ts             # API fetch wrapper
├── models/                # Mongoose schemas
│   ├── Contact.ts
│   ├── Tag.ts
│   ├── User.ts
├── services/              # Business logic
│   ├── ContactService.ts
├── context/               # React context
│   ├── AuthContext.tsx
├── components/
│   ├── layout/            # Sidebar, Navbar
│   ├── contacts/          # Contact modals
│   ├── ui/                # Reusable UI components
hooks/                      # Custom React Query hooks
├── useContacts.ts
├── useTags.ts
├── useDebounce.ts
types/                      # TypeScript interfaces
├── contact.ts
```

## API Endpoints

### Contacts

```
GET    /api/contacts                    # List with pagination/search/filters
POST   /api/contacts                    # Create contact
GET    /api/contacts/:id               # Get contact
PUT    /api/contacts/:id               # Update contact
DELETE /api/contacts/:id               # Delete contact
POST   /api/contacts/bulk-import       # CSV bulk import
POST   /api/contacts/bulk-delete       # Bulk delete
GET    /api/contacts/stats             # Dashboard statistics
```

### Tags

```
GET    /api/tags                        # List all tags
POST   /api/tags                        # Create tag
```

### Admin

```
POST   /api/admin/migrate               # Database migration (requires ADMIN_KEY)
```

## Usage Examples

### Add a Contact

```typescript
const { mutateAsync: createContact } = useCreateContact();

await createContact({
  name: "John Doe",
  email: "john@example.com",
  phone: "+1-555-0000",
  company: "Acme Inc.",
  tags: ["tag-id-1", "tag-id-2"],
  notes: "Important client"
});
```

### Import Contacts from CSV

```typescript
const { mutateAsync: bulkImport } = useBulkImportContacts();

const contacts = [
  { name: "Jane Smith", email: "jane@example.com", company: "TechCorp" },
  // ... more contacts
];

const result = await bulkImport(contacts);
console.log(`Imported: ${result.successCount}, Failed: ${result.failedCount}`);
```

### Search Contacts

```typescript
const { data: contacts } = useContacts(
  page,
  limit,
  "john",      // search term
  ["tag-id"]   // filter by tags
);
```

## Performance Optimizations

- **Text Indexing**: Full-text search on contact fields
- **Pagination**: Server-side pagination with `keepPreviousData`
- **Query Caching**: TanStack React Query with 5-minute stale time
- **Debounced Search**: 500ms debounce on search input
- **Skeleton Loaders**: Better UX during data loading
- **MongoDB Aggregation**: Optimized queries for dashboard charts

## Error Handling

All endpoints return proper HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized
- `404`: Not found
- `409`: Conflict (duplicate email/tag)
- `500`: Server error

Error responses include a `message` field with details.

## Security

- Firebase Authentication for user verification
- JWT tokens for API calls
- Admin key required for migration endpoints
- Mongoose schema validation
- Email uniqueness constraints
- User-scoped data (each user sees only their contacts)

## Database Indexes

**Contacts:**
- Text index: `name`, `email`, `company`
- Index: `createdBy` (user scoped)
- Index: `createdBy` + `createdAt` (dashboard)
- Index: `tags` (filtering)

**Tags:**
- Unique index: `name` + `createdBy` (per user)
- Index: `createdBy`

**Users:**
- Sparse unique index: `firebaseUid` (null-safe)
- Index: `email`

## Troubleshooting

### MongoDB E11000 Duplicate Key Error

Run the migration endpoint once:

```bash
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "x-admin-key: dev-admin-key-change-in-production"
```

This will:
1. Drop old unique indexes
2. Recreate indexes with sparse option
3. Remove duplicate null firebaseUid documents

### QueryClient Not Set Error

Make sure `RootLayoutClient` wraps your app with `QueryClientProvider`. Check [app/layout.tsx](app/layout.tsx).

## Contributing

This project follows clean code principles:
- TypeScript strict mode
- Meaningful variable/function names
- Comments for complex logic
- Reusable components
- Proper error handling

## License

MIT

## Support

For issues or questions:
1. Check [MIGRATION.md](./MIGRATION.md) for MongoDB setup issues
2. Review error messages in server logs
3. Ensure all environment variables are set correctly

---

Built with ❤️ using Next.js and MongoDB

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local setup for this project

1. Copy the example env file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and fill in the `FIREBASE_ADMIN_*` values with your Firebase service account credentials (server only).

3. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

4. Open http://localhost:3000 — the app will redirect to `/login`.

Notes:
- Frontend uses public `NEXT_PUBLIC_FIREBASE_*` keys for client auth.
- Server routes verify tokens using the Firebase Admin SDK; you must set the `FIREBASE_ADMIN_*` env vars for server-side verification.
- The repository contains fallback values for development (Firebase client config and MongoDB URI) but DO NOT commit real private keys to source control.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
