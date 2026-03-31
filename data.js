/**
 * Perfect JSON templates for Setu DigiLocker (OKYC) API.
 * These structures are hardcoded to match the exact field names and types 
 * expected by applications integrated with Setu.
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Creates the initial session response.
 * @param {string} redirectUrl - The URL provided by the developer.
 * @param {string} baseUrl - Our server's base URL (e.g., http://localhost:3000).
 * @returns {Object} - A Setu-compatible session object.
 */
const createSessionResponse = (redirectUrl, baseUrl) => {
  const sessionId = uuidv4(); // Generate a unique V4 UUID for the session
  return {
    id: sessionId,
    url: `${baseUrl}/auth.html?id=${sessionId}`, // The link we send the user to
    status: "unauthenticated",
    validity: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Valid for 30 minutes
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
 * @returns {Object} - A Setu-compatible Aadhaar data object.
 */
const getAadhaarResponse = (sessionId) => {
  return {
    id: sessionId,
    status: "complete",
    aadhaar: {
      name: "John Doe",
      maskedNumber: "XXXXXXXX1234",
      dateOfBirth: "1990-01-01",
      gender: "M",
      email: "johndoe@mock.com",
      phone: "9999999999",
      generatedAt: new Date().toISOString(),
      photo: "base64_string_placeholder",
      address: {
        careOf: "S/O Senior Doe",
        house: "123",
        street: "Mock Street",
        landmark: "Near Mock Circle",
        locality: "Electronic City",
        vtc: "Bengaluru",
        subDistrict: "Bengaluru South",
        district: "Bengaluru Urban",
        state: "Karnataka",
        postOffice: "Electronic City PO",
        pin: "560100",
        country: "India"
      },
      verified: {
        email: false,
        phone: false,
        signature: true
      },
      xml: {
        fileUrl: "",
        shareCode: "",
        validUntil: ""
      }
    }
  };
};

module.exports = {
  createSessionResponse,
  getStatusResponse,
  getAadhaarResponse
};
