"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, LogOut, Moon, Sun, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, loading, logout, userData, updateUserData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [contactInfo, setContactInfo] = useState("")

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  // Load user data
  useEffect(() => {
    if (userData) {
      setContactInfo(userData.contactInfo || userData.email || "")
    }
  }, [userData])

  // Check system theme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode = document.documentElement.classList.contains("dark")
      setDarkMode(isDarkMode)
    }
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // Toggle dark mode class on the document
    if (!darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleUpdateContactInfo = async () => {
    if (!user) return

    setIsUpdating(true)
    try {
      await updateUserData({
        contactInfo,
      })

      toast({
        title: "Contact Info Updated",
        description: "Your contact information has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating contact info:", error)
      toast({
        title: "Error",
        description: "Failed to update contact information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // If loading, show loading state
  if (loading) {
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
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-medium text-primary">Settings</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-info">Contact Information</Label>
                <div className="flex gap-2">
                  <Input
                    id="contact-info"
                    placeholder="Phone number or alternate email"
                    className="premium-input"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpdateContactInfo}
                    disabled={isUpdating}
                    className="shrink-0"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be used for lost & found item contact information
                </p>
              </div>

              <Separator />
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </Button>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications about your laundry status via email
                  </p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications about your laundry status on your device
                  </p>
                </div>
                <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notification-sound">Notification Sound</Label>
                  <p className="text-xs text-muted-foreground">Play a sound when you receive a notification</p>
                </div>
                <Switch id="notification-sound" defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>App information and help</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Tidy Tag - College Laundry Management</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              <div className="pt-2">
                <Button variant="link" className="h-auto p-0 text-sm">
                  Terms of Service
                </Button>
              </div>
              <div>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Privacy Policy
                </Button>
              </div>
              <div>
                <Button variant="link" className="h-auto p-0 text-sm">
                  Help Center
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="settings" />
    </div>
  )
}

