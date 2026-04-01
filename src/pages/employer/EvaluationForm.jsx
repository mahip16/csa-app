// =============================
// FOLDER STRUCTURE
// =============================
// src/
// ├── components/
// │   ├── Navbar.jsx
// ├── context/
// │   └── AuthContext.jsx
// ├── pages/
// │   ├── Home.jsx
// │   ├── Login.jsx
// │   ├── Register.jsx
// │   ├── Dashboard.jsx
// │   └── EvaluationForm.jsx
// ├── routes/
// │   └── AppRoutes.jsx
// ├── App.jsx
// └── main.jsx


// =============================
// AuthContext.jsx
// =============================
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


// =============================
// Placeholder Pages
// =============================

// Home.jsx
export const Home = () => <h1>Home Page</h1>;

// Login.jsx
export const Login = () => <h1>Login Page</h1>;

// Register.jsx
export const Register = () => <h1>Register Page</h1>;

// Dashboard.jsx
export const Dashboard = () => <h1>Dashboard Page</h1>;

// =============================
// EvaluationForm.jsx (styled like EmployerRegister)
// =============================
import { useState } from "react";

export const EvaluationForm = () => {
  const [studentName, setStudentName] = useState("");
  const [performance, setPerformance] = useState("");
  const [comments, setComments] = useState("");
  const [focused, setFocused] = useState("");

  const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)';

  const inputStyle = (name) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.7rem 1rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: '#0f1f4b',
    backgroundColor: '#f8fafc',
    border: `1.5px solid ${focused === name ? '#3b4fa8' : '#dde3ed'}`,
    borderRadius: '8px',
    outline: 'none',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ studentName, performance, comments });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          border: '2px solid #3b4fa8',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
        }}
      >
        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f1f4b', marginBottom: '0.3rem' }}>
          Evaluation Form
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.75rem' }}>
          Submit a student evaluation
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>
              Student Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onFocus={() => setFocused('studentName')}
              onBlur={() => setFocused('')}
              style={inputStyle('studentName')}
              placeholder="Enter student name"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>
              Performance Rating
            </label>
            <input
              type="text"
              value={performance}
              onChange={(e) => setPerformance(e.target.value)}
              onFocus={() => setFocused('performance')}
              onBlur={() => setFocused('')}
              style={inputStyle('performance')}
              placeholder="e.g. Excellent / Good / Needs Improvement"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onFocus={() => setFocused('comments')}
              onBlur={() => setFocused('')}
              style={{ ...inputStyle('comments'), minHeight: '80px' }}
              placeholder="Write your evaluation..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={!studentName || !performance}
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: !studentName || !performance ? '#9baee0' : '#3b4fa8',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: !studentName || !performance ? 'not-allowed' : 'pointer',
            }}
          >
            Submit Evaluation
          </button>
        </form>
      </div>
    </div>
  );
};


// =============================
// Navbar.jsx (basic)
// =============================
import { Link } from "react-router-dom";

export const Navbar = () => (
  <nav>
    <Link to="/">Home</Link> | 
    <Link to="/dashboard">Dashboard</Link> | 
    <Link to="/evaluation">Evaluation</Link> | 
    <Link to="/login">Login</Link>
  </nav>
);


// =============================
// AppRoutes.jsx
// =============================
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, Login, Register, Dashboard, EvaluationForm } from "../pages";

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/evaluation"
        element={
          <PrivateRoute>
            <EvaluationForm />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};


// =============================
// App.jsx
// =============================
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


// =============================
// main.jsx
// =============================
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
