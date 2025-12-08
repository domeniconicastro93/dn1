# ============================================================================
# PHASE 3 - END-TO-END INTEGRATION TEST SCRIPT
# ============================================================================
# Manual test script to validate the entire Strike Steam integration
# ============================================================================

## PREREQUISITES
- All services running (use start-all.bat)
- Browser with DevTools open
- Two test Steam accounts (one public, one private)

## TEST SUITE

### TEST 1: Login Flow
**Steps:**
1. Open http://localhost:3005
2. Click "Login / Register"
3. Enter valid credentials
4. Submit login form

**Expected:**
- ✅ Redirect to dashboard/home
- ✅ Header shows user avatar and dropdown
- ✅ Session persists on page reload
- ✅ No 401 errors in console

**Validation:**
```bash
# Check session endpoint
curl -b cookies.txt http://localhost:3000/api/auth/v1/session
# Should return user data with 200 status
```

---

### TEST 2: Steam Link Flow
**Steps:**
1. Navigate to /games page
2. Click "Connect Steam" button
3. Authenticate with Steam
4. Complete Steam OpenID flow
5. Redirected back to Strike

**Expected:**
- ✅ Redirect to /games?steam_linked=1
- ✅ "Steam Connected" banner appears
- ✅ steamId64 saved in database
- ✅ No errors in console

**Validation:**
```sql
-- Check database
SELECT id, email, steam_id_64 FROM users WHERE email = 'test@example.com';
-- steam_id_64 should be populated
```

---

### TEST 3: Privacy Transitions (PUBLIC Profile)
**Steps:**
1. Set Steam profile to PUBLIC
   - Go to https://steamcommunity.com/my/edit/settings
   - Set "Game Details" to "Public"
2. Reload /games page

**Expected:**
- ✅ NO "Your Steam library is private" banner
- ✅ "My Library" section appears
- ✅ Owned games displayed (including F2P if played)
- ✅ Console shows: `[GamesPage] ✅ Privacy is public - setting owned IDs`

**Backend Logs:**
```
[SteamXML] ✅ Profile is PUBLIC (via privacyState)
[SteamWebAPI] ✅ SUCCESS: User owns X games (PUBLIC library)
[SteamService] === PHASE 2.5: F2P ENRICHMENT ===
[SteamService] === PHASE 2.6: COMMUNITY LIBRARY FALLBACK ===
[SteamService] Final owned games count: X
```

---

### TEST 4: Privacy Transitions (PRIVATE Profile)
**Steps:**
1. Set Steam profile to PRIVATE
   - Go to https://steamcommunity.com/my/edit/settings
   - Set "Game Details" to "Private"
2. Reload /games page

**Expected:**
- ✅ "Your Steam library is private" banner appears
- ✅ NO "My Library" section
- ✅ All games show "NOT OWNED"
- ✅ Console shows: `[GamesPage] ❌ Privacy is NOT public - clearing owned games`

**Backend Logs:**
```
[SteamXML] ❌ Profile is PRIVATE (via privacyState)
[SteamWebAPI] ❌ Profile is PRIVATE - returning no games
[SteamService] Privacy is not public - skipping F2P detection
```

---

### TEST 5: Multi-Account Isolation
**Steps:**
1. Login as User A
2. Link Steam Account A
3. Note owned games count
4. Logout
5. Login as User B
6. Link Steam Account B
7. Check owned games

**Expected:**
- ✅ User B sees ONLY their own games
- ✅ No games from User A appear
- ✅ Privacy state is independent
- ✅ No cross-contamination in cache

**Validation:**
```bash
# Check cache keys are scoped by steamId
# Cache keys should be: steam:ownedGames:{steamId64}
# Each user should have different steamId64
```

---

### TEST 6: F2P Game Detection (Phase 2.5)
**Steps:**
1. Ensure Steam profile is PUBLIC
2. Play a F2P game (e.g., CS2, Dota 2) recently
3. Reload /games page

**Expected:**
- ✅ F2P game appears as "OWNED"
- ✅ Console shows F2P detection reason

**Backend Logs:**
```
[F2P Detection] === START F2P DETECTION ===
[F2P Detection] Recently played AppIDs: [730]
[SteamService] ✅ F2P game 730 detected as owned (reason: recently_played)
```

---

### TEST 7: Global Games Catalog
**Steps:**
1. Set Steam to PRIVATE
2. Navigate to /games
3. Scroll to "All Games" section
4. Use search bar

**Expected:**
- ✅ All games catalog loads regardless of Steam privacy
- ✅ Search works correctly
- ✅ All games show "NOT OWNED" (since private)
- ✅ No errors in console

---

### TEST 8: Error Handling
**Steps:**
1. Stop steam-library-service
2. Reload /games page

**Expected:**
- ✅ NO 500 errors
- ✅ Graceful fallback: empty owned games list
- ✅ User-friendly error message (if any)
- ✅ Page still functional

---

### TEST 9: Session Persistence
**Steps:**
1. Login
2. Navigate to /games
3. Refresh page (F5)
4. Navigate to /dashboard
5. Navigate back to /games

**Expected:**
- ✅ Session persists across navigation
- ✅ No re-login required
- ✅ Owned games state maintained
- ✅ No flickering or state loss

---

### TEST 10: Logout Flow
**Steps:**
1. Login
2. Navigate to /games
3. Click logout

**Expected:**
- ✅ Redirect to home/login
- ✅ Header resets to "Login / Register"
- ✅ Session cleared
- ✅ Owned games cleared
- ✅ No stale data on next login

---

## REGRESSION CHECKLIST

### Authentication
- [ ] Login works with valid credentials
- [ ] Logout clears session completely
- [ ] Session persists across page reloads
- [ ] Multi-account switching works correctly
- [ ] No 401 errors during normal navigation

### Steam Integration
- [ ] Steam link flow completes successfully
- [ ] steamId64 saved correctly in database
- [ ] Owned games fetched after linking
- [ ] Privacy transitions work (Public ↔ Private)
- [ ] F2P games detected correctly (Phase 2.5)
- [ ] Community library fallback works (Phase 2.6)

### UI/UX
- [ ] Header updates correctly after login/logout
- [ ] "Steam Connected" banner appears when linked
- [ ] "My Library" section shows only when appropriate
- [ ] Privacy warning shows only when private
- [ ] Search works regardless of Steam privacy
- [ ] No duplicated game cards
- [ ] No flickering or hydration errors

### Backend
- [ ] Gateway forwards requests correctly
- [ ] JWT validation works on protected routes
- [ ] Steam library service returns correct data
- [ ] Caching works with correct TTL
- [ ] Multi-account isolation maintained
- [ ] No 500 errors (only structured errors)

### Performance
- [ ] First load: < 3 seconds
- [ ] Cached load: < 500ms
- [ ] No memory leaks
- [ ] No excessive API calls

---

## KNOWN LIMITATIONS (FUTURE IMPROVEMENTS)

1. **Cache Invalidation**: Manual cache clear required when unlinking Steam
2. **Real-time Updates**: Privacy changes require page reload
3. **Batch Operations**: No bulk game operations yet
4. **Offline Mode**: No offline fallback for catalog

---

## PRODUCTION READINESS CHECKLIST

- [ ] All tests pass
- [ ] No console errors in production build
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Rate limiting tested
- [ ] Error monitoring configured
- [ ] Logging configured for production
- [ ] Cache TTL optimized for production
- [ ] CORS configured correctly

---

## TROUBLESHOOTING

### Issue: "Your Steam library is private" even when public
**Solution:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Check Steam privacy settings
4. Wait 10 seconds for cache to expire
5. Reload page

### Issue: No games showing in "My Library"
**Solution:**
1. Check Steam profile is PUBLIC
2. Verify Steam account is linked
3. Check browser console for errors
4. Check backend logs for API errors
5. Verify steamId64 in database

### Issue: F2P games not detected
**Solution:**
1. Ensure you've played the game recently (last 2 weeks)
2. Check if game has achievements/stats
3. Verify game is in KNOWN_F2P_GAMES list
4. Check backend logs for F2P detection

### Issue: 401 Unauthorized errors
**Solution:**
1. Check if logged in
2. Verify JWT token in cookies
3. Check token expiration
4. Re-login if needed

---

## CONTACT

For issues or questions, check:
- Backend logs in terminal
- Browser DevTools console
- Network tab for API calls
- Database for data integrity
