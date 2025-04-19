"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Plus, Minus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createOrder, searchUsersByEmail, getAllUsers, type ClothItems } from "@/lib/laundry-service"
import { Timestamp } from "firebase/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function NewOrderPage() {
  const router = useRouter()
  const { user, loading, isAdmin } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchEmail, setSearchEmail] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [clothItems, setClothItems] = useState<ClothItems>({
    tshirt: 0,
    trousers: 0,
    bedsheet: 0,
    shirt: 0,
    pillowcover: 0,
    kurti: 0,
    other: 0,
  })
  const [formData, setFormData] = useState({
    status: "pending",
    notes: "",
    cost: 0,
    bagCode: "", // Add this new field
  })

  // Add a function to generate a random 4-digit code
  const generateRandomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // Add a function to handle generating a new code
  const handleGenerateCode = () => {
    setFormData((prev) => ({
      ...prev,
      bagCode: generateRandomCode(),
    }))
  }

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [loading, user, isAdmin, router, toast])

  // Load all users for dropdown
  useEffect(() => {
    const loadUsers = async () => {
      if (!user || !isAdmin) return

      try {
        const users = await getAllUsers()
        setAllUsers(users)
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        })
      }
    }

    loadUsers()
  }, [user, isAdmin, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "cost" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchEmail(e.target.value)
  }

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const results = await searchUsersByEmail(searchEmail.trim())
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const selectUser = (user: any) => {
    setSelectedUser(user)
    setSearchEmail(user.email)
    setSearchResults([])
  }

  const handleClothItemChange = (type: keyof ClothItems, increment: boolean) => {
    setClothItems((prev) => ({
      ...prev,
      [type]: increment ? prev[type] + 1 : Math.max(0, prev[type] - 1),
    }))
  }

  // Calculate total items
  const totalItems = Object.values(clothItems).reduce((sum, count) => sum + count, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create orders.",
        variant: "destructive",
      })
      return
    }

    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user for this order.",
        variant: "destructive",
      })
      return
    }

    if (totalItems === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the order.",
        variant: "destructive",
      })
      return
    }

    // Show confirmation dialog
    setShowConfirmation(true)
  }

  const confirmOrder = async () => {
    setIsSubmitting(true)
    try {
      const estimatedCompletionTime = new Date()
      estimatedCompletionTime.setHours(estimatedCompletionTime.getHours() + 24) // 24 hours from now

      await createOrder({
        ...formData,
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        items: totalItems,
        status: formData.status as "pending" | "processing" | "ready" | "completed",
        progress:
          formData.status === "pending"
            ? 0
            : formData.status === "processing"
              ? 50
              : formData.status === "ready"
                ? 100
                : undefined,
        estimatedCompletionTime: Timestamp.fromDate(estimatedCompletionTime),
        clothItems,
        bagCode: formData.bagCode, // Include the bag code
      })

      toast({
        title: "Order Created",
        description: "The laundry order has been created successfully.",
      })

      // Redirect to orders page
      router.push("/admin?tab=orders")
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowConfirmation(false)
    }
  }

  // If loading or not admin, show loading state
  if (loading || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 backdrop-blur-sm px-4">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/admin?tab=orders">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-medium text-primary">Create New Order</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-2xl">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>New Laundry Order</CardTitle>
              <CardDescription>Create a new laundry order for a customer</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Search Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">1. Select Customer</h3>
                  <div className="space-y-2">
                    <Label htmlFor="userEmail">Search by Email</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="userEmail"
                          type="email"
                          placeholder="customer@example.com"
                          className="premium-input"
                          value={searchEmail}
                          onChange={handleSearchChange}
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                            <ul className="max-h-60 overflow-auto py-1">
                              {searchResults.map((result) => (
                                <li
                                  key={result.id}
                                  className="cursor-pointer px-4 py-2 hover:bg-muted"
                                  onClick={() => selectUser(result)}
                                >
                                  <div className="font-medium">{result.fullName || "User"}</div>
                                  <div className="text-sm text-muted-foreground">{result.email}</div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="shrink-0"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>

                  {selectedUser ? (
                    <div className="rounded-md bg-muted p-3">
                      <div className="font-medium">{selectedUser.fullName || "User"}</div>
                      <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                      {selectedUser.studentId && (
                        <div className="text-sm text-muted-foreground">ID: {selectedUser.studentId}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">Or select from registered users:</p>
                      <div className="mt-2 flex flex-wrap gap-2 justify-center">
                        {allUsers.slice(0, 5).map((user) => (
                          <Button
                            key={user.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectUser(user)}
                            className="text-xs"
                          >
                            {user.email}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cloth Items Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">2. Select Items</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(clothItems).map((type) => (
                      <div key={type} className="flex items-center justify-between rounded-md border p-3">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleClothItemChange(type as keyof ClothItems, false)}
                            disabled={clothItems[type as keyof ClothItems] === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{clothItems[type as keyof ClothItems]}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleClothItemChange(type as keyof ClothItems, true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Items:</span>
                    <span>{totalItems}</span>
                  </div>
                </div>

                {/* Order Details Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">3. Order Details</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                        required
                      >
                        <SelectTrigger id="status" className="premium-input">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        className="premium-input"
                        value={formData.cost}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="bagCode">Laundry Bag Code</Label>
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateCode}>
                        Generate Code
                      </Button>
                    </div>
                    <Input
                      id="bagCode"
                      placeholder="4-digit code for laundry bag"
                      className="premium-input"
                      value={formData.bagCode}
                      onChange={handleChange}
                      maxLength={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This code will be used to identify the customer's laundry bag
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions or notes about this order"
                      rows={3}
                      className="premium-input"
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {!selectedUser && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>User Required</AlertTitle>
                    <AlertDescription>You must select a user before creating an order.</AlertDescription>
                  </Alert>
                )}

                {totalItems === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Items Required</AlertTitle>
                    <AlertDescription>You must add at least one item to the order.</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full premium-button"
                  disabled={isSubmitting || !selectedUser || totalItems === 0}
                >
                  {isSubmitting ? "Creating Order..." : "Create Order"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col text-sm text-muted-foreground">
              <p>
                This will create a new laundry order for the specified user. The user will be able to see this order in
                their dashboard.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Creation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create a new order for {selectedUser?.email} with {totalItems} items.
              <div className="mt-4 space-y-2">
                <p className="font-medium">Order Details:</p>
                <ul className="space-y-1 text-sm">
                  {Object.entries(clothItems)
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <li key={type} className="flex justify-between">
                        <span className="capitalize">{type}:</span>
                        <span>{count}</span>
                      </li>
                    ))}
                </ul>
                <p className="mt-2">
                  <span className="font-medium">Status:</span> {formData.status}
                </p>
                <p>
                  <span className="font-medium">Cost:</span> ${formData.cost}
                </p>
                <p>
                  <span className="font-medium">Bag Code:</span> {formData.bagCode || "Not set"}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOrder} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

