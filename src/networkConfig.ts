import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import {
  DEVNET_COUNTER_PACKAGE_ID,
  TESTNET_COUNTER_PACKAGE_ID,
  MAINNET_COUNTER_PACKAGE_ID,
} from "./constants.ts";
import { createNetworkConfig } from "@mysten/dapp-kit";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        counterPackageId: DEVNET_COUNTER_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        counterPackageId: TESTNET_COUNTER_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        counterPackageId: MAINNET_COUNTER_PACKAGE_ID,
      },
    },
  });

const suiClient = new SuiClient({
  url: `https://fullnode.${import.meta.env.VITE_CONTRACT_ENV}.sui.io:443`,
});

const suiGraphQLClient = new SuiGraphQLClient({
  url: `https://sui-${import.meta.env.VITE_CONTRACT_ENV}.mystenlabs.com/graphql`,
});

export {
  useNetworkVariable,
  useNetworkVariables,
  networkConfig,
  suiClient,
  suiGraphQLClient,
};
