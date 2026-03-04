# Womencypedia Frontend - API Integration Guide

This document provides detailed specifications for integrating the Womencypedia frontend with a backend API.

## Current Status

⚠️ **Backend Status**: The backend API at `https://womencypedia-api.onrender.com` is currently **not responding** (returns 404).

### Solution Implemented

To enable frontend development and testing without a working backend, a **Mock API Service** has been implemented:

- **`js/mockApi.js`** - Comprehensive mock API that simulates all documented endpoints
- The frontend automatically detects backend availability and falls back to mock data
- Demo credentials work out of the box for testing

### Demo Credentials

| Email | Role | Features |
|-------|------|----------|
| `admin@womencypedia.org` | Admin | Full access, dashboard, content management |
| `contributor@womencypedia.org` | Contributor | Submit nominations, stories, comments |
| `user@example.com` | Public | Basic access (any email/password works) |

---

## Overview

The frontend is designed to work with a RESTful API backend. All API communication is handled through the centralized modules in the `js/` directory:

- **`config.js`** - Configuration constants and API endpoints
- **`api.js`** - API service module with all HTTP request methods
- **`auth.js`** - Authentication and authorization handling
- **`ui.js`** - UI utilities, loading states, and toast notifications
- **`forms.js`** - Form submission handling for contributions
- **`notifications.js`** - Notification management
- **`bookmarks.js`** - Saved/bookmarked entries
- **`comments.js`** - Comment/discussion system to entries
- **`mockApi.js`** - Mock API for development/testing (auto-enabled when backend unavailable)

## Configuration

Update the `API_BASE_URL` in `js/config.js` to point to your backend:

```javascript
// Development
API_BASE_URL: 'http://localhost:8001'

// Production
API_BASE_URL: 'https://womencypedia-api.onrender.com'
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/logout` | User logout | Yes |
| POST | `/auth/refresh` | Refresh access token | No (uses refresh token) |
| GET | `/auth/me` | Get current user info | Yes |
| POST | `/auth/forgot-password` | Request password reset email | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/send-verification` | Resend verification email | Yes |
| GET | `/auth/verify/:token` | Verify email address | No |
| POST | `/auth/change-password` | Change password (logged in) | Yes |
| GET | `/auth/google` | Initiate Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| GET | `/auth/github` | Initiate GitHub OAuth | No |
| GET | `/auth/github/callback` | GitHub OAuth callback | No |

#### Register Request
```json
POST /auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

#### Register Response
```json
{
  "message": "Registration successful. Please check your email to verify.",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "contributor",
    "email_verified": false
  }
}
```

#### Login Request
```json
POST /auth/login
{
  "email": "admin@womencypedia.org",
  "password": "securepassword"
}
```

#### Login Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@womencypedia.org",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### Forgot Password Request
```json
POST /auth/forgot-password
{
  "email": "jane@example.com"
}
```

#### Reset Password Request
```json
POST /auth/reset-password
{
  "token": "reset-token-from-email",
  "new_password": "newsecurepassword"
}
```

#### Change Password Request
```json
POST /auth/change-password
Authorization: Bearer <token>
{
  "current_password": "oldpassword",
  "new_password": "newsecurepassword"
}
```

---

### Entries (Biographies)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/entries` | List all entries with pagination/filtering | No |
| GET | `/entries/:id` | Get single entry | No |
| GET | `/entries/search` | Search entries | No |
| POST | `/entries` | Create new entry | Admin |
| PUT | `/entries/:id` | Update entry | Admin |
| DELETE | `/entries/:id` | Delete entry | Admin |

#### List Entries Request
```
GET /entries?page=1&limit=12&region=Africa&era=Colonial&search=queen
```

#### List Entries Response
```json
{
  "entries": [
    {
      "id": 1,
      "name": "Queen Amina of Zazzau",
      "region": "Africa",
      "era": "Pre-colonial",
      "category": "Leadership",
      "domain": "Monarch",
      "tags": ["Warrior Queen", "Military Leader"],
      "introduction": "A 16th-century Hausa warrior queen...",
      "image": "/images/queen-amina.png",
      "status": "published",
      "createdAt": "2026-01-15T00:00:00Z",
      "updatedAt": "2026-01-15T00:00:00Z"
    }
  ],
  "page": 1,
  "total_pages": 5,
  "total": 50
}
```

#### Single Entry Response
```json
{
  "id": 1,
  "name": "Queen Amina of Zazzau",
  "region": "Africa",
  "era": "Pre-colonial",
  "category": "Leadership",
  "domain": "Monarch",
  "tags": ["Warrior Queen", "Military Leader"],
  "introduction": "A 16th-century Hausa warrior queen...",
  "earlyLife": "Born around 1533 CE in Zazzau...",
  "pathToInfluence": "Ascended to the throne in 1576 CE...",
  "contributions": "Her military campaigns are legendary...",
  "symbolicPower": "Represents female sovereignty...",
  "culturalContext": "Ruled during the 16th century...",
  "legacy": "Her legacy continues in Nigerian folklore...",
  "image": "/images/queen-amina.png",
  "sources": [
    {
      "type": "Secondary",
      "title": "The Emirates of Northern Nigeria",
      "author": "Hogben & Kirk-Greene",
      "year": 1966,
      "citation": "Oxford University Press"
    }
  ],
  "relatedWomen": [2, 3],
  "relatedMovements": ["African Queenship Systems"],
  "relatedDynasties": ["Hausa Kingdoms"],
  "status": "published",
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-01-15T00:00:00Z"
}
```

#### Create Entry Request
```json
POST /entries
Authorization: Bearer <token>
{
  "name": "Wangari Maathai",
  "region": "Africa",
  "era": "Contemporary",
  "category": "Activism & Justice",
  "tags": ["Nobel Peace Prize", "Green Belt Movement"],
  "introduction": "A Kenyan environmental and political activist...",
  "earlyLife": "Born in 1940 in Kenya...",
  "pathToInfluence": "Founded the Green Belt Movement in 1977...",
  "contributions": "Planted over 30 million trees...",
  "legacy": "Her work continues through the Green Belt Movement..."
}
```

---

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/entries/:entryId/comments` | Get comments for an entry | No |
| POST | `/entries/:entryId/comments` | Post a new comment | Yes |
| DELETE | `/entries/:entryId/comments/:commentId` | Delete a comment | Yes (owner/admin) |
| POST | `/entries/:entryId/comments/:commentId/like` | Like/unlike a comment | Yes |

#### List Comments Response
```json
{
  "comments": [
    {
      "id": "1",
      "user": {
        "id": 1,
        "name": "Sarah Johnson",
        "initials": "SJ"
      },
      "content": "This biography is incredibly inspiring!",
      "likes": 12,
      "isLiked": false,
      "createdAt": "2026-01-15T10:30:00Z",
      "replies": [
        {
          "id": "2",
          "user": { "id": 2, "name": "Jane Doe", "initials": "JD" },
          "content": "I agree! The historical context is very well researched.",
          "likes": 3,
          "isLiked": false,
          "createdAt": "2026-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "total": 5
}
```

#### Post Comment Request
```json
POST /entries/1/comments
Authorization: Bearer <token>
{
  "content": "This biography is incredibly inspiring!",
  "parentId": null
}
```

---

### Contributions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/contributions/nominations` | Submit a nomination | No |
| POST | `/contributions/stories` | Submit a story | No |
| GET | `/contributions/pending` | Get pending contributions | Admin |
| POST | `/contributions/:id/approve` | Approve contribution | Admin |
| POST | `/contributions/:id/reject` | Reject contribution | Admin |

#### Nomination Request
```json
POST /contributions/nominations
{
  "nomineeName": "Ada Lovelace",
  "era": "19th Century",
  "region": "Europe",
  "collection": "science",
  "bio": "Ada Lovelace was the first computer programmer...",
  "sources": "Various historical documents...",
  "submitterName": "Jane Doe",
  "submitterEmail": "jane@example.com",
  "type": "nomination",
  "status": "pending"
}
```

#### Story Submission Request
```json
POST /contributions/stories
{
  "storyType": "other",
  "subjectName": "My Grandmother",
  "relationship": "Grandmother",
  "region": "Nigeria",
  "theme": "resilience",
  "story": "My grandmother was a remarkable woman who...",
  "lessons": "Her story teaches us about perseverance...",
  "contactName": "Jane Doe",
  "contactEmail": "jane@example.com",
  "permissionGranted": true,
  "type": "story",
  "status": "pending"
}
```

#### Pending Contributions Response
```json
{
  "contributions": [
    {
      "id": 1,
      "type": "nomination",
      "nomineeName": "Ada Lovelace",
      "bio": "Ada Lovelace was...",
      "submitterName": "Jane Doe",
      "submittedAt": "2026-01-15T00:00:00Z",
      "status": "pending"
    }
  ],
  "total": 5
}
```

---

### Collections

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/collections` | List all collections | No |
| GET | `/collections/:id` | Get collection with entries | No |
| GET | `/collections/saved` | Get user's saved entries | Yes |
| POST | `/collections/saved` | Save an entry | Yes |
| DELETE | `/collections/saved/:entryId` | Remove saved entry | Yes |
| DELETE | `/collections/saved` | Clear all saved entries | Yes |

#### Saved Entries Response
```json
{
  "items": [
    {
      "id": 1,
      "entry_id": 1,
      "name": "Queen Amina of Zazzau",
      "slug": "queen-amina-of-zazzau",
      "image": "/images/queen-amina.png",
      "category": "Leadership",
      "preview": "A 16th-century Hausa warrior queen...",
      "bookmarkedAt": "2026-01-20T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | Get user's notifications | Yes |
| PATCH | `/notifications/:id/read` | Mark notification as read | Yes |
| PATCH | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete a notification | Yes |
| DELETE | `/notifications` | Clear all notifications | Yes |

#### Notifications Response
```json
{
  "notifications": [
    {
      "id": "1",
      "type": "biography",
      "title": "New Biography Published",
      "message": "A new biography for Wangari Maathai has been published.",
      "link": "biography.html?id=5",
      "read": false,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "unread_count": 3
}
```

---

### User Profile & Settings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/profile` | Get user profile | Yes |
| PUT | `/user/profile` | Update user profile | Yes |
| GET | `/user/settings` | Get user settings | Yes |
| PUT | `/user/settings` | Update user settings | Yes |
| DELETE | `/user/account` | Delete user account | Yes |

#### User Profile Response
```json
{
  "id": 1,
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@email.com",
  "role": "contributor",
  "bio": "Editor-in-Chief at Womencypedia",
  "location": "New York, USA",
  "avatar": "/images/avatars/sarah.jpg",
  "joinDate": "2024-01-15T00:00:00Z",
  "contributions_count": 25,
  "bookmarks_count": 15,
  "badges": [
    { "id": 1, "name": "Top Contributor", "icon": "star" }
  ]
}
```

#### Update Profile Request
```json
PUT /user/profile
Authorization: Bearer <token>
{
  "name": "Dr. Sarah Johnson",
  "bio": "Updated bio text",
  "location": "New York, USA"
}
```

#### User Settings Response
```json
{
  "notifications": {
    "email_new_biography": true,
    "email_nomination_update": true,
    "email_newsletter": false,
    "push_enabled": true
  },
  "privacy": {
    "show_profile_public": true,
    "show_contributions": true,
    "show_bookmarks": false
  },
  "display": {
    "theme": "dark",
    "language": "en"
  }
}
```

---

### Contact

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/contact` | Submit contact form | No |

#### Contact Request
```json
POST /contact
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "subject": "General Inquiry",
  "message": "I would like to know more about..."
}
```

---

### Statistics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/stats/dashboard` | Dashboard statistics | Admin |
| GET | `/stats/public` | Public statistics | No |

#### Dashboard Stats Response
```json
{
  "totalEntries": 150,
  "pendingApproval": 12,
  "nominations": 8,
  "stories": 4,
  "recentActivity": [
    {
      "type": "add",
      "description": "Added new entry: Wangari Maathai",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

#### Public Stats Response
```json
{
  "totalEntries": 150,
  "totalCollections": 12,
  "totalContributors": 45,
  "regionsRepresented": 7,
  "erasCovered": 5
}
```

---

## Authentication Flow

### JWT Tokens

The frontend expects JWT tokens in the response:

1. **Access Token**: Short-lived (15-60 minutes), used for API requests
2. **Refresh Token**: Long-lived (7 days), used to get new access tokens

Tokens are stored in `localStorage`:
- `womencypedia_access_token`
- `womencypedia_refresh_token`
- `womencypedia_user` (JSON string)

### User Roles

- **`admin`**: Full access to all features, CRUD operations
- **`contributor`**: Can submit contributions, view their own submissions
- **`public`**: Read-only access, can submit nominations/stories

### Authorization Header

All authenticated requests include:
```
Authorization: Bearer <access_token>
```

## Error Responses

All errors should return JSON with this structure:

```json
{
  "detail": "Human-readable error message",
  "code": "ERROR_CODE",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation failed)
- `500` - Internal Server Error

## CORS Configuration

The backend should allow CORS from the frontend domain:

```
Access-Control-Allow-Origin: https://womencypedia.org
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Fallback Behavior

The frontend is designed to gracefully fallback to static data (`js/data.js`) when the API is unavailable. This allows:

1. Development without a running backend
2. Demonstration of the UI/UX
3. Progressive enhancement as the API is developed

## File Structure

```
js/
├── config.js       # API configuration and endpoints
├── api.js          # HTTP client and API methods
├── auth.js         # Authentication handling
├── ui.js           # UI utilities and components
├── forms.js        # Form submission handling
├── browse.js       # Browse page functionality
├── bookmarks.js    # Saved/bookmark functionality
├── notifications.js # Notification management
├── comments.js     # Comment/discussion system
├── history.js      # Reading history tracking
├── share.js        # Social sharing
├── profile.js      # Profile page functionality
├── analytics.js    # Analytics dashboard
├── data.js         # Static fallback data
├── timeline.js     # Timeline rendering
└── navigation.js   # Navigation component logic
```

## Complete API Endpoint Summary

| # | Method | Endpoint | Module | Auth |
|---|--------|----------|--------|------|
| 1 | POST | `/auth/register` | auth.js | No |
| 2 | POST | `/auth/login` | auth.js | No |
| 3 | POST | `/auth/logout` | auth.js | Yes |
| 4 | POST | `/auth/refresh` | auth.js | No |
| 5 | GET | `/auth/me` | auth.js | Yes |
| 6 | POST | `/auth/forgot-password` | auth.js | No |
| 7 | POST | `/auth/reset-password` | auth.js | No |
| 8 | POST | `/auth/send-verification` | auth.js | Yes |
| 9 | GET | `/auth/verify/:token` | auth.js | No |
| 10 | POST | `/auth/change-password` | auth.js | Yes |
| 11 | GET | `/auth/google` | auth.js | No |
| 12 | GET | `/auth/google/callback` | auth.js | No |
| 13 | GET | `/auth/github` | auth.js | No |
| 14 | GET | `/auth/github/callback` | auth.js | No |
| 15 | GET | `/entries` | api.js | No |
| 16 | GET | `/entries/:id` | api.js | No |
| 17 | GET | `/entries/search` | api.js | No |
| 18 | POST | `/entries` | api.js | Admin |
| 19 | PUT | `/entries/:id` | api.js | Admin |
| 20 | DELETE | `/entries/:id` | api.js | Admin |
| 21 | GET | `/entries/:id/comments` | comments.js | No |
| 22 | POST | `/entries/:id/comments` | comments.js | Yes |
| 23 | DELETE | `/entries/:id/comments/:cid` | comments.js | Yes |
| 24 | POST | `/entries/:id/comments/:cid/like` | comments.js | Yes |
| 25 | POST | `/contributions/nominations` | forms.js | No |
| 26 | POST | `/contributions/stories` | forms.js | No |
| 27 | GET | `/contributions/pending` | api.js | Admin |
| 28 | POST | `/contributions/:id/approve` | api.js | Admin |
| 29 | POST | `/contributions/:id/reject` | api.js | Admin |
| 30 | GET | `/collections` | api.js | No |
| 31 | GET | `/collections/:id` | api.js | No |
| 32 | GET | `/collections/saved` | bookmarks.js | Yes |
| 33 | POST | `/collections/saved` | bookmarks.js | Yes |
| 34 | DELETE | `/collections/saved/:entryId` | bookmarks.js | Yes |
| 35 | DELETE | `/collections/saved` | bookmarks.js | Yes |
| 36 | GET | `/notifications` | notifications.js | Yes |
| 37 | PATCH | `/notifications/:id/read` | notifications.js | Yes |
| 38 | PATCH | `/notifications/read-all` | notifications.js | Yes |
| 39 | DELETE | `/notifications/:id` | notifications.js | Yes |
| 40 | DELETE | `/notifications` | notifications.js | Yes |
| 41 | GET | `/user/profile` | api.js | Yes |
| 42 | PUT | `/user/profile` | api.js | Yes |
| 43 | GET | `/user/settings` | api.js | Yes |
| 44 | PUT | `/user/settings` | api.js | Yes |
| 45 | DELETE | `/user/account` | api.js | Yes |
| 46 | POST | `/contact` | api.js | No |
| 47 | GET | `/stats/dashboard` | api.js | Admin |
| 48 | GET | `/stats/public` | api.js | No |

## Integration Checklist

- [ ] Deploy backend API to Render
- [ ] Implement JWT authentication (register, login, refresh, logout)
- [ ] Implement password reset flow (forgot-password, reset-password)
- [ ] Implement email verification (send-verification, verify/:token)
- [ ] Implement social OAuth (Google, GitHub)
- [ ] Create database schema for entries, comments, collections
- [ ] Implement entries CRUD with search/filter/pagination
- [ ] Implement comments/discussions on entries
- [ ] Implement contributions (nominations, stories)
- [ ] Implement bookmarks (saved collections)
- [ ] Implement notifications system
- [ ] Implement user profile & settings
- [ ] Implement contact form endpoint
- [ ] Implement statistics endpoints
- [ ] Add CORS configuration
- [ ] Update `config.js` with production API URL
- [ ] Test all CRUD operations
- [ ] Verify form submissions
- [ ] Test authentication flow
- [ ] Verify admin dashboard functionality

## Contact & Support

For questions about the API integration, please contact the development team.
