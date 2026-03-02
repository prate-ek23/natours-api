# Natours API

A RESTful API for a tour-booking application built with **Node.js**, **Express**, and **MongoDB**. It supports tours, users, reviews, authentication, role-based access, and geospatial queries.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Seeding Development Data](#seeding-development-data)
- [Testing the API](#testing-the-api)
- [API Overview](#api-overview)
- [License](#license)

---

## Features

### Core Functionality

- **Tours** — Full CRUD for tours: name, duration, difficulty, price, ratings, GeoJSON locations, start dates, guides, and optional discount.
- **Users** — Signup, login, profile management, password reset via email, and role-based access (`user`, `lead-guide`, `admin`).
- **Reviews** — Nested under tours (`/tours/:tourId/reviews`). One review per user per tour; tour ratings recalculate automatically when reviews change.

### Authentication & Security

- **JWT** — Login/signup return a JWT; protected routes require `Authorization: Bearer <token>`.
- **Password** — Bcrypt hashing; optional password reset with time-limited token sent via Nodemailer.
- **Role-based access** — `protect` (must be logged in) and `restrictTo(...roles)` for admin/lead-guide-only or user-only actions.
- **Security middleware** — Helmet (HTTP headers), rate limiting (100 req/hour per IP on `/api`), `express-mongo-sanitize`, `xss-clean`, `hpp` (parameter pollution), body size limit (10kb).

### API Features

- **Filtering** — Query params for equality; advanced filters with `gte`, `gt`, `lte`, `lt` (e.g. `?price[gte]=100`).
- **Sorting** — `?sort=price,-ratingsAverage` (comma-separated, `-` for descending).
- **Field limiting** — `?fields=name,price,difficulty`.
- **Pagination** — `?page=1&limit=10` (default limit 100).
- **Aliasing** — e.g. "top 5 cheap" tours via `/tours/top-5-cheap`.

### Geospatial

- **Tours within radius** — `GET /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit` (e.g. `unit=mi` or `km`).
- **Distances from point** — `GET /api/v1/tours/distances/:latlng/unit/:unit` returns distances from a point to all tours (GeoJSON `2dsphere` index).

### Aggregation

- **Tour stats** — `GET /api/v1/tours/tour-stats` (e.g. by difficulty: count, avg rating, min/max price).
- **Monthly plan** — `GET /api/v1/tours/monthly-plan/:year` (protected, admin/guide/lead-guide) — number of tour starts per month.

### Error Handling & Reliability

- **Central error handler** — All errors go through `globalErrorHandler`; different responses in development (stack trace) vs production (safe messages).
- **Operational errors** — Cast (invalid ID), duplicate fields, validation, JWT invalid/expired are handled and return appropriate status codes.
- **Uncaught / unhandled** — `uncaughtException` and `unhandledRejection` in `server.js` log and shut down the process.

### Server-Side Views

- **Pug templates** — Overview (`/`) and tour detail (`/tour/:slug`) with Mapbox integration in `public/js/mapbox.js`.

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Runtime   | Node.js    |
| Framework | Express 4.x |
| Database  | MongoDB (Mongoose 5.x) |
| Auth      | JWT (jsonwebtoken), bcryptjs |
| Security  | helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp |
| Email     | Nodemailer |
| Templates | Pug        |
| Dev       | nodemon, ESLint (Airbnb + Prettier) |

---

## Project Structure

```
natours-api/
├── app.js                 # Express app, middleware, routes
├── server.js              # DB connection, server listen, global error handlers
├── config.env             # Environment variables (create from template below; not in git)
├── controllers/           # authController, errorController, tourController, userController, reviewController, viewsController, handlerFactory
├── models/                # tourModel, userModel, reviewModel (Mongoose schemas)
├── routes/                # tourRoutes, userRoutes, reviewRoutes, viewRoutes
├── utils/                 # appError, catchAsync, apiFeatures, email
├── views/                 # Pug templates (overview, tour, base, partials)
├── public/                # Static assets (e.g. JS for Mapbox)
└── dev-data/data/         # import-dev-data.js, tours.json, users.json, reviews.json
```

---

## Prerequisites

- **Node.js** (v14+ recommended)
- **MongoDB** (local or Atlas)
- **npm** or **yarn**

---

## Environment Setup

Create a file named `config.env` in the project root (it is gitignored). The app and the import script read from it.

**Required variables:**

```env
NODE_ENV=development
PORT=3000

# MongoDB (replace <PASSWORD> with your actual password)
DATABASE=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/natours?retryWrites=true&w=majority
DATABASE_PASSWORD=your_mongodb_password

# Optional: local MongoDB
# DATABASE_LOCAL=mongodb://localhost:27017/natours

# JWT
JWT_SECRET=your_super_secret_key_at_least_32_chars_long
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90

# Email (for password reset)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USERNAME=your_mailtrap_username
EMAIL_PASSWORD=your_mailtrap_password
```

- **DATABASE** — Used by `server.js` and `dev-data/data/import-dev-data.js` (with `DATABASE_PASSWORD`).
- **JWT_*** — Used for signing and verifying tokens and setting cookie expiry.
- **EMAIL_*** — Used by `utils/email.js` when sending password-reset emails. Without valid SMTP config, "forgot password" will fail at send.

---

## Installation

```bash
git clone <your-repo-url>
cd natours-api
npm install
```

Create `config.env` as above and set your MongoDB URI, JWT secret, and (optionally) email credentials.

---

## Running the Application

**Development (with auto-reload):**

```bash
npm start
```

Uses `nodemon server.js`. Default port from `config.env` or `3000`.

**Production:**

```bash
npm run start:prod
```

Sets `NODE_ENV=production` and runs with nodemon. On Windows you may need to set `NODE_ENV` in `config.env` or use a cross-env script.

**Debug (Node inspector):**

```bash
npm run debug
```

Runs with `ndb server.js` (install `ndb` globally if needed).

After starting, you should see **"DB Connection successful"** and **"App running on &lt;port&gt;...."**. Base URL: `http://localhost:3000` (or your `PORT`).

---

## Seeding Development Data

From the project root, run:

```bash
node dev-data/data/import-dev-data.js --import
```

This populates the database with tours, users, and reviews from `dev-data/data/*.json`.

To wipe all tours, users, and reviews:

```bash
node dev-data/data/import-dev-data.js --delete
```

**Note:** The import script loads `./config.env`; if you run it from a different directory, you may need to ensure `config.env` exists there or adjust the path in the script.

---

## Testing the API

There are no automated test suites in this repo. You can test manually with **Postman**, **Insomnia**, or **curl**.

**Base URL (local):** `http://localhost:3000`  
**Base URL (live):** `https://natours-api-1-170u.onrender.com`

In all examples below, replace `{URL}` with either the local or live base URL. For example:
- Local: `GET {URL}/api/v1/tours` → `GET http://localhost:3000/api/v1/tours`
- Live: `GET {URL}/api/v1/tours` → `GET https://natours-api-1-170u.onrender.com/api/v1/tours`

### 1. Health / Overview

- **Overview page (HTML):** `GET {URL}/`
- **Tour by slug (HTML):** `GET {URL}/tour/the-forest-hiker` (slug depends on seeded data)

### 2. Tours (Public)

**Get all tours** (with optional query params):

```http
GET {URL}/api/v1/tours
```

Examples: `?limit=5`, `?sort=price`, `?fields=name,price,difficulty`, `?page=2&limit=10`, `?difficulty=easy`, `?price[gte]=100&price[lte]=500`

**Top 5 cheap:**

```http
GET {URL}/api/v1/tours/top-5-cheap
```

**Tour stats:**

```http
GET {URL}/api/v1/tours/tour-stats
```

**Single tour by ID:**

```http
GET {URL}/api/v1/tours/<tourId>
```

**Tours within radius** (e.g. 400 km from lat/lng, km):

```http
GET {URL}/api/v1/tours/tours-within/400/center/40,-45/unit/km
```

**Distances from a point:**

```http
GET {URL}/api/v1/tours/distances/40,-45/unit/km
```

### 3. Auth & Users

**Signup:**

```http
POST {URL}/api/v1/users/signup
Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

Response includes `token`; use it in later requests.

**Login:**

```http
POST {URL}/api/v1/users/login
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "password123"
}
```

Use the returned `token` as: `Authorization: Bearer <token>`.

**Forgot password:**

```http
POST {URL}/api/v1/users/forgotPassword
Content-Type: application/json

{ "email": "you@example.com" }
```

Sends reset email (requires EMAIL_* in `config.env`).

**Reset password** (token from email):

```http
PATCH {URL}/api/v1/users/resetPassword/<resetToken>
Content-Type: application/json

{
  "password": "newpass123",
  "passwordConfirm": "newpass123"
}
```

**Get current user** (protected):

```http
GET {URL}/api/v1/users/me
Authorization: Bearer <token>
```

**Update password** (protected):

```http
PATCH {URL}/api/v1/users/updateMyPassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "passwordCurrent": "oldpass",
  "password": "newpass123",
  "passwordConfirm": "newpass123"
}
```

### 4. Protected Tour Actions (Admin / Lead-Guide)

Use a user with role `admin` or `lead-guide` (set in DB) and send the JWT:

**Create tour:**

```http
POST {URL}/api/v1/tours
Authorization: Bearer <token>
Content-Type: application/json
```

Body: tour object with `name`, `duration`, `maxGroupSize`, `difficulty`, `price`, `summary`, `imageCover`, etc.

**Update / delete tour:**

```http
PATCH {URL}/api/v1/tours/<tourId>
DELETE {URL}/api/v1/tours/<tourId>
Authorization: Bearer <token>
```

**Monthly plan** (admin/guide/lead-guide):

```http
GET {URL}/api/v1/tours/monthly-plan/2025
Authorization: Bearer <token>
```

### 5. Reviews (Protected)

**List reviews for a tour:**

```http
GET {URL}/api/v1/tours/<tourId>/reviews
```

**Create review** (logged-in user):

```http
POST {URL}/api/v1/tours/<tourId>/reviews
Authorization: Bearer <token>
Content-Type: application/json

{ "review": "Great tour!", "rating": 5 }
```

**Update / delete own review** (user or admin):

```http
PATCH {URL}/api/v1/tours/<tourId>/reviews/<reviewId>
DELETE {URL}/api/v1/tours/<tourId>/reviews/<reviewId>
Authorization: Bearer <token>
```

Use the seeded users (from the import script) or create new ones via signup to get JWTs for testing protected routes.

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | No | Overview page (Pug) |
| GET | `/tour/:slug` | No | Tour detail page (Pug) |
| GET | `/api/v1/tours` | No | List tours (filter, sort, fields, paginate) |
| GET | `/api/v1/tours/top-5-cheap` | No | Top 5 cheap tours |
| GET | `/api/v1/tours/tour-stats` | No | Aggregated tour stats |
| GET | `/api/v1/tours/monthly-plan/:year` | Yes (admin/guide/lead-guide) | Monthly plan |
| GET | `/api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit` | No | Tours within radius |
| GET | `/api/v1/tours/distances/:latlng/unit/:unit` | No | Distances from point |
| GET | `/api/v1/tours/:id` | No | Single tour |
| POST | `/api/v1/tours` | Yes (admin/lead-guide) | Create tour |
| PATCH | `/api/v1/tours/:id` | Yes (admin/lead-guide) | Update tour |
| DELETE | `/api/v1/tours/:id` | Yes (admin/lead-guide) | Delete tour |
| POST | `/api/v1/users/signup` | No | Signup |
| POST | `/api/v1/users/login` | No | Login |
| POST | `/api/v1/users/forgotPassword` | No | Request password reset |
| PATCH | `/api/v1/users/resetPassword/:token` | No | Reset password with token |
| GET | `/api/v1/users/me` | Yes | Current user |
| PATCH | `/api/v1/users/updateMyPassword` | Yes | Update password |
| PATCH | `/api/v1/users/updateMe` | Yes | Update profile |
| DELETE | `/api/v1/users/deleteMe` | Yes | Deactivate account |
| GET | `/api/v1/users` | Yes (admin) | List users |
| GET/POST/PATCH/DELETE | `/api/v1/users/:id` | Yes (admin) | User CRUD |
| GET | `/api/v1/tours/:tourId/reviews` | Yes | List reviews for tour |
| POST | `/api/v1/tours/:tourId/reviews` | Yes (user) | Create review |
| GET/PATCH/DELETE | `/api/v1/tours/:tourId/reviews/:id` | Yes | Get/update/delete review |

---

## License

ISC | Author: Prateek Singh Rawat

## Data modelling diagram (source: Mongo Db Compass)
<img width="1632" height="1652" alt="natours_data_model_22_02_2026" src="https://github.com/user-attachments/assets/b07c20b9-7fcf-47cd-8e1f-8390c13be369" />
