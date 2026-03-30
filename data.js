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
    status: "authenticated",
    aadhaar: {
      name: "John Doe",
      gender: "MALE",
      dob: "1990-01-01",
      address: "123, Mock Street, Electronic City, Bengaluru, Karnataka - 560100",
      maskedAadhaar: "XXXXXXXX1234",
      fatherName: "Senior Doe",
      image: "base64_string_placeholder", // Setu provides the profile pic in base64
      emailHash: "hashed_email_string",
      mobileHash: "hashed_mobile_string"
    },
    fileUrl: "https://mock-storage.setu.co/aadhaar_xml_mock.xml" // Link to the raw XML file
  };
};

module.exports = {
  createSessionResponse,
  getStatusResponse,
  getAadhaarResponse
};
