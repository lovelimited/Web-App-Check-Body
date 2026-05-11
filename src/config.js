// ─── GAS Backend URL ────────────────────────────────────────
// ใส่ URL จาก Google Apps Script Deploy
export const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvIjpCo7Jgo2Fm3yCgc7ibsaNRvr-0_bXLWhpfF4NO8MXYEstBAx1dzl2SRisa27he/exec';

export const ALL_CLASSES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

export const CLASS_PINS = {
  'ม.1': '1111', 'ม.2': '2222', 'ม.3': '3333',
  'ม.4': '4444', 'ม.5': '5555', 'ม.6': '6666',
};

export const CLASS_COLORS = {
  'ม.1': { bg: 'bg-blue-100',   text: 'text-blue-700',   hover: 'hover:bg-blue-500'   },
  'ม.2': { bg: 'bg-indigo-100', text: 'text-indigo-700', hover: 'hover:bg-indigo-500' },
  'ม.3': { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:bg-purple-500' },
  'ม.4': { bg: 'bg-pink-100',   text: 'text-pink-700',   hover: 'hover:bg-pink-500'   },
  'ม.5': { bg: 'bg-rose-100',   text: 'text-rose-700',   hover: 'hover:bg-rose-500'   },
  'ม.6': { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:bg-orange-500' },
};

export function getTodayTH() {
  return new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'Asia/Bangkok',
  });
}

export function getTodayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
}

export function scoreColorClass(n) {
  if (n <= 3) return 'bg-red-100 text-red-500 border-red-200';
  if (n <= 6) return 'bg-yellow-100 text-yellow-600 border-yellow-200';
  if (n <= 8) return 'bg-green-100 text-green-600 border-green-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

export function scoreBadge(n) {
  if (n >= 8) return 'bg-green-100 text-green-700';
  if (n >= 6) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-600';
}
