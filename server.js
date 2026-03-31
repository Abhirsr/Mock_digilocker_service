const express = require('express');
const cors = require('cors');
const path = require('path');
const { createSessionResponse, getStatusResponse, getAadhaarResponse, getFailureResponse } = require('./data');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable Cross-Origin Resource Sharing (CORS) so your frontend can call this API
app.use(cors());

// ===== GLOBAL REQUEST LOGGER =====
// Logs EVERY request that hits this mock server so you can verify what is being received
app.use((req, res, next) => {
  console.log('\n--------------------------------------------');
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  console.log(`[BODY]    ${JSON.stringify(req.body)}`);
  console.log('--------------------------------------------');
  next();
});

// Parse incoming JSON request bodies automatically
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store (a Map) to keep track of active DigiLocker sessions
// In a real production app, this would be a database like Redis or MongoDB
const sessions = new Map();

/**
 * [POST] /api/okyc/sessions
 * PURPOSE: This initializes a new DigiLocker / OKYC session.
 * LOGIC:
 * 1. Takes 'redirectUrl' from the request body (where the user goes after consent).
 * 2. Generates a unique session ID and an 'authorizationUrl' (our mock login page).
 * 3. Saves the session as 'unauthenticated' in our memory store.
 * 4. Returns a response block that is IDENTICAL to Setu's official API.
 */
app.post('/api/okyc/sessions', (req, res) => {
  const { redirectUrl } = req.body;
  if (!redirectUrl) {
    return res.status(400).json({ error: "redirectUrl is required" });
  }

  // Get the base URL (e.g., http://localhost:3000) to build the redirect links
  const host = `${req.protocol}://${req.get('host')}`;
  
  // Create a structured response matching Setu's pattern
  const session = createSessionResponse(redirectUrl, host);
  
  // Store the session context so we can track progress later
  sessions.set(session.id, {
    id: session.id,
    redirectUrl: redirectUrl,
    status: "unauthenticated", // Initial state is always unauthenticated
    validity: session.validity // Session expiry timestamp
  });

  console.log(`✅ [Session Created]`);
  console.log(`   Session ID  : ${session.id}`);
  console.log(`   redirectUrl : ${redirectUrl}`);
  console.log(`   Auth URL    : ${session.url}`);
  console.log(`   Expires     : ${session.validity}`);
  console.log(`   (Share the Auth URL above with the user's browser)`);
  res.json(session);
});

/**
 * [GET] /api/okyc/sessions/:id
 * PURPOSE: Polling endpoint to check if the user has finished the login process.
 * LOGIC:
 * 1. Looks up the session in our memory store using the ID provided in the URL.
 * 2. Returns the current status ('unauthenticated' or 'authenticated').
 */
app.get('/api/okyc/sessions/:id', (req, res) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  console.log(`🔍 [Status Check] Session: ${id} => Status: ${session.status}`);
  // Returns the status wrapped in a Setu-compatible 'context' object
  res.json(getStatusResponse(id, session.status));
});

/**
 * [GET] /api/okyc/sessions/:id/aadhaar
 * PURPOSE: Final step to retrieve the verified user data.
 * LOGIC:
 * 1. Verifies if the session exists and if the status is 'authenticated'.
 * 2. If 'authenticated', returns the mock Aadhaar JSON data.
 */
app.get('/api/okyc/sessions/:id/aadhaar', (req, res) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Prevent data retrieval if the user hasn't physically clicked "Allow Access" yet
  if (session.status !== 'authenticated') {
    return res.status(401).json({
      error: {
        code: "user_not_authenticated",
        detail: "User is not authenticated to access this resource",
        traceId: `1-${Date.now().toString(16)}-${require('crypto').randomBytes(12).toString('hex')}`
      }
    });
  }

  // If session was marked as failure simulation, return a non-complete status
  if (session.simulateFailure) {
    console.log(`❌ [Failure Simulated] Returning failed status for session: ${id}`);
    return res.json(getFailureResponse(id));
  }

  // Returns a perfectly formatted Aadhaar response block, using form data if available
  res.json(getAadhaarResponse(id, session.userData));
});

/**
 * [INTERNAL] [POST] /api/okyc/sessions/:id/authorize
 * PURPOSE: This is an internal helper called by the Mock UI.
 * LOGIC:
 * 1. When the user clicks "Allow Access" in the UI, this route is hit.
 * 2. It updates our internal session status to 'authenticated'.
 * 3. It returns the client's redirectUrl so the UI knows where to send the user back.
 */
app.post('/api/okyc/sessions/:id/authorize', (req, res) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Store user-supplied data from the form (if provided)
  if (req.body && req.body.userData) {
    session.userData = req.body.userData;
  }

  // Store failure simulation flag
  session.simulateFailure = req.body && req.body.simulateFailure === true;

  // Transition state from 'unauthenticated' to 'authenticated'
  session.status = 'authenticated';
  sessions.set(id, session);

  console.log(`${session.simulateFailure ? '❌ [Failure Simulation]' : '✅ [Session Authorized]'} ID: ${id}`);
  console.log(`   Redirecting user to: ${session.redirectUrl}`);
  res.json({ success: true, redirectUrl: session.redirectUrl });
});

app.listen(PORT, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `[Mock DigiLocker Server] Successfully started!`);
  console.log(`[Base URL] http://localhost:${PORT}`);
  console.log(`[Postman Ready] Use the provided collection to test the flow.`);
});
