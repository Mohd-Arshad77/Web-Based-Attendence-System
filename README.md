# Web-based Attendance System

A MERN-based attendance system that allows employees to check in and check out only when they are physically near the shop location. The app uses browser GPS, device camera selfie capture, and backend distance validation.

---

##  Live Links

* Frontend: https://web-based-attendence-system-xen6.vercel.app/
* Backend: https://web-based-attendence-system.onrender.com

---

##  Features

* Check-in and check-out flow
* Browser geolocation using `navigator.geolocation.getCurrentPosition()`
* Selfie capture using `navigator.mediaDevices.getUserMedia()`
* Server-side distance verification within 100 meters
* Attendance history by employee
* Daily duplicate check-in prevention
* Responsive React UI

---

##  Shop Validation Settings

* Latitude: `9.9312`
* Longitude: `76.2673`
* Max allowed distance: `100 meters`

---

## 🛠️ Tech Stack

* Frontend: React + Vite
* Backend: Node.js + Express
* Database: MongoDB
* File Uploads: Multer

---

## 📂 Project Structure

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

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Mohd-Arshad77/Web-Based-Attendence-System.git
cd Web-Based-Attendence-System
```

---

### 2. Backend setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:
http://localhost:5000

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:
http://localhost:5173

---

## 🌐 Environment Variables

### Frontend (.env)

* Local:
  VITE_API_URL=http://localhost:5000/api

* Production:
  VITE_API_URL=https://web-based-attendence-system.onrender.com/api

---

## 📄 Documentation

* Database Schema → ./DATABASE_SCHEMA.md
* API Documentation → ./API_DOCUMENTATION.md

---



## 🔐 Git Safety Notes

* Do not commit `.env` files
* Ignore:

  * node_modules
  * dist
  * backend/uploads

---

## 🌐 Deployment Notes

* Set `MONGODB_URI` in Render
* Set `CLIENT_URL` to your frontend URL
* Use environment variables for production

---

##  Key Highlights

* GPS + Selfie based secure attendance
* Real-time distance validation
* Clean and scalable architecture

---

##  Author

Mohammed Arshad
