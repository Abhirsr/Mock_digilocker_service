/**
 * MOCK DIGILOCKER FRONTEND LOGIC
 * Step 1 – User fills in their Aadhaar details + photo
 * Step 2 – Consent screen shows a summary, user clicks Allow Access
 */

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('id');

if (!sessionId) {
  alert('Invalid session. Please start the flow from the API first.');
}

// ── DOM references ────────────────────────────────────────────────────────────
const stepForm    = document.getElementById('step-form');
const stepConsent = document.getElementById('step-consent');
const aadhaarForm = document.getElementById('aadhaar-form');

const photoInput    = document.getElementById('photo-input');
const photoPreview  = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');

const authorizeBtn = document.getElementById('authorize-btn');
const backBtn      = document.getElementById('back-btn');
const denyBtn      = document.getElementById('deny-btn');

// Holds the base64 photo string once selected
let photoBase64 = '';

// ── Photo preview ─────────────────────────────────────────────────────────────
photoInput.addEventListener('change', () => {
  const file = photoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    photoBase64 = e.target.result; // data:image/...;base64,...
    photoPreview.src = photoBase64;
    photoPreview.classList.remove('hidden');
    photoPlaceholder.classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

// ── Helper: read a form field value ──────────────────────────────────────────
const val = (id) => document.getElementById(id).value.trim();

// ── Step 1 → Step 2: form submit ─────────────────────────────────────────────
aadhaarForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Populate consent summary
  document.getElementById('s-name').textContent    = val('f-name')   || '—';
  document.getElementById('s-dob').textContent     = val('f-dob')    || '—';
  document.getElementById('s-gender').textContent  = val('f-gender') || '—';
  document.getElementById('s-masked').textContent  = val('f-masked') || '—';

  const addrParts = [
    val('f-house'), val('f-street'), val('f-locality'),
    val('f-vtc'), val('f-district'), val('f-state'), val('f-pin')
  ].filter(Boolean);
  document.getElementById('s-address').textContent = addrParts.join(', ') || '—';

  const summaryPhoto = document.getElementById('summary-photo');
  if (photoBase64) {
    summaryPhoto.src = photoBase64;
    summaryPhoto.classList.remove('hidden');
  }

  // Switch views
  stepForm.classList.add('hidden');
  stepConsent.classList.remove('hidden');
});

// ── Step 2 → Step 1: back button ─────────────────────────────────────────────
backBtn.addEventListener('click', () => {
  stepConsent.classList.add('hidden');
  stepForm.classList.remove('hidden');
});

// ── Authorize button ──────────────────────────────────────────────────────────
authorizeBtn.addEventListener('click', async () => {
  authorizeBtn.textContent = 'Authorizing with DigiLocker...';
  authorizeBtn.disabled = true;

  // Build the payload matching the Aadhaar JSON structure in data.js
  const payload = {
    userData: {
      name:         val('f-name'),
      maskedNumber: val('f-masked'),
      dateOfBirth:  val('f-dob'),
      gender:       val('f-gender'),
      email:        val('f-email'),
      phone:        val('f-phone'),
      photo:        photoBase64,
      address: {
        careOf:      val('f-careOf'),
        house:       val('f-house'),
        street:      val('f-street'),
        landmark:    val('f-landmark'),
        locality:    val('f-locality'),
        vtc:         val('f-vtc'),
        subDistrict: val('f-subDistrict'),
        district:    val('f-district'),
        state:       val('f-state'),
        postOffice:  val('f-postOffice'),
        pin:         val('f-pin'),
        country:     val('f-country')
      },
      xml: {
        fileUrl:    val('f-fileUrl'),
        shareCode:  val('f-shareCode'),
        validUntil: ''
      }
    }
  };

  try {
    const response = await fetch(`/api/okyc/sessions/${sessionId}/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      const finalUrl = new URL(data.redirectUrl);
      finalUrl.searchParams.append('success', 'true');
      finalUrl.searchParams.append('id', sessionId);
      finalUrl.searchParams.append('scope', 'ADHAR,PANCR');

      setTimeout(() => {
        window.location.href = finalUrl.toString();
      }, 1200);
    } else {
      alert('Authorization failed on the server.');
      authorizeBtn.disabled = false;
      authorizeBtn.textContent = 'Allow Access';
    }
  } catch (error) {
    console.error('Error during authorization:', error);
    alert('Communication error with the mock server.');
    authorizeBtn.disabled = false;
    authorizeBtn.textContent = 'Allow Access';
  }
});

// ── Deny button ───────────────────────────────────────────────────────────────
denyBtn.addEventListener('click', () => {
  alert('You have denied access. The session will remain unauthenticated.');
});
