import { GAS_URL } from './config';

export async function apiFetch(params) {
  const url = GAS_URL + '?' + new URLSearchParams(params).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getDashboard  = ()                          => apiFetch({ action: 'getDashboard' });
export const getStudents   = (class_level)               => apiFetch({ action: 'getStudents', class_level });
export const verifyPin     = (class_level, pin)          => apiFetch({ action: 'verifyPin', class_level, pin });
export const submitScores  = (class_level, date, scores) => apiFetch({
  action: 'submitScores',
  class_level,
  date,
  scores: encodeURIComponent(JSON.stringify(scores)),
});
