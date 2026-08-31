// Shared by home (NightOpsWork) and the /projects pages — edit here.
export function statusFor(status: string): { label: string; wip: boolean; dimmed: boolean } {
  const s = status.toLowerCase();
  if (["live", "completed", "operational", "deployed"].includes(s)) {
    return { label: "operational", wip: false, dimmed: false };
  }
  if (["in-progress", "active", "shipping", "wip"].includes(s)) {
    return { label: "shipping", wip: true, dimmed: false };
  }
  return { label: "planned", wip: false, dimmed: true };
}

export function initialsFor(title: string): string {
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return title.slice(0, 2).toUpperCase();
}
