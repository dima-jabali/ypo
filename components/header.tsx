"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProfileSelector } from "@/components/profile-selector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/search", label: "Search" },
    { href: "/members", label: "Members" },
    { href: "/network", label: "Network" },
    { href: "/events", label: "Events" },
    { href: "/content", label: "Content" },
    { href: "/connections", label: "Connections" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border backdrop-blur bg-brand-3 text-white">
      <div className="container mx-auto flex h-16 items-center gap-4 lg:gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/ypo-logo-white.png" alt="YPO Brain Logo" className="size-10" />

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
      </div>
    </header>
  );
}
