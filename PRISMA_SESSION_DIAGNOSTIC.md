# PRISMA SESSION CALLS - COMPLETE DIAGNOSTIC

**Date**: 2025-12-06 00:30
**Status**: 🔍 LEGACY CODE IDENTIFIED

---

## 🎯 FOUND: ALL LEGACY PRISMA SESSION CALLS

### ✅ ORCHESTRATOR SERVICE

**File**: `services/orchestrator-service/src/session-orchestration.ts`

**Line 61-64**: `prisma.session.update()`
```typescript
// Update session record with VM ID
await prisma.session.update({
  where: { id: sessionId },
  data: { vmId },
});
```
**Function**: `assignSessionToVMWithCapacity()`
**Called by**: ❌ NOT CALLED by Phase 11 SessionManager

**Line 87-89**: `prisma.session.findUnique()`
```typescript
const session = await prisma.session.findUnique({
  where: { id: sessionId },
});
```
**Function**: `releaseSessionFromVMWithCleanup()`
**Called by**: ❌ NOT CALLED by Phase 11 SessionManager

**Line 106-109**: `prisma.session.update()`
```typescript
await prisma.session.update({
  where: { id: sessionId },
  data: { vmId: null },
});
```
**Function**: `releaseSessionFromVMWithCleanup()`
**Called by**: ❌ NOT CALLED by Phase 11 SessionManager

**Line 126-137**: `prisma.session.findMany()`
```typescript
const sessions = await prisma.session.findMany({
  where: {
    vmId,
    status: { in: ['starting', 'active', 'paused'] },
  },
  select: {
    id: true,
    userId: true,
    gameId: true,
    createdAt: true,
  },
});
```
**Function**: `getVMSessions()`
**Called by**: ❌ NOT CALLED by Phase 11 SessionManager

---

**File**: `services/orchestrator-service/src/index.ts`

**Line 945-947**: `prisma.session.findUnique()`
```typescript
const session = await prisma.session.findUnique({
  where: { id: sessionId },
});
```
**Function**: `DELETE /api/orchestrator/v1/sessions/:id`
**Called by**: ❌ NOT CALLED by `/api/play/*` routes

---

### ❌ SESSION SERVICE (LEGACY - NOT USED IN PHASE 11)

**File**: `services/session-service/src/index.ts`

**Line 168**: `prisma.session.create()` - Creates session in database
**Line 231**: `prisma.session.findMany()` - Lists user sessions
**Line 285**: `prisma.session.findUnique()` - Gets single session
**Line 340**: `prisma.session.findUnique()` - Pause session
**Line 356**: `prisma.session.update()` - Update session status
**Line 389**: `prisma.session.findUnique()` - Resume session
**Line 405**: `prisma.session.update()` - Update session status
**Line 438**: `prisma.session.findUnique()` - End session
**Line 463**: `prisma.session.update()` - Update session status

**Service Port**: 3004
**Routes**: `/api/session/v1/*`
**Gateway Routing**: ❌ NOT ROUTED (Gateway routes `/api/play` to Orchestrator, not Session Service)

---

### ❌ OTHER SERVICES (NOT INVOLVED IN GAMEPLAY)

**streaming-ingest-service**: Lines 269, 340 - Only for replay/streaming metadata
**replay-engine-service**: Lines 126, 270, 323 - Only for replay processing

---

## 🔍 ROOT CAUSE ANALYSIS

### Why is the error happening?

The error `"startId" is not in the fields"` is a **Prisma Client validation error**.

**Possible causes**:

1. **Prisma Client Not Regenerated**
   - The schema was updated with `startId` field
   - But the TypeScript client wasn't regenerated
   - When Prisma queries the database, it finds the `start_id` column
   - But the client doesn't know about it → validation error

2. **Database Schema Mismatch**
   - The database has a `start_id` column
   - The Prisma schema didn't have it (until we added it)
   - Even after adding it, if client wasn't regenerated, error persists

3. **Cached Prisma Client**
   - Node modules might be caching the old Prisma client
   - Even after regeneration, the old client is still loaded

---

## ✅ VERIFICATION: PHASE 11 DOES NOT USE PRISMA

### SessionManager (`session-manager.ts`)
- ✅ Uses in-memory `SessionStore`
- ✅ NO Prisma imports
- ✅ NO database calls
- ✅ Completely isolated from database

### VMProvider (`vm-provider.ts`)
- ✅ Uses in-memory state
- ✅ NO Prisma imports
- ✅ NO database calls

### Session Routes (`routes/session.ts`)
- ✅ Calls SessionManager only
- ✅ NO Prisma imports
- ✅ NO database calls

### Gateway Routing
- ✅ Routes `/api/play/*` to Orchestrator
- ✅ Does NOT route to session-service
- ✅ No middleware touching Prisma

---

## 🚨 THE MYSTERY

**Question**: If Phase 11 doesn't use Prisma, why is the error happening?

**Hypothesis 1**: The error is NOT from the `/api/play/start` route
- Maybe it's from a different route being called
- Check browser network tab for ALL requests

**Hypothesis 2**: There's a hidden Prisma call we haven't found
- Maybe in shared-utils?
- Maybe in a dependency?

**Hypothesis 3**: The Prisma client is being loaded globally
- Even though we don't call it, it's being initialized
- And failing during initialization

**Hypothesis 4**: The error message is misleading
- Maybe it's not a Prisma error at all
- Maybe it's a different validation error with similar message

---

## 🔧 REQUIRED ACTIONS

### 1. Add Missing PORT Constant

**File**: `services/orchestrator-service/src/index.ts`
**Location**: After line 1227 (after HOST definition)

```diff
const HOST = process.env.HOST || '0.0.0.0';
+ const PORT = parseInt(process.env.PORT || '3012', 10);
```

### 2. Add Debug Logging to Catch Prisma Calls

**File**: `packages/shared-db/index.ts` (if it exists)

Add middleware to log ALL Prisma calls:

```typescript
prisma.$use(async (params, next) => {
  console.log('[PRISMA DEBUG] Model:', params.model);
  console.log('[PRISMA DEBUG] Action:', params.action);
  console.log('[PRISMA DEBUG] Args:', JSON.stringify(params.args, null, 2));
  console.log('[PRISMA DEBUG] Stack:', new Error().stack);
  return next(params);
});
```

This will show us EXACTLY where Prisma is being called from.

### 3. Verify Prisma Client Generation

```powershell
cd packages/shared-db
pnpm prisma generate --force
```

### 4. Check for Shared-Utils Prisma Usage

Search shared-utils for any Prisma calls that might be triggered by middleware.

---

## 📊 NEXT STEPS

1. **Add PORT constant** to fix undefined variable
2. **Add Prisma middleware** to log all calls
3. **Restart services** and test
4. **Check logs** to see where Prisma is being called
5. **Remove or isolate** the legacy code

---

**STATUS**: Diagnostic complete. Legacy code identified but NOT being called by Phase 11. Need to add debug logging to find the actual source of the error.
