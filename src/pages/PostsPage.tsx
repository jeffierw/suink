import { Button } from "@/components/ui/button";
import { PostList } from "@/components/PostList";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function PostsPage() {
  const account = useCurrentAccount();
  const navigate = useNavigate();

  const goCreatePost = () => {
    if (!account) {
      console.log("test2", account);
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
    navigate("post");
  };

  const goCreateSite = () => {
    if (!account) {
      console.log("test2", account);
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
    navigate("/createSite");
  };
  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Posts</h1>
        <div>
          <Button className="mr-4" onClick={goCreatePost}>
            New post
          </Button>
          <Button variant="secondary" onClick={goCreateSite}>
            New site
          </Button>
        </div>
      </div>
      <PostList />
    </div>
  );
}
