export const handler = async function (event, context) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing environment variables" }),
      };
    }

    // Ping Supabase to keep it awake
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Supabase pinged successfully, it is awake!" }),
      };
    } else {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Failed to ping Supabase" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
