"use client";

import { useState, useEffect, useCallback } from "react";
import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";
import { getTestnetBalance } from "../lib/stellar";

let walletKit: StellarWalletsKit | null = null;

function getWalletKit() {
  if (typeof window === "undefined") {
    throw new Error("Wallet access is only available in the browser.");
  }

  if (!walletKit) {
    walletKit = new StellarWalletsKit({
      selectedWalletId: FREIGHTER_ID,
      network: WalletNetwork.TESTNET,
      modules: [new FreighterModule()],
    });
  }

  return walletKit;
}

export function useStellarWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchBalance = useCallback(async (pubKey: string) => {
    const bal = await getTestnetBalance(pubKey);
    setBalance(bal);
  }, []);

  useEffect(() => {
    getWalletKit();

    // Try to restore session if already connected
    const savedKey = localStorage.getItem("stellar_pubkey");
    if (savedKey) {
      void Promise.resolve().then(() => {
        setPublicKey(savedKey);
        void fetchBalance(savedKey);
      });
    }
  }, [fetchBalance]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Actually authModal opens the kit UI, we can also use fetchAddress if we set Freighter as default
      const { address } = await getWalletKit().getAddress();
      setPublicKey(address);
      localStorage.setItem("stellar_pubkey", address);
      await fetchBalance(address);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await getWalletKit().disconnect();
    } catch (error) {
      console.error(error);
    }
    setPublicKey(null);
    setBalance("0");
    localStorage.removeItem("stellar_pubkey");
  };

  const signTransaction = async (xdr: string) => {
    if (!publicKey) throw new Error("Wallet not connected");
    const { signedTxXdr } = await getWalletKit().signTransaction(xdr, {
      networkPassphrase: WalletNetwork.TESTNET,
      address: publicKey,
    });
    return signedTxXdr;
  };

  return {
    publicKey,
    balance,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
    fetchBalance,
  };
}
