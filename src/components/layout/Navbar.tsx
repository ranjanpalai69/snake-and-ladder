"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  User,
  Trophy,
  LogOut,
  Wifi,
  WifiOff,
  Menu,
  X,
  Star,
  MonitorSmartphone,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRoomStore } from "@/stores/roomStore";
import { cn } from "@/lib/utils";
import { RANK_COLORS } from "@/types/game";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { href: "/lobby", label: "Lobby", icon: LayoutGrid },
  { href: "/local", label: "Local Play", icon: MonitorSmartphone },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { isConnected } = useRoomStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const rankColor = profile ? RANK_COLORS[profile.rank_tier as keyof typeof RANK_COLORS] : "#CD7F32";

  return (
    <motion.nav
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/40"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/icons/snake-ladder-favicon.png"
            alt="Snake & Ladder"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-display font-bold text-lg text-white tracking-wide">
            Snake<span className="text-violet-400">&amp;</span>Ladder
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === href
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: connection + profile */}
        <div className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", isConnected ? "text-green-400" : "text-red-400")}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isConnected ? "Online" : "Offline"}</span>
          </div>

          {/* Profile dropdown */}
          {profile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{ background: rankColor, color: "#fff" }}
                    >
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-semibold text-white leading-none">{profile.username}</span>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-2.5 h-2.5"
                          fill={i < profile.rank_stars ? rankColor : "transparent"}
                          stroke={rankColor}
                          strokeWidth={2}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-slate-900 border-white/10">
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-400 cursor-pointer focus:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-white/10 bg-black/60 px-4 py-3 flex flex-col gap-1"
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium",
                pathname === href ? "bg-violet-600/30 text-violet-300" : "text-slate-400"
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </motion.div>
      )}
    </motion.nav>
  );
}
