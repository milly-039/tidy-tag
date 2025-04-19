"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface UserData {
  email: string
  fullName: string
  studentId: string
  createdAt: string
  isAdmin?: boolean
  contactInfo?: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, studentId: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  error: string | null
  isAdmin: boolean
  grantAdminAccess: (userId: string) => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  logout: async () => {},
  error: null,
  isAdmin: false,
  grantAdminAccess: async () => {},
  updateUserData: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData
            setUserData(data)
            setIsAdmin(!!data.isAdmin)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, studentId: string) => {
    try {
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      })

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        fullName,
        studentId,
        createdAt: new Date().toISOString(),
        isAdmin: false, // Default to regular user
        contactInfo: email, // Default contact info is email
      })

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const grantAdminAccess = async (userId: string) => {
    try {
      if (!isAdmin) {
        throw new Error("Only admins can grant admin access")
      }

      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        isAdmin: true,
      })

      return
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateUserData = async (data: Partial<UserData>) => {
    try {
      if (!user) throw new Error("No user logged in")

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, data)

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          ...data,
        })
      }

      return
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signUp,
        signIn,
        logout,
        error,
        isAdmin,
        grantAdminAccess,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

