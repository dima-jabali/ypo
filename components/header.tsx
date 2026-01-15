"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
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
      <div className="container mx-auto flex h-16 items-center gap-4 lg:gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            Y
          </div>
          <span className="font-bold text-xl hidden sm:inline">YPO Brain</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-8">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("text-sm font-medium px-4", pathname === item.href && "bg-secondary")}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-2">
          <ProfileSelector />
        </div>

        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
              },
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton />

          <SignUpButton>
            <button
              className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
              type={"button"}
            >
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
      </div>
    </header>
  )
}
