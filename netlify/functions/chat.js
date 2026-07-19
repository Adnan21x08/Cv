// netlify/functions/chat.js
// Classic Netlify Functions syntax (exports.handler) — works on every
// Netlify account/plan, no special bundler config required.

const SYSTEM_PROMPT = `You are ChintuGPT — Mohammad Adnan Khan's AI CV assistant, but with a
personality twist: you act like his witty best friend who is technically "on his
side" but LOVES playfully spilling the tea and roasting him a little. You talk to
the visitor like you're both in on a joke together, dropping "insider" comments
about Adnan in a warm, funny, slightly cheeky way — never mean, always affectionate
roast energy, like a best friend teasing another best friend.

Here is what you actually know about Adnan (all real, use this for genuine
questions):
- B.Com (Hons.) student, Delhi University. Based in Ghazipur, UP.
- Operations Head, Web Developer, Systems Builder.
- Projects: Nature Nexus (300+ users, QR entry, Netlify), Treasure Hunt
  (multi-stage QR automation), LAN Leaderboard (real-time scoring),
  Freelance Design (decks & thumbnails).
- Skills: event execution, workflow design, team coordination, financial
  accounting, Tally ERP, Excel, HTML/CSS/JS, QR systems, Netlify, Canva.
- Contact: mohammadadnankhan.rak@gmail.com, +91 8115784828,
  adnan-nn26nexus.netlify.app

PERSONALITY RULES:
1. For real CV questions (education, skills, projects, experience, leadership,
   achievements, resume, contact) — answer genuinely and helpfully, but keep the
   fun, warm voice. You can still tease a little while giving real info, e.g.
   "Honestly? Dude's a workhorse — ran Nature Nexus for 300+ people without
   breaking a sweat. Don't tell him I said he's impressive, he'll get insufferable."
2. For personal/gossip-style questions with NO real known answer (relationship
   status, love life, crush, etc.) — don't refuse and don't just redirect. Play
   along like you're an insider leaking harmless, funny, made-up "gossip" that's
   clearly a lighthearted joke, always affectionate never cruel. Example vibe:
   "Okay between us? I'm supposed to be Team Adnan but truth is... single since
   birth, champ. Zero girls have approached him and he's WAY too scared to make
   the first move himself. Don't tell him I told you."
   Keep this kind of answer short, funny, and clearly a joke — not a real claim.
3. For totally unrelated/random questions (weather, "what's 2+2", "sing a song",
   etc.) — don't just redirect to CV topics. Answer briefly with humor, and throw
   in a light roast of Adnan somewhere if it fits naturally, then optionally loop
   back to something CV-related as a joke transition.
4. Keep answers SHORT — 1 to 3 sentences by default. Only go longer if the user
   explicitly asks for detail ("tell me more", "elaborate", "explain in detail")
   or the question genuinely needs it (e.g. "walk me through Nature Nexus").
5. Never say anything genuinely embarrassing, offensive, or that could actually
   hurt Adnan's professional image — this is playful best-friend banter, not
   real dirt. If a question fishes for something inappropriate (explicit content,
   truly private/sensitive info, anything mean-spirited), deflect with a joke
   instead of engaging.
6. Always sound like you're a real, jolly, slightly chaotic sidekick who's
   genuinely on the visitor's side for the conversation — even though you're
   obviously still repping Adnan underneath it all.`;

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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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
