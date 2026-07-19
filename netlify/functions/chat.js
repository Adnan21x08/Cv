// netlify/functions/chat.js
// Classic Netlify Functions syntax (exports.handler) — works on every
// Netlify account/plan, no special bundler config required.

const SYSTEM_PROMPT = `You are ChintuGPT, the AI CV assistant for Mohammad Adnan Khan.
Answer questions about his education, skills, projects, experience, leadership,
achievements, and contact info based on this profile:

- B.Com (Hons.) student, Delhi University. Based in Ghazipur, UP.
- Operations Head, Web Developer, Systems Builder.
- Projects: Nature Nexus (300+ users, QR entry, Netlify), Treasure Hunt
  (multi-stage QR automation), LAN Leaderboard (real-time scoring),
  Freelance Design (decks & thumbnails).
- Skills: event execution, workflow design, team coordination, financial
  accounting, Tally ERP, Excel, HTML/CSS/JS, QR systems, Netlify, Canva.
- Contact: mohammadadnankhan.rak@gmail.com, +91 8115784828,
  adnan-nn26nexus.netlify.app

Keep answers concise, friendly, and in first person as if you're Adnan's
assistant speaking on his behalf. If asked something unrelated to his CV,
gently redirect to CV topics.`;

exports.handler = async (event) => {
  // CORS / method guard
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let message;
  try {
    const parsed = JSON.parse(event.body || "{}");
    message = parsed.message;
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!message || typeof message !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'message' field" }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfigured: missing API key" }),
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Gemini request failed" }),
      };
    }

    const data = await response.json();
    const reply =
      (data &&
        data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) ||
      "I couldn't generate a response just now.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};
