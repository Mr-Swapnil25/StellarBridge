"use client";

import { useState, useMemo, useEffect } from "react";
import { useStellarWallet } from "../hooks/useStellarWallet";
import { buildTransaction, submitTransaction, fetchRecentPayments } from "../lib/stellar";

export default function Home() {
  const {
    publicKey,
    balance,
    isConnecting,
    connect,
    disconnect,
    signTransaction,
    fetchBalance,
  } = useStellarWallet();

  const [billAmount, setBillAmount] = useState<string>("");
  const [personCount, setPersonCount] = useState<number>(2);
  const [recipient, setRecipient] = useState<string>("");
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'split' | 'history'>('split');
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && publicKey) {
      setIsLoadingHistory(true);
      fetchRecentPayments(publicKey).then((records) => {
        setHistory(records);
        setIsLoadingHistory(false);
      });
    }
  }, [activeTab, publicKey]);

  // Parallax effect removed per user request for a static professional look

  const incrementCount = () => setPersonCount((prev) => prev + 1);
  const decrementCount = () => setPersonCount((prev) => (prev > 1 ? prev - 1 : 1));

  const amountPerPerson = useMemo(() => {
    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) return "0.00";
    return (amount / personCount).toFixed(2);
  }, [billAmount, personCount]);

  const handlePayment = async () => {
    if (!publicKey) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }
    if (!recipient) {
      setStatusMessage("Please enter a recipient address.");
      return;
    }
    if (parseFloat(amountPerPerson) <= 0) {
      setStatusMessage("Amount per person must be greater than 0.");
      return;
    }
    if (parseFloat(amountPerPerson) > parseFloat(balance)) {
      setStatusMessage("Insufficient XLM balance.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Building transaction...");
    try {
      const tx = await buildTransaction(publicKey, recipient, amountPerPerson);
      
      setStatusMessage("Awaiting signature from Freighter...");
      const signedXdr = await signTransaction(tx.toXDR());
      
      setStatusMessage("Submitting to testnet...");
      const response = await submitTransaction(signedXdr);
      
      setStatusMessage(`Success! Tx Hash: ${response.hash}`);
      await fetchBalance(publicKey); // Refresh balance
      
      // Reset form
      setBillAmount("");
      setRecipient("");
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`Error: ${error.message || "Payment failed"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-4)}`;
  };

  return (
    <>
      <header className="shrink-0 z-50 bg-[var(--color-cotton-bg)]/80 backdrop-blur-md border-b border-slate-300 shadow-sm felt-texture">
        <nav className="flex flex-col sm:flex-row justify-between items-center w-full px-[var(--spacing-container-padding)] py-4 max-w-7xl mx-auto gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-800 font-bold text-3xl drop-shadow-sm">
                cloud
              </span>
              <h1 className="font-headline-md text-[var(--text-headline-md)] font-bold tracking-tight text-slate-900 drop-shadow-sm">
                Stellar Split
              </h1>
            </div>
            {/* Wallet button moved here for mobile if needed, or keep it below */}
          </div>
          
          <div className="flex w-full sm:w-auto justify-center gap-[var(--spacing-stack-md)] items-center order-3 sm:order-2">
            <button 
              onClick={() => setActiveTab('split')}
              className={`font-label-lg text-[var(--text-label-lg)] transition-colors drop-shadow-sm pb-1 ${activeTab === 'split' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Split
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`font-label-lg text-[var(--text-label-lg)] transition-colors drop-shadow-sm pb-1 ${activeTab === 'history' ? 'text-slate-800 border-b-2 border-slate-800' : 'text-slate-600 hover:text-slate-900'}`}
            >
              History
            </button>
          </div>

          <div className="flex gap-4 items-center order-2 sm:order-3">
            {publicKey ? (
              <div className="flex items-center gap-4 bg-[var(--color-cotton-pink)]/30 px-4 py-2 rounded-full felt-texture inset-puffy border border-slate-200">
                <div className="flex flex-col text-right">
                   <span className="text-slate-600 text-xs font-medium">{formatAddress(publicKey)}</span>
                   <span className="text-slate-900 font-bold text-sm">{parseFloat(balance).toFixed(2)} XLM</span>
                </div>
                <button 
                  onClick={disconnect}
                  className="bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full transition-colors text-slate-700"
                  title="Disconnect"
                >
                  <span className="material-symbols-outlined text-sm block">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="bg-slate-800 text-white px-6 py-2.5 rounded-full font-label-lg text-[var(--text-label-lg)] hover:bg-slate-700 transition-all active:scale-95 shadow-sm puffy-shadow felt-texture"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto flex flex-col">
        <main className="py-6 sm:py-10 flex justify-center items-start px-4 sm:px-[var(--spacing-container-padding)] flex-1">
        {activeTab === 'split' ? (
          <div id="main-card" className="w-full max-w-2xl felt-texture bg-[var(--color-cotton-pink)] rounded-[2rem] sm:rounded-[3rem] puffy-shadow p-6 sm:p-12 flex flex-col gap-8 sm:gap-10">
          
          <div className="flex flex-col gap-2 text-center">
            <h2 className="font-headline-lg text-[var(--text-headline-lg)] text-slate-900 drop-shadow-sm">Divide & Conquer</h2>
            <p className="font-body-md text-slate-700 font-medium">Calculate and send your share in seconds.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            {/* Bill Amount Input Area */}
            <div className="flex flex-col gap-[var(--spacing-stack-sm)]">
              <label className="font-label-lg text-[var(--text-label-lg)] text-slate-800 uppercase tracking-widest px-2 drop-shadow-sm">Total Bill Amount</label>
              <div className="relative group">
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-[var(--color-cotton-lavender)] px-3 py-1 rounded-full font-bold text-slate-800 flex items-center gap-1 felt-texture puffy-shadow">
                  <span className="material-symbols-outlined text-sm text-yellow-600" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  XLM
                </div>
                <input 
                  type="number"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-[var(--color-cotton-bg)] border-none rounded-2xl p-6 font-headline-md text-[var(--text-headline-md)] inset-puffy focus:ring-2 focus:ring-slate-400 text-slate-900 placeholder-slate-400 felt-texture outline-none" 
                  placeholder="0.00" 
                />
              </div>
            </div>

            {/* Number of People Area */}
            <div className="flex flex-col gap-[var(--spacing-stack-sm)]">
              <label className="font-label-lg text-[var(--text-label-lg)] text-slate-800 uppercase tracking-widest px-2 drop-shadow-sm">Number of People</label>
              <div className="flex items-center justify-between bg-[var(--color-cotton-bg)] rounded-2xl p-3 inset-puffy h-full felt-texture">
                <button 
                  onClick={decrementCount}
                  className="step-button w-12 h-12 rounded-full bg-[var(--color-cotton-pink)] flex items-center justify-center text-slate-800 felt-texture puffy-shadow border border-slate-200"
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="font-headline-md text-[var(--text-headline-md)] text-slate-900 px-4 drop-shadow-sm">
                  {personCount}
                </span>
                <button 
                  onClick={incrementCount}
                  className="step-button w-12 h-12 rounded-full bg-[var(--color-cotton-blue)] flex items-center justify-center text-slate-800 felt-texture puffy-shadow border border-slate-200"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Metric: Amount Per Person */}
          <div className="bg-[var(--color-cotton-lavender)] rounded-[3rem] p-10 flex flex-col items-center gap-2 felt-texture relative overflow-hidden group inset-puffy">
            <div className="absolute top-4 left-4 opacity-30 text-slate-800 drop-shadow-sm">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            </div>
            <div className="absolute bottom-4 right-4 opacity-50 text-yellow-600 drop-shadow-sm">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            
            <span className="font-label-lg text-[var(--text-label-lg)] text-slate-700 uppercase tracking-widest drop-shadow-sm text-center">Amount Per Person</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-[var(--text-headline-xl)] text-slate-900 drop-shadow-sm">
                {amountPerPerson}
              </span>
              <span className="font-headline-md text-[var(--text-headline-md)] text-slate-700">XLM</span>
            </div>
          </div>

          {/* Recipient Stellar Address */}
          <div className="flex flex-col gap-[var(--spacing-stack-sm)]">
            <label className="font-label-lg text-[var(--text-label-lg)] text-slate-800 uppercase tracking-widest px-2 drop-shadow-sm">Recipient Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 drop-shadow-sm">
                <span className="material-symbols-outlined">wallet</span>
              </div>
              <input 
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-[var(--color-cotton-bg)] border-none rounded-2xl py-5 pl-14 pr-6 font-body-lg text-[var(--text-body-lg)] inset-puffy focus:ring-2 focus:ring-slate-400 text-slate-900 placeholder-slate-400 felt-texture outline-none" 
                placeholder="G... or federation name" 
              />
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="bg-slate-100 p-4 rounded-xl text-center text-slate-800 font-medium border border-slate-300 break-all text-sm">
              {statusMessage.includes('Success') ? (
                <span className="flex items-center justify-center gap-2 text-green-700">
                   <span className="material-symbols-outlined">check_circle</span>
                   {statusMessage}
                </span>
              ) : (
                <span className={statusMessage.includes('Error') ? 'text-red-600' : ''}>{statusMessage}</span>
              )}
            </div>
          )}

          {/* Main CTA */}
          <button 
            onClick={handlePayment}
            disabled={isSubmitting || parseFloat(amountPerPerson) <= 0 || !publicKey}
            className="w-full bg-slate-800 text-white py-6 rounded-full font-headline-md text-[var(--text-headline-md)] felt-texture puffy-shadow transition-all hover:bg-slate-700 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span className="flex items-center justify-center gap-3 drop-shadow-sm">
              {isSubmitting ? "Processing..." : "Pay My Share"}
              {!isSubmitting && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>}
            </span>
          </button>
        </div>
        ) : (
          <div className="w-full max-w-2xl felt-texture bg-[var(--color-cotton-pink)] rounded-[2rem] sm:rounded-[3rem] puffy-shadow p-6 sm:p-12 flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-2 text-center">
              <h2 className="font-headline-lg text-[var(--text-headline-lg)] text-slate-900 drop-shadow-sm">Transaction History</h2>
              <p className="font-body-md text-slate-700 font-medium">Your recent payments on the Stellar testnet.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {!publicKey ? (
                <div className="text-center py-10 text-slate-600 bg-white/20 rounded-3xl border border-white/30 felt-texture">
                  Please connect your wallet to view history.
                </div>
              ) : isLoadingHistory ? (
                <div className="text-center py-10 text-slate-600 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Loading...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10 text-slate-600 bg-white/20 rounded-3xl border border-white/30 felt-texture">
                  No recent transactions found.
                </div>
              ) : (
                history.map((record, index) => {
                  const isSent = record.from === publicKey;
                  const amount = record.amount;
                  const asset = record.asset_type === 'native' ? 'XLM' : record.asset_code;
                  
                  return (
                    <div key={index} className="flex justify-between items-center p-5 bg-[var(--color-cotton-bg)] rounded-3xl border border-white/40 inset-puffy">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center felt-texture puffy-shadow ${isSent ? 'bg-[var(--color-cotton-pink)] text-red-600' : 'bg-green-100 text-green-700'}`}>
                          <span className="material-symbols-outlined font-bold">
                            {isSent ? 'arrow_upward' : 'arrow_downward'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{isSent ? 'Sent' : 'Received'}</span>
                          <span className="text-xs text-slate-600">
                            {isSent ? `To: ${formatAddress(record.to)}` : `From: ${formatAddress(record.from)}`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className={`font-bold text-lg ${isSent ? 'text-slate-900' : 'text-green-700'}`}>
                          {isSent ? '-' : '+'}{amount} {asset}
                        </span>
                        <a href={`https://stellar.expert/explorer/testnet/tx/${record.transaction_hash}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                          View Explorer
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Shell */}
      <footer className="shrink-0 bg-[var(--color-cotton-bg)] border-t border-slate-300 felt-texture mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-[var(--spacing-container-padding)] py-[var(--spacing-stack-md)] max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-800 text-xl drop-shadow-sm">cloud</span>
            <span className="text-slate-900 font-bold drop-shadow-sm">Stellar Split</span>
          </div>
          <p className="font-label-sm text-[var(--text-label-sm)] text-slate-600 drop-shadow-sm">
            © 2024 Stellar Split. Hand-woven with care.
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
