/**
 * Modul Issues dan To-Do untuk web (Next.js). Memakai DB_ISSUES, DB_TODO, DB_ROCKS yang sama
 * dengan menu Sheets. Rute: 'work.list', 'issues.save', 'issues.solve', 'todos.save', 'todos.finish'.
 */

var PRIORITIES_ = ['Low', 'Medium', 'High', 'Critical'];

function workDate_(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) throw new Error('Tanggal tidak valid.');
  var p = String(s).split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function workLabelDate_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd MMM yyyy');
}

function workList_() {
  var rockLabel = {};
  var rocks = DB.getAll('DB_ROCKS')
    .filter(function (r) { return String(r.Rock_ID || '') !== ''; })
    .map(function (r) {
      var label = String(r.Rock_Label || r.Rock_Name || '');
      rockLabel[String(r.Rock_ID)] = label;
      return { id: String(r.Rock_ID), label: label, done: String(r.Status || '') === 'Done', progress: Math.max(0, Math.min(100, Math.round(Number(r.Progress) || 0))), owner: String(r.Owner || ''), due: rocksDate_(r.Due_Date), quarter: String(r.Quarter || '') };
    });

  var issues = DB.getAll('DB_ISSUES')
    .filter(function (i) { return String(i.Issue_ID || '') !== ''; })
    .map(function (i) {
      var pr = Number(i.Progress || 0);
      return {
        id: String(i.Issue_ID),
        rockId: String(i.Rock_ID || ''),
        rockLabel: String(i.Rock_Label || rockLabel[String(i.Rock_ID)] || ''),
        title: String(i.Issue_Title || ''),
        description: String(i.Description || ''),
        priority: PRIORITIES_.indexOf(String(i.Priority)) >= 0 ? String(i.Priority) : 'Medium',
        owner: String(i.Owner || ''),
        due: rocksDate_(i.Due_Date),
        progress: isFinite(pr) ? Math.max(0, Math.min(100, Math.round(pr))) : 0,
        status: String(i.Status || 'Open') === 'Done' ? 'Done' : 'Open',
        rootCause: String(i.Root_Cause || '')
      };
    });

  var todos = DB.getAll('DB_TODO')
    .filter(function (t) { return String(t.Todo_ID || '') !== ''; })
    .map(function (t) {
      return {
        id: String(t.Todo_ID),
        issueId: String(t.Issue_ID || ''),
        issueLabel: String(t.Issue_Label || ''),
        rockLabel: String(t.Rock_Label || ''),
        task: String(t.Task_Name || ''),
        description: String(t.Description || ''),
        department: String(t.Department || ''),
        owner: String(t.Owner || ''),
        due: rocksDate_(t.Due_Date),
        status: String(t.Status || 'Open') === 'Done' ? 'Done' : 'Open',
        completed: rocksDate_(t.Completed_Date)
      };
    });

  var owners = DB.getAll('MASTER_USER')
    .filter(function (u) { return String(u.Status || '').toLowerCase() === 'active'; })
    .map(function (u) { return String(u.Nama || '').trim(); })
    .filter(function (n) { return n !== ''; });

  return { issues: issues, todos: todos, rocks: rocks, owners: owners };
}

function issuesSave_(p, user) {
  var title = String(p.title || '').trim();
  var owner = String(p.owner || '').trim();
  var priority = String(p.priority || '');
  if (title.length < 3 || title.length > 200) throw new Error('Judul Issue harus 3 sampai 200 karakter.');
  if (!owner) throw new Error('Penanggung jawab wajib diisi.');
  if (PRIORITIES_.indexOf(priority) < 0) throw new Error('Prioritas tidak valid.');
  var due = workDate_(p.due);
  var desc = String(p.description || '').trim().slice(0, 1000);
  var cause = String(p.rootCause || '').trim().slice(0, 1000);
  var label = title + ' \u2022 ' + owner + ' \u2022 ' + workLabelDate_(due);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = String(p.id || '').trim();
    if (id) {
      if (!DB.first('DB_ISSUES', 'Issue_ID', id)) throw new Error('Issue tidak ditemukan.');
      DB.update('DB_ISSUES', 'Issue_ID', id, {
        Issue_Title: title, Issue_Label: label, Description: desc, Priority: priority,
        Owner: owner, Due_Date: due, Root_Cause: cause
      });
      try { LoggerSMOS.add('ISSUE', 'UPDATE', title, 'Diubah dari web oleh ' + user.email); } catch (x) {}
      return { id: id, created: false };
    }
    var rock = DB.first('DB_ROCKS', 'Rock_ID', String(p.rockId || ''));
    if (!rock) throw new Error('Rock tidak ditemukan.');
    id = generateID('ISS');
    DB.insert('DB_ISSUES', {
      Issue_ID: id, Rock_ID: rock.Rock_ID, Rock_Label: rock.Rock_Label || rock.Rock_Name,
      Issue_Title: title, Issue_Label: label, Description: desc, Department: rock.Department,
      Priority: priority, Owner: owner, Due_Date: due, Progress: 0, Status: 'Open',
      Root_Cause: cause, Created_Date: new Date(), Source_Meeting_ID: String(p.meetingId || '')
    });
    try { LoggerSMOS.add('ISSUE', 'CREATE', title, 'Dibuat dari web oleh ' + user.email); } catch (x) {}
    return { id: id, created: true };
  } finally {
    lock.releaseLock();
  }
}

function issuesSolve_(p, user) {
  var id = String(p.id || '').trim();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var issue = DB.first('DB_ISSUES', 'Issue_ID', id);
    if (!issue) throw new Error('Issue tidak ditemukan.');
    DB.update('DB_ISSUES', 'Issue_ID', id, { Progress: 100, Status: 'Done' });
    try { Workflow.refreshRock(issue.Rock_ID); } catch (x) {}
    try { LoggerSMOS.add('ISSUE', 'SOLVE', String(issue.Issue_Title || id), 'Selesai dari web oleh ' + user.email); } catch (x) {}
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}

function todosSave_(p, user) {
  var task = String(p.task || '').trim();
  var owner = String(p.owner || '').trim();
  if (task.length < 3 || task.length > 300) throw new Error('Nama tugas harus 3 sampai 300 karakter.');
  if (!owner) throw new Error('Penanggung jawab wajib diisi.');
  var due = workDate_(p.due);
  var desc = String(p.description || '').trim().slice(0, 1000);

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var id = String(p.id || '').trim();
    if (id) {
      if (!DB.first('DB_TODO', 'Todo_ID', id)) throw new Error('To-Do tidak ditemukan.');
      DB.update('DB_TODO', 'Todo_ID', id, { Task_Name: task, Description: desc, Owner: owner, Due_Date: due });
      try { LoggerSMOS.add('TODO', 'UPDATE', task, 'Diubah dari web oleh ' + user.email); } catch (x) {}
      return { id: id, created: false };
    }
    var issue = DB.first('DB_ISSUES', 'Issue_ID', String(p.issueId || ''));
    if (!issue) throw new Error('Issue tidak ditemukan.');
    var rock = DB.first('DB_ROCKS', 'Rock_ID', issue.Rock_ID);
    id = generateID('TD');
    DB.insert('DB_TODO', {
      Todo_ID: id, Rock_ID: issue.Rock_ID, Rock_Label: rock ? (rock.Rock_Label || rock.Rock_Name) : issue.Rock_Label,
      Issue_ID: issue.Issue_ID, Issue_Label: issue.Issue_Label, Task_Name: task, Description: desc,
      Department: issue.Department, Owner: owner, Due_Date: due, Status: 'Open', Completed_Date: '', Source_Meeting_ID: String(p.meetingId || '')
    });
    try { LoggerSMOS.add('TODO', 'CREATE', task, 'Dibuat dari web oleh ' + user.email); } catch (x) {}
    return { id: id, created: true };
  } finally {
    lock.releaseLock();
  }
}

function todosFinish_(p, user) {
  var id = String(p.id || '').trim();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var todo = DB.first('DB_TODO', 'Todo_ID', id);
    if (!todo) throw new Error('To-Do tidak ditemukan.');
    if (String(todo.Status) === 'Done') return { id: id };
    DB.update('DB_TODO', 'Todo_ID', id, { Status: 'Done', Completed_Date: new Date() });
    Workflow.refreshIssue(todo.Issue_ID);
    var issue = DB.first('DB_ISSUES', 'Issue_ID', todo.Issue_ID);
    if (issue) Workflow.refreshRock(issue.Rock_ID);
    try { Report.refreshOwnerDashboard(); } catch (x) {}
    try { LoggerSMOS.add('TODO', 'FINISH', id, 'Selesai dari web oleh ' + user.email); } catch (x) {}
    return { id: id };
  } finally {
    lock.releaseLock();
  }
}