export async function onRequestPost(context) {
  try {
    const { message, history = [], systemPrompt = "", active = [] } =
      await context.request.json();

    const chars = {
      Tony: ["🤖", "Tony Stark", "alaycı, zeki, hızlı ve kendinden emin"],
      Steve: ["🇺🇸", "Steve Rogers", "lider, sakin, koruyucu"],
      Thor: ["⚡", "Thor", "asil, görkemli, ciddi"],
      Bruce: ["💚", "Bruce Banner / Hulk", "bilimsel, Hulk kısa ve güçlü"],
      Natasha: ["🕷️", "Natasha Romanoff", "sakin, keskin, gözlemci"],
      Peter: ["🕸️", "Peter Parker", "genç, enerjik, esprili"],
      Wanda: ["🔮", "Wanda Maximoff", "empatik, sezgisel, güçlü"],
      Strange: ["🌀", "Stephen Strange", "soğukkanlı, analitik"],
      Sam: ["🦅", "Sam Wilson", "sıcak, dengeli, esprili"],
      Bucky: ["🦾", "Bucky Barnes", "az konuşan, kuru mizahlı"],
      Shuri: ["🐈‍⬛", "Shuri", "zeki, teknoloji meraklısı"],
      Loki: ["🐍", "Loki", "kurnaz, teatral"],
      Deadpool: ["🔴", "Deadpool", "kaotik, esprili"]
    };

    const chosen = active.length
      ? active.filter((x) => chars[x])
      : Object.keys(chars);

    const roster = chosen
      .map((x) => `${x}: ${chars[x][1]} ${chars[x][0]} — ${chars[x][2]}`)
      .join("\n");

    const instructions = `Sen Avengers WhatsApp grup sohbetinin AI yönetmenisin.

Özel prompt:
${systemPrompt}

AKTİF KARAKTERLER:
${roster}

Kurallar:
- Karakterlerin kişiliklerini koru.
- WhatsApp gibi doğal konuş.
- Herkes her mesaja cevap vermesin.
- Mesajlar kısa olsun.
- 1 ila 4 karakter cevap versin.
- Sadece JSON döndür:
{"messages":[{"character":"Tony","text":"..."}]}`;

    const input = [
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
          Authorization: `Bearer ${context.env.OPENAI_API_KEY}`
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
      return Response.json(
        { error: "OpenAI bağlantı hatası." },
        { status: 502 }
      );
    }

    const data = await response.json();

    const parsed = JSON.parse(
      data.output_text || '{"messages":[]}'
    );

    const messages = (parsed.messages || [])
      .filter(
        (m) =>
          chosen.includes(m.character) &&
          typeof m.text === "string"
      )
      .slice(0, 4);

    return Response.json({ messages });

  } catch (error) {
    return Response.json(
      { error: error.message || "Sunucu hatası" },
      { status: 500 }
    );
  }
}
