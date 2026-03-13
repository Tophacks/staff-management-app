import axios from "axios";

const API = "http://localhost:5000";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getStaff = () =>
  axios.get(`${API}/staff`, { headers: getAuthHeader() });

export const addStaff = (staff) =>
  axios.post(`${API}/staff`, staff, { headers: getAuthHeader() });

export const deleteStaff = (id) =>
  axios.delete(`${API}/staff/${id}`, { headers: getAuthHeader() });

export const login = (email, password) =>
  axios.post(`${API}/auth/login`, { email, password });

export const getHours = (params = {}) =>
  axios.get(`${API}/hours`, { params, headers: getAuthHeader() });

export const addHours = (entry) =>
  axios.post(`${API}/hours`, entry, { headers: getAuthHeader() });

export const patchHours = (id, status) =>
  axios.patch(`${API}/hours/${id}`, { status }, { headers: getAuthHeader() });

export const getHoursMe = (params = {}) =>
  axios.get(`${API}/hours/me`, { params, headers: getAuthHeader() });

export const addHoursMe = (entry) =>
  axios.post(`${API}/hours/me`, entry, { headers: getAuthHeader() });

export const getAIInsights = () =>
  axios.get(`${API}/api/ai/insights`, { headers: getAuthHeader() });

export const getShifts = (params = {}) =>
  axios.get(`${API}/shifts`, { params, headers: getAuthHeader() });

export const addShift = (shift) =>
  axios.post(`${API}/shifts`, shift, { headers: getAuthHeader() });

export const updateShift = (id, data) =>
  axios.patch(`${API}/shifts/${id}`, data, { headers: getAuthHeader() });

export const deleteShift = (id) =>
  axios.delete(`${API}/shifts/${id}`, { headers: getAuthHeader() });

export const getEmployeeProfile = (id) =>
  axios.get(`${API}/api/employees/${id}/profile`, { headers: getAuthHeader() });

export const updateEmployeeProfile = (id, data) =>
  axios.put(`${API}/api/employees/${id}/profile`, data, { headers: getAuthHeader() });

export const uploadEmployeeDocument = (id, formData) =>
  axios.post(`${API}/api/employees/${id}/documents`, formData, {
    headers: { ...getAuthHeader(), "Content-Type": "multipart/form-data" },
  });

export const getEmployeeDocuments = (id) =>
  axios.get(`${API}/api/employees/${id}/documents`, { headers: getAuthHeader() });

export const deleteEmployeeDocument = (id, docId) =>
  axios.delete(`${API}/api/employees/${id}/documents/${docId}`, { headers: getAuthHeader() });

export const getAnnouncements = () =>
  axios.get(`${API}/api/announcements`, { headers: getAuthHeader() });

export const createAnnouncement = (announcement) =>
  axios.post(`${API}/api/announcements`, announcement, { headers: getAuthHeader() });

export const getNotifications = () =>
  axios.get(`${API}/api/notifications`, { headers: getAuthHeader() });

export const markNotificationRead = (id) =>
  axios.put(`${API}/api/notifications/${id}/read`, {}, { headers: getAuthHeader() });
