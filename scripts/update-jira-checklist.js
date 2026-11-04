/**
 * Script Otomasi: Update Smart Checklist di JIRA berdasarkan Hasil Unit Test Jest
 * BSI MFE Shared UI - Bank BRI / BSI Agile SDLC Ecosystem
 */

const fs = require('fs');
const https = require('https');

// 1. Baca hasil eksekusi Jest dari jest-results.json
const resultsPath = process.env.JEST_RESULTS_PATH || './jest-results.json';
if (!fs.existsSync(resultsPath)) {
  console.log('File jest-results.json tidak ditemukan. Melewati update Smart Checklist.');
  process.exit(0);
}

const jestResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// 2. Evaluasi status kelulusan masing-masing Acceptance Criteria (AC-01 s/d AC-05)
const acStatus = {
  'AC-01': true,
  'AC-02': true,
  'AC-03': true,
  'AC-04': true,
  'AC-05': true,
};

let hasACTests = false;

jestResults.testResults.forEach((suite) => {
  suite.assertionResults.forEach((test) => {
    const title = test.title || '';
    const ancestor = (test.ancestorTitles || []).join(' ');
    const fullText = `${ancestor} ${title}`;

    ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].forEach((acKey) => {
      if (fullText.includes(acKey)) {
        hasACTests = true;
        if (test.status !== 'passed') {
          acStatus[acKey] = false;
        }
      }
    });
  });
});

console.log('Evaluasi Unit Test terhadap Acceptance Criteria (AC):', acStatus);

// 3. Konfigurasi JIRA
const jiraBaseUrl = process.env.JIRA_BASE_URL; // misal: https://v1-software-dev.atlassian.net
const jiraAuth = process.env.JIRA_API_BASIC_AUTH;
const jiraIssueKey = process.env.JIRA_ISSUE_KEY || 'BSI-9';

if (!jiraBaseUrl || !jiraAuth) {
  console.log('JIRA_BASE_URL atau JIRA_API_BASIC_AUTH tidak terdefinisi. Melewati pengiriman ke JIRA.');
  process.exit(0);
}

const cleanBaseUrl = jiraBaseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

// Helper request HTTPS
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
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', (err) => reject(err));
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function updateSmartChecklist() {
  try {
    console.log(`Mengambil Smart Checklist dari tiket ${jiraIssueKey}...`);

    // Coba ambil property checklist dari Jira issue
    const getRes = await jiraRequest(`/rest/api/3/issue/${jiraIssueKey}/properties/checklist`, 'GET');

    let currentChecklist = '';
    if (getRes.statusCode === 200) {
      const parsed = JSON.parse(getRes.body);
      currentChecklist = parsed.value || '';
    } else {
      // Fallback jika belum ada property, ambil dari customfield tiket
      const issueRes = await jiraRequest(`/rest/api/3/issue/${jiraIssueKey}?fields=*all`, 'GET');
      if (issueRes.statusCode === 200) {
        const issueData = JSON.parse(issueRes.body);
        for (const [key, val] of Object.entries(issueData.fields)) {
          if (typeof val === 'string' && val.includes('AC-01')) {
            currentChecklist = val;
            break;
          }
        }
      }
    }

    if (!currentChecklist) {
      console.log('Checklist markdown tidak ditemukan di property. Menyusun checklist terstandarisasi...');
      currentChecklist = [
        '# 🎯 Acceptance Criteria Verification',
        '- [ ] AC-01: Validasi Nominal',
        '> Field Nominal hanya menerima angka positif dengan nilai minimum Rp 10.000 dan maksimum Rp 100.000.000.000 (100 Miliar)',
        '> Bila nilai nominal bernilai 0 atau dikosongkan, input harus menampilkan string kosong, bukan angka 0 telanjang',
        '- [ ] AC-02: Proteksi Idempotency & Double Submission',
        '- [ ] AC-03: Keterangan Transaksi & Sanitasi',
        '- [ ] AC-04: Slotting Inversion of Control',
        '- [ ] AC-05: Dynamic Error Presentation',
      ].join('\n');
    }

    // Update status checklist: jika lolos ubah `- [ ] AC-xx` menjadi `- [x] AC-xx #done`
    let updatedChecklist = currentChecklist;
    ['AC-01', 'AC-02', 'AC-03', 'AC-04', 'AC-05'].forEach((acKey) => {
      if (acStatus[acKey]) {
        // Regex untuk mengubah `- [ ] AC-xx` atau `- [ ] ... AC-xx` menjadi `- [x] ... #done`
        const regexUnchecked = new RegExp(`- \\[ \\] (${acKey}[^\\n]*)`, 'g');
        updatedChecklist = updatedChecklist.replace(regexUnchecked, '- [x] $1 #done');
      }
    });

    console.log('Menyimpan perubahan Smart Checklist ke JIRA...');
    const putRes = await jiraRequest(
      `/rest/api/3/issue/${jiraIssueKey}/properties/checklist`,
      'PUT',
      JSON.stringify(updatedChecklist)
    );

    if (putRes.statusCode >= 200 && putRes.statusCode < 300) {
      console.log(`✅ Smart Checklist untuk ${jiraIssueKey} berhasil di-update menjadi DONE!`);
    } else {
      console.log(`Respons JIRA (${putRes.statusCode}):`, putRes.body);
    }
  } catch (error) {
    console.error('Error saat update Smart Checklist:', error.message);
  }
}

updateSmartChecklist();
