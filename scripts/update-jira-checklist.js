/**
 * Script Otomasi: Update Smart Checklist di JIRA berdasarkan Granular Sub-Criteria Unit Test
 * BSI MFE Shared UI - Bank BRI / BSI Agile SDLC Ecosystem
 * Standar QC Service: Sub-Details Traceability & Strict Verification
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

// 2. Definisi Granular Sub-Kriteria Acceptance Criteria
// Title AC HANYA boleh DONE jika seluruh sub-kriteria di bawahnya lulus 100%!
const acSubCriteria = {
  'AC-01': {
    title: 'Validasi Nominal',
    subDetails: {
      'AC-01.1 (Boundary & Range Rp 10.000 - 100B)': { testKeys: ['TC-07', 'TC-07c'], passed: false, tested: false },
      'AC-01.2 (Zero/Empty string representation)': { testKeys: ['TC-02', 'TC-08'], passed: false, tested: false },
    },
    overallPassed: false,
  },
  'AC-02': {
    title: 'Proteksi Idempotency & Double Submission',
    subDetails: {
      'AC-02.1 (Spinner & Form Disabled during Loading)': { testKeys: ['TC-12'], passed: false, tested: false },
      'AC-02.2 (Prevent Double Submit Callback)': { testKeys: ['TC-12', 'TC-13'], passed: false, tested: false },
    },
    overallPassed: false,
  },
  'AC-03': {
    title: 'Keterangan Transaksi & Sanitasi',
    subDetails: {
      'AC-03.1 (Multiline Text Description up to 255 chars)': { testKeys: ['TC-09', 'TC-09b'], passed: false, tested: false },
    },
    overallPassed: false,
  },
  'AC-04': {
    title: 'Slotting Inversion of Control',
    subDetails: {
      'AC-04.1 (Custom Children Slot above amount)': { testKeys: ['TC-05'], passed: false, tested: false },
      'AC-04.2 (Custom Footer Slot below submit)': { testKeys: ['TC-06'], passed: false, tested: false },
    },
    overallPassed: false,
  },
  'AC-05': {
    title: 'Dynamic Error Presentation',
    subDetails: {
      'AC-05.1 (Aria-invalid & Error Helper Text rendering)': { testKeys: ['TC-10'], passed: false, tested: false },
    },
    overallPassed: false,
  },
};

// Kumpulkan hasil eksekusi test per test case ID (TC-xx)
const testCaseResults = {};

jestResults.testResults.forEach((suite) => {
  suite.assertionResults.forEach((test) => {
    const title = test.title || '';
    const match = title.match(/TC-\d+[a-z]?/);
    if (match) {
      const tcId = match[0];
      testCaseResults[tcId] = test.status === 'passed';
    }
  });
});

console.log('--- REKAPITULASI HASIL EKSEKUSI UNIT TEST PER TEST CASE ---');
console.table(testCaseResults);

// Evaluasi sub-kriteria
let allSubCriteriaPassed = true;

Object.keys(acSubCriteria).forEach((acKey) => {
  const ac = acSubCriteria[acKey];
  let acSubAllOk = true;

  Object.keys(ac.subDetails).forEach((subKey) => {
    const sub = ac.subDetails[subKey];
    // Pastikan seluruh testKeys yang dipetakan bernilai passed
    const requiredTestsPassed = sub.testKeys.every((tc) => testCaseResults[tc] === true);
    const requiredTestsExecuted = sub.testKeys.every((tc) => tc in testCaseResults);

    sub.tested = requiredTestsExecuted;
    sub.passed = requiredTestsPassed;

    if (!sub.passed) {
      acSubAllOk = false;
      allSubCriteriaPassed = false;
    }
  });

  ac.overallPassed = acSubAllOk;
});

console.log('\n--- EVALUASI GRANULAR SUB-KRITERIA ACCEPTANCE CRITERIA ---');
const tableReport = [];
Object.keys(acSubCriteria).forEach((acKey) => {
  const ac = acSubCriteria[acKey];
  Object.keys(ac.subDetails).forEach((subKey) => {
    tableReport.push({
      AC: acKey,
      'Sub-Kriteria Bisnis': subKey,
      'Test Cases': ac.subDetails[subKey].testKeys.join(', '),
      'Teruji?': ac.subDetails[subKey].tested ? '✅ YA' : '❌ TIDAK',
      'Status Sub': ac.subDetails[subKey].passed ? '✅ PASSED' : '❌ FAILED',
      'Status Title AC': ac.overallPassed ? '🟢 DONE' : '🔴 TODO',
    });
  });
});
console.table(tableReport);

if (!allSubCriteriaPassed) {
  console.error('\n❌ FATAL ERROR: Terdapat sub-kriteria AC yang belum teruji atau gagal!');
  console.error('Title AC tidak boleh diubah ke DONE jika sub-kriterianya belum lolos verifikasi.');
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

  // Lakukan transformasi: Title AC HANYA diubah ke `+ [ ]` jika ac.overallPassed bernilai true!
  let updatedChecklist = currentChecklist;

  Object.keys(acSubCriteria).forEach((acKey) => {
    const ac = acSubCriteria[acKey];
    if (ac.overallPassed) {
      // Ubah `- [ ] AC-xx:` atau `+ [ ] AC-xx:` atau `- AC-xx:` -> `+ [ ] AC-xx:` (Done)
      const regexAny = new RegExp(`^[\\+\\-]\\s*(\\[[ xX]?\\]\\s*)?(${acKey}[:\\s][^\\n]*)`, 'gm');
      updatedChecklist = updatedChecklist.replace(regexAny, '+ [ ] $2');
    }
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

  // Verifikasi ulang (Audit Trail)
  console.log('Melakukan verifikasi ulang langsung ke API JIRA...');
  const verifyRes = await jiraRequest(
    `/rest/api/3/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'GET'
  );

  const verifyVal = JSON.parse(verifyRes.body).value || '';
  const notDone = Object.keys(acSubCriteria).filter((acKey) => {
    const isDone = new RegExp(`\\+\\s*\\[?\\s*\\w*\\s*\\]?\\s*${acKey}`, 'm').test(verifyVal);
    return !isDone;
  });

  if (notDone.length > 0) {
    console.error(`❌ FATAL VERIFICATION ERROR: Item berikut belum terdaftar sebagai DONE di JIRA: ${notDone.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🎉 VERIFIKASI SUB-DETAILS BERHASIL 100%:`);
  console.log(`Seluruh sub-detail teknis untuk AC-01 s/d AC-05 terbukti lulus pengujian.`);
  console.log(`Smart Checklist tiket ${jiraIssueKey} resmi berstatus DONE di JIRA!`);
}

updateSmartChecklist().catch((err) => {
  console.error('❌ UNHANDLED EXCEPTION:', err);
  process.exit(1);
});
