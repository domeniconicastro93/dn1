# 🟣 PHASE 1 — STRIKE AUTHENTICATION IMPLEMENTATION
## SAFE PLAN

**Mode:** STRICT ENTERPRISE  
**Date:** 2024  
**Status:** AWAITING APPROVAL

---

## 📋 CURRENT STATE ANALYSIS

### ✅ Already Implemented
1. **Core Auth Infrastructure:**
   - `apps/web/lib/server/strike-auth.ts` - Session management with JWT
   - `apps/web/lib/server/auth-actions.ts` - Server actions for login/register/logout
   - `apps/web/hooks/useStrikeSession.ts` - React hook for client-side session
   - `apps/web/app/api/auth/login/route.ts` - Login API endpoint
   - `apps/web/app/api/auth/register/route.ts` - Registration API endpoint
   - `apps/web/app/api/auth/logout/route.ts` - Logout API endpoint
   - `apps/web/app/api/auth/me/route.ts` - User profile fetch endpoint

2. **UI Components:**
   - `apps/web/components/auth/LoginPage.tsx` - Login form (fully functional)
   - `apps/web/components/auth/RegisterPage.tsx` - Registration form (fully functional)
   - `apps/web/components/layout/Header.tsx` - Header with auth state (shows user when logged in)

3. **Protected Endpoints:**
   - Steam linking (`/api/steam/auth`, `/api/steam/callback`)
   - Compute session start (`/api/compute/start-session`)
   - User library (`/api/user/steam/library`)

### ⚠️ Gaps & Required Changes

1. **API Route Naming:**
   - Requirement: `/api/auth/session`
   - Current: `/api/auth/me`
   - **Solution:** Create `/api/auth/session` route that calls same logic (maintain backward compatibility)

2. **Session Middleware Location:**
   - Requirement: `apps/web/lib/auth/session.ts`
   - Current: `apps/web/lib/server/strike-auth.ts`
   - **Solution:** Keep existing file, add alias/export from `lib/auth/session.ts` for compatibility

3. **Session Data Enhancement:**
   - Current: Only returns `userId`
   - Requirement: Should fetch full user profile + roles from user-service
   - **Solution:** Enhance `getStrikeSession()` to optionally fetch full profile

4. **Header Dropdown:**
   - Current: Has Settings, Logout
   - Requirement: Should also have Wallet link
   - **Solution:** Add Wallet link to dropdown menu

5. **Register Page Locale:**
   - Current: Hardcoded `locale: 'en'`
   - Requirement: Should use locale from i18n
   - **Solution:** Use `useLocale()` hook from next-intl

6. **Page Protection:**
   - Need to add `requireStrikeSession()` to:
     - Replay saving endpoints
     - Reels upload endpoints
     - Wallet endpoints
     - Live stream endpoints
     - Settings/profile pages

---

## 🎯 IMPLEMENTATION PLAN

### Step 1: Create `/api/auth/session` Route
**File:** `apps/web/app/api/auth/session/route.ts` (NEW)

- Create new route that mirrors `/api/auth/me` functionality
- Returns normalized session object: `{ user, authenticated, roles }`
- Maintains backward compatibility with `/api/auth/me`

**Changes:**
- New file only
- No breaking changes

---

### Step 2: Enhance Session Middleware
**File:** `apps/web/lib/server/strike-auth.ts` (MODIFY)

- Add `getStrikeSessionWithProfile()` function that fetches full user profile
- Keep existing `getStrikeSession()` for backward compatibility
- Add optional `includeProfile` parameter

**Changes:**
- Additive only
- No breaking changes

---

### Step 3: Create Session Alias (Optional)
**File:** `apps/web/lib/auth/session.ts` (NEW - Optional)

- Create thin wrapper that re-exports from `lib/server/strike-auth.ts`
- Provides the path structure requested in requirements
- Maintains backward compatibility

**Changes:**
- New file only
- No breaking changes

---

### Step 4: Update useStrikeSession Hook
**File:** `apps/web/hooks/useStrikeSession.ts` (MODIFY)

- Update to call `/api/auth/session` instead of `/api/auth/me`
- Handle new response format with `user`, `authenticated`, `roles`
- Maintain backward compatibility

**Changes:**
- Internal change only
- No breaking changes

---

### Step 5: Enhance Header Dropdown
**File:** `apps/web/components/layout/Header.tsx` (MODIFY)

- Add "Wallet" link to user dropdown menu
- Link to `/wallet` or appropriate wallet page
- Maintain existing structure

**Changes:**
- Additive only
- No breaking changes

---

### Step 6: Fix Register Page Locale
**File:** `apps/web/components/auth/RegisterPage.tsx` (MODIFY)

- Import `useLocale()` from `next-intl`
- Use locale value instead of hardcoded `'en'`
- Pass locale to registration API

**Changes:**
- Internal change only
- No breaking changes

---

### Step 7: Protect Replay Endpoints
**Files to Check:**
- `apps/web/app/api/replay/**/route.ts`
- `apps/web/components/play/SaveReplayButton.tsx`

- Add `requireStrikeSession()` to replay saving endpoints
- Ensure `userId` from session is used instead of hardcoded values

**Changes:**
- Additive protection
- No breaking changes

---

### Step 8: Protect Reels Upload Endpoints
**Files to Check:**
- `apps/web/app/api/clips/**/route.ts`
- `apps/web/app/api/feed/**/route.ts`

- Add `requireStrikeSession()` to upload endpoints
- Ensure `userId` from session is used

**Changes:**
- Additive protection
- No breaking changes

---

### Step 9: Protect Wallet Endpoints
**Files to Check:**
- `apps/web/app/api/wallet/**/route.ts`

- Add `requireStrikeSession()` to wallet endpoints
- Ensure `userId` from session is used

**Changes:**
- Additive protection
- No breaking changes

---

### Step 10: Protect Live Stream Endpoints
**Files to Check:**
- `apps/web/app/api/live/**/route.ts`
- `apps/web/app/api/streaming/**/route.ts`

- Add `requireStrikeSession()` to live stream start endpoints
- Ensure `userId` from session is used

**Changes:**
- Additive protection
- No breaking changes

---

### Step 11: Protect Settings/Profile Pages
**Files to Check:**
- `apps/web/app/[locale]/account/**/page.tsx`
- `apps/web/app/[locale]/settings/**/page.tsx`
- `apps/web/app/[locale]/profile/**/page.tsx`

- Add `requireStrikeSession()` to server components
- Redirect to login if not authenticated

**Changes:**
- Additive protection
- No breaking changes

---

## 📦 FILES TO BE MODIFIED

### New Files (3)
1. `apps/web/app/api/auth/session/route.ts` - Session API endpoint
2. `apps/web/lib/auth/session.ts` - Session middleware alias (optional)
3. `PHASE1_AUTH_SAFE_PLAN.md` - This plan document

### Modified Files (8)
1. `apps/web/lib/server/strike-auth.ts` - Enhance session functions
2. `apps/web/hooks/useStrikeSession.ts` - Update to use /api/auth/session
3. `apps/web/components/layout/Header.tsx` - Add Wallet link
4. `apps/web/components/auth/RegisterPage.tsx` - Use locale from i18n
5. Replay endpoints (TBD after discovery)
6. Reels upload endpoints (TBD after discovery)
7. Wallet endpoints (TBD after discovery)
8. Live stream endpoints (TBD after discovery)

### Files NOT Modified
- ❌ `services/auth-service` - No internal changes
- ❌ `services/user-service` - No internal changes
- ❌ `services/orchestrator-service` - No changes
- ❌ `services/replay-service` - No changes
- ❌ Steam integration logic - No changes
- ❌ Feed service - No changes
- ❌ Wallet service - No changes
- ❌ All Phase 1-10 locked modules - No changes

---

## 🔒 BACKWARD COMPATIBILITY

### Guarantees
1. ✅ All existing API endpoints continue to work
2. ✅ `/api/auth/me` remains functional (not removed)
3. ✅ Existing `getStrikeSession()` calls continue to work
4. ✅ All existing protected endpoints remain protected
5. ✅ Demo mode fallback (`STRIKE_DEMO_USER_ID`) still works
6. ✅ No breaking changes to shared types
7. ✅ No breaking changes to API contracts

### Migration Path
- Old code using `/api/auth/me` → Still works
- Old code using `getStrikeSession()` → Still works
- New code can use `/api/auth/session` → Recommended
- New code can use `getStrikeSessionWithProfile()` → For full profile

---

## 🧪 TEST PLAN

### Test 1: Registration Flow
1. Navigate to `/auth/register`
2. Fill form with email, password, confirm password
3. Submit form
4. **Expected:** User created, session cookie set, redirect to `/games`
5. **Verify:** Header shows user profile

### Test 2: Login Flow
1. Navigate to `/auth/login`
2. Enter valid credentials
3. Submit form
4. **Expected:** Session cookie set, redirect to `/games`
5. **Verify:** Header shows user profile

### Test 3: Session Persistence
1. Login successfully
2. Refresh page
3. **Expected:** Session persists, header still shows user
4. **Verify:** `/api/auth/session` returns user data

### Test 4: Logout Flow
1. While logged in, click Logout
2. **Expected:** Session cookie cleared, redirect to home
3. **Verify:** Header shows "Login / Register" button

### Test 5: Protected Endpoints
1. Try to access protected endpoint without login
2. **Expected:** Error or redirect to login
3. Login and retry
4. **Expected:** Request succeeds with user context

### Test 6: Steam Linking
1. Login to Strike
2. Click "Login with Steam"
3. **Expected:** Steam linking works (requires session)

### Test 7: Wallet Access
1. Login to Strike
2. Click Wallet in dropdown
3. **Expected:** Wallet page loads (if exists)

---

## ⚠️ RISK ASSESSMENT

### Low Risk
- ✅ Creating new API route (additive)
- ✅ Enhancing session functions (additive)
- ✅ Adding Wallet link to header (additive)
- ✅ Using locale from i18n (internal change)

### Medium Risk
- ⚠️ Updating hook to use new endpoint (needs testing)
- ⚠️ Adding protection to existing endpoints (needs verification)

### Mitigation
- All changes are additive or internal
- Backward compatibility maintained
- Existing functionality preserved
- Incremental testing at each step

---

## ✅ APPROVAL CHECKLIST

Before implementation:
- [ ] Plan reviewed
- [ ] Files identified
- [ ] Backward compatibility verified
- [ ] Test plan approved
- [ ] Risk assessment accepted

After implementation:
- [ ] All tests pass
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Code reviewed

---

## 📝 NOTES

1. **Cookie Naming:** Current implementation uses `strike_access_token` and `strike_refresh_token`. Requirements mention `strike_session`. We'll keep current naming for now (JWT-based auth is more secure) but can add alias if needed.

2. **Session Middleware Location:** Current location `lib/server/strike-auth.ts` is appropriate for server-side code. We'll add optional alias at `lib/auth/session.ts` for compatibility.

3. **User Profile Fetching:** We'll enhance session to optionally fetch full profile, but keep lightweight `userId`-only version for performance.

4. **Page Protection:** We'll add protection incrementally, starting with endpoints that are clearly user-specific.

---

**Status:** READY FOR APPROVAL  
**Next Step:** Wait for user approval, then proceed with implementation

