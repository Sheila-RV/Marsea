"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LogOut, QrCode, Ticket } from "lucide-react";
import { RequireRole } from "@/components/require-role";
import { useAuth } from "@/hooks/use-auth";
import { bookingsApi } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Clases disponibles", icon: CalendarDays },
  { href: "/bookings", label: "Mis reservas", icon: Ticket },
  { href: "/qr", label: "Mi código QR", icon: QrCode },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const { data: bookings } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: bookingsApi.findMine,
  });
  const activeBookingsCount = (bookings ?? []).filter(
    (b) => b.status === "BOOKED",
  ).length;

  return (
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="border-none">
        <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-5">
          <Image
            src="/marsea-logo.png"
            alt="MARSEA"
            width={160}
            height={28}
            className="h-7 w-auto brightness-0 invert"
            priority
          />
          <p className="mt-1.5 text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
            Clases y bienestar
          </p>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        className={cn(
                          "h-auto gap-3 rounded-xl py-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          isActive &&
                            "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            isActive ? "bg-white/10" : "bg-white/5",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span>{item.label}</span>
                        {item.href === "/bookings" &&
                          activeBookingsCount > 0 && (
                            <span className="ml-auto rounded-full bg-sidebar-primary-foreground/90 px-2 py-0.5 text-xs font-bold text-sidebar">
                              {activeBookingsCount}
                            </span>
                          )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sidebar-primary-foreground/20 bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground shadow">
                {profile ? initials(profile.fullName) : "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">
                  {profile?.fullName ?? "Cargando..."}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {profile?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:bg-white/5 hover:text-sidebar-foreground"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 bg-sidebar px-4 text-sidebar-foreground md:hidden">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground" />
          <Image
            src="/marsea-logo.png"
            alt="MARSEA"
            width={126}
            height={22}
            className="h-[22px] w-auto brightness-0 invert"
          />
        </header>
        <main className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole roles={["MEMBER"]}>
      <AppShell>{children}</AppShell>
    </RequireRole>
  );
}
