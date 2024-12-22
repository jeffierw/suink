import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useSite } from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import {
  editSite,
  getObject,
  // getSubdomainIsSubmitted,
  queryHash,
  waitForTransaction,
} from "@/contracts";
import { operateData } from "@/lib/utils";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Upload } from "lucide-react";
import { Label } from "./ui/label";
import { ToastAction } from "./ui/toast";
import { toast } from "@/hooks/use-toast";
import { Loading } from "./loading";
import { Skeleton } from "./ui/skeleton";

type UploadedBlobInfo = {
  status: string;
  blobId: string;
  endEpoch: number;
  suiRef: string;
};

const generalFormSchema = z.object({
  name: z
    .string()
    .nonempty("Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z.string().optional(),
  avatar: z.string().optional(),
});

// const subdomainFormSchema = z.object({
//   subdomain: z.string().min(1),
// });

type GeneralFormValues = z.infer<typeof generalFormSchema>;
// type SubdomainFormValues = z.infer<typeof subdomainFormSchema>;

export function SiteSettings() {
  const { currentSite } = useSite();
  const account = useCurrentAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [
    // subdomain,
    // setSubdomain
  ] = useState("");
  const [b36addr, setB36addr] = useState();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const generalForm = useForm<GeneralFormValues>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      name: currentSite.name,
      description: "",
      avatar: "",
    },
  });

  const { reset } = generalForm;

  useEffect(() => {
    const fetchSiteDetails = async () => {
      setIsPending(true);
      try {
        if (currentSite && currentSite?.id && account?.address) {
          const res: any = await getObject(currentSite.id);
          console.log("test111", res);

          if (
            res?.owner.AddressOwner === account?.address &&
            res?.content.type ===
              `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::Suink`
          ) {
            const walrusData = await fetch(
              `${import.meta.env.VITE_WALRUS_AGGREGATOR}/v1/${res?.content?.fields?.metadata}`,
            );
            const JSONData = await operateData(walrusData);
            console.log("Fetched JSON Data:", JSONData);
            setName(res?.content?.fields?.name);
            setAvatar(JSONData.avatar);
            setDescription(JSONData.description);
            setB36addr(res?.content?.fields?.b36addr);
          }
        }
      } catch (error) {
        console.error("Error fetching site details:", error);
      } finally {
        setIsPending(false);
      }
    };

    fetchSiteDetails();
  }, [account, currentSite, reset]);

  // const subdomainForm = useForm<SubdomainFormValues>({
  //   resolver: zodResolver(subdomainFormSchema),
  //   defaultValues: {
  //     subdomain: currentSite.subdomain.split(".")[0],
  //   },
  // });

  // function onGeneralSubmit(data: GeneralFormValues) {
  //   console.log(data);
  // }

  // function onSubdomainSubmit(data: SubdomainFormValues) {
  //   console.log(data);
  // }

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

  const handleSubmit = async () => {
    if (!account) {
      toast({
        variant: "destructive",
        title: "Please connect wallet~",
      });
      return;
    }
    if (!account.chains.includes("sui:testnet")) {
      console.log("test3", account.chains);
      toast({
        variant: "destructive",
        title: "Please choose sui testnet.",
      });
      return;
    }
    const siteData = { name, description, avatar };
    const validationResult = generalFormSchema.safeParse(siteData);
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
          if (metadataBlobId && account?.address && currentSite) {
            const tx = await editSite(currentSite.id, name, metadataBlobId);
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
                        Your site has been successfully edited on the
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
                  toast({
                    className: "bg-green-100 border-green-400 text-green-700",
                    title: "Set Site successfully!",
                  });
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
  };

  // const handleSubdomain = async () => {
  //   const submitted = await getSubdomainIsSubmitted(subdomain);
  //   console.log("test", submitted);
  //   if (submitted) {
  //     toast({
  //       variant: "destructive",
  //       title: "This subdomain is Unavailable.",
  //     });
  //   }
  //   // TODO
  // };

  return (
    <>
      {isLoading && <Loading />}
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="name" className="flex items-center">
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
              <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="description" className="flex items-center">
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
              <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="avatar" className="flex items-center">
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
              <Button onClick={handleSubmit}>Save</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subdomain</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                You can visit your site at{" "}
                <a
                  href={`https://${b36addr}.walrus.site`}
                  target="_blank"
                  className="text-blue-500"
                >{`https://${b36addr}.walrus.site`}</a>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="flex items-center pr-3">
                  Or set a free subdomain at&nbsp;
                  <a
                    href="https://testnet.suins.io/"
                    target="_blank"
                    className="text-blue-500"
                  >
                    https://testnet.suins.io
                  </a>
                </span>
                {/* <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.slice(0, 63))}
                  maxLength={63}
                  style={{
                    minWidth: "100px",
                    maxWidth: "200px",
                    overflow: "auto",
                  }}
                />
                <span className="flex items-center px-3">.walrus.site</span> */}
              </div>
              {/* <Button onClick={handleSubdomain}>Save</Button> */}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
