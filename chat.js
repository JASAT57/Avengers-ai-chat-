export async function onRequestPost(context) {
  try {
    const { message, history = [], systemPrompt = "", active = [] } = await context.request.json();

    const chars = {
      Tony:["🤖","Tony Stark","alaycı, zeki, hızlı ve kendinden emin"],
      Steve:["🇺🇸","Steve Rogers","lider, sakin, koruyucu"],
      Thor:["⚡","Thor","asil, görkemli, ciddi"],
      Bruce:["💚","Bruce Banner / Hulk","bilimsel; Hulk kısa ve güçlü"],
      Natasha:["🕷️","Natasha Romanoff","sakin, keskin, gözlemci"],
      Clint:["🏹","Clint Barton","pratik, kuru mizahlı"],
      Peter:["🕸️","Peter Parker","genç, enerjik, esprili"],
      Wanda:["🔮","Wanda Maximoff","empatik, sezgisel, güçlü"],
      Vision:["💎","Vision","mantıklı, sakin"],
      Strange:["🌀","Stephen Strange","soğukkanlı, analitik"],
      Sam:["🦅","Sam Wilson","sıcak, dengeli, esprili"],
      Bucky:["🦾","Bucky Barnes","az konuşan, kuru mizahlı"],
      Rhodey:["🛡️","James Rhodes","doğrudan, disiplinli"],
      Scott:["🐜","Scott Lang / Ant-Man","sempatik, komik"],
      Hope:["🐝","Hope Van Dyne / Wasp","kararlı, pratik"],
      TChalla:["🐾","T’Challa / Black Panther","asil, sakin"],
      Shuri:["🐈‍⬛","Shuri","zeki, teknoloji meraklısı"],
      Carol:["⭐","Carol Danvers / Captain Marvel","kendinden emin"],
      Rocket:["🦝","Rocket","huysuz, sivri dilli"],
      Groot:["🌱","Groot","çoğunlukla I am Groot"],
      Nebula:["🔵","Nebula","sert, kısa"],
      Gamora:["💚","Gamora","kararlı, sakin"],
      Quill:["🚀","Peter Quill / Star-Lord","rahat, esprili"],
      Drax:["🗿","Drax","literal, doğrudan"],
      Mantis:["🌿","Mantis","naif, empatik"],
      Fury:["🕶️","Nick Fury","otoriter, kısa"],
      Loki:["🐍","Loki","kurnaz, teatral"],
      Deadpool:["🔴","Deadpool","kaotik, esprili"]
    };

    const chosen = active.length ? active.filter(k => chars[k]) : Object.keys(chars);
    const roster = chosen.map(k => `${k}: ${chars[k][1]} ${chars[k][0]} — ${chars[k][2]}`).join("\n");

    const instructions = `Sen Avengers WhatsApp grup sohbetinin AI yönetmenisin.
Kullanıcının özel promptu:
${systemPrompt}

AKTİF KADRO:
${roster}

Kurallar:
- Karakterlerin kişiliklerini koru.
- WhatsApp gibi doğal ve canlı konuş.
- Her mesaja herkes cevap vermesin.
- Mesajlar kısa olsun; çoğunlukla 1 cümle, gerekirse 2 kısa cümle.
- SADECE JSON döndür: {"messages":[{"character":"Tony","text":"..."}]}
- character yalnızca aktif kadrodaki anahtarlardan biri olabilir.
- 1 ila 4 karakter seç.`;

    const input = [
      ...history.slice(-30).map(x => ({
        role: x.role === "assistant" ? "assistant" : "user",
        content: String(x.text || "")
      })),
      { role: "user", content: String(message || "") }
    ];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${context.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: context.env.OPENAI_MODEL || "gpt-5.6",
        instructions,
        input,
        text: { format: { type: "json_object" } }
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      return Response.json({ error: `OpenAI API hatası: ${detail}` }, { status: 502 });
    }

    const data = await r.json();
    const text = data.output_text || "";
    let parsed = { messages: [] };

    try {
      parsed = JSON.parse(text);
    } catch {
      return Response.json({ error: "AI JSON yanıtı okunamadı.", raw: text }, { status: 502 });
    }

    const messages = (parsed.messages || [])
      .filter(m => chosen.includes(m.character) && typeof m.text === "string")
      .slice(0, 4);

    return Response.json({ messages });
  } catch (e) {
    return Response.json({ error: e?.message || "Sunucu hatası" }, { status: 500 });
  }
}
