/**
 * ============================================================
 * API JSON UNTUK FRONTEND VERCEL ("Irama Kerja MAZARIN")
 * ============================================================
 * File BARU. Taruh di proyek Apps Script, lalu:
 *  1) Ganti nama `function doGet(e)` lama di WebAppController.js menjadi
 *     `function doGetLegacy_(e)` (hanya boleh ada satu doGet).
 *  2) Isi Script Property  API_SECRET  (Project Settings > Script Properties)
 *     dengan teks acak minimal 32 karakter. Nilai yang sama dipasang di
 *     Vercel sebagai APPS_SCRIPT_SECRET. JANGAN ditulis di kode.
 *  3) Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 *     Tautan /exec baru ini hanya diberikan ke Vercel.
 *
 * Keamanan: tanpa API_SECRET yang benar, semua permintaan ditolak. Email
 * pengguna dikirim oleh server Vercel (setelah login Google) dan DIPERIKSA
 * lagi di sini terhadap MASTER_USER (Status Active) pada setiap panggilan.
 */

function doGet() {
  return json_({ ok: false, code: 'USE_POST', message: 'Endpoint ini hanya menerima POST.' });
}

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (!secretOk_(req.secret)) return json_({ ok: false, code: 'UNAUTHORIZED', message: 'Akses ditolak.' });

    var email = String(req.email || '').trim().toLowerCase();

    // --- Pintu login (hanya dipanggil server Vercel; wajib lolos API_SECRET di atas) ---
    if (req.action === 'auth.get')   return json_({ ok: true, data: authGet_(email) });
    if (req.action === 'auth.fail')  { authFail_(email);  return json_({ ok: true, data: {} }); }
    if (req.action === 'auth.clear') { authClear_(email); return json_({ ok: true, data: {} }); }

    var user = findActiveUser_(email);

    if (req.action === 'whoami') {
      return json_({ ok: true, data: { allowed: !!user, name: user ? user.name : '', role: user ? user.role : '' } });
    }
    if (!user) return json_({ ok: false, code: 'FORBIDDEN', message: 'Pengguna tidak terdaftar atau nonaktif.' });

    var p = req.payload || {};
    var handler = ROUTES_[req.action];
    if (!handler) return json_({ ok: false, code: 'NOT_FOUND', message: 'Aksi tidak dikenal: ' + req.action });

    return json_({ ok: true, data: handler(p, user) });
  } catch (err) {
    return json_({ ok: false, code: 'ERROR', message: String(err && err.message || err) });
  }
}

var ROUTES_ = {
  'auth.setPassword': function (p, user) {
    var hash = String(p.hash || '');
    if (!/^\$2[aby]\$\d{2}\$[.\/A-Za-z0-9]{53}$/.test(hash)) throw new Error('Format hash tidak valid.');
    setPasswordHash_(user.email, hash);
    return {};
  },
  'scorecard.get': function () {
    return neutralize_(_toPlain(Scorecard.getWebAppData_()));
  },
  'scorecard.weekly': function (p) {
    return _toPlain(getManualKpiList(p.week || ''));
  },
  'scorecard.submit': function (p, user) {
    var res = submitWeeklyScores(p.scores || {}, p.week || '');
    try { Logger.log('scorecard.submit oleh ' + user.email + ': ' + JSON.stringify(res)); } catch (x) {}
    return res;
  }
};

/* ---------- pembantu ---------- */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function secretOk_(given) {
  var real = PropertiesService.getScriptProperties().getProperty('API_SECRET') || '';
  if (real.length < 32 || typeof given !== 'string' || given.length !== real.length) return false;
  var diff = 0;
  for (var i = 0; i < real.length; i++) diff |= real.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

function findActiveUser_(email) {
  if (!email) return null;
  var rows = DB.getAll('MASTER_USER');
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.Email || '').trim().toLowerCase() === email && String(r.Status || '').toLowerCase() === 'active') {
      return { id: r.User_ID, name: r.Nama, email: email, role: r.Role };
    }
  }
  return null;
}

/** Ganti istilah lama pada teks yang akan tampil ke klien (tidak mengubah sheet). */
function neutralize_(data) {
  var map = [
    [/🚨\s*/g, ''],
    [/EOS Rule:\s*Company Scorecard idealnya berisi/g, 'Saran: Kartu Skor utama sebaiknya berisi'],
    [/⚠️\s*/g, ''],
    [/ke Issues/g, 'ke Daftar Masalah'],
    [/di IDS minggu ini/g, 'di rapat mingguan ini'],
    [/KPI off-track/g, 'angka melenceng'],
    [/\bEOS\b/g, '']
  ];
  ['alertMessage', 'ruleWarning'].forEach(function (k) {
    if (!data[k]) return;
    var s = String(data[k]);
    map.forEach(function (m) { s = s.replace(m[0], m[1]); });
    data[k] = s.trim();
  });
  return data;
}


/* ---------- login email + kata sandi ---------- */

var MAX_FAILS_ = 5;          // salah berturut-turut sebelum dikunci
var LOCK_SECONDS_ = 15 * 60; // lama kunci (dan masa hitung)

function failKey_(email) { return 'authfail:' + email; }

/** Info untuk server Vercel. Hash hanya dikirim ke server (diamankan API_SECRET), tidak pernah ke browser. */
function authGet_(email) {
  var out = { allowed: false, name: '', role: '', hash: '', locked: false };
  if (!email) return out;
  var count = Number(CacheService.getScriptCache().get(failKey_(email)) || 0);
  out.locked = count >= MAX_FAILS_;
  var rows = DB.getAll('MASTER_USER');
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (String(r.Email || '').trim().toLowerCase() !== email) continue;
    out.allowed = String(r.Status || '').toLowerCase() === 'active';
    out.name = String(r.Nama || '');
    out.role = String(r.Role || '');
    out.hash = String(r.Password_Hash || '');
    break;
  }
  return out;
}

function authFail_(email) {
  if (!email) return;
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(failKey_(email)) || 0) + 1;
  cache.put(failKey_(email), String(n), LOCK_SECONDS_);
}

function authClear_(email) {
  if (email) CacheService.getScriptCache().remove(failKey_(email));
}

/** Menulis hash ke kolom Password_Hash di MASTER_USER (kolom dibuat otomatis bila belum ada). */
function setPasswordHash_(email, hash) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = DB.sheet('MASTER_USER');
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var cEmail = headers.indexOf('Email');
    if (cEmail < 0) throw new Error('Kolom Email tidak ada di MASTER_USER.');
    var cHash = headers.indexOf('Password_Hash');
    if (cHash < 0) {
      cHash = headers.length;
      sh.getRange(1, cHash + 1).setValue('Password_Hash');
    }
    var last = sh.getLastRow();
    if (last < 2) throw new Error('Pengguna tidak ditemukan.');
    var emails = sh.getRange(2, cEmail + 1, last - 1, 1).getValues();
    for (var i = 0; i < emails.length; i++) {
      if (String(emails[i][0] || '').trim().toLowerCase() === email) {
        sh.getRange(i + 2, cHash + 1).setNumberFormat('@').setValue(hash);
        SpreadsheetApp.flush();
        authClear_(email);
        return;
      }
    }
    throw new Error('Pengguna tidak ditemukan.');
  } finally {
    lock.releaseLock();
  }
}
