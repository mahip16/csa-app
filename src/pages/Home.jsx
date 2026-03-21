import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div>
      <h1>Welcome to the Co-op Support Application</h1>
      <p>Please select who you are</p>

      <button onClick={() => navigate("/register")}>
        Student
      </button>

      <button onClick={() => navigate("/coordinator/login")}>
        Coordinator
      </button>

      <button onClick={() => navigate("/employer/login")}>
        Employer
      </button>
    </div>
  )
}