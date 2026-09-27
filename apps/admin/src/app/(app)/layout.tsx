"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CreditCard,
  Dumbbell,
  IdCard,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ScanLine,
  Settings,
  Users,
} from "lucide-react";
import { RequireRole } from "@/components/require-role";
import { useAuth } from "@/hooks/use-auth";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Clases", icon: CalendarDays },
  { href: "/disciplines", label: "Disciplinas", icon: Dumbbell },
  { href: "/plans", label: "Planes", icon: CreditCard },
  { href: "/users", label: "Usuarios", icon: Users },
  { href: "/memberships", label: "Membresías", icon: IdCard },
  { href: "/check-in", label: "Check-in", icon: ScanLine },
  { href: "/settings", label: "Configuración", icon: Settings },
];

const SUPER_ADMIN_ITEM = {
  href: "/gyms",
  label: "Gimnasios",
  icon: Building2,
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

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
  const { profile, payload, logout } = useAuth();

  const items =
    payload?.role === "SUPER_ADMIN"
      ? [...NAV_ITEMS, SUPER_ADMIN_ITEM]
      : NAV_ITEMS;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
              Gym Management
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                    {profile ? initials(profile.fullName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-sm font-medium">
                    {profile?.fullName ?? "Cargando..."}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {payload ? ROLE_LABEL[payload.role] : ""}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden"
                      />
                    }
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top">
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireRole roles={["ADMIN", "SUPER_ADMIN"]}>
      <AppShell>{children}</AppShell>
    </RequireRole>
  );
}
