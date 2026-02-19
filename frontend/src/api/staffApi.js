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
