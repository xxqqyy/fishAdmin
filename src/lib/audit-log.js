const STORAGE_KEY = 'fish-admin-audit-log';
const MAX_ENTRIES = 24;

export function getAuditLog() {
  try {
    const entries = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

export function appendAuditLog(entry) {
  const nextEntries = [
    {
      id: `${entry.action}-${entry.targetType}-${entry.targetId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...entry
    },
    ...getAuditLog()
  ].slice(0, MAX_ENTRIES);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
  window.dispatchEvent(new Event('fish-admin-audit-log-change'));
  return nextEntries;
}
