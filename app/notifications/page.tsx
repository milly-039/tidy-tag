"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobileNav } from "@/components/mobile-nav"
import { useToast } from "@/hooks/use-toast"

export default function NotificationsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Laundry Ready for Pickup",
      description: "Your order #L12345 is ready for pickup at the main counter.",
      time: "10 minutes ago",
      isUnread: true,
      isImportant: true,
    },
    {
      id: 2,
      title: "Processing Started",
      description: "We've started processing your laundry order #L12345.",
      time: "2 hours ago",
      isUnread: true,
      isImportant: false,
    },
    {
      id: 3,
      title: "Order Received",
      description: "We've received your laundry order #L12345.",
      time: "3 hours ago",
      isUnread: false,
      isImportant: false,
    },
    {
      id: 4,
      title: "Special Offer",
      description: "Get 20% off on your next laundry order this weekend!",
      time: "1 day ago",
      isUnread: false,
      isImportant: true,
    },
    {
      id: 5,
      title: "Previous Order Completed",
      description: "Your order #L12344 has been completed and delivered.",
      time: "3 days ago",
      isUnread: false,
      isImportant: false,
    },
  ])

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        isUnread: false,
      })),
    )
    toast({
      title: "All notifications marked as read",
      description: "Your notifications have been updated",
    })
  }

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isUnread: false } : notification)),
    )
  }

  const getFilteredNotifications = (tab: string) => {
    switch (tab) {
      case "unread":
        return notifications.filter((n) => n.isUnread)
      case "important":
        return notifications.filter((n) => n.isImportant)
      default:
        return notifications
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/95 backdrop-blur-sm px-4">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-medium text-primary">Notifications</h1>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-2xl">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="important">Important</TabsTrigger>
            </TabsList>

            {["all", "unread", "important"].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <ScrollArea className="h-[calc(100vh-180px)]">
                  <div className="space-y-4">
                    <Card className="premium-card">
                      <CardContent className="p-0">
                        {getFilteredNotifications(tab).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4 text-muted-foreground/50" />
                            <p>No {tab} notifications</p>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {getFilteredNotifications(tab).map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                {...notification}
                                onClick={() => markAsRead(notification.id)}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      <MobileNav activeTab="notifications" />
    </div>
  )
}

interface NotificationItemProps {
  id: number
  title: string
  description: string
  time: string
  isUnread?: boolean
  isImportant?: boolean
  onClick?: () => void
}

function NotificationItem({
  title,
  description,
  time,
  isUnread = false,
  isImportant = false,
  onClick,
}: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-4 p-4 transition-colors ${isUnread ? "bg-primary/5" : ""} hover:bg-muted/50 cursor-pointer`}
      onClick={onClick}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isImportant ? "bg-accent/80" : isUnread ? "bg-primary" : "bg-muted"
        }`}
      >
        <Bell className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>{title}</p>
          {isUnread && <span className="inline-flex h-2 w-2 rounded-full bg-primary"></span>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-full">
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">View</span>
      </Button>
    </div>
  )
}

