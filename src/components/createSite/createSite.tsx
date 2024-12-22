import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loading } from "@/components/loading";
import { Icon } from "@iconify/react";
import { z } from "zod";
import { createSite, queryHash, waitForTransaction } from "@/contracts";
import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
import baseX from "base-x";
import { fromHex } from "@mysten/sui/utils";

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const b36 = baseX(BASE36);

type UploadedBlobInfo = {
  status: string;
  blobId: string;
  endEpoch: number;
  suiRef: string;
};

interface SiteContent {
  id: string;
  owner?: string;
}

const siteSchema = z.object({
  name: z
    .string()
    .nonempty("Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .nonempty("Description is required")
    .max(255, "Description must be 255 characters or less"),
  avatar: z.string().optional(),
});

export function CreateSite() {
  const currentAccount = useCurrentAccount();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    const fetchEvent = async () => {
      const event = await queryHash(
        "CFGAFt5MBKWxsaMb9hVYMMkamdEvxQAGaSsvvHfESh2x",
      );
      console.log("dadadasda", event);
    };

    fetchEvent();
    getSuinkUrl(
      "0x424f65f05f9d4327e93dc5b3b5dd142f48ec2a666dd84b5216205446cc4841da",
    );
  }, []); //

  function getSuinkUrl(id: string): string {
    console.log(
      "test",
      `https://${b36.encode(fromHex(id.substring(2)))}.walrus.site`,
    );

    return "https://" + b36.encode(fromHex(id.substring(2))) + ".walrus.site";
  }

  async function handleSubmit() {
    console.log("test", currentAccount);

    if (!currentAccount) {
      console.log("test2", currentAccount);
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
    if (!currentAccount.chains.includes("sui:testnet")) {
      console.log("test3", currentAccount.chains);
      toast({
        variant: "destructive",
        title: "Please choose sui testnet.",
      });
      return;
    }
    const siteData = { name, description, avatar };
    const validationResult = siteSchema.safeParse(siteData);
    if (!validationResult.success) {
      toast({
        variant: "destructive",
        title: validationResult.error.errors
          .map((error: any) => error.message)
          .join(", "),
      });
      return;
    }

    try {
      setIsLoading(true);
      const metadata = {
        description,
        avatar,
        template: 1,
      };

      // Walrus
      const response = await fetch(
        `${import.meta.env.VITE_WALRUS_PUBLISHER}/v1/store?epochs=200`,
        {
          method: "PUT",
          body: JSON.stringify(metadata),
        },
      );

      if (response.status === 200) {
        const info = await response.json();
        let metadataBlobId: string;

        if ("alreadyCertified" in info) {
          metadataBlobId = info.alreadyCertified.blobId;
        } else if ("newlyCreated" in info) {
          metadataBlobId = info.newlyCreated.blobObject.blobId;
        } else {
          toast({
            variant: "destructive",
            title: "Create Site error!",
          });
          throw new Error("Unexpected response format");
        }

        // 上链
        try {
          setIsLoading(true);
          if (metadataBlobId && currentAccount?.address) {
            const tx = await createSite(name, metadataBlobId);
            console.log("test", tx);
            await signAndExecuteTransaction(
              {
                transaction: tx as any,
              },
              {
                onSuccess: async (result) => {
                  toast({
                    className: "bg-green-100 border-green-400 text-green-700",
                    title: "Create Site successfully!",
                    description: (
                      <p>
                        Your site has been successfully created on the
                        blockchain. See the transaction at{" "}
                        <a
                          href={`https://${import.meta.env.VITE_CONTRACT_ENV}.suivision.xyz/txblock/${result.digest}`}
                          target="_blank"
                          style={{ textDecoration: "underline" }}
                        >
                          here
                        </a>
                        .
                      </p>
                    ),
                  });
                  console.log("Transaction successful:", result);
                  await waitForTransaction(result.digest);

                  const txRes = await queryHash(result.digest);
                  console.log("test txRes", txRes);

                  if (txRes.events) {
                    navigate(
                      `/dashboard/${(txRes.events[0].parsedJson as SiteContent)?.id}`,
                    );
                  } else {
                    toast({
                      variant: "destructive",
                      title: "Transaction failed.",
                    });
                    return;
                  }
                },
                onError: (error) => {
                  console.error("Transaction failed:", error);
                  toast({
                    variant: "destructive",
                    title: "Transaction failed.",
                  });
                },
              },
            );
          }
        } catch (error) {
          console.error("Error in handleMint:", error);
          toast({
            variant: "destructive",
            title:
              error instanceof Error ? error.message : "Create Site failed",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Card minted error!",
        });
        throw new Error("Create Site failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: error instanceof Error ? error.message : "Create Site failed",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "Please upload image file.",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
        // Reset input element to allow selecting the same file again
        event.target.value = "";
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_WALRUS_PUBLISHER}/v1/store?epochs=200`,
          {
            method: "PUT",
            body: file,
          },
        );

        console.log("eaad", response);

        if (response.status === 200) {
          const info = await response.json();
          console.log(info);

          let blobInfo: UploadedBlobInfo;
          if ("alreadyCertified" in info) {
            blobInfo = {
              status: "Already certified",
              blobId: info.alreadyCertified.blobId,
              endEpoch: info.alreadyCertified.endEpoch,
              suiRef: info.alreadyCertified.eventOrObject.Event.txDigest,
            };
            setAvatar(blobInfo.blobId);
          } else if ("newlyCreated" in info) {
            blobInfo = {
              status: "Newly created",
              blobId: info.newlyCreated.blobObject.blobId,
              endEpoch: info.newlyCreated.blobObject.storage.endEpoch,
              suiRef: info.newlyCreated.blobObject.id,
            };
            setAvatar(blobInfo.blobId);
          } else {
            throw new Error("Unexpected response format");
          }
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: error instanceof Error ? error.message : "Upload failed",
          action: <ToastAction altText="Try again">Try again</ToastAction>,
        });
      } finally {
        setIsLoading(false);
        event.target.value = "";
      }
    }
  };

  return (
    <div>
      {isLoading && <Loading />}
      <header className="px-5 text-sm  md:px-14 flex justify-between items-end py-2">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold text-2xl">Suink</span>
          </a>
        </div>
        <div>
          <ConnectButton />
        </div>
      </header>
      <div className="max-w-sm mx-auto mt-20 space-y-6">
        <h2 className="text-3xl mb-10 text-center">Create a new site</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="flex items-center">
            <Icon icon="mdi:web" className="w-4 h-4 mr-2" />
            Site Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            maxLength={100}
          />
          <span className="text-sm text-gray-500">{name.length}/100</span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="flex items-center">
            <Icon icon="mdi:card-bulleted-outline" className="w-4 h-4 mr-2" />
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 255))}
            maxLength={256}
          />
          <span className="text-sm text-gray-500">
            {description.length}/256
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="avatar" className="flex items-center">
            <Icon icon="mdi:image" className="w-4 h-4 mr-2" />
            Upload Avatar (Optional)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {avatar && (
              <>
                <img
                  src={`${import.meta.env.VITE_WALRUS_AGGREGATOR}/v1/${avatar}`}
                  alt="Uploaded Avatar"
                  className="w-24 h-24"
                />
              </>
            )}
            <Label
              htmlFor="avatar"
              className="cursor-pointer flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Label>
          </div>
        </div>
        <div onClick={handleSubmit} className="flex">
          <Button type="submit">Create</Button>
        </div>
      </div>
    </div>
  );
}
