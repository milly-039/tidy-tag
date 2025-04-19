import { db, storage } from "@/lib/firebase"
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
  deleteDoc,
  updateDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

export interface LostItem {
  id?: string
  itemType: string
  color: string
  brand: string
  description: string
  lastSeen: string
  orderId?: string
  imageUrl?: string
  reportedBy: string
  reportedAt: Timestamp
  status: "reported" | "found" | "claimed"
}

export const reportLostItem = async (
  item: Omit<LostItem, "id" | "reportedAt" | "status">,
  imageFile?: File,
): Promise<string> => {
  try {
    let imageUrl = undefined

    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(storage, `lost-items/${Date.now()}-${imageFile.name}`)
      await uploadBytes(storageRef, imageFile)
      imageUrl = await getDownloadURL(storageRef)
    }

    // Add document to Firestore
    const docRef = await addDoc(collection(db, "lostItems"), {
      ...item,
      imageUrl,
      reportedAt: Timestamp.now(),
      status: "reported",
    })

    return docRef.id
  } catch (error) {
    console.error("Error reporting lost item:", error)
    throw error
  }
}

export const getLostItems = async (userId?: string): Promise<LostItem[]> => {
  try {
    let q = query(collection(db, "lostItems"), orderBy("reportedAt", "desc"))

    // If userId is provided, filter by user
    if (userId) {
      q = query(collection(db, "lostItems"), where("reportedBy", "==", userId), orderBy("reportedAt", "desc"))
    }

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as LostItem,
    )
  } catch (error) {
    console.error("Error getting lost items:", error)
    throw error
  }
}

export const searchLostItems = async (searchTerm: string): Promise<LostItem[]> => {
  try {
    // Get all items (in a real app, you'd use a proper search index)
    const items = await getLostItems()

    // Filter items client-side (not ideal for large datasets)
    const lowerSearchTerm = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        item.itemType.toLowerCase().includes(lowerSearchTerm) ||
        item.color.toLowerCase().includes(lowerSearchTerm) ||
        item.brand.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm),
    )
  } catch (error) {
    console.error("Error searching lost items:", error)
    throw error
  }
}

export const getLostItemById = async (id: string): Promise<LostItem | null> => {
  try {
    const docRef = doc(db, "lostItems", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LostItem
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting lost item:", error)
    throw error
  }
}

export const getUserById = async (userId: string): Promise<any | null> => {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user:", error)
    throw error
  }
}

export const deleteLostItem = async (id: string, imageUrl?: string): Promise<void> => {
  try {
    // Delete the image from storage if it exists
    if (imageUrl) {
      try {
        // Extract the path from the URL
        const imagePath = imageUrl.split("firebase:")[1]
        if (imagePath) {
          const imageRef = ref(storage, imagePath)
          await deleteObject(imageRef)
        }
      } catch (imageError) {
        console.error("Error deleting image:", imageError)
        // Continue with document deletion even if image deletion fails
      }
    }

    // Delete the document from Firestore
    await deleteDoc(doc(db, "lostItems", id))
  } catch (error) {
    console.error("Error deleting lost item:", error)
    throw error
  }
}

export const updateLostItemStatus = async (id: string, status: "reported" | "found" | "claimed"): Promise<void> => {
  try {
    const itemRef = doc(db, "lostItems", id)
    await updateDoc(itemRef, {
      status,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating lost item status:", error)
    throw error
  }
}

