// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"


import Home from "./pages/Home"

import Register from "./pages/student/Register"
import Login from "./pages/student/Login"
import StudentDashboard from "./pages/student/StudentDashboard"

import CoordinatorLogin from "./pages/coordinator/CoordinatorLogin"
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard"
import ApplicationReview from "./pages/coordinator/ApplicationReview"
import FinalDecisions from "./pages/coordinator/FinalDecisions"
import RejectionTracking from "./pages/coordinator/RejectionTracking"
import ReportingDashboard from "./pages/coordinator/ReportingDashboard"
import EvaluationTracking from "./pages/coordinator/EvaluationTracking"

import EmployerRegister from "./pages/employer/EmployerRegister"
import EmployerLogin from "./pages/employer/EmployerLogin"
import EmployerDashboard from "./pages/employer/EmployerDashboard"
import EvaluationForm from "./pages/employer/EvaluationForm"

import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* home */}
          <Route path="/" element={<Home />} />

          {/* student routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }/>

          {/* coordinator routes */}
          <Route path="/coordinator/login" element={<CoordinatorLogin />} />
          <Route path="/coordinator/dashboard" element={
            <ProtectedRoute role="coordinator">
              <CoordinatorDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/coordinator/review" element={
            <ProtectedRoute role="coordinator">
              <ApplicationReview />
            </ProtectedRoute>
          }/>
          <Route path="/coordinator/final" element={
            <ProtectedRoute role="coordinator">
              <FinalDecisions />
            </ProtectedRoute>
          }/>
          <Route path="/coordinator/rejections" element={
            <ProtectedRoute role="coordinator">
              <RejectionTracking />
            </ProtectedRoute>
          }/>
          <Route path="/coordinator/reporting" element={
            <ProtectedRoute role="coordinator">
              <ReportingDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/coordinator/evaluations" element={
            <ProtectedRoute role="coordinator">
              <EvaluationTracking />
            </ProtectedRoute>
          }/>

          {/* employer routes */}
          <Route path="/employer/register" element={<EmployerRegister />} />
          <Route path="/employer/login" element={<EmployerLogin />} />
          <Route path="/employer/dashboard" element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/employer/evaluation" element={
            <ProtectedRoute role="employer">
              <EvaluationForm />
            </ProtectedRoute>
          }/>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App