/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/firebase"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const register = async (email, password, name, studentId) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid
    await setDoc(doc(db, "users", uid), {
      name, studentId, email, role: "student", createdAt: new Date()
    })
    await setDoc(doc(db, "applications", uid), {
      name, studentId, email, status: "pending", submittedAt: new Date()
    })
  }

  const registerEmployer = async (email, password, name, company) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const uid = userCredential.user.uid
    await setDoc(doc(db, "users", uid), {
      name, company, email, role: "employer", createdAt: new Date()
    })
  }

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const logout = () => {
    return signOut(auth)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid))
        if (docSnap.exists()) {
          setRole(docSnap.data().role)
        }
      } else {
        setRole(null)
      }
      setCurrentUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, role, register, registerEmployer, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}