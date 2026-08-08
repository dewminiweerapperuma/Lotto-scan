export function formatPrize(amount: number): string {
  if (!amount || amount === 0) return "Rs. 0";
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-LK", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return dateStr; }
}

export function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString("en-LK", {
      timeZone: "Asia/Colombo",
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch { return ts; }
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function mapResponse(res: any): any[] {
  if (!res || !res.columns || !res.dataset) return [];
  const keys = res.columns.map((c: any) => c.name);
  return res.dataset.map((row: any[]) => {
    const obj: any = {};
    keys.forEach((key: string, i: number) => { obj[key] = row[i]; });
    return obj;
  });
}
