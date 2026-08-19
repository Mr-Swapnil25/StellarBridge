import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/stellar-wallets-kit.js";
import { WalletNetwork } from "@creit.tech/stellar-wallets-kit/types.js";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo.module.js";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter.module.js";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana.module.js";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr.module.js";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull.module.js";

export const walletKit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    modules: [
      new FreighterModule(),
      new AlbedoModule(),
      new HanaModule(),
      new LobstrModule(),
      new xBullModule(),
    ],
  });

export async function connectWallet() {
  const { address } = await walletKit.getAddress();
  return address;
}
