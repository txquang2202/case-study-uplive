# Case Study - Fullstack Application

A production-ready fullstack boilerplate for rapid development with **Next.js** (frontend), **NestJS** (backend), and **PostgreSQL** (database).

## Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Axios
- **Backend**: NestJS 10, Node.js, TypeORM, PostgreSQL
- **Infrastructure**: Docker, Docker Compose
- **Tools**: Git, npm/yarn, ESLint, Prettier

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose

### Development with Docker (Recommended)

```bash
docker-compose up --build
```

Services available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- PostgreSQL: localhost:5432

### Local Development

**Backend:**

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

**Frontend:**

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Project Structure

```
case-study/
├── frontend/           # Next.js app (App Router)
│   ├── src/app/
│   ├── src/styles/
│   └── package.json
├── backend/            # NestJS app
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Scripts

### Backend

- `npm run start:dev` - Watch mode
- `npm run build` - Build production
- `npm test` - Run tests

### Frontend

- `npm run dev` - Dev server
- `npm run build` - Build production
- `npm run format` - Format code

## Database

PostgreSQL credentials:

- Host: localhost:5432
- User: devuser
- Password: devpassword
- Database: caseStudyDB

## Environment Variables

Backend `.env`:

```
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpassword
DB_NAME=caseStudyDB
```

Frontend `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Ready for Implementation

This boilerplate is prepared for the technical test. Adapt according to specific requirements.
