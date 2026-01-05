# YPO Unified Member Brain Demo

A comprehensive demo application showcasing the YPO Unified Member Brain platform with AI-powered search, member profiles, network visualization, and event intelligence.

## Features

- **Chat-First Interface**: Natural language search with AI-powered suggestions
- **Enhanced Member Profiles**: Rich profiles with CEO DNA attributes and LinkedIn integration
- **Interactive Network Graph**: 3D force-directed visualization of member connections
- **Smart Recommendations**: AI-powered connection suggestions based on multiple dimensions
- **Event Intelligence**: Smart attendee matching and networking insights
- **Profile Management**: Comprehensive interface for managing personal information
- **Secure Authentication**: Clerk-powered authentication protecting member routes

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.staging.betterbrain.ai

# Clerk Authentication (required for member access)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (see above)
   - Get your Clerk keys from [https://clerk.com](https://clerk.com)
   - Add them to your `.env.local` file

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication

The application uses Clerk for secure authentication. Protected routes include:

- `/members` - Member directory (requires sign-in)
- `/members/:id` - Individual member profiles (requires sign-in)
- `/profile` - User profile management (requires sign-in)

### Authentication Flow

1. User signs in via Clerk
2. `useAuthenticatedAxios` hook sets up Axios interceptors
3. Interceptors wait for Clerk to load (`isLoaded: true`)
4. Once loaded, interceptors add `Authorization: Bearer <token>` header
5. Interceptors also add `X-Clerk-User-Id: <userId>` header
6. TanStack Query hooks wait for authentication before fetching data
7. API requests are made with full authentication credentials

**Important**: The `useYpoProfiles` and `useYpoProfile` hooks will not fetch data until:

- Clerk authentication is fully loaded (`isLoaded === true`)
- A valid `userId` exists
- This prevents "Couldn't find Clerk userId" errors

## Tech Stack

- **Next.js 16.0.7** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Clerk** - Authentication
- **shadcn/ui** - UI components
- **Recharts** - Data visualization

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable React components
- `/lib` - Utilities, stores, API layer, and types
- `/hooks` - Custom React hooks
- `/middleware.ts` - Clerk authentication middleware

## API Integration

The application connects to the YPO backend API for real member data. The API base URL is configurable via the `NEXT_PUBLIC_API_BASE_URL` environment variable.

### Available Endpoints

- `POST /api/v1/ypo/profiles` - Fetch all YPO member profiles (requires auth)
- `POST /api/v1/ypo/profile` - Fetch individual member profile by ID (requires auth)

All API requests automatically include:

- `Authorization: Bearer <clerk_token>` header
- `X-Clerk-User-Id: <user_id>` header

### API Request Flow

1. Component calls `useYpoProfiles()` or `useYpoProfile(id)`
2. Hook checks if Clerk auth is loaded and userId exists
3. If yes, TanStack Query executes the API call
4. Axios interceptor adds authentication headers
5. Backend validates Clerk token and userId
6. Response is cached and returned to component
