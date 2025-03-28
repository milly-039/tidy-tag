"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, MessageSquare, Search, Settings, Upload, CheckCircle2 } from "lucide-react"
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

// Sample data for lost items
const LOST_ITEMS = [
  {
    id: 1,
    name: "Blue T-shirt",
    date: "Mar 25",
    image: "/placeholder.svg?height=100&width=100",
    color: "Blue",
    type: "shirt",
  },
  {
    id: 2,
    name: "Black Jeans",
    date: "Mar 24",
    image: "/placeholder.svg?height=100&width=100",
    color: "Black",
    type: "pants",
  },
  {
    id: 3,
    name: "Red Hoodie",
    date: "Mar 23",
    image: "/placeholder.svg?height=100&width=100",
    color: "Red",
    type: "hoodie",
  },
  {
    id: 4,
    name: "White Socks",
    date: "Mar 22",
    image: "/placeholder.svg?height=100&width=100",
    color: "White",
    type: "socks",
  },
  {
    id: 5,
    name: "Gray Sweater",
    date: "Mar 21",
    image: "/placeholder.svg?height=100&width=100",
    color: "Gray",
    type: "sweater",
  },
  {
    id: 6,
    name: "Yellow T-shirt",
    date: "Mar 20",
    image: "/placeholder.svg?height=100&width=100",
    color: "Yellow",
    type: "shirt",
  },
]

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "home")
  const [progress, setProgress] = useState(65)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState(LOST_ITEMS)
  const [issueType, setIssueType] = useState("")
  const [description, setDescription] = useState("")
  const [orderId, setOrderId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(LOST_ITEMS)
    } else {
      const query = searchQuery.toLowerCase()
      const results = LOST_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.color.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query),
      )
      setFilteredItems(results)
    }
  }, [searchQuery])

  // Handle complaint submission
  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been received. We'll get back to you soon.",
      })
      setIssueType("")
      setDescription("")
      setOrderId("")
    }, 1500)
  }

  // Simulate progress update
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer)
          toast({
            title: "Laundry Ready!",
            description: "Your laundry is ready for pickup.",
          })
          return 100
        }
        return prevProgress + 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [toast])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground">MS</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-medium text-primary">Campus Laundry</h1>
        </div>
        <div className="flex items-center gap-2">
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
          <Tabs defaultValue={activeTab} value={activeTab} className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="lost-found">Lost & Found</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-0 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="premium-card">
                  <CardHeader className="pb-2">
                    <CardTitle>Current Laundry Status</CardTitle>
                    <CardDescription>Last updated: Just now</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="font-medium">Order #L12345</span>
                        <Badge className="status-badge-processing">In Progress</Badge>
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
                          <span>Today, 10:30 AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated completion:</span>
                          <span>Today, 4:30 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items:</span>
                          <span>8 pieces</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full premium-button-outline">
                      View Details
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="premium-card">
                  <CardHeader className="pb-2">
                    <CardTitle>Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      <div className="divide-y">
                        {[
                          { id: "L12344", date: "Mar 25", status: "Completed", items: 6 },
                          { id: "L12343", date: "Mar 22", status: "Completed", items: 4 },
                          { id: "L12342", date: "Mar 18", status: "Completed", items: 7 },
                          { id: "L12341", date: "Mar 15", status: "Completed", items: 5 },
                          { id: "L12340", date: "Mar 10", status: "Completed", items: 8 },
                        ].map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <div className="font-medium">Order #{order.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.date} • {order.items} items
                              </div>
                            </div>
                            <Badge variant="outline" className="status-badge-completed">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              {order.status}
                            </Badge>
                          </div>
                        ))}
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
                      <div className="text-center py-12 text-muted-foreground">No items match your search</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-lg border group cursor-pointer transition-all duration-300 hover:shadow-md hover:border-primary/40"
                          >
                            <div className="aspect-square bg-muted relative overflow-hidden">
                              <div className="flex h-full items-center justify-center">
                                <img
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                                <div className="p-2 text-white w-full">
                                  <div className="text-xs font-medium truncate">{item.name}</div>
                                </div>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="text-sm font-medium truncate">{item.name}</div>
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">Found {item.date}</div>
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
                      <h3 className="font-medium mb-2">Campus Laundry Support</h3>
                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="text-muted-foreground">Email:</span> support@campuslaundry.edu
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
                            Standard service takes 24 hours. Express service is available for an additional fee.
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

     
    </div>
  )
}

