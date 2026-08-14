import {
  Calendar,
  Home,
  Inbox,
  Lock,
  LockKeyhole,
  Mail,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

// Menu items.
const tabbars = [
  {
    name: "Passwords",
    icon: Lock,
    url: "/",
  },
  {
    name: "Emails",
    icon: Mail,
    url: "/",
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex items-center gap-3 px-4 py-3 border-b">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <LockKeyhole className="stroke-2 w-6 h-6" />
          <span className="select-none">NexPSWM</span>
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabbars.map((tabbar) => (
                <SidebarMenuItem key={tabbar.name}>
                  <SidebarMenuButton asChild>
                    <a href={tabbar.url}>
                      <tabbar.icon />
                      <span>{tabbar.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem></SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="cursor-pointer ">
              <Button
                variant={"outline"}
                className="justify-start text-destructive [&:hover,&:focus,&:active]:text-destructive"
              >
                <Settings />
                <span>App Timeout</span>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
