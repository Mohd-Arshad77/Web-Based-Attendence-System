# API Documentation

Base URL: `http://localhost:5000/api`

## Health Check

### `GET /health`

Response:

```json
{
  "message": "Attendance API is running."
}
```

## Shop Info

### `GET /attendance/shop-info`

Response:

```json
{
  "shopLocation": {
    "latitude": 9.9312,
    "longitude": 76.2673
  },
  "maxDistanceMeters": 100
}
```

## Check-In

### `POST /attendance/checkin`

Content type: `multipart/form-data`

Fields:

- `userId`
- `userName`
- `latitude`
- `longitude`
- `timestamp`
- `image`

Success response:

```json
{
  "message": "Check-in successful.",
  "distanceFromShop": 24.13,
  "attendance": {}
}
```

Error example:

```json
{
  "message": "You are not near the shop. Please move closer to mark attendance."
}
```

## Check-Out

### `POST /attendance/checkout`

Content type: `multipart/form-data`

Fields:

- `userId`
- `userName`
- `latitude`
- `longitude`
- `timestamp`
- `image`

Success response:

```json
{
  "message": "Check-out successful.",
  "distanceFromShop": 18.91,
  "attendance": {}
}
```

## Attendance History

### `GET /attendance/user/:userId`

Success response:

```json
[
  {
    "_id": "attendance-id",
    "userId": "EMP001",
    "userName": "Arun",
    "date": "2026-03-13",
    "checkInTime": "2026-03-13T08:30:00.000Z",
    "checkOutTime": "2026-03-13T17:45:00.000Z",
    "latitude": 9.9311,
    "longitude": 76.2674,
    "checkInImagePath": "/uploads/file-a.jpg",
    "checkOutImagePath": "/uploads/file-b.jpg"
  }
]
```
