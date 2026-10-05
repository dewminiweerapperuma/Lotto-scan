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
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
