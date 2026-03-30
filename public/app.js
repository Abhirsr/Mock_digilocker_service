/**
 * MOCK DIGILOCKER FRONTEND LOGIC
 * This script runs on the auth.html page.
 */

// 1. Extract the 'id' (sessionId) from the URL parameters
// The link looks like: auth.html?id=123-abc-...
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('id');

const authorizeBtn = document.getElementById('authorize-btn');
const denyBtn = document.getElementById('deny-btn');

// Basic validation to ensure the page wasn't opened directly without a session
if (!sessionId) {
  alert('Invalid session. Please start the flow from the API first.');
}

/**
 * AUTHORIZE BUTTON HANDLER
 * When clicked, it tells our server to mark the session as 'authenticated'.
 */
authorizeBtn.addEventListener('click', async () => {
  try {
    // Show loading state
    authorizeBtn.innerText = 'Authorizing with DigiLocker...';
    authorizeBtn.disabled = true;

    // Call the INTERNAL server route to update the session status
    const response = await fetch(`/api/okyc/sessions/${sessionId}/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();
    
    if (data.success) {
      /**
       * FINAL REDIRECTION
       * After server confirms authentication, we send the user back to the 
       * developer's 'redirectUrl' with the standard Setu query parameters.
       */
      const finalUrl = new URL(data.redirectUrl);
      finalUrl.searchParams.append('success', 'true');
      finalUrl.searchParams.append('id', sessionId);
      finalUrl.searchParams.append('scope', 'ADHAR,PANCR'); // Standard consented scopes
      
      // Artificial delay to make it feel like a real verification process
      setTimeout(() => {
        window.location.href = finalUrl.toString();
      }, 1200);
    } else {
      alert('Authorization failed on the server.');
      authorizeBtn.disabled = false;
      authorizeBtn.innerText = 'Allow Access';
    }
  } catch (error) {
    console.error('Error during authorization:', error);
    alert('Communication error with the mock server.');
  }
});

// DENY BUTTON HANDLER
denyBtn.addEventListener('click', () => {
  alert('You have denied access. The session will remain unauthenticated.');
});
