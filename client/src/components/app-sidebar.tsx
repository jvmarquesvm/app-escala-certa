import { Link, useLocation } from "wouter";
import { CalendarDays, ListChecks, Plus, Users, UserCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LogoMark } from "@/components/logo";

const items = [
  { title: "Próximos cultos", url: "/", icon: CalendarDays, testId: "link-dashboard" },
  { title: "Nova escala", url: "/nova-escala", icon: Plus, testId: "link-nova-escala" },
  { title: "Todas as escalas", url: "/escalas", icon: ListChecks, testId: "link-escalas" },
  { title: "Músicos", url: "/musicos", icon: Users, testId: "link-musicos" },
  { title: "Minhas escalas", url: "/minhas-escalas", icon: UserCheck, testId: "link-minhas-escalas" },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <LogoMark />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-sm">Escala Certa</span>
            <span className="text-xs text-muted-foreground">Ministério de louvor</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} data-testid={item.testId}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">
          Organize os cultos e escale sua equipe em minutos.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
