import Link from "next/link"
import { Bell, Home, MessageSquare, Settings, ShirtIcon as Tshirt } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  activeTab?: string
}

export function MobileNav({ activeTab = "home" }: MobileNavProps) {
  const navItems = [
    {
      name: "home",
      href: "/dashboard?tab=home",
      icon: Home,
      label: "Home",
    },
    {
      name: "lost-found",
      href: "/dashboard?tab=lost-found",
      icon: Tshirt,
      label: "Lost & Found",
    },
    {
      name: "notifications",
      href: "/notifications",
      icon: Bell,
      label: "Notifications",
      badge: 3,
    },
    {
      name: "support",
      href: "/dashboard?tab=support",
      icon: MessageSquare,
      label: "Support",
    },
    {
      name: "settings",
      href: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t bg-background">
      <nav className="grid h-16 grid-cols-5">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              activeTab === item.name
                ? "text-primary bg-primary/5"
                : "text-muted-foreground hover:text-primary/80 hover:bg-muted/50",
            )}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px]">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

