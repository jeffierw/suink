import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { toast } from "@/hooks/use-toast";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BlogEditor from "@/components/BlogEditor";
import { useEffect, useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { Loading } from "@/components/loading";
import { createPost, editPost, waitForTransaction } from "@/contracts";
import { useSite } from "@/components/DashboardLayout";
import { getObject } from "@/contracts";
import { operateData } from "@/lib/utils";
import { Skeleton } from "@radix-ui/themes";

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const account = useCurrentAccount();
  const navigate = useNavigate();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { updateCurrentPosts } = useSite();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const postId = queryParams.get("postId");

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  // const [contentHash, setContentHash] = useState("");
  const [initialValue, setInitialValue] = useState("");

  console.log("Post ID:", postId);

  useEffect(() => {
    if (postId && account?.address) {
      const fetchObject = async () => {
        setIsPending(true);
        try {
          const res: any = await getObject(postId);
          console.log("test", res);
          if (
            res &&
            res.owner &&
            res?.owner.AddressOwner === account?.address &&
            res?.content.type ===
              `${import.meta.env.VITE_CONTRACT_ADDRESS}::post::Post`
          ) {
            const walrusData = await fetch(
              `${import.meta.env.VITE_WALRUS_AGGREGATOR}/v1/${res?.content?.fields?.content}`,
            );
            const JSONData = await operateData(walrusData);
            console.log("Fetched JSON Data:", JSONData);
            setTitle(JSONData.title);
            setInitialValue(JSONData.content);

            // setTitle(res?.content?.fields?.title);
            // setContentHash(res?.content?.fields?.content);
          }
        } catch (error) {
          console.error("Error fetching post:", error);
        } finally {
          setIsPending(false);
        }
      };
      fetchObject();
    }
  }, [postId, account?.address]);

  // useEffect(() => {
  //   if (contentHash) {
  //     const fetchContent = async () => {
  //       setIsPending(true);
  //       try {
  //         const res = await fetch(
  //           `${import.meta.env.VITE_WALRUS_AGGREGATOR}/v1/${contentHash}`,
  //         );
  //         const JSONData = await operateData(res);
  //         console.log("Fetched JSON Data:", JSONData);
  //         setInitialValue(JSONData.content);
  //       } catch (error) {
  //         console.error("Error fetching content:", error);
  //       } finally {
  //         setIsPending(false);
  //       }
  //     };
  //     fetchContent();
  //   }
  // }, [contentHash]);

  const goBack = () => {
    navigate(-1);
    updateCurrentPosts();
  };

  const handleSaveContent = async (markdown: string) => {
    if (!account) {
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Please input post title~",
      });
      return;
    }
    if (!markdown.trim()) {
      toast({
        variant: "destructive",
        title: "Please input post content~",
      });
      return;
    }
    console.log("Saved Markdown:", markdown);
    try {
      setIsLoading(true);
      const postData = {
        title,
        content: markdown,
      };
      const res = await fetch(
        `${import.meta.env.VITE_WALRUS_PUBLISHER}/v1/store?epochs=200`,
        {
          method: "PUT",
          body: JSON.stringify(postData),
        },
      );
      if (res.status === 200) {
        const info = await res.json();
        let postDataBlobId: string;

        if ("alreadyCertified" in info) {
          postDataBlobId = info.alreadyCertified.blobId;
        } else if ("newlyCreated" in info) {
          postDataBlobId = info.newlyCreated.blobObject.blobId;
        } else {
          toast({
            variant: "destructive",
            title: "Walrus upload error!",
          });
          throw new Error("Unexpected response format");
        }
        if (postDataBlobId) {
          if (postId) {
            handleEditPost(id as string, postId, title, postDataBlobId);
          } else {
            handleCreatePost(id as string, title, postDataBlobId);
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Walrus upload error!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Walrus upload failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = async (
    siteId: string,
    postId: string,
    title: string,
    contentHash: string,
  ) => {
    const tx = await editPost(siteId, postId, title, contentHash);
    console.log("test", tx, siteId, postId, title, contentHash);
    await signAndExecuteTransaction(
      {
        transaction: tx as any,
      },
      {
        onSuccess: async (result) => {
          console.log("Transaction successful:", result);
          await waitForTransaction(result.digest);
          toast({
            className: "bg-green-100 border-green-400 text-green-700",
            title: "Edit Post successfully!",
          });
        },
      },
    );
  };

  const handleCreatePost = async (
    siteId: string,
    title: string,
    contentHash: string,
  ) => {
    const tx = await createPost(siteId, title, contentHash);
    console.log("test", tx, siteId, title, contentHash);
    await signAndExecuteTransaction(
      {
        transaction: tx as any,
      },
      {
        onSuccess: async (result) => {
          console.log("Transaction successful:", result);
          await waitForTransaction(result.digest);
          toast({
            className: "bg-green-100 border-green-400 text-green-700",
            title: "Create Post successfully!",
          });
        },
      },
    );
  };

  return (
    <>
      {isLoading && <Loading />}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white/50 px-4 backdrop-blur-lg">
        <button
          onClick={goBack}
          className="focus-visible:ring-ring justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground aria-expanded:bg-accent h-9 px-4 py-2 inline-flex items-center gap-0.5 pl-2"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Back</span>
        </button>
        <ConnectButton />
      </header>
      {isPending ? (
        <>
          <Skeleton
            className="mb-4 mx-auto max-w-screen-sm"
            style={{ height: "60px" }}
          />
          <Skeleton
            className="mx-auto max-w-screen-lg"
            style={{ height: "600px" }}
          />
        </>
      ) : (
        <div className="mx-auto max-w-screen-lg">
          <div className="p-5">
            {/* title */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-5xl font-bold outline-none"
              />
            </div>
            {/* content */}
            <div className="relative grow">
              <BlogEditor
                initialValue={initialValue}
                onSave={handleSaveContent}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
