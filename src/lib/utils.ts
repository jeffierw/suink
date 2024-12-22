import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SuiClient } from "@mysten/sui/client";
import { networkConfig } from "@/networkConfig";
export const SUI_CLIENT = new SuiClient({ url: networkConfig.testnet.url });

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function operateData(response: any) {
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader?.read()!;
    if (value) {
      chunks.push(value);
    }
    done = readerDone;
  }

  // 将 Uint8Array[] 转换为单个 Uint8Array
  const combinedChunks = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    combinedChunks.set(chunk, offset);
    offset += chunk.length;
  }

  // 1. 将数据转换为文本
  const text = new TextDecoder().decode(combinedChunks);
  const res = JSON.parse(text);
  return res;
}
