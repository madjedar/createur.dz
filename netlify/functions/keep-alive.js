export const handler = async function (event, context) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ccrtrgdgaqhvqqxbimdu.supabase.co";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ZcsppHF5Ibc3z5uIY--2Bg_kT7S0kjg";

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      }).catch(() => null);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      },
      body: "OK"
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: "OK"
    };
  }
};

export default async function (req, context) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ccrtrgdgaqhvqqxbimdu.supabase.co";
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ZcsppHF5Ibc3z5uIY--2Bg_kT7S0kjg";

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/profiles?limit=1`, {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`
        }
      }).catch(() => null);
    }

    return new Response("OK", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response("OK", { status: 200 });
  }
}
