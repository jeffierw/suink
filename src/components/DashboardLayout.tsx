import { Outlet, useLocation, useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { getPostsList, getSitesOfAddress } from "@/contracts";
import { useState, useEffect, useContext, createContext } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface Site {
  id: string;
  name: string;
  posts: { size: string; id: {} };
  subdomain?: string;
}

interface SiteContextType {
  currentPosts: any;
  currentSite: Site;
  setSite: (site: any) => void;
  sites: [];
  updateCurrentPosts: () => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export default function DashboardLayout() {
  const location = useLocation();
  const shouldShowSidebar =
    !location.pathname.includes("/dashboard/") ||
    !location.pathname.includes("/post");

  const { id } = useParams<{ id: string }>();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  console.log("test", id);

  const [currentSite, setCurrentSite] = useState<any>({});
  const [currentPosts, setCurrentPosts] = useState<any>();
  const [sites, setSites] = useState<any>();

  useEffect(() => {
    if (account?.address) {
      const fetchSite = async () => {
        let data: any = await getSitesOfAddress(account?.address);
        console.log("fetch", data, window.location.pathname);
        if (!data.length && window.location.pathname !== "/") {
          navigate("/createSite");
          return;
        }
        data = data.map((i: any) => {
          return {
            id: i?.data?.objectId,
            name: i?.data?.content?.fields.name,
            posts: i?.data?.content?.fields.posts.fields,
          };
        });
        setSites(data);
        const site = data.find((s: any) => s.id === id);
        if (site) {
          setCurrentSite(site);
        }
      };
      fetchSite();
    }
  }, [account, id]);

  useEffect(() => {
    if (currentSite) {
      const fetchPostList = async () => {
        updateCurrentPosts();
      };
      fetchPostList();
    }
  }, [currentSite]);

  const updateCurrentPosts = async () => {
    if (currentSite && currentSite?.posts?.size !== "0") {
      const postList = await getPostsList(currentSite?.posts?.id?.id, null);
      setCurrentPosts(postList);
    } else {
      setCurrentPosts([]);
    }
  };

  return (
    <SiteContext.Provider
      value={{
        currentPosts,
        currentSite,
        setSite: setCurrentSite,
        sites,
        updateCurrentPosts,
      }}
    >
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {shouldShowSidebar && <DashboardSidebar />}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used within DashboardLayout");
  return context;
}
