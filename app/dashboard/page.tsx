"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Bell,
  MessageSquare,
  Search,
  Settings,
  ShirtIcon as Tshirt,
  Upload,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MobileNav } from "@/components/mobile-nav"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getLostItems, searchLostItems, type LostItem, deleteLostItem, getUserById } from "@/lib/lost-found-service"
import { submitComplaint } from "@/lib/complaint-service"
import { getCurrentOrder, getUserOrders, type LaundryOrder, updateOrderProgress } from "@/lib/laundry-service"
import { format } from "date-fns"
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading, isAdmin } = useAuth()

  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "home")

  // Laundry state
  const [currentOrder, setCurrentOrder] = useState<LaundryOrder | null>(null)
  const [recentOrders, setRecentOrders] = useState<LaundryOrder[]>([])
  const [progress, setProgress] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<LaundryOrder | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Lost & Found state
  const [lostItems, setLostItems] = useState<LostItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<LostItem[]>([])
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null)
  const [itemOwner, setItemOwner] = useState<any | null>(null)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  // Complaint state
  const [issueType, setIssueType] = useState("")
  const [description, setDescription] = useState("")
  const [orderId, setOrderId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/dashboard?tab=${value}`, { scroll: false })
  }

  // Load user's laundry data
  useEffect(() => {
    const loadLaundryData = async () => {
      if (!user) return

      setIsLoadingData(true)
      setDataError(null)

      try {
        // Get current order from Firestore
        const current = await getCurrentOrder(user.uid)
        if (current) {
          setCurrentOrder(current)
          setProgress(current.progress || 0)
        } else {
          setCurrentOrder(null)
        }

        // Get user's order history
        const orders = await getUserOrders(user.uid)
        if (orders.length > 0) {
          setRecentOrders(orders.filter((order) => order.status === "completed").slice(0, 5))
        } else {
          setRecentOrders([])
        }
      } catch (error) {
        console.error("Error loading laundry data:", error)
        setDataError("Failed to load your laundry data. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load your laundry data. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadLaundryData()
  }, [user, toast])

  // Load lost items
  useEffect(() => {
    const loadLostItems = async () => {
      if (!user) return

      try {
        const items = await getLostItems()
        setLostItems(items)
        setFilteredItems(items)
      } catch (error) {
        console.error("Error loading lost items:", error)
        toast({
          title: "Error",
          description: "Failed to load lost items. Please try again later.",
          variant: "destructive",
        })
      }
    }

    loadLostItems()
  }, [user, toast])

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === "") {
        setFilteredItems(lostItems)
      } else {
        try {
          const results = await searchLostItems(searchQuery)
          setFilteredItems(results)
        } catch (error) {
          console.error("Error searching lost items:", error)
          toast({
            title: "Error",
            description: "Failed to search lost items. Please try again.",
            variant: "destructive",
          })
        }
      }
    }

    handleSearch()
  }, [searchQuery, lostItems, toast])

  // Handle complaint submission
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a complaint.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await submitComplaint({
        issueType,
        description,
        orderId: orderId || undefined,
        submittedBy: user.uid,
      })

      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been received. We'll get back to you soon.",
      })

      setIssueType("")
      setDescription("")
      setOrderId("")
    } catch (error) {
      console.error("Error submitting complaint:", error)
      toast({
        title: "Error",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete lost item
  const confirmDeleteItem = (id: string) => {
    setItemToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return

    setIsDeleting(true)
    try {
      const itemToRemove = lostItems.find((item) => item.id === itemToDelete)
      await deleteLostItem(itemToDelete, itemToRemove?.imageUrl)

      // Update the UI
      setLostItems((prev) => prev.filter((item) => item.id !== itemToDelete))
      setFilteredItems((prev) => prev.filter((item) => item.id !== itemToDelete))

      toast({
        title: "Item Deleted",
        description: "Your lost item report has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting lost item:", error)
      toast({
        title: "Error",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Simulate progress update
  useEffect(() => {
    if (!currentOrder || !currentOrder.id) return

    const timer = setInterval(async () => {
      if (progress >= 100) {
        clearInterval(timer)
        toast({
          title: "Laundry Ready!",
          description: "Your laundry is ready for pickup.",
        })
        return
      }

      const newProgress = progress + 1
      setProgress(newProgress)

      try {
        await updateOrderProgress(currentOrder.id, newProgress)

        if (newProgress >= 100) {
          setCurrentOrder((prev) => (prev ? { ...prev, status: "ready", progress: 100 } : null))
        } else {
          setCurrentOrder((prev) => (prev ? { ...prev, progress: newProgress } : null))
        }
      } catch (error) {
        console.error("Error updating progress:", error)
      }
    }, 3000)

    return () => {
      clearInterval(timer)
    }
  }, [currentOrder, progress, toast])

  // View order details
  const viewOrderDetails = (order: LaundryOrder) => {
    setSelectedOrder(order)
    setIsOrderDetailsOpen(true)
  }

  // View item contact info
  const viewItemContact = async (item: LostItem) => {
    setSelectedItem(item)

    try {
      if (item.reportedBy) {
        const owner = await getUserById(item.reportedBy)
        setItemOwner(owner)
      }
      setIsContactDialogOpen(true)
    } catch (error) {
      console.error("Error fetching item owner:", error)
      toast({
        title: "Error",
        description: "Failed to load contact information.",
        variant: "destructive",
      })
    }
  }

  // If loading or not logged in, show loading state
  if (loading || !user) {
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
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt={user.displayName || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-medium text-primary">Tidy Tag</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href="/admin">Admin Panel</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] bg-primary">3</Badge>
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-6xl">
          {dataError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dataError}</AlertDescription>
            </Alert>
          )}

          {isLoadingData && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          <Tabs defaultValue={activeTab} value={activeTab} className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="lost-found">Lost & Found</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {currentOrder ? (
                  <Card className="premium-card">
                    <CardHeader className="pb-2">
                      <CardTitle>Current Laundry Status</CardTitle>
                      <CardDescription>Last updated: {format(new Date(), "MMM d, h:mm a")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg bg-secondary/50 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="font-medium">Order #{currentOrder.id?.substring(0, 6)}</span>
                          <Badge
                            className={`${
                              currentOrder.status === "ready" ? "status-badge-ready" : "status-badge-processing"
                            }`}
                          >
                            {currentOrder.status === "ready" ? "Ready for Pickup" : "In Progress"}
                          </Badge>
                        </div>
                        <div className="space-y-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Progress:</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dropped off:</span>
                            <span>{format(currentOrder.createdAt.toDate(), "MMM d, h:mm a")}</span>
                          </div>
                          {currentOrder.bagCode && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Bag Code:</span>
                              <span className="font-bold">{currentOrder.bagCode}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated completion:</span>
                            <span>
                              {currentOrder.estimatedCompletionTime
                                ? format(currentOrder.estimatedCompletionTime.toDate(), "MMM d, h:mm a")
                                : "Today, 4:30 PM"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Items:</span>
                            <span>{currentOrder.items} pieces</span>
                          </div>
                          {currentOrder.clothItems && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="font-medium mb-1">Items breakdown:</p>
                              <ul className="space-y-1">
                                {Object.entries(currentOrder.clothItems)
                                  .filter(([_, count]) => count > 0)
                                  .map(([type, count]) => (
                                    <li key={type} className="flex justify-between">
                                      <span className="capitalize">{type}:</span>
                                      <span>{count}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full premium-button-outline"
                        onClick={() => viewOrderDetails(currentOrder)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="premium-card">
                    <CardHeader className="pb-2">
                      <CardTitle>No Active Orders</CardTitle>
                      <CardDescription>You don't have any active laundry orders</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Tshirt className="h-16 w-16 text-muted-foreground/50 mb-4" />
                      <p className="text-center text-muted-foreground mb-4">
                        Drop off your laundry at the main counter to get started
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="premium-card">
                  <CardHeader className="pb-2">
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y">
                        {recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => viewOrderDetails(order)}
                            >
                              <div>
                                <div className="font-medium">Order #{order.id?.substring(0, 6)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.completedAt
                                    ? format(order.completedAt.toDate(), "MMM d")
                                    : format(order.createdAt.toDate(), "MMM d")}{" "}
                                  • {order.items} items
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Badge variant="outline" className="status-badge-completed mr-2">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Completed
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <p>No recent orders</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>Laundry Tips</CardTitle>
                  <CardDescription>Get the most out of our laundry service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Sorting Your Clothes</h3>
                      <p className="text-sm text-muted-foreground">
                        Sort your clothes by color and fabric type for best results.
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Stain Treatment</h3>
                      <p className="text-sm text-muted-foreground">
                        Pre-treat stains before dropping off your laundry for better cleaning.
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Special Instructions</h3>
                      <p className="text-sm text-muted-foreground">
                        Let us know about any special care instructions for your garments.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lost-found" className="mt-0 space-y-6">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle>Lost & Found</CardTitle>
                  <CardDescription>Report or search for missing items</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button className="premium-button-accent w-full sm:w-auto" asChild>
                      <Link href="/lost-found/report">
                        <Upload className="h-4 w-4 mr-2" />
                        Report Missing Item
                      </Link>
                    </Button>

                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search by color, type, or name..."
                        className="w-full pl-8 premium-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Recently Reported Items</h3>
                      <span className="text-sm text-muted-foreground">{filteredItems.length} items</span>
                    </div>

                    {filteredItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "No items match your search" : "No lost items reported yet"}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-lg border group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/40"
                            onClick={() => viewItemContact(item)}
                          >
                            <div className="aspect-square bg-muted relative overflow-hidden">
                              <div className="flex h-full items-center justify-center">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl || "/placeholder.svg"}
                                    alt={item.itemType}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                ) : (
                                  <Tshirt className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                <div className="p-2 text-white w-full">
                                  <div className="text-xs font-medium truncate">{item.itemType}</div>
                                </div>
                              </div>
                              {/* Delete button for user's own items */}
                              {item.reportedBy === user.uid && (
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteItem(item.id || "")
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="p-3">
                              <div className="text-sm font-medium truncate">{item.itemType}</div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                  {item.reportedAt ? format(item.reportedAt.toDate(), "MMM d") : "Recently"}
                                </div>
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: item.color.toLowerCase() }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Submit a Complaint</CardTitle>
                    <CardDescription>Let us know about any issues with our service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitComplaint} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="issue-type">Issue Type</Label>
                        <Select value={issueType} onValueChange={setIssueType} required>
                          <SelectTrigger id="issue-type" className="premium-input">
                            <SelectValue placeholder="Select an issue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damaged">Damaged Clothing</SelectItem>
                            <SelectItem value="missing">Missing Items</SelectItem>
                            <SelectItem value="late">Late Delivery</SelectItem>
                            <SelectItem value="quality">Quality Issues</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Please describe your issue in detail..."
                          className="min-h-[120px] premium-input"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order-id">Order ID (if applicable)</Label>
                        <Input
                          id="order-id"
                          placeholder="e.g. L12345"
                          className="premium-input"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full premium-button" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Complaint"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="premium-card">
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>Need immediate assistance?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Tidy Tag Support</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Email:</span> support@tidytag.com
                        </p>
                        <p>
                          <span className="text-muted-foreground">Phone:</span> (555) 123-4567
                        </p>
                        <p>
                          <span className="text-muted-foreground">Hours:</span> Mon-Fri, 8am-6pm
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4">
                      <h3 className="font-medium mb-2">Frequently Asked Questions</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium">How long does laundry service take?</p>
                          <p className="text-muted-foreground">
                            Standard service takes 24 hours. Express service is available upon request.
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">What if my clothes are damaged?</p>
                          <p className="text-muted-foreground">
                            Submit a complaint with details and we'll investigate promptly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full premium-button-outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start Live Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MobileNav activeTab={activeTab} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lost Item Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Details Drawer */}
      <Drawer open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Order Details</DrawerTitle>
            <DrawerDescription>{selectedOrder && `Order #${selectedOrder.id?.substring(0, 6)}`}</DrawerDescription>
          </DrawerHeader>
          {selectedOrder && (
            <div className="px-4 py-2">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  <Badge
                    className={`${
                      selectedOrder.status === "completed"
                        ? "status-badge-completed"
                        : selectedOrder.status === "ready"
                          ? "status-badge-ready"
                          : "status-badge-processing"
                    }`}
                  >
                    {selectedOrder.status === "completed"
                      ? "Completed"
                      : selectedOrder.status === "ready"
                        ? "Ready for Pickup"
                        : "In Progress"}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{format(selectedOrder.createdAt.toDate(), "MMM d, yyyy h:mm a")}</span>
                </div>

                {selectedOrder.completedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium">Completed:</span>
                    <span>{format(selectedOrder.completedAt.toDate(), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-medium">Total Items:</span>
                  <span>{selectedOrder.items}</span>
                </div>

                {selectedOrder.bagCode && (
                  <div className="flex justify-between">
                    <span className="font-medium">Bag Code:</span>
                    <span className="font-bold">{selectedOrder.bagCode}</span>
                  </div>
                )}

                {selectedOrder.clothItems && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Items Breakdown:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedOrder.clothItems)
                        .filter(([_, count]) => count > 0)
                        .map(([type, count]) => (
                          <div key={type} className="flex justify-between p-2 bg-muted rounded-md">
                            <span className="capitalize">{type}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Notes:</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DrawerFooter>
            <Button variant="outline" onClick={() => setIsOrderDetailsOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Contact Dialog for Lost Items */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>{selectedItem && `${selectedItem.color} ${selectedItem.itemType}`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedItem && (
              <>
                <div className="aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-md border">
                  {selectedItem.imageUrl ? (
                    <img
                      src={selectedItem.imageUrl || "/placeholder.svg"}
                      alt={selectedItem.itemType}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <Tshirt className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <span className="capitalize">{selectedItem.itemType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Color:</span>
                    <span>{selectedItem.color}</span>
                  </div>
                  {selectedItem.brand && (
                    <div className="flex justify-between">
                      <span className="font-medium">Brand:</span>
                      <span>{selectedItem.brand}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Last Seen:</span>
                    <span>{selectedItem.lastSeen}</span>
                  </div>
                  <div className="pt-2">
                    <span className="font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1">{selectedItem.description}</p>
                  </div>
                </div>

                {itemOwner && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Contact Information:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{itemOwner.email}</span>
                      </div>
                      {itemOwner.contactInfo && itemOwner.contactInfo !== itemOwner.email && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{itemOwner.contactInfo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

