import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toast } from "@/hooks/use-toast";
import { getSitesOfAddress } from "@/contracts";
import { useEffect, useState } from "react";
export function Section() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const [sites, setSites] = useState<any>();

  useEffect(() => {
    if (currentAccount?.address) {
      const fetchSite = async () => {
        let data: any = await getSitesOfAddress(currentAccount?.address);
        console.log("fetch", data, window.location.pathname);
        // if (!data.length && window.location.pathname !== "/") {
        //   navigate("/createSite");
        //   return;
        // }
        data = data.map((i: any) => {
          return {
            id: i?.data?.objectId,
            name: i?.data?.content?.fields.name,
            posts: i?.data?.content?.fields.posts.fields,
          };
        });
        setSites(data);
      };
      fetchSite();
    }
  }, [currentAccount]);

  const startWrite = () => {
    if (currentAccount) {
      if (sites && sites.length > 0) {
        const id = sites[0]?.id;
        if (id) {
          navigate(`/dashboard/${id}`);
        }
      } else {
        navigate("/createSite");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
  };

  return (
    <section className="py-32 sm:py-40 px-6 min-h-[calc(100vh-118px)]">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Write Your Life
          <br />
          with Decentralized World.
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-2xl">
          An open-source creative community written on the blockchain.
        </p>
        <div className="flex gap-4">
          <Button onClick={startWrite}>
            Start Writing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {/* <Button variant="outline" size="lg">
            Explore Posts <ArrowRight className="ml-2 h-4 w-4" />
          </Button> */}
        </div>
      </div>
    </section>
  );
}
