# Media Scraper

Media Scraper is a full-stack web application which is used to scrape images and videos from any website by providing URLs.

---

## Check more

- Problem/deal with url CSR...

## Features

- **Bulk Scraping:** Input multiple URLs to scrape images and videos in parallel.
- **Media Gallery:** Browse, search, filter, and paginate all scraped media.
- **Robust Backend:** Use Bullmq vs Worker to deal with a huge number of requests
- **Persistence:** Uses PostgreSQL for storage and Redis for queue management.
- **Dockerized:** Easy deployment with Docker Compose and Nginx reverse proxy.

---

## Resource

**Total: 1CPU, 1 GB**

- postgres: 10%
- redis: 10 % (for bullmq)
- frontend: 10%
- backend: 70%

## Tech Stack

### Prerequisites

- [Node.js](https://nodejs.org/) >= v22
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/): Docker version 27.4.0

### Backend:

- Express 4.21.2
- TypeScript
- PostgreSQL 16
- Sequelize
- Redis 7

### Frontend:

- React 19
- SWR
- Tailwind CSS
- Vite

---

## Getting Started

### Local Development

1. **Clone the repository:**

   ```sh
   git clone https://github.com/mio1710/media-scraper.git
   cd media-scraper
   ```

2. **Copy environment files:**

   ```sh
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Start all services with Docker Compose:**

   ```sh
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Access the app:**
   - Frontend: [http://localhost](http://localhost)
   - Backend API: [http://localhost:3001/api](http://localhost:3001/api)
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

---

## Usage

1. **Scrape URLs:**  
   Enter one or more URLs in the "Scrape URLs" form and submit. The backend will process each URL and extract images/videos.

2. **Browse Media:**  
   Use the gallery to search, filter by type, and paginate through results.

3. **View Stats:**  
   See counts of images and videos at the top of the gallery.

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── app.ts
│   │   ├── index.ts
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── tests/
│   │   └── types/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── vite-env.d.ts
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---
