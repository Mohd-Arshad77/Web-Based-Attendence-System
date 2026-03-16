# Database Schema

## Collection: `attendances`

```js
{
  userId: String,
  userName: String,
  date: String, // YYYY-MM-DD
  checkInTime: Date | null,
  checkOutTime: Date | null,
  latitude: Number,
  longitude: Number,
  checkInImagePath: String | null,
  checkOutImagePath: String | null,
  createdAt: Date,
  updatedAt: Date
}
```

## Constraints

- Unique index on `userId + date`
- One attendance document per user per day
- Prevents multiple check-ins for the same date

## Notes

- `checkOutTime` stays `null` until the employee checks out.
- Latest latitude and longitude are stored on the attendance record.
- Selfie paths are stored as relative file URLs served from `/uploads`.
