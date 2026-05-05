// services/authService.js

import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const signup = (data) => {
  return axios.post(`${API}/signup`, data);
};

export const login = (data) => {
  return axios.post(`${API}/login`, data);
};