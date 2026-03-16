export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const fetchAttendanceHistory = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/attendance/user/${userId}`);

  if (!response.ok) {
    throw new Error("Unable to load attendance history.");
  }

  return response.json();
};

export const fetchShopInfo = async () => {
  const response = await fetch(`${API_BASE_URL}/attendance/shop-info`);

  if (!response.ok) {
    throw new Error("Unable to load shop information.");
  }

  return response.json();
};

export const submitAttendanceRequest = async (action, formData) => {
  const response = await fetch(`${API_BASE_URL}/attendance/${action}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Attendance request failed.");
  }

  return data;
};
