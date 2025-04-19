import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore"

// Update the LaundryOrder interface to include the bagCode field
export interface LaundryOrder {
  id?: string
  userId: string
  userEmail?: string
  items: number
  status: "pending" | "processing" | "ready" | "completed"
  createdAt: Timestamp
  updatedAt: Timestamp
  completedAt?: Timestamp
  estimatedCompletionTime?: Timestamp
  progress?: number
  notes?: string
  cost?: number
  clothItems?: ClothItems
  bagCode?: string // Add this new field for the 4-digit laundry bag code
}

export interface ClothItems {
  tshirt: number
  trousers: number
  bedsheet: number
  shirt: number
  pillowcover: number
  kurti: number
  other: number
  [key: string]: number
}

export const getUserOrders = async (userId: string): Promise<LaundryOrder[]> => {
  try {
    const q = query(collection(db, "laundryOrders"), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    // Sort in memory instead of using orderBy in the query
    const orders = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LaundryOrder)

    // Sort by createdAt in descending order
    return orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  } catch (error) {
    console.error("Error getting user orders:", error)
    return [] // Return empty array instead of throwing
  }
}

export const getAllOrders = async (): Promise<LaundryOrder[]> => {
  try {
    // Simple query without orderBy to avoid index requirements
    const q = query(collection(db, "laundryOrders"))
    const querySnapshot = await getDocs(q)

    const orders = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as LaundryOrder)

    // Sort in memory
    return orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
  } catch (error) {
    console.error("Error getting all orders:", error)
    return [] // Return empty array instead of throwing
  }
}

export const getOrderById = async (orderId: string): Promise<LaundryOrder | null> => {
  try {
    const docRef = doc(db, "laundryOrders", orderId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LaundryOrder
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting order:", error)
    return null // Return null instead of throwing
  }
}

export const getCurrentOrder = async (userId: string): Promise<LaundryOrder | null> => {
  try {
    // Simplest possible query - just filter by userId
    const q = query(collection(db, "laundryOrders"), where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    // Convert to array of orders
    const orders = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LaundryOrder,
    )

    // Filter for active orders
    const activeStatuses = ["pending", "processing", "ready"]
    const activeOrders = orders.filter((order) => activeStatuses.includes(order.status))

    if (activeOrders.length === 0) {
      return null
    }

    // Sort by createdAt in descending order and return the most recent
    activeOrders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    return activeOrders[0]
  } catch (error) {
    console.error("Error getting current order:", error)
    return null // Return null instead of throwing
  }
}

export const createOrder = async (order: Omit<LaundryOrder, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "laundryOrders"), {
      ...order,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating order:", error)
    throw error
  }
}

export const updateOrder = async (
  orderId: string,
  updates: Partial<Omit<LaundryOrder, "id" | "createdAt" | "updatedAt">>,
): Promise<void> => {
  try {
    const orderRef = doc(db, "laundryOrders", orderId)

    await updateDoc(orderRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      // If status is completed and completedAt is not provided, set it
      ...(updates.status === "completed" && !updates.completedAt ? { completedAt: Timestamp.now() } : {}),
    })
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

export const updateOrderProgress = async (orderId: string, progress: number): Promise<void> => {
  try {
    const orderRef = doc(db, "laundryOrders", orderId)

    await updateDoc(orderRef, {
      progress,
      updatedAt: Timestamp.now(),
      // If progress is 100%, update status to ready
      ...(progress >= 100 ? { status: "ready" } : {}),
    })
  } catch (error) {
    console.error("Error updating order progress:", error)
    throw error
  }
}

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "laundryOrders", orderId))
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

// Function to search users by email
export const searchUsersByEmail = async (email: string): Promise<any[]> => {
  try {
    if (!email || email.trim() === "") return []

    const q = query(collection(db, "users"), where("email", ">=", email), where("email", "<=", email + "\uf8ff"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error searching users:", error)
    return [] // Return empty array instead of throwing
  }
}

// Function to get all users
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const q = query(collection(db, "users"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting all users:", error)
    return [] // Return empty array instead of throwing
  }
}

