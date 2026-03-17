import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const fetchAttendanceHistory = async (userId) => {
  const { data } = await api.get(`/attendance/user/${userId}`);
  return data;
};

export const fetchShopInfo = async () => {
  const { data } = await api.get("/attendance/shop-info");
  return data;
};

export const submitAttendanceRequest = async (action, formData) => {
  try {
    const { data } = await api.post(`/attendance/${action}`, formData);
    return data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Attendance request failed."
    );
  }
};
