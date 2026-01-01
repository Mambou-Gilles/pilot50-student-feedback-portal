const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  try {
    // 1. Get the cohort name from the URL query parameters
    const { cohort } = event.queryStringParameters;
    
    // 2. Get your Secret URL from Netlify Environment Variables
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("Missing GOOGLE_SCRIPT_URL environment variable.");
    }

    // 3. Request data from Google for this specific cohort
    const targetUrl = `${GOOGLE_SCRIPT_URL}?cohort=${encodeURIComponent(cohort)}`;
    
    // We add a timeout and follow redirects (Google Scripts always redirect)
    const response = await fetch(targetUrl, { 
        method: 'GET',
        redirect: 'follow' 
    });
    
    if (!response.ok) {
      return { statusCode: response.status, body: "Error from Google Script" };
    }

    const data = await response.json();
    
    // 4. Return the data to your Frontend
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Enable CORS if you are testing locally
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};