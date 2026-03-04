# Missing Backend Endpoints - Send to Backend Developer

**Date:** February 12, 2026  
**Backend URL:** https://womencypedia-backend.onrender.com  
**Backend Docs:** https://womencypedia-backend.onrender.com/docs  

---

## Overview

The backend currently has **14 endpoints**. The frontend requires **48 endpoints**.  
**34 endpoints are missing** and **8 existing endpoints have path/schema mismatches**.

---

## ⚠️ CRITICAL: Fix Existing Endpoint Mismatches

These endpoints exist but need to be updated to match what the frontend expects:

### 1. Login Schema Mismatch
- **Backend expects:** `{ "username": "...", "password": "..." }`
- **Frontend sends:** `{ "email": "...", "password": "..." }`
- **Fix:** Accept `email` field instead of (or in addition to) `username`

### 2. Register Schema Mismatch  
- **Backend expects:** `{ "username": "...", "password": "...", "is_admin": false }`
- **Frontend sends:** `{ "name": "...", "email": "...", "password": "..." }`
- **Fix:** Accept `name` and `email` fields, remove `is_admin` from user-facing register (security risk!)

### 3. Entry Create Path Mismatch
- **Backend path:** `POST /entries/entries/submit`
- **Frontend expects:** `POST /entries`
- **Fix:** Add route alias or update to `POST /entries`

### 4. Entry Update Path & Method Mismatch
- **Backend:** `PATCH /entries/entries/1?entry_id=X`
- **Frontend expects:** `PUT /entries/:id`
- **Fix:** Use path parameter `/entries/{id}` and accept PUT method

### 5. Entry Delete Path Mismatch
- **Backend:** `DELETE /entries/entries/1?entry_id=X`
- **Frontend expects:** `DELETE /entries/:id`
- **Fix:** Use path parameter `/entries/{id}`

### 6. Entry Search Path Mismatch
- **Backend:** `GET /entries/entries/search?name=X`
- **Frontend expects:** `GET /entries/search?q=X`
- **Fix:** Move to `/entries/search` and accept `q` param

### 7. Logout Endpoint Name Mismatch
- **Backend:** `POST /auth/signout`
- **Frontend expects:** `POST /auth/logout`
- **Fix:** Rename to `/auth/logout` or add alias

### 8. Forgot Password Method Mismatch
- **Backend:** `POST /auth/forgot-password?username=X` (query param)
- **Frontend sends:** `POST /auth/forgot-password` with body `{ "email": "..." }`
- **Fix:** Accept JSON body with `email` field

### 9. Admin Review Queue Path Mismatch
- **Backend:** `GET /admin/review-queue`
- **Frontend expects:** `GET /contributions/pending`
- **Fix:** Add alias at `/contributions/pending`

### 10. Admin Verify Entry Path Mismatch
- **Backend:** `PATCH /admin/verify-entry/{entry_id}`
- **Frontend expects:** `POST /contributions/:id/approve`
- **Fix:** Add alias or update frontend

---

## ❌ Missing Endpoints to Implement

### Priority 1: Authentication (Critical)

| # | Method | Endpoint | Description | Request Body |
|---|--------|----------|-------------|-------------|
| 1 | `POST` | `/auth/refresh` | Refresh JWT access token | `{ "refresh_token": "..." }` |
| 2 | `GET` | `/auth/me` | Get current authenticated user | Header: `Authorization: Bearer <token>` |
| 3 | `POST` | `/auth/send-verification` | Resend email verification | Header: `Authorization: Bearer <token>` |
| 4 | `GET` | `/auth/verify/:token` | Verify email with token | Path param: token |
| 5 | `POST` | `/auth/change-password` | Change password (logged in) | `{ "current_password": "...", "new_password": "..." }` |

**Expected Login/Register Response Format:**
```json
{
  "access_token": "jwt-token-here",
  "refresh_token": "jwt-refresh-token-here",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "contributor",
    "email_verified": false
  }
}
```

### Priority 2: OAuth (Important for UX)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 6 | `GET` | `/auth/google` | Initiate Google OAuth flow |
| 7 | `GET` | `/auth/google/callback` | Google OAuth callback |
| 8 | `GET` | `/auth/github` | Initiate GitHub OAuth flow |
| 9 | `GET` | `/auth/github/callback` | GitHub OAuth callback |

### Priority 3: Entries Enhancement

| # | Method | Endpoint | Description | Notes |
|---|--------|----------|-------------|-------|
| 10 | `GET` | `/entries/:id` | Get single entry by ID | Currently only bulk GET exists |

**Expected Entry Schema (full biography):**
```json
{
  "id": 1,
  "name": "Queen Amina of Zazzau",
  "region": "Africa",
  "era": "Pre-colonial",
  "category": "Leadership",
  "domain": "Monarch",
  "tags": ["Warrior Queen", "Military Leader"],
  "introduction": "...",
  "earlyLife": "...",
  "pathToInfluence": "...",
  "contributions": "...",
  "symbolicPower": "...",
  "culturalContext": "...",
  "legacy": "...",
  "image": "/images/queen-amina.png",
  "sources": [{ "type": "Secondary", "title": "...", "author": "...", "year": 1966 }],
  "relatedWomen": [2, 3],
  "status": "published",
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
}
```

### Priority 4: Comments System

| # | Method | Endpoint | Description | Request Body |
|---|--------|----------|-------------|-------------|
| 11 | `GET` | `/entries/:entryId/comments` | Get comments for entry | - |
| 12 | `POST` | `/entries/:entryId/comments` | Post new comment | `{ "content": "...", "parentId": null }` |
| 13 | `DELETE` | `/entries/:entryId/comments/:commentId` | Delete a comment | Auth: owner/admin |
| 14 | `POST` | `/entries/:entryId/comments/:commentId/like` | Toggle like | Auth required |

**Expected Comments Response:**
```json
{
  "comments": [{
    "id": "1",
    "user": { "id": 1, "name": "Sarah Johnson", "initials": "SJ" },
    "content": "This biography is incredibly inspiring!",
    "likes": 12,
    "isLiked": false,
    "createdAt": "2026-01-15T10:30:00Z",
    "replies": []
  }],
  "total": 5
}
```

### Priority 5: Contributions

| # | Method | Endpoint | Description | Request Body |
|---|--------|----------|-------------|-------------|
| 15 | `POST` | `/contributions/nominations` | Submit nomination | See below |
| 16 | `POST` | `/contributions/stories` | Submit story | See below |
| 17 | `POST` | `/contributions/:id/reject` | Reject contribution | `{ "reason": "..." }` |

**Nomination Request:**
```json
{
  "nomineeName": "Ada Lovelace",
  "era": "19th Century",
  "region": "Europe",
  "collection": "science",
  "bio": "...",
  "sources": "...",
  "submitterName": "Jane Doe",
  "submitterEmail": "jane@example.com",
  "type": "nomination",
  "status": "pending"
}
```

**Story Request:**
```json
{
  "storyType": "other",
  "subjectName": "My Grandmother",
  "relationship": "Grandmother",
  "region": "Nigeria",
  "theme": "resilience",
  "story": "...",
  "lessons": "...",
  "contactName": "Jane Doe",
  "contactEmail": "jane@example.com",
  "permissionGranted": true
}
```

### Priority 6: Collections & Bookmarks

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 18 | `GET` | `/collections` | List all collections |
| 19 | `GET` | `/collections/:id` | Get collection with entries |
| 20 | `GET` | `/collections/saved` | Get user's bookmarked entries |
| 21 | `POST` | `/collections/saved` | Bookmark an entry |
| 22 | `DELETE` | `/collections/saved/:entryId` | Remove bookmark |
| 23 | `DELETE` | `/collections/saved` | Clear all bookmarks |

### Priority 7: Notifications

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 24 | `GET` | `/notifications` | Get user's notifications |
| 25 | `PATCH` | `/notifications/:id/read` | Mark as read |
| 26 | `PATCH` | `/notifications/read-all` | Mark all as read |
| 27 | `DELETE` | `/notifications/:id` | Delete notification |
| 28 | `DELETE` | `/notifications` | Clear all notifications |

### Priority 8: User Profile & Settings

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 29 | `GET` | `/user/profile` | Get user profile |
| 30 | `PUT` | `/user/profile` | Update user profile |
| 31 | `GET` | `/user/settings` | Get user settings |
| 32 | `PUT` | `/user/settings` | Update user settings |
| 33 | `DELETE` | `/user/account` | Delete account |

### Priority 9: Contact & Statistics

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 34 | `POST` | `/contact` | Submit contact form |
| 35 | `GET` | `/stats/dashboard` | Admin dashboard stats |
| 36 | `GET` | `/stats/public` | Public statistics |

---

## 🔧 Backend Configuration Required

### CORS Configuration
```
Access-Control-Allow-Origin: https://womencypedia.org, http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### JWT Token Requirements
- **Access Token**: Short-lived (15-60 minutes)
- **Refresh Token**: Long-lived (7 days)
- Both returned on login/register

### Error Response Format
```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### HTTP Status Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## 📝 Summary

| Category | Backend Has | Frontend Needs | Gap |
|----------|------------|----------------|-----|
| Auth | 5 endpoints | 14 endpoints | 9 missing |
| Entries | 5 endpoints | 6 endpoints | 1 missing + path fixes |
| Admin | 2 endpoints | 3 endpoints | 1 missing + path fixes |
| Comments | 0 endpoints | 4 endpoints | 4 missing |
| Contributions | 0 endpoints | 3 endpoints | 3 missing |
| Collections | 0 endpoints | 6 endpoints | 6 missing |
| Notifications | 0 endpoints | 5 endpoints | 5 missing |
| User Profile | 0 endpoints | 5 endpoints | 5 missing |
| Contact | 0 endpoints | 1 endpoint | 1 missing |
| Statistics | 0 endpoints | 2 endpoints | 2 missing |
| **TOTAL** | **12** | **48** | **36 missing/broken** |
