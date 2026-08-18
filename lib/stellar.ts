import { Horizon, TransactionBuilder, Networks, Asset, Operation, TimeoutInfinite, Transaction } from "@stellar/stellar-sdk";

// Define the testnet horizon URL
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const server = new Horizon.Server(HORIZON_URL);
const NETWORK_PASSPHRASE = Networks.TESTNET;

export async function getTestnetBalance(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find((b) => b.asset_type === "native");
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
}

export async function buildTransaction(
  senderPublicKey: string,
  recipientPublicKey: string,
  amount: string
) {
  try {
    const sourceAccount = await server.loadAccount(senderPublicKey);
    
    const transaction = new TransactionBuilder(sourceAccount, {
      fee: "100", // Default base fee, or you can fetch it
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.payment({
          destination: recipientPublicKey,
          asset: Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(30)
      .build();

    return transaction;
  } catch (error) {
    console.error("Error building transaction:", error);
    throw error;
  }
}

export async function submitTransaction(signedTxXdr: string) {
  try {
    const transaction = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const response = await server.submitTransaction(transaction as Transaction);
    return response;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    throw error;
  }
}

export async function fetchRecentPayments(publicKey: string) {
  try {
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .order("desc")
      .limit(10)
      .call();
      
    return payments.records;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
}

