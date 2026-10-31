/**
 * Modul Rocks untuk web (Next.js). Memakai sheet DB_ROCKS yang sama dengan menu Sheets.
 * Dipanggil lewat ROUTES_ di Api.js ('rocks.list' dan 'rocks.save').
 */

function rocksDate_(v) {
  if (!v) return '';
  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function rocksList_() {
  var issueRocks = {};
  DB.getAll('DB_ISSUES').forEach(function (i) { if (i.Rock_ID) issueRocks[String(i.Rock_ID)] = true; });
  var rocks = DB.getAll('DB_ROCKS')
    .filter(function (r) { return String(r.Rock_ID || '') !== ''; })
    .map(function (r) {
      var prog = Number(r.Progress || 0);
      return {
        id: String(r.Rock_ID),
        name: String(r.Rock_Name || ''),
        quarter: String(r.Quarter || ''),
        department: String(r.Department || ''),
        target: String(r.Target || ''),
        owner: String(r.Owner || ''),
        start: rocksDate_(r.Start_Date),
        due: rocksDate_(r.Due_Date),
        progress: isFinite(prog) ? Math.max(0, Math.min(100, Math.round(prog))) : 0,
        status: String(r.Status || 'Open') === 'Done' ? 'Done' : 'Open',
        auto: !!issueRocks[String(r.Rock_ID)]
      };
    });
  var owners = DB.getAll('MASTER_USER')
    .filter(function (u) { return String(u.Status || '').toLowerCase() === 'active'; })
    .map(function (u) { return String(u.Nama || '').trim(); })
    .filter(function (n) { return n !== ''; });
  return { rocks: rocks, owners: owners };
}

function rocksSave_(p, user) {
  var name = String(p.name || '').trim();
  var quarter = String(p.quarter || '').trim();
  var owner = String(p.owner || '').trim();
  var dept = String(p.department || '').trim();
  var target = String(p.target || '').trim();
  var due = String(p.due || '').trim();
  var progress = Number(p.progress);
  if (name.length < 3 || name.length > 200) throw new Error('Nama Rock harus 3 sampai 200 karakter.');
  if (!quarter) throw new Error('Kuartal wajib diisi.');
  if (!owner) throw new Error('Penanggung jawab wajib diisi.');
  if (!target) throw new Error('Target wajib diisi.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error('Tenggat tidak valid.');
  if (!isFinite(progress)) progress = 0;
  progress = Math.max(0, Math.min(100, Math.round(progress)));

  var parts = due.split('-');
  var dueDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  var status = progress >= 100 ? 'Done' : 'Open';
  var label = name + ' \u2022 ' + quarter + ' \u2022 ' + owner + ' \u2022 ' +
    Utilities.formatDate(dueDate, Session.getScriptTimeZone(), 'dd MMM yyyy');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = String(p.id || '').trim();
    if (id) {
      var existing = DB.first('DB_ROCKS', 'Rock_ID', id);
      if (!existing) throw new Error('Rock tidak ditemukan.');
      var auto = DB.getAll('DB_ISSUES').some(function (i) { return String(i.Rock_ID) === id; });
      DB.update('DB_ROCKS', 'Rock_ID', id, {
        Rock_Name: name, Rock_Label: label, Quarter: quarter, Department: dept, Target: target,
        Owner: owner, Due_Date: dueDate, Progress: auto ? existing.Progress : progress, Status: auto ? existing.Status : status
      });
      try { LoggerSMOS.add('ROCK', 'UPDATE', name, 'Diubah dari web oleh ' + user.email); } catch (x) {}
      return { id: id, created: false };
    }
    id = generateID('R');
    DB.insert('DB_ROCKS', {
      Rock_ID: id, Rock_Label: label, Quarter: quarter, Rock_Name: name, Target: target, Owner: owner,
      Department: dept, Start_Date: new Date(), Due_Date: dueDate, Progress: progress, Status: status
    });
    try { LoggerSMOS.add('ROCK', 'CREATE', name, 'Dibuat dari web oleh ' + user.email); } catch (x) {}
    return { id: id, created: true };
  } finally {
    lock.releaseLock();
  }
}