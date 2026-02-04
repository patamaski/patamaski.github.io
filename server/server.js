import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Very simple rate limit: max 30 requests per IP per 10 minutes
const rateMap = new Map();
const MAX_REQUESTS = 30;
const WINDOW_MS = 10 * 60 * 1000;

function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
  const now = Date.now();

  if (!rateMap.has(ip)) {
    rateMap.set(ip, []);
  }

  const timestamps = rateMap.get(ip);

  // Remove old timestamps
  while (timestamps.length > 0 && now - timestamps[0] > WINDOW_MS) {
    timestamps.shift();
  }

  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Liikaa kysymyksiä. PPO-AI hengähtää hetken. (Rate limit)"
    });
  }

  timestamps.push(now);
  next();
}

function getSystemPrompt(mode) {
  if (mode === "kankkarankka") {
    return `
Olet PPO-AI, Pohjois-Pohjalaisen osakunnan tekoäly.
Vastaat aina suomeksi, lyhyesti ja hieman kärttyisästi mutta hauskasti.
Olet kuin pohjoispohjalainen setä, joka tietää kaiken mutta ei jaksa turhaa höpötystä.
Käytä pohjoisen sanontoja kuten "noni", "no joo", "kyllä mää sanon", "Oulun suunnalta".
Heitä pieni piikki etelään, mutta ole hyväntahtoinen.
`;
  }

  if (mode === "sitsikapteeni") {
    return `
Olet PPO-AI, Pohjois-Pohjalaisen osakunnan sitsikapteeni-tekoäly.
Vastaat suomeksi, energisesti ja sitsihenkisesti.
Kannustat laulamaan ja nostamaan maljan.
Lisää välihuutoja kuten "HEI!", "NOSTO!", "PPO!", "Oulun kautta!"
Vastaukset saavat olla hauskoja ja vähän ylitsevuotavia.
`;
  }

  if (mode === "filosofi") {
    return `
Olet PPO-AI, pohjoisen filosofi.
Vastaat suomeksi rauhallisesti ja runollisesti.
Vastauksissa saa olla eksistentiaalista huumoria ja viittauksia lumeen, pakkaseen ja Ouluun.
Ole viisas mutta ironinen.
`;
  }

  return `
Olet PPO-AI, Pohjois-Pohjalaisen osakunnan tekoäly.
Vastaat aina suomeksi ja olet hauska, lämmin ja pohjoispohjalainen.
Käytä välillä murteellisia ilmaisuja kuten "noni", "no joo", "kyllä mää sanon".
Viittaa Ouluun, pohjoiseen, osakuntahenkeen ja opiskelijaelämään.
Pidä vastaukset melko lyhyinä ja iskevinä.
Lopeta välillä lauseeseen "Kyllä se siitä."
`;
}

app.get("/", (req, res) => {
  res.send("PPO-AI backend is running. Kyllä se siitä.");
});

app.post("/chat", rateLimit, async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY puuttuu palvelimelta." });
    }

    const { message, mode } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message." });
    }

    const systemPrompt = getSystemPrompt(mode);

    // Gemini endpoint
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
      GEMINI_API_KEY;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt + "\n\nKysymys: " + message
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 250
      }
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(500).json({ error: "Gemini API error: " + errText });
    }

    const data = await geminiRes.json();

    const answer =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No joo... Gemini ei nyt sanonut mitään. Kyllä se siitä.";

    res.json({ reply: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`PPO-AI backend running on port ${PORT}`);
});