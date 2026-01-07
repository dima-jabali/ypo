"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { ProfileSelector } from "@/components/profile-selector"

export function Header() {
  const pathname = usePathname()
  const { setSearchQuery } = useStore()

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/search", label: "Search" },
    { href: "/members", label: "Members" },
    { href: "/network", label: "Network" },
    { href: "/events", label: "Events" },
    { href: "/content", label: "Content" },
    { href: "/connections", label: "Connections" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            Y
          </div>
          <span className="font-bold text-xl">YPO Brain</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("text-sm font-medium", pathname === item.href && "bg-secondary")}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-2">
          <Link href="/search" className="w-full max-w-sm hidden lg:block">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search members, events, content..."
                className="pl-8 bg-muted/50"
                readOnly
              />
            </div>
          </Link>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="default" size="sm">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <ProfileSelector />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
