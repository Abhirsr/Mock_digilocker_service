const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('id');

if (!sessionId) {
  alert('Invalid session. Please start the flow from the API first.');
}

// ── Populate DOB dropdowns ────────────────────────────────────────────────────
(function () {
  const dayEl  = document.getElementById('f-dob-day');
  const yearEl = document.getElementById('f-dob-year');
  for (let d = 1; d <= 31; d++) {
    const o = document.createElement('option');
    o.value = String(d).padStart(2, '0');
    o.textContent = d;
    dayEl.appendChild(o);
  }
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1924; y--) {
    const o = document.createElement('option');
    o.value = y;
    o.textContent = y;
    yearEl.appendChild(o);
  }
})();

// ── Photo upload ──────────────────────────────────────────────────────────────
let photoBase64 = '';
document.getElementById('photo-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    photoBase64 = e.target.result.split(',')[1]; // pure base64, no data: prefix
    const img  = document.getElementById('photo-preview');
    const icon = document.getElementById('photo-icon');
    img.src = e.target.result;
    img.style.display = 'block';
    icon.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const val     = (id) => (document.getElementById(id)?.value || '').trim();
const showLoader = () => document.getElementById('loader-overlay').classList.add('active');
const setBtn  = (loading) => {
  const btn     = document.getElementById('authorize-btn');
  const spinner = document.getElementById('btn-spinner');
  const label   = document.getElementById('btn-label');
  btn.disabled         = loading;
  spinner.style.display = loading ? 'block' : 'none';
  label.textContent    = loading ? 'Authorizing...' : 'Allow Access';
};

// ── Authorize ─────────────────────────────────────────────────────────────────
document.getElementById('authorize-btn').addEventListener('click', async () => {

  // Validation
  if (!val('f-name'))     { alert('Full Name is required.');           return; }
  if (!val('f-dob-day') || !val('f-dob-month') || !val('f-dob-year')) {
    alert('Date of Birth is required.'); return;
  }
  if (!val('f-district')) { alert('District is required.');            return; }
  if (!val('f-state'))    { alert('State is required.');               return; }
  if (val('f-pin') && val('f-pin').length !== 6) {
    alert('PIN Code must be 6 digits.');  return;
  }

  const dateOfBirth = `${val('f-dob-year')}-${val('f-dob-month')}-${val('f-dob-day')}`;

  setBtn(true);

  const payload = {
    userData: {
      name:         val('f-name'),
      maskedNumber: val('f-masked'),
      dateOfBirth:  dateOfBirth,
      gender:       val('f-gender'),
      email:        '',
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
        country:     val('f-country') || 'India'
      },
      xml: { fileUrl: '', shareCode: '', validUntil: '' }
    }
  };

  try {
    const response = await fetch(`/api/okyc/sessions/${sessionId}/authorize`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.success) {
      showLoader(); // show overlay while redirecting
      const finalUrl = new URL(data.redirectUrl);
      finalUrl.searchParams.append('success', 'true');
      finalUrl.searchParams.append('id', sessionId);
      finalUrl.searchParams.append('scope', 'ADHAR,PANCR');
      window.location.href = finalUrl.toString();
    } else {
      alert('Authorization failed on the server.');
      setBtn(false);
    }
  } catch (error) {
    console.error('Authorization error:', error);
    alert('Could not reach the mock server.');
    setBtn(false);
  }
});
