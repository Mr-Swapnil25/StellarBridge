import { Networks, Operation, TransactionBuilder, Address, nativeToScVal } from "@stellar/stellar-sdk";
import { Server } from "@stellar/stellar-sdk/rpc";
import { walletKit } from "./wallets.js";

export const TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const rpcServer = new Server(TESTNET_RPC_URL);

export type TransactionStatus =
  | { state: "idle" }
  | { state: "building" }
  | { state: "awaiting-signature" }
  | { state: "submitted"; hash: string }
  | { state: "confirmed"; hash: string }
  | { state: "failed"; message: string };

export async function recordSplit(
  contractId: string,
  payer: string,
  recipient: string,
  amountStroops: bigint,
  onStatus: (status: TransactionStatus) => void,
): Promise<string> {
  try {
    onStatus({ state: "building" });
    const account = await rpcServer.getAccount(payer);
    const operation = Operation.invokeContractFunction({
      contract: contractId,
      function: "record_split",
      args: [
        new Address(payer).toScVal(),
        new Address(recipient).toScVal(),
        nativeToScVal(amountStroops, { type: "i128" }),
      ],
    });
    const transaction = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();
    const simulated = await rpcServer.simulateTransaction(transaction);
    if ("error" in simulated) {
      throw new Error(simulated.error);
    }
    const prepared = await rpcServer.prepareTransaction(transaction);
    onStatus({ state: "awaiting-signature" });
    const { signedTxXdr } = await walletKit.signTransaction(
      prepared.toXDR(),
      { networkPassphrase: NETWORK_PASSPHRASE, address: payer },
    );
    const submitted = await rpcServer.sendTransaction(
      TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE),
    );
    if (submitted.status === "ERROR") {
      throw new Error(submitted.errorResult?.toString() ?? "Transaction was rejected");
    }
    onStatus({ state: "submitted", hash: submitted.hash });
    let result = await rpcServer.getTransaction(submitted.hash);
    while (result.status === "NOT_FOUND") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result = await rpcServer.getTransaction(submitted.hash);
    }
    if (result.status !== "SUCCESS") {
      throw new Error(`Transaction ended with status ${result.status}`);
    }
    onStatus({ state: "confirmed", hash: submitted.hash });
    return submitted.hash;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contract call failed";
    onStatus({ state: "failed", message });
    throw error;
  }
}
