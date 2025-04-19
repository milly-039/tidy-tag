"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getOrderById, updateOrder, type LaundryOrder } from "@/lib/laundry-service"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

export default function ManageOrderPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading, isAdmin } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<LaundryOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    status: "",
    progress: 0,
    notes: "",
    bagCode: "", // Add this new field
  })

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

  // Load order data
  useEffect(() => {
    const loadOrderData = async () => {
      if (!user || !isAdmin || !params.id) return

      setIsLoading(true)
      try {
        const orderId = params.id as string
        const orderData = await getOrderById(orderId)

        if (orderData) {
          setOrder(orderData)
          setFormData({
            status: orderData.status,
            progress: orderData.progress || 0,
            notes: orderData.notes || "",
            bagCode: orderData.bagCode || "", // Add this line
          })
        } else {
          toast({
            title: "Order Not Found",
            description: "The requested order could not be found.",
            variant: "destructive",
          })
          router.push("/admin?tab=orders")
        }
      } catch (error) {
        console.error("Error loading order data:", error)
        toast({
          title: "Error",
          description: "Failed to load order data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrderData()
  }, [user, isAdmin, params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: id === "progress" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // If status changes to completed, set progress to 100
    if (field === "status" && value === "completed") {
      setFormData((prev) => ({ ...prev, progress: 100 }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!order || !order.id) return

    setIsUpdating(true)
    try {
      await updateOrder(order.id, {
        status: formData.status as "pending" | "processing" | "ready" | "completed",
        progress: formData.progress,
        notes: formData.notes,
        bagCode: formData.bagCode, // Add this line
      })

      toast({
        title: "Order Updated",
        description: "The order has been updated successfully.",
      })

      // Update local state
      setOrder((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: formData.status as "pending" | "processing" | "ready" | "completed",
          progress: formData.progress,
          notes: formData.notes,
          bagCode: formData.bagCode, // Add this line
        }
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // If loading or not admin, show loading state
  if (loading || !user || !isAdmin || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium">Order Not Found</p>
          <p className="mt-2 text-muted-foreground">The requested order could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/admin?tab=orders">Back to Orders</Link>
          </Button>
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
        <h1 className="text-lg font-medium text-primary">Manage Order #{order.id?.substring(0, 6)}</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>View order information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge
                    className={`
                      ${order.status === "pending" ? "status-badge-pending" : ""}
                      ${order.status === "processing" ? "status-badge-processing" : ""}
                      ${order.status === "ready" ? "status-badge-ready" : ""}
                      ${order.status === "completed" ? "status-badge-completed" : ""}
                    `}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{format(order.createdAt.toDate(), "MMM d, yyyy h:mm a")}</span>
                </div>

                {order.completedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium">Completed:</span>
                    <span>{format(order.completedAt.toDate(), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <span>{order.userEmail || order.userId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Total Items:</span>
                  <span>{order.items}</span>
                </div>

                {order.bagCode && (
                  <div className="flex justify-between">
                    <span className="font-medium">Bag Code:</span>
                    <span className="font-bold">{order.bagCode}</span>
                  </div>
                )}


                {order.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Progress:</span>
                      <span>{order.progress}%</span>
                    </div>
                    <Progress value={order.progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle>Items Breakdown</CardTitle>
                <CardDescription>Clothing items in this order</CardDescription>
              </CardHeader>
              <CardContent>
                {order.clothItems ? (
                  <div className="space-y-2">
                    {Object.entries(order.clothItems)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <div key={type} className="flex justify-between p-2 bg-muted rounded-md">
                          <span className="capitalize">{type}:</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No item breakdown available</div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="premium-card mt-6">
            <CardHeader>
              <CardTitle>Update Order</CardTitle>
              <CardDescription>Modify order status and details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="progress">Progress (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    className="premium-input"
                    value={formData.progress}
                    onChange={handleChange}
                    disabled={formData.status === "completed"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bagCode">Laundry Bag Code</Label>
                  <Input
                    id="bagCode"
                    placeholder="4-digit code for laundry bag"
                    className="premium-input"
                    value={formData.bagCode}
                    onChange={handleChange}
                    maxLength={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this order"
                    rows={3}
                    className="premium-input"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <Button type="submit" className="w-full premium-button" disabled={isUpdating}>
                  {isUpdating ? "Updating..." : "Update Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

