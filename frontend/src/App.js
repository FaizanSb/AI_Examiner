import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Evaluate from './pages/Evaluate';
import EvaluateBatch from './pages/EvaluateBatch';
import Results from './pages/Results';
import Management from './pages/Management';
import EvaluationHistory from './pages/EvaluationHistory';
import ProtectedRoute from './utils/ProtectedRoute'; // ✅ added
import Login from './pages/login';    // 👈 add karo
import Signup from './pages/Signup';  // 👈 add karo
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const setAppLoading = (isLoading, message = '') => {
    setLoading(isLoading);
    setLoadingMessage(message);
  };

  return (
    <Router>
      <div className="App">
        <Navigation />
        {loading && (
          <div className="app-loading-overlay">
            <div className="app-loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-message">{loadingMessage || 'Processing...'}</p>
            </div>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />

          {/* ✅ Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard setLoading={setAppLoading} /></ProtectedRoute>
          } />
          <Route path="/evaluate" element={
            <ProtectedRoute><Evaluate setLoading={setAppLoading} /></ProtectedRoute>
          } />
          <Route path="/EvaluateBatch" element={
            <ProtectedRoute><EvaluateBatch setLoading={setAppLoading} /></ProtectedRoute>
          } />
          <Route path="/results/:evaluationId" element={
            <ProtectedRoute><Results /></ProtectedRoute>
          } />
          <Route path="/management" element={
            <ProtectedRoute><Management setLoading={setAppLoading} /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><EvaluationHistory setLoading={setAppLoading} /></ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;