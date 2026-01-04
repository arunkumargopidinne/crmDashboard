# Admin Migration Instructions

If you encounter the MongoDB "E11000 duplicate key error" on the firebaseUid index, run this migration once to fix it:

```bash
# Option 1: Using curl
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "x-admin-key: $(echo $ADMIN_KEY)"

# Option 2: Using Node fetch
fetch('http://localhost:3000/api/admin/migrate', {
  method: 'POST',
  headers: { 'x-admin-key': 'your-admin-key' }
}).then(r => r.json()).then(console.log)
```

## Setup

1. Add `ADMIN_KEY` to your `.env.local`:
```
ADMIN_KEY=your-secure-admin-key-here
```

2. Run the migration (one time):
```bash
curl -X POST http://localhost:3000/api/admin/migrate \
  -H "x-admin-key: your-secure-admin-key-here"
```

## What it does:
- Drops old non-sparse `firebaseUid_1` index
- Recreates indexes from Mongoose schema (with sparse option)
- Removes duplicate null firebaseUid documents
- Logs all operations

After running this, the sync route should work without duplicate key errors.
