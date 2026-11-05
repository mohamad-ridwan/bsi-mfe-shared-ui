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
  console.log(`\n============================================================`);
  console.log(`🔍 [QC Service] Menghubungi JIRA untuk tiket ${jiraIssueKey}`);
  console.log(`============================================================`);

  // 1. Ambil daftar custom fields di instance Jira untuk mendeteksi 'Checklists'
  console.log(`Memeriksa konfigurasi Custom Field di JIRA (/rest/api/3/field)...`);
  let checklistCustomFieldId = null;
  let checklistCustomFieldName = null;

  try {
    const fieldsRes = await jiraRequest('/rest/api/3/field', 'GET');
    if (fieldsRes.statusCode === 200) {
      const allFields = JSON.parse(fieldsRes.body);
      const matchedField = allFields.find((f) => {
        const name = (f.name || '').toLowerCase();
        return name === 'checklists' || name === 'checklist';
      });

      if (matchedField) {
        checklistCustomFieldId = matchedField.id;
        checklistCustomFieldName = matchedField.name;
        console.log(`🎯 Custom Field Checklists terdeteksi: '${checklistCustomFieldName}' (ID: ${checklistCustomFieldId})`);
      } else {
        console.log(`ℹ️ Custom Field 'Checklists' belum terdeteksi di /rest/api/3/field.`);
        const customOnly = allFields.filter(f => f.custom).map(f => `${f.name} (${f.id})`);
        console.log(`Daftar Custom Fields yang ada: ${customOnly.slice(0, 10).join(', ')}...`);
      }
    } else {
      console.warn(`⚠️ Gagal membaca /rest/api/3/field (Status: ${fieldsRes.statusCode}). Melanjutkan ke Entity Property...`);
    }
  } catch (err) {
    console.warn(`⚠️ Error saat membaca fields: ${err.message}`);
  }

  // 2. Ambil konten checklist saat ini dari Issue Property
  console.log(`\nMengambil konten Smart Checklist dari Issue Property: ${SMART_CHECKLIST_PROP}...`);
  const getPropRes = await jiraRequest(
    `/rest/api/2/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'GET'
  );

  let currentChecklist = '';

  if (getPropRes.statusCode === 200) {
    const parsed = JSON.parse(getPropRes.body);
    currentChecklist = parsed.value;
  } else if (checklistCustomFieldId) {
    // Coba baca dari Custom Field jika property kosong
    const issueRes = await jiraRequest(`/rest/api/2/issue/${jiraIssueKey}?fields=${checklistCustomFieldId}`, 'GET');
    if (issueRes.statusCode === 200) {
      const issueData = JSON.parse(issueRes.body);
      currentChecklist = issueData.fields?.[checklistCustomFieldId] || '';
    }
  }

  if (!currentChecklist || typeof currentChecklist !== 'string' || currentChecklist.trim() === '') {
    console.error(`\n❌ [QC Service ERROR] Checklist untuk tiket ${jiraIssueKey} TIDAK DITEMUKAN di JIRA!`);
    console.error(`Detail Respon API: Status ${getPropRes.statusCode} - ${getPropRes.body}`);
    console.error(`\n💡 SOLUSI PROBLEM SOLVING:`);
    console.error(`1. Pastikan tiket ${jiraIssueKey} sudah memiliki checklist di panel Smart Checklist Jira.`);
    console.error(`2. Pastikan checklist memiliki section '# 🎯 Acceptance Criteria Verification'.`);
    process.exit(1);
  }

  console.log('✅ Konten Smart Checklist berhasil dimuat dari JIRA.');

  // 3. Verifikasi apakah semua AC (AC-01 s/d AC-05) ada di checklist JIRA
  const requiredAcs = ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'];
  const missingInJira = requiredAcs.filter((acKey) => !currentChecklist.includes(acKey));

  if (missingInJira.length > 0) {
    console.error(`\n❌ [QC Service ERROR] Kriteria berikut tidak ditemukan di checklist JIRA tiket ${jiraIssueKey}:`);
    console.error(`Missing items: ${missingInJira.join(', ')}`);
    console.error(`\n💡 Acceptance Criteria pada tiket JIRA harus memuat AC-01 sampai AC-05.`);
    process.exit(1);
  }

  // 4. Transformasi format checklist ke DONE: `+ AC-xx:`
  let updatedChecklist = currentChecklist;

  Object.keys(acSubCriteria).forEach((acKey) => {
    const ac = acSubCriteria[acKey];
    if (ac.overallPassed) {
      // Ubah baris `- AC-xx:` atau `- [ ] AC-xx:` menjadi `+ AC-xx:`
      const regexAny = new RegExp(`^[\\+\\-]\\s*(\\[[^\\]]*\\]\\s*)?(${acKey}[:\\s][^\\n]*)`, 'gm');
      updatedChecklist = updatedChecklist.replace(regexAny, '+ $2');
    }
  });

  // 5. Simpan ke Issue Property: com.railsware.SmartChecklist.checklist
  console.log(`\nMenyimpan checklist ter-update ke Issue Property (${SMART_CHECKLIST_PROP})...`);
  const putPropRes = await jiraRequest(
    `/rest/api/2/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'PUT',
    JSON.stringify(updatedChecklist)
  );

  if (putPropRes.statusCode !== 200 && putPropRes.statusCode !== 201) {
    console.error(`\n❌ [QC Service ERROR] Gagal menyimpan checklist ke JIRA Issue Property!`);
    console.error(`HTTP Status: ${putPropRes.statusCode}`);
    console.error(`Respon Server: ${putPropRes.body}`);
    console.error(`\n💡 PROBLEM SOLVING:`);
    console.error(`Periksa hak akses user bot (JIRA_API_BASIC_AUTH) apakah memiliki izin 'Edit Issues' di project BSI.`);
    process.exit(1);
  }
  console.log(`✅ Berhasil menyimpan ke Issue Property (Status: ${putPropRes.statusCode}).`);

  // 6. Simpan ke Custom Field Checklists (jika ada)
  if (checklistCustomFieldId) {
    console.log(`Menyimpan checklist ter-update ke Custom Field '${checklistCustomFieldName}' (${checklistCustomFieldId})...`);
    const putCfRes = await jiraRequest(`/rest/api/2/issue/${jiraIssueKey}`, 'PUT', {
      fields: {
        [checklistCustomFieldId]: updatedChecklist,
      },
    });

    if (putCfRes.statusCode === 200 || putCfRes.statusCode === 204) {
      console.log(`✅ Berhasil sync ke Custom Field '${checklistCustomFieldName}'!`);
    } else {
      console.warn(`⚠️ Update Custom Field mengembalikan status ${putCfRes.statusCode}: ${putCfRes.body}`);
      console.warn(`Pastikan custom field '${checklistCustomFieldName}' terhubung ke Screen Edit/View di project BSI.`);
    }
  } else {
    console.log(`ℹ️ Info: Custom field 'Checklists' belum ada di Jira instance.`);
    console.log(`Data tersimpan di Jira Issue Property. Jika UI belum langsung sync otomatis,`);
    console.log(`buat custom field bernama 'Checklists' (Paragraph / Multi-line text) di Jira Settings.`);
  }

  // 7. Verifikasi Ulang Langsung dari JIRA (Audit Trail & Fail-Safe)
  console.log(`\nMelakukan verifikasi ulang langsung ke backend JIRA...`);
  const verifyRes = await jiraRequest(
    `/rest/api/2/issue/${jiraIssueKey}/properties/${SMART_CHECKLIST_PROP}`,
    'GET'
  );

  if (verifyRes.statusCode !== 200) {
    console.error(`\n❌ [QC Service ERROR] Gagal memverifikasi ulang status tiket dari JIRA.`);
    console.error(`HTTP Status: ${verifyRes.statusCode}`);
    process.exit(1);
  }

  const verifyVal = JSON.parse(verifyRes.body).value || '';
  const notDoneAcs = Object.keys(acSubCriteria).filter((acKey) => {
    const isDone = new RegExp(`^\\+\\s+${acKey}`, 'm').test(verifyVal);
    return !isDone;
  });

  if (notDoneAcs.length > 0) {
    console.error(`\n❌ [QC Service AUDIT FAILED] Verifikasi gagal: AC berikut masih belum berstatus DONE di JIRA:`);
    console.error(`Item bermasalah: ${notDoneAcs.join(', ')}`);
    console.error(`\n💡 PROBLEM SOLVING: Format di JIRA tidak sesuai dengan regex verifikasi.`);
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`🎉 [QC Service AUDIT PASSED] Seluruh AC-01 s/d AC-05 terverifikasi DONE di JIRA!`);
  console.log(`============================================================\n`);
}

updateSmartChecklist().catch((err) => {
  console.error('❌ UNHANDLED EXCEPTION:', err);
  process.exit(1);
});
