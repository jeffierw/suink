import { bcs } from "@mysten/sui/bcs";
import { Transaction as TX } from "@mysten/sui/transactions";
import { suiClient, suiGraphQLClient } from "@/networkConfig";
import { graphql } from "@mysten/sui/graphql/schemas/2024.4";
import { isValidSuiAddress } from "@mysten/sui/utils";

const createSite = async (name: string, metadata_blob: string) => {
  console.log("test", name, metadata_blob);

  const tx = new TX();
  tx.moveCall({
    target: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::create_site`,
    arguments: [
      tx.pure(bcs.string().serialize(name).toBytes()),
      tx.pure(bcs.string().serialize(metadata_blob).toBytes()),
    ],
  });
  return tx;
};

const editSite = async (siteId: string, name: string, metadata: string) => {
  console.log("test", siteId, name, metadata);

  const tx = new TX();
  tx.moveCall({
    target: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::update_site`,
    arguments: [
      tx.object(siteId),
      tx.pure(bcs.string().serialize(name).toBytes()),
      tx.pure(bcs.string().serialize(metadata).toBytes()),
    ],
  });
  return tx;
};

const createPost = async (
  siteId: string,
  title: string,
  contentHash: string,
) => {
  console.log("create post", siteId, title, contentHash);

  const tx = new TX();
  tx.moveCall({
    target: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::create_post`,
    arguments: [
      tx.object(siteId),
      tx.pure(bcs.string().serialize(title).toBytes()),
      tx.pure(bcs.string().serialize(contentHash).toBytes()),
      tx.object("0x6"),
    ],
  });
  return tx;
};

const editPost = async (
  siteId: string,
  postId: string,
  title: string,
  contentHash: string,
) => {
  console.log("edit post", siteId, postId, title, contentHash);

  const tx = new TX();
  tx.moveCall({
    target: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::update_post`,
    arguments: [
      tx.object(siteId),
      tx.object(postId),
      tx.pure(bcs.string().serialize(title).toBytes()),
      tx.pure(bcs.string().serialize(contentHash).toBytes()),
      tx.object("0x6"),
    ],
  });
  return tx;
};

const deletePost = async (siteId: string, postId: string) => {
  console.log("delete post", siteId, postId);

  const tx = new TX();
  tx.moveCall({
    target: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::delete_post`,
    arguments: [tx.object(siteId), tx.object(postId)],
  });
  return tx;
};

const getPostsList = async (
  tableId: string,
  endCursor: string | null = null,
) => {
  const query = graphql(`
    query($endCursor: String) {
      owner(address: "${tableId}") {
        dynamicFields(
          first: 50
          after: $endCursor
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name {
              json
            }
            value {
              ... on MoveValue {
                json
              }
            }
          }
        }
      }
    }
  `);
  const result = await suiGraphQLClient.query({
    query,
    variables: { endCursor },
  });
  return {
    nodes: result.data?.owner?.dynamicFields?.nodes,
    pageInfo: result.data?.owner?.dynamicFields?.pageInfo,
  };
};

const waitForTransaction = async (digest: string) => {
  await suiClient.waitForTransaction({ digest });
};

const queryHash = async (digest: string) => {
  const txRes = await suiClient.getTransactionBlock({
    digest,
    options: { showEvents: true },
  });
  return txRes;
};

const queryEvent = async (eventType: string, sender: string) => {
  console.log("test", eventType);
  console.log("test", sender);
  return (
    await suiGraphQLClient.query({
      query: graphql(`
        {
          events(
            filter: {
              eventType: "${eventType}",
              sender: "${sender}"
            }
          ) {
            nodes {
              timestamp
              contents {
                json
              }
            }
          }
        }
      `),
    })
  ).data?.events;
};

const getSitesOfAddress = async (address: string) => {
  console.log("dada", address);

  if (!isValidSuiAddress(address)) {
    throw new Error("Invalid Sui address");
  }
  const res = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      MatchAll: [
        {
          StructType: `${import.meta.env.VITE_CONTRACT_ADDRESS}::suink::Suink`,
        },
        {
          AddressOwner: address,
        },
      ],
    },
    options: {
      showOwner: true,
      showType: true,
      showContent: true,
    },
  });
  return res.data || [];
};

const getObject = async (id: string) => {
  const res = await suiClient.getObject({
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
  return res.data || [];
};

const getSubdomainIsSubmitted = async (name: string) => {
  console.log("test", name);
  const res1 = await suiClient.getDynamicFieldObject({
    parentId:
      "0x9d50c5992dc24ca596bbe6c12c67915d8c0665a226f5c6ae935e7abe4e453a17",
    name: {
      type: "0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93::domain::Domain",
      value: ["sui", name],
    },
  });
  const res2 = await suiClient.getDynamicFieldObject({
    parentId:
      "0xb120c0d55432630fce61f7854795a3463deb6e3b443cc4ae72e1282073ff56e4",
    name: {
      type: "0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93::domain::Domain",
      value: ["sui", name],
    },
  });
  // submitted
  if ((res1 && res1.data) || (res2 && res2.data)) {
    return true;
  } else {
    return false;
  }
};

export {
  createSite,
  editSite,
  createPost,
  editPost,
  deletePost,
  queryEvent,
  queryHash,
  getObject,
  waitForTransaction,
  getSitesOfAddress,
  getPostsList,
  getSubdomainIsSubmitted,
};
