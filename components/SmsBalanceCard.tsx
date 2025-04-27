"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function SmsBalanceCard() {
  const [balance, setBalance] = useState<string | number>("N/A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sms/balance");
      const data = await res.json();
      if (res.ok && data.sms_balance !== undefined) {
        setBalance(data.sms_balance);
      } else {
        setBalance("N/A");
        setError(data.error || "Failed to fetch balance");
      }
    } catch (err: any) {
      setBalance("N/A");
      setError(err.message || "Failed to fetch balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">SMS Balance</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchBalance}
          aria-label="Refresh SMS Balance"
          disabled={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{loading ? "Loading..." : balance}</div>
        <p className="text-xs text-gray-500">{error ? error : "SMS balance is managed in settings"}</p>
      </CardContent>
    </Card>
  );
} 