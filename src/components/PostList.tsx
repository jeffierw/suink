import { useSite } from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { deletePost, waitForTransaction } from "@/contracts";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function PostList() {
  const { currentPosts, currentSite, updateCurrentPosts } = useSite();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const navigate = useNavigate();
  const handleEditPost = (postId: string) => {
    navigate(`post?postId=${postId}`);
  };

  const handleDeletePost = async (id: string, postId: string) => {
    const tx = await deletePost(id, postId);
    console.log("test", tx, id, postId);
    await signAndExecuteTransaction(
      {
        transaction: tx as any,
      },
      {
        onSuccess: async (result) => {
          console.log("Transaction successful:", result);
          await waitForTransaction(result.digest);
          updateCurrentPosts();
          toast({
            className: "bg-green-100 border-green-400 text-green-700",
            title: "Delete Post successfully!",
          });
        },
      },
    );
  };

  if (
    currentSite &&
    currentSite?.posts?.size !== "0" &&
    !currentPosts &&
    !currentPosts?.nodes
  ) {
    return (
      <div className="flex flex-col justify-center items-center">
        <Icon icon="solar:ghost-bold" className="text-4xl text-gray-300" />
        <p className="text-gray-400 text-lg">Loading Posts...</p>
      </div>
    );
  }

  return currentSite && currentSite?.posts?.size === "0" ? (
    <div className="flex flex-col justify-center items-center">
      <Icon icon="solar:ghost-bold" className="text-4xl text-gray-300" />
      <p className="text-gray-400 text-lg">No Post Yet</p>
    </div>
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          {/* <TableHead>Published</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {currentPosts?.nodes?.map((post: any) => (
          <TableRow key={post.name.json}>
            <TableCell className="font-medium">{post.value.json}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button onClick={() => handleEditPost(post.name.json)}>
                  编辑
                </Button>
                <Button
                  onClick={() =>
                    handleDeletePost(currentSite.id, post.name.json)
                  }
                  variant="secondary"
                >
                  删除
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
