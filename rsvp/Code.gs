/**
 * RSVP receiver for the Ahmed & Reem invitation.
 * Paste this into Extensions → Apps Script of a Google Sheet,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Every RSVP becomes a new row: Time | Full name | Message
 */

const SHEET_NAME = 'RSVP';

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    const fullname = clean_(p.fullname, 120);
    const message = clean_(p.message, 600);

    if (fullname.length < 2) return json_({ ok: false, error: 'Full name is required' });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      getSheet_().appendRow([new Date(), fullname, message]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'rsvp' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Time', 'Full name', 'Message']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and stop text like "=HYPERLINK(...)" from running as a formula
function clean_(value, max) {
  let s = String(value || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
