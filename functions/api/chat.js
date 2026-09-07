export async function onRequestPost(context) {
  try {
    const {
      message,
      history = [],
      systemPrompt = "",
      active = []
    } = await context.request.json();

    const chars = {
      Tony: ["🤖", "Tony Stark", "alaycı, zeki, hızlı ve kendinden emin"],
      Steve: ["🇺🇸", "Steve Rogers", "lider, sakin, koruyucu"],
      Thor: ["⚡", "Thor", "asil, görkemli, ciddi"],
      Bruce: ["💚", "Bruce Banner / Hulk", "bilimsel, Hulk kısa ve güçlü"],
      Natasha: ["🕷️", "Natasha Romanoff", "sakin, keskin, gözlemci"],
      Clint: ["🏹", "Clint Barton", "pratik, kuru mizahlı"],
      Peter: ["🕸️", "Peter Parker", "genç, enerjik, esprili"],
      Wanda: ["🔮", "Wanda Maximoff", "empatik, sezgisel, güçlü"],
      Vision: ["💎", "Vision", "mantıklı, sakin"],
      Strange: ["🌀", "Stephen Strange", "soğukkanlı, analitik"],
      Sam: ["🦅", "Sam Wilson", "sıcak, dengeli, esprili"],
      Bucky: ["🦾", "Bucky Barnes", "az konuşan, kuru mizahlı"],
      Shuri: ["🐈‍⬛", "Shuri", "zeki, teknoloji meraklısı"],
      Loki: ["🐍", "Loki", "kurnaz, teatral"],
      Deadpool: ["🔴", "Deadpool", "kaotik, esprili"]
    };

    const chosen = active.length
      ? active.filter((k) => chars[k])
      : Object.keys(chars);

    const roster = chosen
      .map(
        (k) =>
          `${k}: ${chars[k][1]} ${chars[k][0]} — ${chars[k][2]}`
      )
      .join("\n");

    const instructions = `Sen Avengers WhatsApp grup sohbetinin AI yönetmenisin.

Özel prompt:
${systemPrompt}

AKTİF KARAKTERLER:
${roster}

Kurallar:
- Karakterlerin kişiliklerini koru.
- WhatsApp gibi doğal ve canlı konuş.
- Herkes her mesaja cevap vermesin.
- Mesajlar kısa olsun.
- 1 ila 4 karakter cevap versin.
- Cevabı JSON formatında döndür.
- JSON yapısı:
{"messages":[{"character":"Tony","text":"..."}]}`;

    const input = [
      {
        role: "user",
        content: "Return the Avengers conversation as JSON."
      },

      ...history.slice(-30).map((x) => ({
        role: x.role === "assistant" ? "assistant" : "user",
        content: String(x.text || "")
      })),

      {
        role: "user",
        content: String(message || "")
      }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${context.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-5.6",
          instructions,
          input,
          text: {
            format: {
              type: "json_object"
            }
          }
        })
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      return Response.json(
        {
          error: `OpenAI API Hatası: ${detail}`
        },
        {
          status: 502
        }
      );
    }

    const data = await response.json();

    let parsed;

    try {
      parsed = JSON.parse(
        data.output_text || '{"messages":[]}'
      );
    } catch (error) {
      return Response.json(
        {
          error: "OpenAI JSON cevabı okunamadı.",
          raw: data.output_text || ""
        },
        {
          status: 502
        }
      );
    }

    const messages = (parsed.messages || [])
      .filter(
        (m) =>
          chosen.includes(m.character) &&
          typeof m.text === "string"
      )
      .slice(0, 4);

    return Response.json({
      messages
    });

  } catch (error) {
    return Response.json(
      {
        error:
          `Sunucu Hatası: ${
            error?.message || "Bilinmeyen hata"
          }`
      },
      {
        status: 500
      }
    );
  }
}

    
