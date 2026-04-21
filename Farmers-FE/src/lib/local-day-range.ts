/** Ngày hiện tại theo lịch máy, dạng YYYY-MM-DD (cho input type=date). */
export function getTodayLocalIsoDate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** YYYY-MM-DD → ISO đầu ngày local (tránh `new Date('YYYY-MM-DD')` parse UTC ở BE). */
export function getLocalDayStartIso(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

export function getLocalDayEndIso(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}
