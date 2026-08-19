import { rpcServer } from "./contractClient.js";

export type SplitEvent = {
  id: string;
  ledger: number;
  amount: string;
  topic: string;
};

export async function getSplitEvents(contractId: string, startLedger?: number): Promise<SplitEvent[]> {
  const response = startLedger === undefined
    ? await rpcServer.getEvents({
        cursor: "",
        filters: [{ type: "contract", contractIds: [contractId] }],
        limit: 50,
      })
    : await rpcServer.getEvents({
        startLedger,
        filters: [{ type: "contract", contractIds: [contractId] }],
        limit: 50,
      });
  return response.events.map((event) => ({
    id: event.id,
    ledger: event.ledger,
    amount: event.value.toString(),
    topic: event.topic.map((value) => value.toString()).join(" / "),
  }));
}

export function watchSplitEvents(
  contractId: string,
  onEvents: (events: SplitEvent[]) => void,
  intervalMs = 4000,
) {
  let stopped = false;
  let lastLedger: number | undefined;

  const poll = async () => {
    if (stopped) return;
    try {
      const events = await getSplitEvents(contractId, lastLedger);
      if (events.length > 0) {
        lastLedger = Math.max(...events.map((event) => event.ledger)) + 1;
        onEvents(events);
      }
    } catch (error) {
      console.error("Event polling failed", error);
    } finally {
      if (!stopped) setTimeout(poll, intervalMs);
    }
  };

  void poll();
  return () => {
    stopped = true;
  };
}
