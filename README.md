# Web-based Attendance System

A MERN-based attendance system that allows employees to check in and check out only when they are physically near the shop location. The app uses browser GPS, device camera selfie capture, and backend distance validation.

## Features

- Check-in and check-out flow
- Browser geolocation permission using `navigator.geolocation.getCurrentPosition()`
- Selfie capture using `navigator.mediaDevices.getUserMedia()`
- Server-side distance verification within 100 meters of the shop
- Attendance history by employee
- Daily duplicate check-in prevention
- Responsive React UI

## Shop Validation Settings

- Latitude: `9.9312`
- Longitude: `76.2673`
- Max allowed distance: `100 meters`

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- File Uploads: Multer

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
frontend/
  src/
```

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Web-based Attendance System
```

### 2. Backend setup

```bash
cd backend
npm install
```

Update `backend/.env` with your MongoDB connection string if needed.

Run backend:

```bash
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
copy .env.example .env
```

Run frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Git Safety Notes

- Keep `frontend/.env`, `backend/.env`, `node_modules`, `dist`, and `backend/uploads` out of Git.
- The root `.gitignore` is already configured for those files and folders.
- The frontend reads shop validation settings from the backend `GET /api/attendance/shop-info` endpoint so both sides stay in sync.

## First Push to GitHub

```bash
git init
git remote add origin https://github.com/Mohd-Arshad77/Web-Based-Attendence-System.git
git add .
git commit -m "Initial project backup"
git branch -M main
git push -u origin main
```

## API Documentation

### `POST /api/attendance/checkin`

Form data fields:

- `userId`
- `userName`
- `latitude`
- `longitude`
- `timestamp`
- `image`

### `POST /api/attendance/checkout`

Form data fields:

- `userId`
- `userName`
- `latitude`
- `longitude`
- `timestamp`
- `image`

### `GET /api/attendance/user/:userId`

Returns all attendance records for a user.

### `GET /api/attendance/shop-info`

Returns the shop coordinates and max allowed distance.

## Database Schema

See [docs/database-schema.md](/d:/Web-based%20Attendance%20System/docs/database-schema.md)

## Extra Notes for Submission

- Test the app from a browser on a phone or laptop with camera and GPS enabled.
- Add screenshots or a short demo video before submission.
- If using MongoDB Atlas, whitelist your IP and update `MONGODB_URI`.
- Uploaded selfie images are stored inside `backend/uploads/`.

## Render Deployment Notes

- Set `MONGODB_URI` in Render to your MongoDB Atlas connection string.
- Set `CLIENT_URL` in Render to your deployed frontend URL so CORS allows browser requests.
- Keep `backend/.env` local only; do not commit Atlas credentials to GitHub.
