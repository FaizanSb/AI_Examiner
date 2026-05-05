import axios from 'axios';
import { getToken } from '../utils/auth'; 

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes - Gemini vision is much faster than EasyOCR
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Teacher APIs
export const createTeacher = async (name, email, subject) => {
  const response = await api.post('/teachers', { name, email, subject }, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const getTeacher = async (teacherId) => {
  const response = await api.get(`/teachers/${teacherId}`);
  return response.data;
};

export const getAllTeachers = async () => {
  const response = await api.get('/teachers');
  return response.data;
};

export const deleteTeacher = async (teacherId) => {
  const response = await api.delete(`/teachers/${teacherId}`);
  return response.data;
};

// Student APIs
export const createStudent = async (name, email, rollNumber, className) => {
  const response = await api.post('/students', { 
    name, 
    email, 
    roll_number: rollNumber, 
    class: className 
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const getStudent = async (studentId) => {
  const response = await api.get(`/students/${studentId}`);
  return response.data;
};

export const getAllStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const deleteStudent = async (studentId) => {
  const response = await api.delete(`/students/${studentId}`);
  return response.data;
};

export const getStudentStatistics = async (studentId) => {
  const response = await api.get(`/students/${studentId}/statistics`);
  return response.data;
};

// Evaluation APIs
export const uploadModelAnswer = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload-model-answer', formData);
  return response.data;
};

export const evaluateAnswer = async (formDataOrFile, modelAnswer, maxMarks, question = '', studentId = null) => {
  let formData;

  if (formDataOrFile instanceof FormData) {
    formData = formDataOrFile;
  } else {
    formData = new FormData();
    formData.append('student_file', formDataOrFile);
    formData.append('model_answer', modelAnswer);
    formData.append('max_marks', maxMarks);
    if (question) formData.append('question', question);
    if (studentId) formData.append('student_id', studentId);
    // ✅ teacher_id hata di — backend token se lega
  }

  const response = await api.post('/evaluate-answer', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getEvaluation = async (evaluationId) => {
  const response = await api.get(`/evaluations/${evaluationId}`);
  return response.data;
};

export const getEvaluations = async () => {
  const response = await api.get('/evaluations');
  return response.data;
};

export const getStudentEvaluations = async (studentId, limit = 10) => {
  const response = await api.get(`/evaluations/student/${studentId}?limit=${limit}`);
  return response.data;
};

// ✅ Naya — token se automatically pata chalega
export const getTeacherEvaluations = async (limit = 10) => {
  const response = await api.get(`/evaluations/teacher?limit=${limit}`);
  return response.data;
};


export const getRecentEvaluations = async (limit = 20) => {
  const response = await api.get(`/evaluations/recent?limit=${limit}`);
  return response.data;
};

export const deleteEvaluation = async (evaluationId) => {
  const response = await api.delete(`/evaluations/${evaluationId}`);
  return response.data;
};

export const extractTextOnly = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/ocr-only', formData);
  return response.data;
};

export default api;
