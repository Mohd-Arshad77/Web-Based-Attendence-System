import { Attendance } from "../models/Attendance.js";
import { MAX_DISTANCE_METERS, SHOP_LOCATION } from "../config/constants.js";
import { calculateDistanceInMeters } from "../utils/distance.js";

const buildImagePath = (file) => (file ? `/uploads/${file.filename}` : null);

const getBaseUrl = (request) => `${request.protocol}://${request.get("host")}`;

const buildImageUrl = (request, imagePath) =>
  imagePath ? `${getBaseUrl(request)}${imagePath}` : null;

const serializeAttendance = (request, attendance) => {
  const attendanceObject =
    typeof attendance.toObject === "function" ? attendance.toObject() : attendance;

  return {
    ...attendanceObject,
    checkInImagePath: buildImageUrl(request, attendanceObject.checkInImagePath),
    checkOutImagePath: buildImageUrl(request, attendanceObject.checkOutImagePath),
  };
};

const normalizeCoordinates = (latitude, longitude) => {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
    throw new Error("Latitude and longitude must be valid numbers.");
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
};

const getAttendanceDate = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid timestamp provided.");
  }

  return date.toISOString().split("T")[0];
};

const validateDistance = (coordinates) => {
  const distance = calculateDistanceInMeters(coordinates, SHOP_LOCATION);

  if (distance > MAX_DISTANCE_METERS) {
    const error = new Error("You are not near the shop. Please move closer to check.");
    error.statusCode = 400;
    throw error;
  }

  return distance;
};

const validateAttendanceRequest = (request) => {
  const { userId, userName, latitude, longitude, timestamp } = request.body;

  if (!userId || !userName || !timestamp || !request.file) {
    const error = new Error("userId, userName, timestamp, and selfie image are required.");
    error.statusCode = 400;
    throw error;
  }

  const coordinates = normalizeCoordinates(latitude, longitude);
  const distanceFromShop = validateDistance(coordinates);
  const date = getAttendanceDate(timestamp);

  return {
    userId,
    userName,
    timestamp,
    coordinates,
    distanceFromShop,
    date,
  };
};

export const checkIn = async (request, response, next) => {
  try {
    const { userId, userName, timestamp, coordinates, distanceFromShop, date } =
      validateAttendanceRequest(request);

    const existingAttendance = await Attendance.findOne({ userId, date });

    if (existingAttendance?.checkInTime) {
      return response.status(409).json({
        message: "Check-in already exists for this user today.",
      });
    }

    const attendance =
      existingAttendance ||
      new Attendance({
        userId,
        userName,
        date,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

    attendance.userName = userName;
    attendance.latitude = coordinates.latitude;
    attendance.longitude = coordinates.longitude;
    attendance.checkInTime = new Date(timestamp);
    attendance.checkInImagePath = buildImagePath(request.file);

    await attendance.save();

    return response.status(201).json({
      message: "Check-in successful.",
      distanceFromShop: Number(distanceFromShop.toFixed(2)),
      attendance: serializeAttendance(request, attendance),
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (request, response, next) => {
  try {
    const { userId, userName, timestamp, coordinates, distanceFromShop, date } =
      validateAttendanceRequest(request);

    const attendance = await Attendance.findOne({ userId, date });

    if (!attendance?.checkInTime) {
      return response.status(404).json({
        message: "No check-in found for this user today.",
      });
    }

    if (attendance.checkOutTime) {
      return response.status(409).json({
        message: "Check-out already exists for this user today.",
      });
    }

    attendance.userName = userName;
    attendance.latitude = coordinates.latitude;
    attendance.longitude = coordinates.longitude;
    attendance.checkOutTime = new Date(timestamp);
    attendance.checkOutImagePath = buildImagePath(request.file);

    await attendance.save();

    return response.status(200).json({
      message: "Check-out successful.",
      distanceFromShop: Number(distanceFromShop.toFixed(2)),
      attendance: serializeAttendance(request, attendance),
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceHistory = async (request, response, next) => {
  try {
    const { userId } = request.params;

    const attendanceHistory = await Attendance.find({ userId }).sort({
      date: -1,
      createdAt: -1,
    });

    return response
      .status(200)
      .json(attendanceHistory.map((attendance) => serializeAttendance(request, attendance)));
  } catch (error) {
    next(error);
  }
};

export const getShopInfo = (_request, response) => {
  response.status(200).json({
    shopLocation: SHOP_LOCATION,
    maxDistanceMeters: MAX_DISTANCE_METERS,
  });
};
