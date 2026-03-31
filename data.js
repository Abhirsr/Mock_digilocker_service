/**
 * Perfect JSON templates for Setu DigiLocker (OKYC) API.
 * These structures are hardcoded to match the exact field names and types 
 * expected by applications integrated with Setu.
 */
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Returns a Setu-style traceId: "1-<hex unix seconds>-<random 12 bytes hex>"
const makeTraceId = () =>
  `1-${Math.floor(Date.now() / 1000).toString(16)}-${crypto.randomBytes(12).toString('hex')}`;

// Returns an ISO-8601 timestamp with IST offset (+05:30)
const toIST = (date) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(date.getTime() + offsetMs);
  const iso = ist.toISOString().replace('Z', '+05:30');
  return iso;
};

/**
 * Creates the initial session response.
 * @param {string} redirectUrl - The URL provided by the developer.
 * @param {string} baseUrl - Our server's base URL (e.g., http://localhost:3000).
 * @returns {Object} - A Setu-compatible session object.
 */
const createSessionResponse = (redirectUrl, baseUrl) => {
  const sessionId = uuidv4();
  return {
    id: sessionId,
    status: "unauthenticated",
    url: `${baseUrl}/auth.html?id=${sessionId}`,
    validUpto: toIST(new Date(Date.now() + 30 * 60 * 1000)),
    traceId: makeTraceId()
  };
};

/**
 * Creates the status check response.
 * @param {string} sessionId - The session identifier.
 * @param {string} status - Current status ('unauthenticated' or 'authenticated').
 * @returns {Object} - A Setu-compatible status object.
 */
const getStatusResponse = (sessionId, status = "unauthenticated") => {
  return {
    id: sessionId,
    status: status,
    context: {
      // Setu often includes internal tracking IDs in the context
      "dg-id": "DG-" + sessionId.slice(0, 8).toUpperCase()
    }
  };
};

/**
 * Creates the final Aadhaar data response.
 * @param {string} sessionId - The session identifier.
 * @param {Object} [userData] - Optional user-supplied data from the consent form.
 * @returns {Object} - A Setu-compatible Aadhaar data object.
 */
const getAadhaarResponse = (sessionId, userData) => {
  const u = userData || {};
  const addr = u.address || {};
  const xml  = u.xml    || {};

  return {
    id: sessionId,
    status: "complete",
    aadhaar: {
      name:         u.name         || "John Doe",
      maskedNumber: u.maskedNumber || "XXXXXXXX1234",
      dateOfBirth:  u.dateOfBirth  || "1990-01-01",
      gender:       u.gender       || "M",
      email:        u.email        || "johndoe@mock.com",
      phone:        u.phone        || "9999999999",
      generatedAt:  new Date().toISOString(),
      photo:        u.photo        || "",
      address: {
        careOf:      addr.careOf      || "S/O Senior Doe",
        house:       addr.house       || "123",
        street:      addr.street      || "Mock Street",
        landmark:    addr.landmark    || "Near Mock Circle",
        locality:    addr.locality    || "Electronic City",
        vtc:         addr.vtc         || "Bengaluru",
        subDistrict: addr.subDistrict || "Bengaluru South",
        district:    addr.district    || "Bengaluru Urban",
        state:       addr.state       || "Karnataka",
        postOffice:  addr.postOffice  || "Electronic City PO",
        pin:         addr.pin         || "560100",
        country:     addr.country     || "India"
      },
      verified: {
        email:     false,
        phone:     false,
        signature: true
      },
      xml: {
        fileUrl:    xml.fileUrl    || "",
        shareCode:  xml.shareCode  || "",
        validUntil: xml.validUntil || ""
      }
    }
  };
};

/**
 * Returns a failure response matching what Setu sends when DigiLocker fails.
 * status must be anything other than "complete" — backend checks equalsIgnoreCase("complete").
 */
const getFailureResponse = (sessionId) => {
  return {
    id: sessionId,
    status: "failed",
    message: "User denied access or DigiLocker verification failed"
  };
};

module.exports = {
  createSessionResponse,
  getStatusResponse,
  getAadhaarResponse,
  getFailureResponse
};
