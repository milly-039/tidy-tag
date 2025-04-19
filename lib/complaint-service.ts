import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"

export interface Complaint {
  id?: string
  issueType: string
  description: string
  orderId?: string
  submittedBy: string
  submittedAt: Timestamp
  status: "submitted" | "in-progress" | "resolved"
  response?: string
  resolvedAt?: Timestamp
}

export const submitComplaint = async (complaint: Omit<Complaint, "id" | "submittedAt" | "status">): Promise<string> => {
  try {
    // Add document to Firestore
    const docRef = await addDoc(collection(db, "complaints"), {
      ...complaint,
      submittedAt: Timestamp.now(),
      status: "submitted",
    })

    return docRef.id
  } catch (error) {
    console.error("Error submitting complaint:", error)
    throw error
  }
}

export const getUserComplaints = async (userId: string): Promise<Complaint[]> => {
  try {
    const q = query(collection(db, "complaints"), where("submittedBy", "==", userId), orderBy("submittedAt", "desc"))

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Complaint,
    )
  } catch (error) {
    console.error("Error getting user complaints:", error)
    throw error
  }
}

export const getAllComplaints = async (): Promise<Complaint[]> => {
  try {
    const q = query(collection(db, "complaints"), orderBy("submittedAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Complaint,
    )
  } catch (error) {
    console.error("Error getting all complaints:", error)
    throw error
  }
}

export const getComplaintById = async (id: string): Promise<Complaint | null> => {
  try {
    const docRef = doc(db, "complaints", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Complaint
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting complaint:", error)
    throw error
  }
}

export const updateComplaintStatus = async (
  id: string,
  status: "submitted" | "in-progress" | "resolved",
  response?: string,
): Promise<void> => {
  try {
    const complaintRef = doc(db, "complaints", id)

    const updates: any = {
      status,
      updatedAt: Timestamp.now(),
    }

    if (response) {
      updates.response = response
    }

    if (status === "resolved") {
      updates.resolvedAt = Timestamp.now()
    }

    await updateDoc(complaintRef, updates)
  } catch (error) {
    console.error("Error updating complaint status:", error)
    throw error
  }
}

export const deleteComplaint = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "complaints", id))
  } catch (error) {
    console.error("Error deleting complaint:", error)
    throw error
  }
}

