/**
 * Script Otomasi: Update Smart Checklist di JIRA berdasarkan Hasil Unit Test Jest
 * BSI MFE Shared UI - Bank BRI / BSI Agile SDLC Ecosystem
 * Standar QC Service: Strict Formatting & Real-Time Verification
 */

const fs = require('fs');
const https = require('https');

// 1. Validasi Keberadaan Hasil Jest
const resultsPath = process.env.JEST_RESULTS_PATH || './jest-results.json';
if (!fs.existsSync(resultsPath)) {
  console.error('❌ FATAL ERROR: File jest-results.json tidak ditemukan!');
  console.error('Unit test harus dijalankan dengan flag --json --outputFile=jest-results.json sebelum step ini.');
  process.exit(1);
}

const jestResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// 2. Evaluasi Status Kelulusan Masing-masing Acceptance Criteria
const acStatus = {
  'AC-01': true,
  'AC-02': true,
  'AC-03': true,
  'AC-04': true,
  'AC-05': true,
};

const acFoundInTests = {
  'AC-01': false,
  'AC-02': false,
  'AC-03': false,
  'AC-04': false,
  'AC-05': false,
};

jestResults.testResults.forEach((suite) => {
  suite.assertionResults.forEach((test) => {
    const title = test.title || '';
    const ancestor = (test.ancestorTitles || []).join(' ');
    const fullText = `${ancestor} ${title}`;

    ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].forEach((acKey) => {
      if (fullText.includes(acKey)) {
        acFoundInTests[acKey] = true;
        if (test.status !== 'passed') {
          acStatus[acKey] = false;
        }
      }
    });
  });
});

console.log('Evaluasi Unit Test terhadap Acceptance Criteria:');
console.table(
  Object.keys(acStatus).map((key) => ({
    'Acceptance Criteria': key,
    'Ditemukan di Test': acFoundInTests[key] ? '✅ YA' : '❌ TIDAK',
    'Status Kelulusan': acStatus[key] ? '✅ PASSED' : '❌ FAILED',
  }))
);

// Pastikan semua AC ada di unit test dan semuanya passed
const missingInTests = Object.keys(acFoundInTests).filter((k) => !acFoundInTests[k]);
if (missingInTests.length > 0) {
  console.error(`❌ FATAL ERROR: AC berikut tidak ditemukan dalam skenario Jest: ${missingInTests.join(', ')}`);
  process.exit(1);
}

const failedTests = Object.keys(acStatus).filter((k) => !acStatus[k]);
if (failedTests.length > 0) {
  console.error(`❌ FATAL ERROR: AC berikut gagal dalam unit test: ${failedTests.join(', ')}`);
  process.exit(1);
}

// 3. Konfigurasi JIRA
const jiraBaseUrl = process.env.JIRA_BASE_URL;
const jiraAuth = process.env.JIRA_API_BASIC_AUTH;
const jiraIssueKey = process.env.JIRA_ISSUE_KEY || 'BSI-9';

if (!jiraBaseUrl || !jiraAuth) {
  console.error('❌ FATAL ERROR: JIRA_BASE_URL atau JIRA_API_BASIC_AUTH tidak terdefinisi di environment!');
  process.exit(1);
}

const cleanBaseUrl = jiraBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
const SMART_CHECKLIST_PROP = 'com.railsware.SmartChecklist.checklist';

function jiraRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: cleanBaseUrl,
      path: path,
      method: method,
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function updateSmartChecklist() {
  console.log(`\nMenghubungi JIRA untuk tiket ${jiraIssueKey}...`);
  console.log(`Mengambil property Smart Checklist: ${SMART_CHECKLIST_PROP}...`);

  const getRes = await jiraRequest(
    `/rest/api/3/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'GET'
  );

  if (getRes.statusCode !== 200) {
    console.error(`❌ FATAL ERROR (${getRes.statusCode}): Gagal mengambil Smart Checklist dari JIRA.`);
    console.error('Detail Respons:', getRes.body);
    process.exit(1);
  }

  const parsed = JSON.parse(getRes.body);
  const currentChecklist = parsed.value;

  if (!currentChecklist || typeof currentChecklist !== 'string') {
    console.error('❌ FATAL ERROR: Konten Smart Checklist kosong atau bukan string markdown!');
    process.exit(1);
  }

  console.log('✅ Konten Smart Checklist berhasil ditemukan di JIRA.');

  // Verifikasi apakah semua AC (AC-01 s/d AC-05) benar-benar ada di checklist JIRA
  const missingInJira = ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].filter(
    (acKey) => !currentChecklist.includes(acKey)
  );

  if (missingInJira.length > 0) {
    console.error(`❌ FATAL ERROR: Item berikut tidak ada di checklist JIRA tiket ${jiraIssueKey}: ${missingInJira.join(', ')}`);
    process.exit(1);
  }

  // Format Standar Smart Checklist untuk status DONE:
  // Harus menggunakan format: `+ [ ] AC-xx:` atau `+ [x] AC-xx:`
  // Sesuai panduan Smart Checklist:
  // -- todo
  // + done
  let updatedChecklist = currentChecklist;

  ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].forEach((acKey) => {
    // Pola 1: Mencocokkan `- AC-xx:` atau `+ AC-xx:` (tanpa kurung siku) -> ubah ke `+ [ ] AC-xx:`
    const regexPlain = new RegExp(`^[\\+\\-]\\s*(${acKey}[:\\s][^\\n]*)`, 'gm');
    updatedChecklist = updatedChecklist.replace(regexPlain, '+ [ ] $1');

    // Pola 2: Mencocokkan `- [ ] AC-xx:` atau `- [x] AC-xx:` -> ubah ke `+ [ ] AC-xx:`
    const regexBracket = new RegExp(`^[\\+\\-]\\s*\\[[ xX]?\\]\\s*(${acKey}[:\\s][^\\n]*)`, 'gm');
    updatedChecklist = updatedChecklist.replace(regexBracket, '+ [ ] $1');
  });

  console.log(`Menyimpan pembaruan Smart Checklist ke JIRA (${jiraIssueKey})...`);
  const putRes = await jiraRequest(
    `/rest/api/3/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'PUT',
    JSON.stringify(updatedChecklist)
  );

  if (putRes.statusCode < 200 || putRes.statusCode >= 300) {
    console.error(`❌ FATAL ERROR (${putRes.statusCode}): Gagal menyimpan perubahan ke JIRA.`);
    console.error('Detail Respons:', putRes.body);
    process.exit(1);
  }

  // VERIFIKASI KEMBALI (Audit Trail): Pastikan JIRA benar-benar menyimpan status Done
  console.log('Melakukan verifikasi ulang langsung ke API JIRA...');
  const verifyRes = await jiraRequest(
    `/rest/api/3/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'GET'
  );

  const verifyVal = JSON.parse(verifyRes.body).value || '';
  const notDone = ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].filter((acKey) => {
    const isDone = new RegExp(`\\+\\s*\\[?\\s*\\w*\\s*\\]?\\s*${acKey}`, 'm').test(verifyVal);
    return !isDone;
  });

  if (notDone.length > 0) {
    console.error(`❌ FATAL VERIFICATION ERROR: Item berikut belum terdaftar sebagai DONE di JIRA: ${notDone.join(', ')}`);
    console.error('Konten JIRA saat ini:\n', verifyVal);
    process.exit(1);
  }

  console.log(`\n🎉 VERIFIKASI BERHASIL 100%: Smart Checklist tiket ${jiraIssueKey} telah terkonfirmasi DONE di JIRA!`);
  console.log('Semua Acceptance Criteria (AC-01 s/d AC-05) kini resmi berstatus DONE (Hijau) di Smart Checklist JIRA.');
}

updateSmartChecklist().catch((err) => {
  console.error('❌ UNHANDLED EXCEPTION:', err);
  process.exit(1);
});
