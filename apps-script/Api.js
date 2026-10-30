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
