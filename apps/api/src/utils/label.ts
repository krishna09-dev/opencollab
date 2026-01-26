export function normalizeLabel(label: string) {
  return (label || "").trim().toLowerCase();
}

export function containsAllowedLabel(labels: string[], allowed: string[]) {
  const set = new Set(labels.map(normalizeLabel));
  return allowed.some((a) => set.has(normalizeLabel(a)));
}