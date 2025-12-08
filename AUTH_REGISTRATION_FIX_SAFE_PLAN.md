# 🔒 AUTH REGISTRATION FIX — SAFE PLAN
## STRICT ENTERPRISE MODE

**Date:** 2024  
**Status:** AWAITING APPROVAL

---

## 📋 PROBLEM ANALYSIS

### Current Issue
- Registration route `/api/auth/register` returns `400 Bad Request` with `{ error: "Internal server error" }`
- The web app may not be calling auth-service correctly
- Environment variables may be missing or incorrect
- Error messages are not being properly extracted and displayed

### Root Causes Identified
1. **API URL Configuration:**
   - Currently using `NEXT_PUBLIC_API_URL` (gateway on port 3000)
   - Should use `AUTH_SERVICE_URL` directly (port 3001) OR ensure gateway proxies correctly
   - Environment variables may not be set in `.env.local`

2. **Request Body:**
   - Current: `{ email, password, locale, marketingConsent }` ✅ Correct
   - Auth-service expects: `{ email, password, locale, marketingConsent? }` ✅ Matches
   - **Note:** User mentioned `confirmPassword`, `username`, `metadata` but these are NOT in RegisterRequestDTO schema

3. **Error Handling:**
   - Errors from auth-service not being properly logged
   - Error messages not extracted correctly from response
   - No visibility into what auth-service actually returns

---

## 🎯 SOLUTION PLAN

### Step 1: Environment Variable Validation
**File:** `apps/web/app/api/auth/register/route.ts` (MODIFY)

- Add validation at the start of the route handler
- Check for `AUTH_SERVICE_URL` or fallback to `NEXT_PUBLIC_API_URL`
- Log warning if env vars are missing
- Use `AUTH_SERVICE_URL` if available, otherwise use gateway

**Changes:**
- Add env var validation
- No breaking changes

---

### Step 2: Update API Route to Call Auth-Service Directly
**File:** `apps/web/app/api/auth/register/route.ts` (MODIFY)

- Option A: Use `AUTH_SERVICE_URL` directly (if set)
- Option B: Use `NEXT_PUBLIC_API_URL` (gateway) but ensure it proxies correctly
- **Decision:** Use `AUTH_SERVICE_URL` if available, fallback to gateway
- Ensure correct endpoint: `/api/auth/v1/register`

**Changes:**
- Internal change only
- No breaking changes

---

### Step 3: Ensure Complete Request Body
**File:** `apps/web/app/api/auth/register/route.ts` (MODIFY)

- Current body is correct: `{ email, password, locale, marketingConsent }`
- **Note:** `confirmPassword`, `username`, `metadata` are NOT required by auth-service
- Keep current body structure (it's already correct)
- Add validation to ensure all required fields are present

**Changes:**
- Add validation
- No breaking changes

---

### Step 4: Ensure Correct Headers
**File:** `apps/web/lib/server/auth-actions.ts` (MODIFY)

- Already has `Content-Type: application/json` ✅
- Verify headers are correct
- Add any additional headers if needed

**Changes:**
- Verification only
- No breaking changes

---

### Step 5: Enhanced Error Logging
**File:** `apps/web/lib/server/auth-actions.ts` (MODIFY)
**File:** `apps/web/app/api/auth/register/route.ts` (MODIFY)

- Log full request details (URL, body, headers)
- Log full response from auth-service (status, headers, body)
- Log extracted error message
- Return meaningful error messages to frontend

**Changes:**
- Additive logging
- No breaking changes

---

### Step 6: Update Environment Variables Documentation
**File:** `env.example` (MODIFY)

- Ensure `AUTH_SERVICE_URL` is documented
- Add note about using direct service URL vs gateway
- Document `JWT_SECRET` (not `STRIKE_JWT_SECRET` - check actual name)

**Changes:**
- Documentation only
- No breaking changes

---

## 📦 FILES TO BE MODIFIED

### Modified Files (3)
1. `apps/web/app/api/auth/register/route.ts` - Add env validation, better error logging
2. `apps/web/lib/server/auth-actions.ts` - Enhanced error logging, use AUTH_SERVICE_URL
3. `env.example` - Document AUTH_SERVICE_URL

### Files NOT Modified
- ❌ `services/auth-service` - No changes
- ❌ `services/user-service` - No changes
- ❌ Orchestrator, replay, steam, wallet - No changes
- ❌ Session logic - No changes
- ❌ Frontend components - No changes (error display already works)

---

## 🔍 DETAILED CHANGES

### Change 1: Environment Variable Validation
```typescript
// In registerAction (auth-actions.ts)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_ENDPOINT = AUTH_SERVICE_URL.includes('auth') 
  ? `${AUTH_SERVICE_URL}/api/auth/v1/register`
  : `${AUTH_SERVICE_URL}/api/auth/v1/register`; // Gateway should proxy

if (!AUTH_SERVICE_URL) {
  console.warn('AUTH_SERVICE_URL or NEXT_PUBLIC_API_URL not set, using default');
}
```

### Change 2: Enhanced Error Logging
```typescript
// Before fetch
console.log('Registration request:', {
  url: AUTH_ENDPOINT,
  method: 'POST',
  body: requestBody,
});

// After response
console.error('Registration error:', {
  status: response.status,
  statusText: response.statusText,
  headers: Object.fromEntries(response.headers.entries()),
  body: data,
  extractedMessage: errorMessage,
});
```

### Change 3: Request Body Validation
```typescript
// In API route
if (!email || !password) {
  return NextResponse.json(
    { success: false, error: 'Email and password are required' },
    { status: 400 }
  );
}

// Validate email format
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return NextResponse.json(
    { success: false, error: 'Invalid email format' },
    { status: 400 }
  );
}

// Validate password length
if (password.length < 8) {
  return NextResponse.json(
    { success: false, error: 'Password must be at least 8 characters' },
    { status: 400 }
  );
}
```

---

## 🔒 BACKWARD COMPATIBILITY

### Guarantees
1. ✅ All existing API contracts maintained
2. ✅ Frontend components continue to work
3. ✅ Falls back to gateway if AUTH_SERVICE_URL not set
4. ✅ No breaking changes to request/response format
5. ✅ Error handling improvements are additive

### Migration Path
- Old: Uses `NEXT_PUBLIC_API_URL` (gateway)
- New: Uses `AUTH_SERVICE_URL` if set, otherwise falls back to gateway
- Both paths supported

---

## 🧪 TEST PLAN

### Test 1: Environment Variables
1. Check `.env.local` has `AUTH_SERVICE_URL` or `NEXT_PUBLIC_API_URL`
2. Verify `JWT_SECRET` is set
3. **Expected:** No warnings in console

### Test 2: Registration Request
1. Fill registration form
2. Submit
3. **Expected:** Request logged in server console with full details

### Test 3: Success Case
1. Register with valid data
2. **Expected:** User created, tokens set, redirect to /games

### Test 4: Error Cases
1. Register with invalid email → **Expected:** Clear error message
2. Register with short password → **Expected:** Clear error message
3. Register with existing email → **Expected:** "Email already registered"
4. Auth-service down → **Expected:** "Auth service unavailable" with details

### Test 5: Error Logging
1. Check server console for detailed error logs
2. **Expected:** Full request/response details logged

---

## ⚠️ RISK ASSESSMENT

### Low Risk
- ✅ Adding environment variable validation
- ✅ Enhanced error logging (additive)
- ✅ Request body validation (additive)

### Medium Risk
- ⚠️ Changing from gateway to direct auth-service call
- **Mitigation:** Fallback to gateway if AUTH_SERVICE_URL not set

### Mitigation
- All changes are additive or have fallbacks
- Backward compatibility maintained
- Incremental testing at each step

---

## 📝 NOTES

1. **Request Body:** The user mentioned `confirmPassword`, `username`, `metadata` but these are NOT in the RegisterRequestDTO schema. The current body structure is correct. We'll keep it as is.

2. **Environment Variables:** 
   - `AUTH_SERVICE_URL` - Direct auth-service URL (optional, falls back to gateway)
   - `NEXT_PUBLIC_API_URL` - Gateway URL (fallback)
   - `JWT_SECRET` - Already documented in env.example

3. **Error Messages:** The "Internal server error" suggests the error from auth-service isn't being properly extracted. Enhanced logging will help identify the issue.

4. **Gateway vs Direct:** We'll support both:
   - If `AUTH_SERVICE_URL` is set → Call auth-service directly
   - Otherwise → Use gateway (which should proxy to auth-service)

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
- [ ] Error messages are meaningful
- [ ] Logging provides visibility
- [ ] Code reviewed

---

**Status:** READY FOR APPROVAL  
**Next Step:** Wait for user approval, then proceed with implementation

