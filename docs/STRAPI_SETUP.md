# Womencypedia Strapi CMS Setup Guide

This guide walks you through setting up Strapi CMS for the Womencypedia frontend.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A PostgreSQL database (recommended for production)

## Quick Start

### 1. Create a New Strapi Project

```bash
# Create Strapi project
npx create-strapi-app@latest womencypedia-cms --quickstart

# Or with custom settings
npx create-strapi-app@latest womencypedia-cms
```

### 2. Install Dependencies

```bash
cd womencypedia-cms
npm install @strapi/provider-upload-local @strapi/plugin-i18n @strapi/plugin-users-permissions
```

### 3. Configure Plugins

Copy the plugin configuration from the frontend:

```bash
# Copy the plugins configuration
cp /path/to/womencypedia-frontend/strapi/config/plugins.js ./config/
```

### 4. Create Content Types

The frontend includes pre-configured content type schemas. Create them in the Strapi admin:

#### Biography Content Type

Create fields according to `strapi/api/biography/content-types/biography/schema.json`:
- `name` (string, required)
- `slug` (UID, based on name)
- `region` (enumeration: Africa, Europe, Asia, Middle East, North America, South America, Oceania, Global)
- `era` (enumeration: Ancient, Pre-colonial, Colonial, Post-colonial, Contemporary)
- `category` (enumeration: Leadership, Culture & Arts, Spirituality & Faith, Politics & Governance, Science & Innovation, Community Builders, Activism & Justice, Education, Diaspora Stories)
- `domain` (string)
- `introduction` (rich text)
- `earlyLife` (rich text)
- `pathToInfluence` (rich text)
- `contributions` (rich text)
- `symbolicPower` (rich text)
- `culturalContext` (rich text)
- `legacy` (rich text)
- `image` (media, single)
- `gallery` (media, multiple)
- `tags` (relation to Tags)
- `sources` (JSON)
- `relatedWomen` (relation to Biography)
- `relatedMovements` (JSON)
- `relatedDynasties` (JSON)
- `featured` (boolean)

Enable i18n for localized fields.

#### Collection Content Type

Create fields according to `strapi/api/collection/content-types/collection/schema.json`:
- `title` (string, i18n enabled)
- `slug` (UID)
- `description` (rich text, i18n enabled)
- `coverImage` (media)
- `biographies` (relation to Biography)
- `featured` (boolean)
- `order` (integer)

#### Tag Content Type

Create fields according to `strapi/api/tag/content-types/tag/schema.json`:
- `name` (string, unique)
- `slug` (UID)
- `biographies` (relation to Biography)

#### Education Module Content Type

Create fields according to `strapi/api/education-module/content-types/education-module/schema.json`:
- `title` (string, i18n enabled)
- `slug` (UID)
- `description` (text, i18n enabled)
- `order` (integer)
- `content` (rich text, i18n enabled)
- `coverImage` (media)
- `lessons` (JSON)
- `quiz` (JSON)
- `relatedBiographies` (relation to Biography)
- `featured` (boolean)

### 5. Enable Internationalization

1. Go to **Settings > Internationalization**
2. Add locales:
   - English (en) - Default
   - French (fr)
   - Portuguese (pt)
   - Swahili (sw)
   - Hausa (ha)
   - Yoruba (yo)
   - Arabic (ar)
   - Spanish (es)
   - Chinese (zh)
   - Hindi (hi)

### 6. Configure API Permissions

1. Go to **Settings > Users & Permissions > Roles > Public**
2. Grant find and findOne permissions for:
   - Biography
   - Collection
   - Tag
   - Education Module

3. Create an API token for frontend access:
   - Go to **Settings > API Tokens**
   - Create a new token with full access
   - Copy the token to your frontend config

### 7. Configure Frontend

Update `js/config.js`:

```javascript
// Set your Strapi URL
API_BASE_URL: 'https://your-strapi-instance.com',

// Enable Strapi mode
USE_STRAPI: true,
```

### 8. Add Sample Data

Use the Strapi admin to add sample biographies. Here's example data:

```json
{
  "name": "Wangari Maathai",
  "region": "Africa",
  "era": "Contemporary",
  "category": "Activism & Justice",
  "domain": "Environmental Activist",
  "introduction": "Wangari Maathai was a Kenyan environmental and political activist, first African woman to win the Nobel Peace Prize.",
  "earlyLife": "Born in 1940 in Kenya, studied biology in the US and returned to teach at University of Nairobi.",
  "pathToInfluence": "Founded the Green Belt Movement in 1977 to combat deforestation and empower women.",
  "contributions": "Planted over 30 million trees, advocated for democracy and women's rights in Kenya.",
  "legacy": "Her work continues through the Green Belt Movement and inspires global environmental activism.",
  "featured": true
}
```

## Environment Variables

Create a `.env` file:

```env
# Server
HOST=0.0.0.0
PORT=1337

# Database (PostgreSQL recommended for production)
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=womencypedia
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Admin
ADMIN_JWT_SECRET=your-super-secret-admin-jwt-key
```

## Development vs Production

### Development
```bash
npm run develop
```

### Production Build
```bash
npm run build
npm start
```

## Frontend Integration

The frontend has been configured to work with Strapi:

1. **API Layer**: `js/api.js` routes requests to Strapi when `USE_STRAPI: true`
2. **Strapi Service**: `js/strapi-api.js` handles Strapi-specific response transformation
3. **i18n**: `js/i18n.js` integrates with Strapi's locale system

## Troubleshooting

### CORS Issues
Add your frontend URL to `config/middlewares.js`:

```javascript
module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:3000', 'https://womencypedia.org'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

### Image Upload Issues
Ensure the upload provider is properly configured. For local storage:

```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 25 * 1024 * 1024, // 25MB
      },
    },
  },
});
```

### Authentication Issues
Make sure to configure JWT in `config/plugins.js`:

```javascript
module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
    },
  },
});
```

## Data Migration

To migrate from the old mock API data:

1. Export data from `js/data.js`
2. Use Strapi's import/export features
3. Or create a script to populate via Strapi's API

## API Endpoints Reference

| Content Type | Endpoint | Methods |
|-------------|----------|---------|
| Biographies | `/api/biographies` | GET, POST |
| Biography | `/api/biographies/:id` | GET, PUT, DELETE |
| Collections | `/api/collections` | GET, POST |
| Collection | `/api/collections/:id` | GET, PUT, DELETE |
| Tags | `/api/tags` | GET, POST |
| Education Modules | `/api/education-modules` | GET, POST |

## Support

For issues with Strapi, refer to the official documentation: https://docs.strapi.io/
