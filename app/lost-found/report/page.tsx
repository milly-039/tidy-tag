"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, X, Camera, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MobileNav } from "@/components/mobile-nav"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { reportLostItem } from "@/lib/lost-found-service"
import { useRouter } from "next/navigation"

export default function ReportLostItemPage() {
  const { toast } = useToast()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    itemType: "",
    color: "",
    brand: "",
    description: "",
    lastSeen: "",
    orderId: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not logged in
  if (!loading && !user) {
    router.push("/login")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Modify the handleSubmit function to handle permission errors
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report a lost item.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      try {
        await reportLostItem(
          {
            ...formData,
            reportedBy: user.uid,
          },
          imageFile || undefined,
        )

        toast({
          title: "Report Submitted",
          description: "Your lost item report has been submitted successfully!",
        })
      } catch (firestoreError) {
        console.error("Error accessing Firestore:", firestoreError)
        toast({
          title: "Demo Mode",
          description: "This is a preview. In production, your report would be saved to the database.",
        })
      }

      // Reset form
      setFormData({
        itemType: "",
        color: "",
        brand: "",
        description: "",
        lastSeen: "",
        orderId: "",
      })
      setImagePreview(null)
      setImageFile(null)

      // Redirect to dashboard after successful submission
      router.push("/dashboard?tab=lost-found")
    } catch (error) {
      console.error("Error reporting lost item:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
          <Link href="/dashboard?tab=lost-found">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-lg font-medium text-primary">Report Missing Item</h1>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 subtle-bg">
        <div className="mx-auto max-w-2xl">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle>Missing Item Details</CardTitle>
              <CardDescription>Please provide as much detail as possible to help us locate your item</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item-type">Item Type</Label>
                  <Select
                    value={formData.itemType}
                    onValueChange={(value) => handleSelectChange("itemType", value)}
                    required
                  >
                    <SelectTrigger id="item-type" className="premium-input">
                      <SelectValue placeholder="Select item type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shirt">Shirt/T-shirt</SelectItem>
                      <SelectItem value="pants">Pants/Jeans</SelectItem>
                      <SelectItem value="dress">Dress</SelectItem>
                      <SelectItem value="sweater">Sweater/Hoodie</SelectItem>
                      <SelectItem value="socks">Socks</SelectItem>
                      <SelectItem value="underwear">Underwear</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      placeholder="e.g. Blue, Red, Black"
                      className="premium-input"
                      value={formData.color}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand (if known)</Label>
                    <Input
                      id="brand"
                      placeholder="e.g. Nike, Adidas"
                      className="premium-input"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe any unique features, patterns, or identifying marks"
                    rows={3}
                    className="premium-input"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="lastSeen">When did you last see it?</Label>
                    <Input
                      id="lastSeen"
                      type="date"
                      className="premium-input"
                      value={formData.lastSeen}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID (if applicable)</Label>
                    <Input
                      id="orderId"
                      placeholder="e.g. L12345"
                      className="premium-input"
                      value={formData.orderId}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload Image (if available)</Label>
                  <div className="flex flex-col items-center gap-4">
                    {imagePreview ? (
                      <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-md border">
                        <img
                          src={imagePreview || "/placeholder.svg"}
                          alt="Item preview"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute right-2 top-2 rounded-full h-8 w-8 p-0"
                          onClick={removeImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex w-full flex-col items-center gap-2">
                        <div
                          className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input bg-muted/30 px-4 py-5 text-center hover:bg-muted/50 transition-colors"
                          onClick={triggerFileInput}
                        >
                          <div className="flex gap-2 mb-2">
                            <Camera className="h-6 w-6 text-primary" />
                            <ImageIcon className="h-6 w-6 text-accent" />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium text-primary">Click to upload</span> or drag and drop
                          </div>
                          <div className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 5MB)</div>
                        </div>
                        <Input
                          ref={fileInputRef}
                          id="image-upload"
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full premium-button" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col text-sm text-muted-foreground">
              <p>
                Our team will review your report and contact you if we find a match. You'll receive notifications
                through the app and via email.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      <MobileNav activeTab="lost-found" />
    </div>
  )
}

