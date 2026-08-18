"use client";

import { useState, useEffect, useCallback } from "react";
import { StellarWalletsKit, Networks, KitEventType } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule, FREIGHTER_ID } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { getTestnetBalance } from "../lib/stellar";

let isKitInitialized = false;

export function useStellarWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchBalance = useCallback(async (pubKey: string) => {
    const bal = await getTestnetBalance(pubKey);
    setBalance(bal);
  }, []);

  useEffect(() => {
    if (!isKitInitialized && typeof window !== "undefined") {
      StellarWalletsKit.init({
        modules: [new FreighterModule()],
      });
      StellarWalletsKit.setNetwork(Networks.TESTNET);
      StellarWalletsKit.setWallet(FREIGHTER_ID);
      isKitInitialized = true;
    }
    
    // Try to restore session if already connected
    const savedKey = localStorage.getItem("stellar_pubkey");
    if (savedKey) {
      setPublicKey(savedKey);
      fetchBalance(savedKey);
    }
  }, [fetchBalance]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      // Actually authModal opens the kit UI, we can also use fetchAddress if we set Freighter as default
      const { address } = await StellarWalletsKit.fetchAddress();
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
      await StellarWalletsKit.disconnect();
    } catch (error) {
      console.error(error);
    }
    setPublicKey(null);
    setBalance("0");
    localStorage.removeItem("stellar_pubkey");
  };

  const signTransaction = async (xdr: string) => {
    if (!publicKey) throw new Error("Wallet not connected");
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
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
