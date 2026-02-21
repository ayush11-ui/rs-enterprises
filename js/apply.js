// ===== ROLE CONFIGURATION =====
const ROLES = {
  'security-guard': {
    title: 'Security Guard Application',
    desc: 'Fill in your details below. All fields are required.',
    value: 'Security Guard'
  },
  'supervisor': {
    title: 'Supervisor Application',
    desc: 'Apply for a supervisory position. All fields are required.',
    value: 'Supervisor'
  },
  'cctv-operator': {
    title: 'CCTV Operator Application',
    desc: 'Join our surveillance team. All fields are required.',
    value: 'CCTV Operator'
  },
  'armed-guard': {
    title: 'Armed Guard Application',
    desc: 'Apply for an armed security position. All fields are required.',
    value: 'Armed Guard'
  }
};

// ===== GOOGLE SHEETS CONFIG =====
// To connect to Google Sheets:
// 1. Create a Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste the following code in the script editor:
//
//    function doPost(e) {
//      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//      var data = JSON.parse(e.postData.contents);
//      sheet.appendRow([
//        new Date(),
//        data.role,
//        data.fullName,
//        data.email,
//        data.phone,
//        data.aadhaar,
//        data.address,
//        data.dob,
//        data.experience
//      ]);
//      return ContentService.createTextOutput(
//        JSON.stringify({ status: 'success' })
//      ).setMimeType(ContentService.MimeType.JSON);
//    }
//
// 4. Deploy as Web App (Execute as: Me, Access: Anyone)
// 5. Copy the deployment URL and paste it below:

const GOOGLE_SHEETS_URL = ''; // <-- Paste your Google Apps Script Web App URL here

// ===== ROLE TAB SWITCHING =====
(function initTabs() {
  const tabs = document.querySelectorAll('.role-tab');
  const titleEl = document.getElementById('formTitle');
  const descEl = document.getElementById('formDesc');
  const roleField = document.getElementById('roleField');
  const form = document.getElementById('applyForm');
  const successMsg = document.getElementById('successMsg');
  const formContent = document.getElementById('formContent');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update form content
      const role = ROLES[tab.dataset.role];
      titleEl.textContent = role.title;
      descEl.textContent = role.desc;
      roleField.value = role.value;

      // Reset form & show it
      form.reset();
      formContent.style.display = 'block';
      successMsg.classList.remove('show');

      // Reset file labels
      resetFileLabels();
    });
  });
})();

// ===== FILE UPLOAD LABELS =====
function resetFileLabels() {
  const resumeLabel = document.querySelector('#resumeLabel span:last-child');
  const idLabel = document.querySelector('#idProofLabel span:last-child');
  if (resumeLabel) resumeLabel.textContent = 'Choose file (PDF, DOC — Max 5MB)';
  if (idLabel) idLabel.textContent = 'Choose file (PDF, JPG, PNG — Max 5MB)';
}

(function initFileUploads() {
  const resumeInput = document.getElementById('resumeInput');
  const idProofInput = document.getElementById('idProofInput');

  if (resumeInput) {
    resumeInput.addEventListener('change', () => {
      const label = document.querySelector('#resumeLabel span:last-child');
      label.textContent = resumeInput.files[0]?.name || 'Choose file (PDF, DOC — Max 5MB)';
    });
  }

  if (idProofInput) {
    idProofInput.addEventListener('change', () => {
      const label = document.querySelector('#idProofLabel span:last-child');
      label.textContent = idProofInput.files[0]?.name || 'Choose file (PDF, JPG, PNG — Max 5MB)';
    });
  }
})();

// ===== FORM VALIDATION & SUBMISSION =====
(function initForm() {
  const form = document.getElementById('applyForm');
  const submitBtn = document.getElementById('submitBtn');
  const formContent = document.getElementById('formContent');
  const successMsg = document.getElementById('successMsg');
  if (!form) return;

  // Style invalid fields
  function showValidation() {
    const inputs = form.querySelectorAll('[required]');
    let firstInvalid = null;
    inputs.forEach(input => {
      if (!input.validity.valid) {
        input.style.borderColor = '#ef4444';
        if (!firstInvalid) firstInvalid = input;
      } else {
        input.style.borderColor = '';
      }
    });
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
    return !firstInvalid;
  }

  // Clear error on input
  form.querySelectorAll('[required]').forEach(input => {
    input.addEventListener('input', () => {
      if (input.validity.valid) input.style.borderColor = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!showValidation()) return;

    submitBtn.classList.add('loading');

    // Collect form data
    const formData = {
      role: form.role.value,
      fullName: form.fullName.value,
      email: form.email.value,
      phone: form.phone.value,
      aadhaar: form.aadhaar.value,
      address: form.address.value,
      dob: form.dob.value,
      experience: form.experience.value
    };

    try {
      if (GOOGLE_SHEETS_URL) {
        // Send to Google Sheets
        await fetch(GOOGLE_SHEETS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Simulate network delay when no URL is configured
        await new Promise(r => setTimeout(r, 1500));
        console.log('Form data (Google Sheets URL not configured):', formData);
      }

      // Show success
      submitBtn.classList.remove('loading');
      formContent.style.display = 'none';
      successMsg.classList.add('show');

    } catch (err) {
      submitBtn.classList.remove('loading');
      alert('Something went wrong. Please try again.');
      console.error(err);
    }
  });
})();

// ===== MOBILE NAV TOGGLE =====
(function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });

  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      links.classList.remove('open');
    });
  });
})();
