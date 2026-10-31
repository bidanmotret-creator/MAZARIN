/**
 * Modul Level 10 (Weekly Meeting) untuk web. Memakai objek Meeting (Meeting.js)
 * dan data kerja dari IssuesApi.js. Rute: 'meeting.workspace', 'meeting.save', 'meeting.finish'.
 */

function meetingText_(v) { return String(v || '').trim().slice(0, 2000); }

function meetingOut_(m) {
  var r = Number(m.Rating);
  return {
    id: String(m.Meeting_ID || ''),
    week: Number(m.Week) || 0,
    year: Number(m.Year) || 0,
    quarter: String(m.Quarter || ''),
    date: rocksDate_(m.Meeting_Date),
    facilitator: String(m.Facilitator || ''),
    status: String(m.Status || 'Scheduled'),
    segue: String(m.Segue || ''),
    customerHeadlines: String(m.Customer_Headlines || ''),
    employeeHeadlines: String(m.Employee_Headlines || ''),
    notes: String(m.Notes || ''),
    decision: String(m.Decision || ''),
    cascading: String(m.Cascading_Message || ''),
    rating: (isFinite(r) && r >= 1 && r <= 10) ? Math.round(r) : 0
  };
}

function meetingScorecard_() {
  var out = { onTrack: 0, warning: 0, offTrack: 0, total: 0 };
  try {
    var sc = Scorecard.getWebAppData_();
    var s = (sc && sc.summary) ? sc.summary : (sc || {});
    out.onTrack = Number(s.onTrack) || 0;
    out.warning = Number(s.warning) || 0;
    out.offTrack = Number(s.offTrack) || 0;
    out.total = Number(s.total) || (out.onTrack + out.warning + out.offTrack);
  } catch (x) {}
  return out;
}

function meetingChanges_(p) {
  var r = Number(p.rating);
  return {
    Segue: meetingText_(p.segue),
    Customer_Headlines: meetingText_(p.customerHeadlines),
    Employee_Headlines: meetingText_(p.employeeHeadlines),
    Notes: meetingText_(p.notes),
    Decision: meetingText_(p.decision),
    Cascading_Message: meetingText_(p.cascading),
    Rating: (isFinite(r) && r >= 1 && r <= 10) ? Math.round(r) : ''
  };
}

function meetingWorkspace_(p, user) {
  var now = new Date();
  var id = 'WM-' + now.getFullYear() + '-' + ('0' + Meeting._isoWeek(now)).slice(-2);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  var m;
  try {
    m = Meeting.detail(id);
    if (!m) m = Meeting.create({ Facilitator: user.email });
    if (String(m.Status) === 'Scheduled') m = Meeting.start(id) || m;
  } finally {
    lock.releaseLock();
  }

  var issues = DB.getAll('DB_ISSUES');
  var todos = DB.getAll('DB_TODO');
  var dari = function (rows, mid) {
    return rows.filter(function (r) { return String(r.Source_Meeting_ID || '') === mid; }).length;
  };

  var history = Meeting.all()
    .filter(function (x) { return String(x.Status) === 'Completed'; })
    .sort(function (a, b) { return (Number(b.Year) * 100 + Number(b.Week)) - (Number(a.Year) * 100 + Number(a.Week)); })
    .slice(0, 12)
    .map(function (x) {
      var hid = String(x.Meeting_ID);
      var r = Number(x.Rating);
      return {
        id: hid, week: Number(x.Week) || 0, year: Number(x.Year) || 0, date: rocksDate_(x.Meeting_Date),
        rating: (isFinite(r) && r >= 1 && r <= 10) ? Math.round(r) : 0,
        issues: dari(issues, hid), todos: dari(todos, hid)
      };
    });

  return {
    meeting: meetingOut_(m),
    scorecard: meetingScorecard_(),
    recap: { issues: dari(issues, id), todos: dari(todos, id) },
    history: history,
    work: workList_()
  };
}

function meetingSave_(p, user) {
  var id = String(p.id || '').trim();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var m = Meeting.detail(id);
    if (!m) throw new Error('Meeting tidak ditemukan.');
    if (String(m.Status) === 'Completed') throw new Error('Meeting ini sudah selesai dan tidak bisa diubah.');
    Meeting._updateRow(id, meetingChanges_(p));
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

function meetingFinish_(p, user) {
  var id = String(p.id || '').trim();
  var changes = meetingChanges_(p);
  if (!changes.Rating) throw new Error('Beri rating 1 sampai 10 sebelum menutup meeting.');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var m = Meeting.detail(id);
    if (!m) throw new Error('Meeting tidak ditemukan.');
    if (String(m.Status) === 'Completed') throw new Error('Meeting ini sudah selesai.');
    try {
      Meeting.finish(id, changes);
    } catch (e) {
      var cek = Meeting.detail(id);
      if (!cek || String(cek.Status) !== 'Completed') throw e;
    }
    try { LoggerSMOS.add('MEETING', 'FINISH', id, 'Ditutup dari web oleh ' + user.email + ', rating ' + changes.Rating); } catch (x) {}
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}