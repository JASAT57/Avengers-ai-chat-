import express from "express";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({limit:"1mb"}));
app.use(express.static("public"));

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

const roster = Object.entries(chars).map(([k,v])=>`${k}: ${v[1]} ${v[0]} — ${v[2]}`).join("\n");

app.get("/api/health",(req,res)=>res.json({ok:true,ai:Boolean(process.env.OPENAI_API_KEY)}));
app.get("/api/characters",(req,res)=>res.json(Object.fromEntries(Object.entries(chars).map(([k,v])=>[k,{name:v[1],emoji:v[0]}]))));

app.post("/api/chat", async (req,res)=>{
  try {
    const {message,history=[],systemPrompt="",active=[]}=req.body;
    const chosen = active.length ? active : Object.keys(chars);
    const activeRoster = Object.entries(chars).filter(([k])=>chosen.includes(k))
      .map(([k,v])=>`${k}: ${v[1]} ${v[0]} — ${v[2]}`).join("\n");

    const instructions = `Sen Avengers WhatsApp grup sohbetinin AI yönetmenisin.
Kullanıcının özel promptu:
${systemPrompt}

AKTİF KADRO:
${activeRoster}

Kesin kurallar:
- Film karakterlerinin kişiliklerini koru.
- WhatsApp gibi doğal, düzensiz ve canlı konuş.
- Her mesaja herkes cevap vermesin.
- Kullanıcı bir karakteri çağırsa bile uygun diğerleri araya girebilir.
- Karakterler bazen kullanıcıdan bağımsız kısa konuşma başlatabilir.
- Mesajlar kısa olsun; çoğunlukla 1 cümle, gerekirse 2 kısa cümle.
- Sahne anlatımı, uzun paragraf, "5 saniye sonra" gibi zaman atlamaları kullanma.
- Çıktıyı SADECE JSON olarak ver: {"messages":[{"character":"Tony","text":"..."}]}
- character yalnızca aktif kadrodaki anahtarlardan biri olabilir.
- 1 ila 4 karakter seç; gereksiz kalabalık yapma.`;

    const input = [
      ...history.slice(-30).map(x=>({role:x.role==="assistant"?"assistant":"user",content:x.text})),
      {role:"user",content:message}
    ];

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions,
      input,
      text:{format:{type:"json_object"}}
    });

    const parsed=JSON.parse(response.output_text || '{"messages":[]}');
    const messages=(parsed.messages||[]).filter(m=>chosen.includes(m.character)).slice(0,4);
    res.json({messages});
  } catch(e) {
    console.error(e);
    res.status(500).json({error:e.message || "AI bağlantı hatası"});
  }
});

app.listen(port,()=>console.log(`Avengers Chat running on ${port}`));