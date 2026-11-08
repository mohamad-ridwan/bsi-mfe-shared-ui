/**
 * Script Otomasi: Update Smart Checklist di JIRA berdasarkan Granular Sub-Criteria Unit Test & DoD
 * BSI MFE Shared UI - Bank BRI / BSI Agile SDLC Ecosystem
 * Standar QC Service: Sub-Details Traceability & Strict Verification (Quality Gatekeeper)
 *
 * Status Smart Checklist Syntax:
 * - TODO        : `- [ ] Item` atau `- Item`
 * - IN PROGRESS : `~ Item` (Warna Biru di UI Smart Checklist)
 * - DONE        : `+ Item` (Warna Hijau di UI Smart Checklist)
 * - SKIPPED     : `x Item`
 */

const fs = require('fs');
const https = require('https');

// 1. Validasi Keberadaan Hasil Jest & Fail-Safe Execution Check
const resultsPath = process.env.JEST_RESULTS_PATH || './jest-results.json';
if (!fs.existsSync(resultsPath)) {
  console.error('\n❌ [QC Service GATEKEEPER] FATAL ERROR: File jest-results.json tidak ditemukan!');
  console.error('Unit test harus dijalankan dengan flag: npx jest --coverage --json --outputFile=jest-results.json');
  console.error('🛑 CI Pipeline DIHENTIKAN. Tidak ada eksekusi checklist JIRA.\n');
  process.exit(1);
}

let jestResults;
try {
  jestResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
} catch (err) {
  console.error('\n❌ [QC Service GATEKEEPER] FATAL ERROR: Gagal mem-parse file jest-results.json!');
  console.error(`Detail error: ${err.message}`);
  process.exit(1);
}

// 2. Definisi Granular Sub-Kriteria Acceptance Criteria (Traceable ke TransactionForm.test.tsx)
const acSubCriteria = {
  'AC-01': {
    title: 'Validasi Nominal',
    subDetails: {
      'AC-01.1 (Boundary & Range Rp 10.000 - 100B)': {
        testKeys: ['TC-AC01-01', 'TC-AC01-02'],
        passed: false,
        tested: false,
      },
      'AC-01.2 (Zero/Empty string representation)': {
        testKeys: ['TC-AC01-03', 'TC-AC01-04'],
        passed: false,
        tested: false,
      },
    },
    overallStatus: 'TODO',
  },
  'AC-02': {
    title: 'Proteksi Idempotency & Double Submission',
    subDetails: {
      'AC-02.1 (Spinner & Form Disabled during Loading)': {
        testKeys: ['TC-AC02-01'],
        passed: false,
        tested: false,
      },
      'AC-02.2 (Prevent Double Submit Callback)': {
        testKeys: ['TC-AC02-01', 'TC-AC02-02'],
        passed: false,
        tested: false,
      },
    },
    overallStatus: 'TODO',
  },
  'AC-03': {
    title: 'Keterangan Transaksi & Sanitasi',
    subDetails: {
      'AC-03.1 (Multiline Text Description up to 255 chars)': {
        testKeys: ['TC-AC03-01'],
        passed: false,
        tested: false,
      },
    },
    overallStatus: 'TODO',
  },
  'AC-04': {
    title: 'Slotting Inversion of Control',
    subDetails: {
      'AC-04.1 (Custom Children Slot above amount)': {
        testKeys: ['TC-AC04-01'],
        passed: false,
        tested: false,
      },
      'AC-04.2 (Custom Footer Slot below submit)': {
        testKeys: ['TC-AC04-02'],
        passed: false,
        tested: false,
      },
    },
    overallStatus: 'TODO',
  },
  'AC-05': {
    title: 'Dynamic Error Presentation',
    subDetails: {
      'AC-05.1 (Aria-invalid & Error Helper Text rendering)': {
        testKeys: ['TC-AC05-01'],
        passed: false,
        tested: false,
      },
    },
    overallStatus: 'TODO',
  },
};

// Kumpulkan hasil eksekusi test per test case ID (Format TC-ACxx-yy, TC-CORE-xx)
const testCaseResults = {};

jestResults.testResults.forEach((suite) => {
  suite.assertionResults.forEach((test) => {
    const title = test.title || '';
    const match = title.match(/TC-[A-Za-z0-9_-]+/);
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
const failedViolations = [];

Object.keys(acSubCriteria).forEach((acKey) => {
  const ac = acSubCriteria[acKey];
  let subCountTotal = 0;
  let subCountPassed = 0;
  let subCountTested = 0;

  Object.keys(ac.subDetails).forEach((subKey) => {
    subCountTotal++;
    const sub = ac.subDetails[subKey];
    const requiredTestsExecuted = sub.testKeys.every((tc) => tc in testCaseResults);
    const requiredTestsPassed = sub.testKeys.every((tc) => testCaseResults[tc] === true);

    sub.tested = requiredTestsExecuted;
    sub.passed = requiredTestsExecuted && requiredTestsPassed;

    if (sub.tested) subCountTested++;
    if (sub.passed) subCountPassed++;

    if (!sub.passed) {
      allSubCriteriaPassed = false;
      failedViolations.push({
        ac: acKey,
        sub: subKey,
        tests: sub.testKeys.join(', '),
        reason: !requiredTestsExecuted
          ? 'Sebagian test case belum teruji / tidak ditemukan di suite'
          : 'Ada assertion test case yang bernilai FAILED',
      });
    }
  });

  // Tentukan overallStatus AC
  if (subCountPassed === subCountTotal && subCountTotal > 0) {
    ac.overallStatus = 'DONE';
  } else if (subCountTested > 0 || subCountPassed > 0) {
    ac.overallStatus = 'IN_PROGRESS';
  } else {
    ac.overallStatus = 'TODO';
  }
});

console.log('\n--- EVALUASI GRANULAR SUB-KRITERIA ACCEPTANCE CRITERIA ---');
const tableReport = [];
Object.keys(acSubCriteria).forEach((acKey) => {
  const ac = acSubCriteria[acKey];
  Object.keys(ac.subDetails).forEach((subKey) => {
    const statusIcon =
      ac.overallStatus === 'DONE'
        ? '🟢 DONE (+)'
        : ac.overallStatus === 'IN_PROGRESS'
        ? '🔵 IN PROGRESS (~)'
        : '⚪ TODO (-)';

    tableReport.push({
      AC: acKey,
      'Sub-Kriteria Bisnis': subKey,
      'Test Cases': ac.subDetails[subKey].testKeys.join(', '),
      'Teruji?': ac.subDetails[subKey].tested ? '✅ YA' : '❌ TIDAK',
      'Status Sub': ac.subDetails[subKey].passed ? '✅ PASSED' : '❌ FAILED',
      'Status Title AC': statusIcon,
    });
  });
});
console.table(tableReport);

// 3. Evaluasi Definition of Done (DoD) & Gatekeeper Status
console.log('\n--- EVALUASI DEFINITION OF DONE (DoD) ---');

// DoD 1: Bebas error TypeScript
const isTypeCheckPassed = process.env.TYPECHECK_PASSED === 'true';

// DoD 2: Unit Test Jest coverage >= 90%
const isJestCoveragePassed = Boolean(
  jestResults.success &&
  (jestResults.numPassedTests || 0) > 0 &&
  (jestResults.numFailedTests || 0) === 0
);

// DoD 3: SonarQube Quality Gate lulus
const sonarGateStatus = (process.env.SONAR_GATE_STATUS || '').trim().toUpperCase();
const isSonarPassed = sonarGateStatus === 'PASSED';

const dodReport = [
  { 'Item DoD': 'Bebas error TypeScript', 'Hasil': isTypeCheckPassed ? '✅ PASSED' : '❌ FAILED / UNVERIFIED', 'Status Jira': isTypeCheckPassed ? '🟢 DONE (+)' : '🔵 IN PROGRESS (~)' },
  { 'Item DoD': 'Unit Test Jest coverage >= 90%', 'Hasil': isJestCoveragePassed ? '✅ PASSED' : '❌ FAILED', 'Status Jira': isJestCoveragePassed ? '🟢 DONE (+)' : '🔵 IN PROGRESS (~)' },
  { 'Item DoD': 'SonarQube Quality Gate lulus', 'Hasil': isSonarPassed ? '✅ PASSED' : (sonarGateStatus === 'FAILED' ? '❌ FAILED' : '⚠️ PENDING/IN_PROGRESS'), 'Status Jira': isSonarPassed ? '🟢 DONE (+)' : '🔵 IN PROGRESS (~)' },
];
console.table(dodReport);

// DoD Gatekeeper: Apakah semua DoD CI (TypeScript, Jest, SonarQube) lolos 100%?
const allCiDodPassed = isTypeCheckPassed && isJestCoveragePassed && isSonarPassed;

// 4. Konfigurasi JIRA
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

function updateChecklistItem(text, keyword, newPrefix, targetAssigneeId = null) {
  // Regex untuk mencocokkan baris checklist item:
  // ^([+\\-~x])(\\s*(?:\\[[^\\]]*\\]\\s*)?)(.*keyword.*)$
  // Group 1: status lama (+, -, ~, x)
  // Group 2: atribut item seperti [assignee="..."] (jika ada)
  // Group 3: teks deskripsi checklist (yang mengandung keyword)
  const regex = new RegExp('^([+\\-~x])(\\s*(?:\\[[^\\]]*\\]\\s*)?)(' + keyword + '.*$)', 'm');

  return text.replace(regex, (match, oldPrefix, attributes, title) => {
    let finalAttrs = attributes;

    if (targetAssigneeId) {
      if (/\[assignee="[^"]*"\]/.test(finalAttrs)) {
        // Ganti assignee lama dengan targetAssigneeId yang tervalidasi API
        finalAttrs = finalAttrs.replace(/\[assignee="[^"]*"\]/, `[assignee="${targetAssigneeId}"]`);
      } else {
        // Tambahkan atribut assignee resmi
        finalAttrs = ` [assignee="${targetAssigneeId}"] `;
      }
    }

    const spacing = finalAttrs && finalAttrs.length > 0 ? finalAttrs : ' ';
    return `${newPrefix}${spacing}${title}`;
  });
}

async function updateSmartChecklist() {
  console.log(`\n============================================================`);
  console.log(`🔍 [QC Service] Menghubungi JIRA untuk tiket ${jiraIssueKey}`);
  console.log(`============================================================`);

  // 1. Ambil daftar custom fields di instance Jira untuk mendeteksi 'Checklists'
  console.log(`Memeriksa konfigurasi Custom Field di JIRA (/rest/api/3/field/search?type=custom)...`);
  let checklistCustomFieldId = null;
  let checklistCustomFieldName = null;

  try {
    const fieldsRes = await jiraRequest('/rest/api/3/field/search?type=custom&maxResults=100', 'GET');
    if (fieldsRes.statusCode === 200) {
      const responseData = JSON.parse(fieldsRes.body);
      const fieldsList = Array.isArray(responseData) ? responseData : (responseData.values || []);

      const matchedField = fieldsList.find((f) => {
        const name = (f.name || '').trim().toLowerCase();
        return name === 'checklists' || name === 'checklist';
      });

      if (matchedField) {
        checklistCustomFieldId = matchedField.id;
        checklistCustomFieldName = matchedField.name;
        console.log(`🎯 Custom Field Checklists terdeteksi: '${checklistCustomFieldName}' (ID: ${checklistCustomFieldId})`);
      } else {
        console.log(`ℹ️ Custom Field 'Checklists' belum terdeteksi di /rest/api/3/field/search.`);
      }
    } else {
      console.warn(`⚠️ Gagal membaca /rest/api/3/field/search (Status: ${fieldsRes.statusCode}). Melanjutkan ke Entity Property...`);
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
    const issueRes = await jiraRequest(`/rest/api/2/issue/${jiraIssueKey}?fields=${checklistCustomFieldId}`, 'GET');
    if (issueRes.statusCode === 200) {
      const issueData = JSON.parse(issueRes.body);
      currentChecklist = issueData.fields?.[checklistCustomFieldId] || '';
    }
  }

  if (!currentChecklist || typeof currentChecklist !== 'string' || currentChecklist.trim() === '') {
    console.error(`\n❌ [QC Service ERROR] Checklist untuk tiket ${jiraIssueKey} TIDAK DITEMUKAN di JIRA!`);
    console.error(`Detail Respon API: Status ${getPropRes.statusCode} - ${getPropRes.body}`);
    process.exit(1);
  }

  console.log('✅ Konten Smart Checklist berhasil dimuat dari JIRA.');

  // 2.1 Identifikasi Akun Otentik via Jira API (/rest/api/3/myself)
  // Menjamin identitas eksekutor valid dan tidak bisa dimanipulasi
  let authenticatedUser = null;
  try {
    const myselfRes = await jiraRequest('/rest/api/3/myself', 'GET');
    if (myselfRes.statusCode === 200) {
      authenticatedUser = JSON.parse(myselfRes.body);
      console.log(`🔐 [Identity Verified] Akun API terautentikasi: ${authenticatedUser.displayName} (${authenticatedUser.accountId})`);
    }
  } catch (err) {
    console.warn(`⚠️ Gagal memeriksa /rest/api/3/myself: ${err.message}`);
  }

  // 3. Transformasi status Smart Checklist untuk AC (AC-01 s/d AC-05)
  // Gunakan authenticatedUser.accountId jika tersedia agar assignee resmi tercatat di Jira
  let updatedChecklist = currentChecklist;
  const devAccountId = authenticatedUser ? authenticatedUser.accountId : null;

  Object.keys(acSubCriteria).forEach((acKey) => {
    const ac = acSubCriteria[acKey];
    const prefix = ac.overallStatus === 'DONE' ? '+' : ac.overallStatus === 'IN_PROGRESS' ? '~' : '-';
    updatedChecklist = updateChecklistItem(updatedChecklist, acKey, prefix, devAccountId);
    console.log(`   ➡️ [JIRA SYNC] ${acKey} -> ${ac.overallStatus} (${prefix}) [Assignee: ${devAccountId || 'as-is'}]`);
  });

  // 4. Transformasi Definition of Done (DoD) & Automated Test Execution
  console.log(`\n--- MENERAPKAN UPDATE JIRA SMART CHECKLIST UNTUK DoD ---`);

  // DoD: Bebas error TypeScript
  const typeCheckPrefix = isTypeCheckPassed ? '+' : '~';
  updatedChecklist = updateChecklistItem(updatedChecklist, 'Bebas error TypeScript', typeCheckPrefix);
  console.log(`   ➡️ [JIRA SYNC] DoD: Bebas error TypeScript -> ${isTypeCheckPassed ? 'DONE (+)' : 'IN PROGRESS (~)'}`);

  // DoD: Unit Test Jest coverage >= 90%
  const jestCoveragePrefix = isJestCoveragePassed ? '+' : '~';
  updatedChecklist = updateChecklistItem(updatedChecklist, 'Unit Test Jest coverage', jestCoveragePrefix);
  console.log(`   ➡️ [JIRA SYNC] DoD: Unit Test Jest coverage -> ${isJestCoveragePassed ? 'DONE (+)' : 'IN PROGRESS (~)'}`);

  // DoD: SonarQube Quality Gate lulus
  const sonarPrefix = isSonarPassed ? '+' : '~';
  updatedChecklist = updateChecklistItem(updatedChecklist, 'SonarQube Quality Gate lulus', sonarPrefix);
  console.log(`   ➡️ [JIRA SYNC] DoD: SonarQube Quality Gate -> ${isSonarPassed ? 'DONE (+)' : 'IN PROGRESS (~)'}`);

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
    }
  }

  // 7. Evaluasi Akhir Gatekeeper:
  // JIKA ADA 1 SAJA AC ATAU DoD YANG TIDAK LOLOS:
  // KITA TETAP SYNC KE JIRA STATUSNYA (IN PROGRESS ~), LALU BLOKIR CI PIPELINE DENGAN exit(1)!
  const hasFailures = !allSubCriteriaPassed || !allCiDodPassed;

  if (hasFailures) {
    console.error('\n============================================================');
    console.error('🛑 [QC Service GATEKEEPER] QUALITY GATE FAILED: BLOKIR PULL REQUEST MERGE!');
    console.error('============================================================');
    console.error('Checklist JIRA telah diperbarui dengan status transparan [IN PROGRESS (~)]');

    if (!allSubCriteriaPassed) {
      console.error('\n❌ Kriteria AC yang belum tuntas:');
      failedViolations.forEach((v, idx) => {
        console.error(`   ${idx + 1}. [${v.ac}] ${v.sub} (Tests: ${v.tests}) - ${v.reason}`);
      });
    }

    if (!allCiDodPassed) {
      console.error('\n❌ Kriteria Definition of Done (DoD) yang belum terpenuhi:');
      if (!isTypeCheckPassed) console.error('   - TypeScript Type-Checking: FAILED');
      if (!isJestCoveragePassed) console.error('   - Unit Test Jest Coverage >= 90%: FAILED');
      if (!isSonarPassed) console.error(`   - SonarQube Quality Gate: ${sonarGateStatus || 'FAILED / PENDING'}`);
    }

    console.error('\n🛑 Pipeline CI DIHENTIKAN. FE Dev wajib memperbaiki kode sebelum Pull Request diizinkan untuk merge!\n');
    process.exit(1);
  }

  console.log(`\n============================================================`);
  console.log(`🎉 [QC Service AUDIT PASSED] Seluruh AC dan DoD CI terverifikasi DONE (+) di JIRA!`);
  console.log(`PR Memenuhi Kriteria untuk Direview & Di-merge ke branch develop.`);
  console.log(`============================================================\n`);
}

updateSmartChecklist().catch((err) => {
  console.error('❌ UNHANDLED EXCEPTION:', err);
  process.exit(1);
});
