import { useNavigate } from "react-router-dom"
import "./Home.css"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <h1 className="home-title">Co-op Application Portal</h1>
      <p className="home-subtitle">Select your role to continue</p>

      <div className="home-cards">

        <div className="home-card">
          <div className="home-icon blue-icon">🎓</div>
          <h2>Student</h2>
          <p>Apply for co-op positions and track your application</p>
          <button className="btn-outline" onClick={() => navigate("/register")}>Register</button>
          <button className="btn-solid" onClick={() => navigate("/login")}>Login</button>
        </div>

        <div className="home-card home-card-yellow">
          <div className="home-icon yellow-icon">👥</div>
          <h2>Coordinator</h2>
          <p>Review applications and manage the co-op program</p>
          <button className="btn-yellow" onClick={() => navigate("/coordinator/login")}>Login</button>
        </div>

        <div className="home-card">
          <div className="home-icon blue-icon">🏢</div>
          <h2>Employer</h2>
          <p>Submit evaluations for co-op students</p>
          <button className="btn-outline" onClick={() => navigate("/employer/register")}>Register</button>
          <button className="btn-solid" onClick={() => navigate("/employer/login")}>Login</button>
        </div>

      </div>
    </div>
  )
}