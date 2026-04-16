require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ─── Configuración ───────────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;
const GROQ_MODEL = "llama-3.1-8b-instant";
const DIALOGPT_URL =
  "https://router.huggingface.co/hf-inference/models/microsoft/DialoGPT-medium";
const OUTPUT_DIR = path.join(__dirname, "output");

// ─── Escenarios ───────────────────────────────────────────────────────────────
const escenarios = [
  {
    nombre: "Consulta simple",
    descripcion:
      "El usuario saluda, hace una pregunta sencilla y pide más información.",
    promptInicial:
      "Eres un usuario real iniciando una conversación amigable con un chatbot. " +
      "Empieza saludando, luego haz una pregunta simple sobre el clima, y en turnos siguientes " +
      "pide más detalles sobre lo que el chatbot responda. Sé breve (1-2 oraciones por turno).",
  },
  {
    nombre: "Cambio de tema",
    descripcion:
      "El usuario empieza hablando de comida y cambia abruptamente a tecnología.",
    promptInicial:
      "Eres un usuario que empieza hablando de comida favorita con el chatbot, " +
      "pero en el turno 3 cambias abruptamente a preguntar sobre inteligencia artificial. " +
      "Sé breve (1-2 oraciones por turno).",
  },
  {
    nombre: "Conversación emocional",
    descripcion:
      "Evalúa cómo el chatbot responde ante mensajes con carga emocional como tristeza o frustración. " +
      "Elegido para probar la empatía y coherencia del chatbot ante situaciones sensibles.",
    promptInicial:
      "Eres un usuario que expresa que tuvo un día muy difícil y se siente frustrado. " +
      "Habla de tus emociones con el chatbot y ve respondiendo según lo que él diga. " +
      "Sé breve (1-2 oraciones por turno).",
  },
  {
    nombre: "Preguntas de conocimiento",
    descripcion:
      "El usuario hace preguntas de trivia o conocimiento general al chatbot. " +
      "Elegido para evaluar si DialoGPT puede mantener coherencia en respuestas informativas.",
    promptInicial:
      "Eres un usuario curioso que hace preguntas de conocimiento general al chatbot, " +
      "como datos históricos o científicos curiosos. Reacciona a sus respuestas con más preguntas. " +
      "Sé breve (1-2 oraciones por turno).",
  },
];

// ─── Llamar a Groq ────────────────────────────────────────────────────────────
async function llamarGroq(mensajes) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: GROQ_MODEL,
      messages: mensajes,
      max_tokens: 100,
      temperature: 0.7,
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.choices[0].message.content.trim();
}

// ─── Llamar a DialoGPT ────────────────────────────────────────────────────────
async function llamarDialoGPT(texto, pastUserInputs, generatedResponses) {
  const messages = [];
  
  for (let i = 0; i < pastUserInputs.length; i++) {
    messages.push({ role: "user", content: pastUserInputs[i] });
    if (generatedResponses[i]) {
      messages.push({ role: "assistant", content: generatedResponses[i] });
    }
  }
  messages.push({ role: "user", content: texto });

  for (let intento = 1; intento <= 5; intento++) {
    try {
      const response = await axios.post(
        DIALOGPT_URL,
        { model: "HuggingFaceH4/zephyr-7b-beta", messages, max_tokens: 100 },
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (err) {
      if (err.response && err.response.status === 503) {
        console.log(`   ⏳ DialoGPT cargando, reintento ${intento}/5...`);
        await new Promise((r) => setTimeout(r, 10000));
      } else {
        throw err;
      }
    }
  }
  throw new Error("DialoGPT no respondió después de 5 intentos.");
}
// ─── Ejecutar un escenario ────────────────────────────────────────────────────
async function ejecutarEscenario(escenario) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📋 ESCENARIO: ${escenario.nombre}`);
  console.log(`${"=".repeat(60)}`);

  const turnos = [];
  const historialGroq = [
    { role: "system", content: escenario.promptInicial },
  ];

  // Historial para DialoGPT
  const pastUserInputs = [];
  const generatedResponses = [];

  for (let turno = 1; turno <= 4; turno++) {
    console.log(`\n--- Turno ${turno} ---`);

    // 1. Groq genera el mensaje del "usuario"
    let contextoExtra = "";
    if (turno > 1) {
      const ultimaRespuesta = turnos[turnos.length - 1].mensaje;
      contextoExtra = `El chatbot respondió: "${ultimaRespuesta}". Ahora genera tu siguiente mensaje como usuario.`;
      historialGroq.push({ role: "user", content: contextoExtra });
    } else {
      historialGroq.push({
        role: "user",
        content: "Genera tu primer mensaje como usuario.",
      });
    }

    const mensajeGroq = await llamarGroq(historialGroq);
    historialGroq.push({ role: "assistant", content: mensajeGroq });

    console.log(`🤖 Groq (usuario): ${mensajeGroq}`);
    turnos.push({ rol: "groq", mensaje: mensajeGroq });

    // 2. DialoGPT responde
    const respuestaDialoGPT = await llamarDialoGPT(
      mensajeGroq,
      pastUserInputs,
      generatedResponses
    );

    // Actualizar historial de DialoGPT
    pastUserInputs.push(mensajeGroq);
    generatedResponses.push(respuestaDialoGPT);

    console.log(`💬 DialoGPT: ${respuestaDialoGPT}`);
    turnos.push({ rol: "dialogpt", mensaje: respuestaDialoGPT });
  }

  // ─── Análisis final con Groq ─────────────────────────────────────────────
  console.log(`\n🔍 Analizando conversación...`);

  const conversacionTexto = turnos
    .map((t) => `${t.rol === "groq" ? "Usuario" : "DialoGPT"}: ${t.mensaje}`)
    .join("\n");

  const promptAnalisis = [
    {
      role: "system",
      content:
        "Eres un evaluador de calidad de chatbots. Analiza conversaciones y da un veredicto.",
    },
    {
      role: "user",
      content:
        `Analiza esta conversación entre un usuario simulado y DialoGPT:\n\n${conversacionTexto}\n\n` +
        `Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin explicaciones extra):\n` +
        `{"veredicto": "PASS o FAIL o PARCIAL", "analisis": "explicación breve de 2-3 oraciones"}`,
    },
  ];

  let veredicto = "PARCIAL";
  let analisis = "No se pudo generar análisis.";

  try {
    const respuestaAnalisis = await llamarGroq(promptAnalisis);
    // Limpiar posible markdown
    const jsonLimpio = respuestaAnalisis
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(jsonLimpio);
    veredicto = parsed.veredicto || "PARCIAL";
    analisis = parsed.analisis || analisis;
  } catch (e) {
    console.log("   ⚠️  No se pudo parsear el análisis, usando valores por defecto.");
  }

  console.log(`\n✅ Veredicto: ${veredicto}`);
  console.log(`📝 Análisis: ${analisis}`);

  return {
    escenario: escenario.nombre,
    turnos,
    veredicto,
    analisis,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Validar variables de entorno
  if (!GROQ_API_KEY) {
    console.error("❌ Falta GROQ_API_KEY en el archivo .env");
    process.exit(1);
  }
  if (!HF_TOKEN) {
    console.error("❌ Falta HF_TOKEN en el archivo .env");
    process.exit(1);
  }

  // Crear carpeta output si no existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("🚀 Iniciando Prueba Técnica QA — Integración de Chatbot\n");

  for (let i = 0; i < escenarios.length; i++) {
    try {
      const resultado = await ejecutarEscenario(escenarios[i]);

      // Guardar JSON
      const nombreArchivo = `escenario-${i + 1}.json`;
      const rutaArchivo = path.join(OUTPUT_DIR, nombreArchivo);
      fs.writeFileSync(rutaArchivo, JSON.stringify(resultado, null, 2), "utf-8");
      console.log(`\n💾 Guardado: output/${nombreArchivo}`);
    } catch (err) {
      console.error(`\n❌ Error en escenario ${i + 1}:`, err.message);
    }

    // Pequeña pausa entre escenarios para no saturar las APIs
    if (i < escenarios.length - 1) {
      console.log("\n⏸️  Pausa de 3 segundos entre escenarios...");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log("\n🎉 ¡Prueba completada! Revisa la carpeta /output");
}

main();
