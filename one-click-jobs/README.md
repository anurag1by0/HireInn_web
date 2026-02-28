# One-Click Jobs

A full-stack Next.js job board prototype designed for quick applications and interview prep.

## Features

- **Job Grid**: Browse curated tech jobs in Bengaluru.
- **One-Click Apply**: Instant application submission (mock).
- **Prep Guides**: Detailed interview preparation content for each company.
- **Smart Profile**: Resume parsing (PDF) to autofill your profile.
- **Authentication**: Email/Password and Google OAuth support.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (via Mongoose)
- **Auth**: NextAuth.js v4
- **Tools**: pdfjs-dist (Resume parsing), bcryptjs (Security)

## Getting Started

### 1. Prerequisites
- Node.js 18+ installed.
- MongoDB Atlas account (Free tier) or local MongoDB.

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your details:
- `MONGODB_URI`: Your MongoDB connection string.
- `NEXTAUTH_SECRET`: Any random string.
- `GOOGLE_CLIENT_ID` / `SECRET`: Optional for Google login.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push this code to GitHub.
2. Import project in Vercel.
3. Add Environment Variables in Vercel settings (match .env.local).
4. Deploy!

## Folder Structure

- `app/`: Next.js App Router pages and API routes.
- `components/`: Reusable UI components.
- `lib/`: Utilities (DB connection, dummy data).
- `models/`: Mongoose database models.
