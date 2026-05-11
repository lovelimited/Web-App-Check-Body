
const SPREADSHEET_ID = '1cm-v8T3tJQ3niMRWgS53wax7W6YanR7WKWaOBkzrpNc'; // ← ใส่ ID ของ Google Sheets ที่นี่
const STUDENT_SHEET_NAME = 'ข้อมูลนักเรียน';
const RESULT_SHEET_NAME = 'ผลการตรวจ';

const RESULT_HEADERS = [
  'date', 'class_level', 'prefix', 'first_name', 'last_name', 'nickname',
  'score_dress', 'score_body', 'total', 'timestamp'
];

const CLASS_PINS = {
  'ม.1': '1111', 'ม.2': '2222', 'ม.3': '3333',
  'ม.4': '4444', 'ม.5': '5555', 'ม.6': '6666'
};

const ALL_CLASSES = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

// ─── HTTP Handler ────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    let result;
    switch (action) {
      case 'getStudents':
        result = getStudents(e.parameter.class_level); break;
      case 'getDashboard':
        result = getDashboard(); break;
      case 'verifyPin':
        result = verifyPin(e.parameter.class_level, e.parameter.pin); break;
      case 'submitScores':
        result = submitScores(
          e.parameter.class_level,
          e.parameter.date,
          JSON.parse(decodeURIComponent(e.parameter.scores || '[]'))
        ); break;
      case 'initSheet':
        initResultSheet();
        result = { success: true, message: 'Sheet initialized' }; break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }
    return jsonRes(result);
  } catch (err) {
    return jsonRes({ success: false, error: err.toString() });
  }
}

function jsonRes(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Init Result Sheet ───────────────────────────────────
function initResultSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(RESULT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(RESULT_SHEET_NAME);
    const hRange = sheet.getRange(1, 1, 1, RESULT_HEADERS.length);
    hRange.setValues([RESULT_HEADERS]);
    hRange.setFontWeight('bold').setBackground('#1E40AF').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120);
  }
  return sheet;
}

// ─── Get Students ────────────────────────────────────────
function getStudents(classLevel) {
  if (!classLevel) return { success: false, error: 'No class_level provided' };
  
  const cache = CacheService.getScriptCache();
  const cacheKey = 'std_' + classLevel;
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(STUDENT_SHEET_NAME);
  if (!sheet) return { success: false, error: 'Student sheet not found' };

  const data = sheet.getDataRange().getValues();
  const h = data[0].map(x => x.toString().trim().toLowerCase());
  const idx = {
    prefix: h.indexOf('prefix'), first_name: h.indexOf('first_name'),
    last_name: h.indexOf('last_name'), nickname: h.indexOf('nickname'),
    class_level: h.indexOf('class_level')
  };

  const students = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cl = idx.class_level >= 0 ? (row[idx.class_level] || '').toString().trim() : '';
    if (cl === classLevel.trim()) {
      students.push({
        prefix: idx.prefix >= 0 ? (row[idx.prefix] || '').toString() : '',
        first_name: idx.first_name >= 0 ? (row[idx.first_name] || '').toString() : '',
        last_name: idx.last_name >= 0 ? (row[idx.last_name] || '').toString() : '',
        nickname: idx.nickname >= 0 ? (row[idx.nickname] || '').toString() : '',
        class_level: cl
      });
    }
  }
  
  const result = { success: true, class_level: classLevel, students };
  cache.put(cacheKey, JSON.stringify(result), 900); // Cache for 15 minutes
  return result;
}

// ─── Verify PIN ──────────────────────────────────────────
function verifyPin(classLevel, pin) {
  const correct = CLASS_PINS[classLevel];
  if (!correct) return { success: false, error: 'ชั้นเรียนไม่ถูกต้อง' };
  return pin === correct ? { success: true } : { success: false, error: 'รหัส PIN ไม่ถูกต้อง' };
}

// ─── Submit Scores (Overwrite same day+class) ────────────
function submitScores(classLevel, date, scores) {
  if (!classLevel || !date || !scores || scores.length === 0)
    return { success: false, error: 'Missing required data' };

  const sheet = initResultSheet();
  const all = sheet.getDataRange().getValues();
  const headers = all[0].map(h => h.toString());
  const dateIdx = headers.indexOf('date');
  const classIdx = headers.indexOf('class_level');

  // Delete existing rows for this class+date BUT ONLY for the students being submitted
  for (let i = all.length; i >= 2; i--) {
    const rowDate = parseSheetDate(all[i - 1][dateIdx]);
    const rowClass = (all[i - 1][classIdx] || '').toString().trim();
    if (rowDate === date && rowClass === classLevel.trim()) {
      const rowFName = (all[i - 1][headers.indexOf('first_name')] || '').toString().trim();
      const rowLName = (all[i - 1][headers.indexOf('last_name')] || '').toString().trim();
      
      const isSubmitted = scores.some(s => 
        (s.first_name || '').trim() === rowFName && 
        (s.last_name || '').trim() === rowLName
      );
      
      if (isSubmitted) {
        sheet.deleteRow(i);
      }
    }
  }

  // Append new rows
  const ts = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const newRows = scores.map(s => [
    date, classLevel,
    s.prefix || '', s.first_name || '', s.last_name || '', s.nickname || '',
    Number(s.score_dress) || 0, Number(s.score_body) || 0,
    (Number(s.score_dress) || 0) + (Number(s.score_body) || 0),
    ts
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, newRows.length, RESULT_HEADERS.length).setValues(newRows);

  // Clear Dashboard Cache so it reflects new scores instantly
  CacheService.getScriptCache().remove('dash_' + date);

  return { success: true, saved: newRows.length };
}

// ─── Student count per class (from ข้อมูลนักเรียน) ─────────
function getStudentCountPerClass() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(STUDENT_SHEET_NAME);
  const counts = {};
  ALL_CLASSES.forEach(c => counts[c] = 0);
  if (!sheet || sheet.getLastRow() <= 1) return counts;

  const data = sheet.getDataRange().getValues();
  const h = data[0].map(x => x.toString().trim().toLowerCase());
  const classIdx = h.indexOf('class_level');
  if (classIdx < 0) return counts;

  for (let i = 1; i < data.length; i++) {
    const cl = (data[i][classIdx] || '').toString().trim();
    if (counts[cl] !== undefined) counts[cl]++;
  }
  return counts;
}

// ─── Dashboard ───────────────────────────────────────────
function getDashboard() {
  const today = getTodayBKK();
  const cache = CacheService.getScriptCache();
  const cacheKey = 'dash_' + today;
  
  // Optional: If user clicks Refresh button, we could force clear cache.
  // But since we clear cache on submitScores, it should always be up to date!
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const rs = ss.getSheetByName(RESULT_SHEET_NAME);

  // Always fetch student totals from ข้อมูลนักเรียน
  const studentTotals = getStudentCountPerClass();

  const empty = {
    success: true, today,
    summary: { total: 0, avg_dress: 0, avg_body: 0 },
    class_status: ALL_CLASSES.map(c => ({
      class_level: c, submitted: false, count: 0, total_students: studentTotals[c] || 0
    })),
    class_averages: ALL_CLASSES.map(c => ({
      class_level: c, avg_dress: 0, avg_body: 0, count: 0, total_students: studentTotals[c] || 0
    })),
    passed: 0, failed: 0, recent: []
  };
  if (!rs || rs.getLastRow() <= 1) return empty;

  const all = rs.getDataRange().getValues();
  const headers = all[0].map(h => h.toString());
  const col = name => headers.indexOf(name);

  const todayRows = [];
  for (let i = 1; i < all.length; i++) {
    const row = all[i];
    const rowDate = parseSheetDate(row[col('date')]);
    if (rowDate !== today) continue;
    todayRows.push({
      class_level: (row[col('class_level')] || '').toString().trim(),
      prefix: (row[col('prefix')] || '').toString(),
      first_name: (row[col('first_name')] || '').toString(),
      last_name: (row[col('last_name')] || '').toString(),
      nickname: (row[col('nickname')] || '').toString(),
      score_dress: Number(row[col('score_dress')]) || 0,
      score_body: Number(row[col('score_body')]) || 0,
      total: Number(row[col('total')]) || 0
    });
  }

  const n = todayRows.length;
  const avgDress = n ? +(todayRows.reduce((s, r) => s + r.score_dress, 0) / n).toFixed(2) : 0;
  const avgBody  = n ? +(todayRows.reduce((s, r) => s + r.score_body, 0) / n).toFixed(2) : 0;

  const classesSubmitted = new Set(todayRows.map(r => r.class_level));
  const class_status = ALL_CLASSES.map(c => ({
    class_level: c,
    submitted: classesSubmitted.has(c),
    count: todayRows.filter(r => r.class_level === c).length,
    total_students: studentTotals[c] || 0
  }));

  const class_averages = ALL_CLASSES.map(c => {
    const rows = todayRows.filter(r => r.class_level === c);
    const cnt = rows.length;
    return {
      class_level: c,
      avg_dress: cnt ? +(rows.reduce((s, r) => s + r.score_dress, 0) / cnt).toFixed(2) : 0,
      avg_body: cnt ? +(rows.reduce((s, r) => s + r.score_body, 0) / cnt).toFixed(2) : 0,
      count: cnt,
      total_students: studentTotals[c] || 0
    };
  });

  const passed = todayRows.filter(r => r.total >= 14).length;
  const recent = todayRows.slice(-10).reverse();

  const finalResult = {
    success: true, today,
    summary: { total: n, avg_dress: avgDress, avg_body: avgBody },
    class_status, class_averages, passed, failed: n - passed, recent
  };

  cache.put(cacheKey, JSON.stringify(finalResult), 21600); // Cache for 6 hours
  return finalResult;
}

function getTodayBKK() {
  return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
}

// Sheets อาจแปลง string date เป็น Date object อัตโนมัติ
// ฟังก์ชันนี้ handle ได้ทั้งสองกรณี
function parseSheetDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Bangkok', 'yyyy-MM-dd');
  }
  return val.toString().substring(0, 10);
}
