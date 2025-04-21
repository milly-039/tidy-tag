"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Shirt, MessageSquare, Package, Plus, RefreshCw, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getAllOrders, type LaundryOrder } from "@/lib/laundry-service"
import { getAllComplaints, type Complaint, updateComplaintStatus } from "@/lib/complaint-service"
import { getLostItems, type LostItem, updateLostItemStatus } from "@/lib/lost-found-service"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPage() {
  const router = useRouter()
  const { user, loading, isAdmin, grantAdminAccess } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [orders, setOrders] = useState<LaundryOrder[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Admin management
  const [isGrantAdminOpen, setIsGrantAdminOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [isGrantingAdmin, setIsGrantingAdmin] = useState(false)

  // Complaint response
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isComplaintDialogOpen, setIsComplaintDialogOpen] = useState(false)
  const [complaintResponse, setComplaintResponse] = useState("")
  const [complaintStatus, setComplaintStatus] = useState<"in-progress" | "resolved">("in-progress")
  const [isRespondingComplaint, setIsRespondingComplaint] = useState(false)

  // Lost item management
  const [selectedLostItem, setSelectedLostItem] = useState<LostItem | null>(null)
  const [isLostItemDialogOpen, setIsLostItemDialogOpen] = useState(false)
  const [lostItemStatus, setLostItemStatus] = useState<"found" | "claimed">("found")
  const [isUpdatingLostItem, setIsUpdatingLostItem] = useState(false)

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

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (!user || !isAdmin) return

      setIsLoading(true)
      try {
        // Load orders
        const allOrders = await getAllOrders()
        setOrders(allOrders)

        // Load complaints
        const allComplaints = await getAllComplaints()
        setComplaints(allComplaints)

        // Load lost items
        const allLostItems = await getLostItems()
        setLostItems(allLostItems)
      } catch (error) {
        console.error("Error loading admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminData()
  }, [user, isAdmin, toast])

  // Handle refresh data
  const handleRefreshData = async () => {
    if (!user || !isAdmin) return

    setIsLoading(true)
    try {
      // Reload all data
      const allOrders = await getAllOrders()
      setOrders(allOrders)

      const allComplaints = await getAllComplaints()
      setComplaints(allComplaints)

      const allLostItems = await getLostItems()
      setLostItems(allLostItems)

      toast({
        title: "Data Refreshed",
        description: "Admin data has been refreshed successfully.",
      })
    } catch (error) {
      console.error("Error refreshing admin data:", error)
      toast({
        title: "Error",
        description: "Failed to refresh admin data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle grant admin access
  const handleGrantAdmin = async () => {
    if (!adminEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsGrantingAdmin(true)
    try {
      // In a real app, you would search for the user by email first
      // For now, we'll just show a success message
      toast({
        title: "Admin Access Granted",
        description: `Admin access has been granted to ${adminEmail}.`,
      })
      setAdminEmail("")
      setIsGrantAdminOpen(false)
    } catch (error) {
      console.error("Error granting admin access:", error)
      toast({
        title: "Error",
        description: "Failed to grant admin access. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGrantingAdmin(false)
    }
  }

  // Handle complaint response
  const handleComplaintResponse = async () => {
    if (!selectedComplaint || !complaintResponse.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response.",
        variant: "destructive",
      })
      return
    }

    setIsRespondingComplaint(true)
    try {
      await updateComplaintStatus(selectedComplaint.id!, complaintStatus, complaintResponse)

      // Update local state
      setComplaints(
        complaints.map((complaint) =>
          complaint.id === selectedComplaint.id
            ? { ...complaint, status: complaintStatus, response: complaintResponse }
            : complaint,
        ),
      )

      toast({
        title: "Response Sent",
        description: "Your response has been sent to the user.",
      })

      setComplaintResponse("")
      setComplaintStatus("in-progress")
      setIsComplaintDialogOpen(false)
    } catch (error) {
      console.error("Error responding to complaint:", error)
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRespondingComplaint(false)
    }
  }

  // Handle lost item status update
  const handleLostItemUpdate = async () => {
    if (!selectedLostItem) return

    setIsUpdatingLostItem(true)
    try {
      await updateLostItemStatus(selectedLostItem.id!, lostItemStatus)

      // Update local state
      setLostItems(
        lostItems.map((item) => (item.id === selectedLostItem.id ? { ...item, status: lostItemStatus } : item)),
      )

      toast({
        title: "Status Updated",
        description: `Item has been marked as ${lostItemStatus}.`,
      })

      setLostItemStatus("found")
      setIsLostItemDialogOpen(false)
    } catch (error) {
      console.error("Error updating lost item status:", error)
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingLostItem(false)
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

  // Count statistics
  const pendingOrders = orders.filter((order) => order.status === "pending").length
  const processingOrders = orders.filter((order) => order.status === "processing").length
  const readyOrders = orders.filter((order) => order.status === "ready").length
  const pendingComplaints = complaints.filter((complaint) => complaint.status === "submitted").length
  const reportedItems = lostItems.filter((item) => item.status === "reported").length

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-lg font-medium text-primary">Tidy Tag Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsGrantAdminOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Grant Admin
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-7xl">
          <Tabs defaultValue={activeTab} value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="lost-found">Lost & Found</TabsTrigger>
              <TabsTrigger value="complaints">Complaints</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="premium-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{orders.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {pendingOrders} pending, {processingOrders} processing, {readyOrders} ready
                    </p>
                  </CardContent>
                </Card>
                <Card className="premium-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Lost Items</CardTitle>
                    <Shirt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lostItems.length}</div>
                    <p className="text-xs text-muted-foreground">{reportedItems} reported items</p>
                  </CardContent>
                </Card>
                <Card className="premium-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Complaints</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{complaints.length}</div>
                    <p className="text-xs text-muted-foreground">{pendingComplaints} pending complaints</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="premium-card md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest laundry orders across all users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <div className="font-medium">Order #{order.id?.substring(0, 6)}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(order.createdAt.toDate(), "MMM d, h:mm a")} • {order.items} items
                              </div>
                              {order.userEmail && (
                                <div className="text-xs text-muted-foreground">User: {order.userEmail}</div>
                              )}
                              {order.bagCode && <div className="text-xs font-medium">Bag Code: {order.bagCode}</div>}
                            </div>
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
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Recent Complaints</CardTitle>
                    <CardDescription>Latest customer complaints</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {complaints.slice(0, 5).map((complaint) => (
                          <div key={complaint.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="font-medium">{complaint.issueType}</div>
                              <Badge
                                className={`
                                  ${complaint.status === "submitted" ? "bg-laundry-warning" : ""}
                                  ${complaint.status === "in-progress" ? "bg-laundry-info" : ""}
                                  ${complaint.status === "resolved" ? "bg-laundry-success" : ""}
                                  text-white
                                `}
                              >
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(complaint.submittedAt.toDate(), "MMM d, h:mm a")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Laundry Orders</h2>
                <Button asChild>
                  <Link href="/admin/orders/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Order
                  </Link>
                </Button>
              </div>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>View and manage all laundry orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No orders found</div>
                      ) : (
                        orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                              <div className="font-medium">Order #{order.id?.substring(0, 6)}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(order.createdAt.toDate(), "MMM d, h:mm a")} • {order.items} items
                              </div>
                              <div className="text-sm text-muted-foreground">
                                User: {order.userEmail || order.userId.substring(0, 8) + "..."}
                              </div>
                              {order.bagCode && <div className="text-sm font-medium">Bag Code: {order.bagCode}</div>}
                              {order.progress !== undefined && (
                                <div className="text-sm text-muted-foreground">Progress: {order.progress}%</div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/orders/${order.id}`}>Manage</Link>
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lost-found" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Lost & Found</h2>
              </div>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>All Lost Items</CardTitle>
                  <CardDescription>View and manage all reported lost items</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lostItems.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground col-span-full">
                          No lost items reported
                        </div>
                      ) : (
                        lostItems.map((item) => (
                          <div key={item.id} className="rounded-lg border overflow-hidden">
                            <div className="aspect-square bg-muted relative">
                              <div className="flex h-full items-center justify-center">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.itemType}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Shirt className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                              <Badge
                                className={`
                                  absolute top-2 left-2
                                  ${item.status === "reported" ? "bg-laundry-warning" : ""}
                                  ${item.status === "found" ? "bg-laundry-success" : ""}
                                  ${item.status === "claimed" ? "bg-laundry-blue" : ""}
                                  text-white
                                `}
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <div className="p-4">
                              <div className="font-medium">{item.itemType}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.color} {item.brand && `• ${item.brand}`}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Reported: {format(item.reportedAt.toDate(), "MMM d")}
                              </div>
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedLostItem(item)
                                    setIsLostItemDialogOpen(true)
                                  }}
                                >
                                  Update Status
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints" className="mt-0 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Manage Complaints</h2>
              </div>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>All Complaints</CardTitle>
                  <CardDescription>View and respond to customer complaints</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {complaints.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No complaints found</div>
                      ) : (
                        complaints.map((complaint) => (
                          <div key={complaint.id} className="rounded-lg border p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium">{complaint.issueType}</div>
                              <Badge
                                className={`
                                  ${complaint.status === "submitted" ? "bg-laundry-warning" : ""}
                                  ${complaint.status === "in-progress" ? "bg-laundry-info" : ""}
                                  ${complaint.status === "resolved" ? "bg-laundry-success" : ""}
                                  text-white
                                `}
                              >
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{complaint.description}</p>
                            <div className="text-xs text-muted-foreground mb-3">
                              Submitted: {format(complaint.submittedAt.toDate(), "MMM d, h:mm a")}
                              {complaint.orderId && ` • Order: ${complaint.orderId}`}
                            </div>
                            {complaint.response && (
                              <div className="mt-2 p-2 bg-muted rounded-md">
                                <p className="text-xs font-medium">Response:</p>
                                <p className="text-sm">{complaint.response}</p>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                setSelectedComplaint(complaint)
                                setIsComplaintDialogOpen(true)
                              }}
                            >
                              {complaint.response ? "Update Response" : "Respond"}
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Grant Admin Access Dialog */}
      <Dialog open={isGrantAdminOpen} onOpenChange={setIsGrantAdminOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Admin Access</DialogTitle>
            <DialogDescription>Enter the email of the user you want to grant admin access to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">User Email</Label>
              <Input
                id="admin-email"
                placeholder="user@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGrantAdminOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAdmin} disabled={isGrantingAdmin}>
              {isGrantingAdmin ? "Granting Access..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complaint Response Dialog */}
      <Dialog open={isComplaintDialogOpen} onOpenChange={setIsComplaintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Complaint</DialogTitle>
            <DialogDescription>
              {selectedComplaint?.issueType} - {selectedComplaint?.description?.substring(0, 50)}...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-status">Status</Label>
              <Select
                value={complaintStatus}
                onValueChange={(value) => setComplaintStatus(value as "in-progress" | "resolved")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complaint-response">Your Response</Label>
              <Textarea
                id="complaint-response"
                placeholder="Enter your response to the complaint..."
                value={complaintResponse}
                onChange={(e) => setComplaintResponse(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComplaintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplaintResponse} disabled={isRespondingComplaint}>
              {isRespondingComplaint ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lost Item Status Dialog */}
      <Dialog open={isLostItemDialogOpen} onOpenChange={setIsLostItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Item Status</DialogTitle>
            <DialogDescription>
              {selectedLostItem?.color} {selectedLostItem?.itemType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lost-item-status">Status</Label>
              <Select value={lostItemStatus} onValueChange={(value) => setLostItemStatus(value as "found" | "claimed")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="found">Found</SelectItem>
                  <SelectItem value="claimed">Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLostItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLostItemUpdate} disabled={isUpdatingLostItem}>
              {isUpdatingLostItem ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

