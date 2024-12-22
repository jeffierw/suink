import { Settings, FileText } from "lucide-react";
import { Link, useParams, useLocation } from "react-router-dom";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSite } from "@/components/DashboardLayout";
import { ConnectButton } from "@mysten/dapp-kit";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSidebar() {
  const { id } = useParams<{ id: string }>();
  console.log("tets", id);
  const location = useLocation();
  const { currentSite, setSite, sites } = useSite();
  console.log("sidebar", sites, currentSite);

  useEffect(() => {
    if (sites) {
      const site = sites.find((s: any) => s.id === id);
      setSite(site);
    }
  }, [id, sites]);

  // function createNewSite() {
  //   navigate("/createSite");
  // }

  return sites && currentSite ? (
    <Sidebar collapsible="icon" className="w-64 border-r">
      <SidebarHeader className="border-b p-4">
        <a href="/" className="flex justify-center items-center space-x-2">
          <span className="font-bold text-2xl">Suink</span>
        </a>
        <ConnectButton />
        <Select
          value={currentSite.id}
          onValueChange={(value) => {
            const site: any = sites.find((s: any) => s.id === value);
            if (site) {
              setSite(site);
              window.location.href = `/dashboard/${site.id}`;
            }
          }}
        >
          <SelectTrigger>
            <SelectValue>Site：{currentSite.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sites &&
              sites.map((site: any) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === `/dashboard/${id}`}
              tooltip="Posts"
            >
              <Link to={`/dashboard/${id}`}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Posts</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === `/dashboard/${id}/settings`}
              tooltip="Settings"
            >
              <Link to={`/dashboard/${id}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  ) : (
    <Skeleton className="w-full min-h-screen" />
  );
}
