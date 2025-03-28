import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shirt, Sparkles, Clock, MessageSquare } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 subtle-bg">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-block rounded-full bg-accent/20 px-3 py-1 text-sm text-laundry-navy">
                  <span>Campus Laundry Service</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-laundry-navy">
                  Campus Laundry
                </h1>
                <p className="mx-auto max-w-[700px] text-laundry-slate md:text-xl">
                  Manage your laundry with ease. Track status, get notifications, and never lose your clothes again.
                </p>
              </div>
              <div className="mt-6">
                <Link href="/login">
                  <Button className="px-8 premium-button">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-4xl">
                <div className="flex flex-col items-center p-6 premium-card rounded-xl">
                  <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Shirt className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">Track Laundry</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Real-time updates on your laundry status
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 premium-card rounded-xl">
                  <div className="p-3 rounded-full bg-accent/20 mb-4">
                    <Sparkles className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-medium">Lost & Found</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">Report and find missing items easily</p>
                </div>

                <div className="flex flex-col items-center p-6 premium-card rounded-xl">
                  <div className="p-3 rounded-full bg-laundry-info/10 mb-4">
                    <Clock className="h-6 w-6 text-laundry-info" />
                  </div>
                  <h3 className="font-medium">Notifications</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    Get alerts when your laundry is ready
                  </p>
                </div>

                <div className="flex flex-col items-center p-6 premium-card rounded-xl">
                  <div className="p-3 rounded-full bg-laundry-success/10 mb-4">
                    <MessageSquare className="h-6 w-6 text-laundry-success" />
                  </div>
                  <h3 className="font-medium">Support</h3>
                  <p className="text-sm text-center text-muted-foreground mt-2">Submit complaints and get help</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

