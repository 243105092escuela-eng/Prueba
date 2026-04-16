# Prueba Técnica — QA Engineer: Integración y análisis de chatbot

Script en Node.js que simula una conversación entre **Groq (LLaMA)** como usuario simulado y **DialoGPT** como chatbot, ejecutando 4 escenarios con 4 turnos cada uno y generando un análisis de calidad.

---

## Requisitos

- Node.js v18 o superior
- Cuenta en [Groq](https://console.groq.com) con API Key
- Cuenta en [HuggingFace](https://huggingface.co) con Access Token

---

## Instalación

1. Clona o descarga este repositorio:
   ```bash
   git clone <url-del-repo>
   cd prueba-qa-chatbot
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea el archivo `.env` basado en el ejemplo:
   ```bash
   cp .env.example .env
   ```

4. Abre el archivo `.env` y llena tus credenciales:
   ```
   GROQ_API_KEY=tu_api_key_de_groq
   HF_TOKEN=hf_tu_token_de_huggingface
   ```

---

## Ejecución

```bash
node index.js
```

El script ejecutará los 4 escenarios automáticamente y guardará los resultados en la carpeta `/output`.

---

## Estructura del proyecto

```
prueba-qa-chatbot/
├── index.js          ← script principal
├── README.md         ← este archivo
├── .env.example      ← variables de entorno sin valores reales
├── .env              ← tus credenciales reales (NO subir a GitHub)
└── output/
    ├── escenario-1.json
    ├── escenario-2.json
    ├── escenario-3.json
    └── escenario-4.json
```

---

## Escenarios

| # | Nombre | Descripción |
|---|--------|-------------|
| 1 | Consulta simple | El usuario saluda y hace preguntas sobre el clima |
| 2 | Cambio de tema | El usuario habla de comida y cambia abruptamente a IA |
| 3 | Conversación emocional | El usuario expresa frustración y tristeza |
| 4 | Preguntas de conocimiento | El usuario hace trivia y preguntas de cultura general |

---

## Formato de salida (JSON)

Cada escenario genera un archivo con esta estructura:

```json
{
  "escenario": "nombre del escenario",
  "turnos": [
    { "rol": "groq",     "mensaje": "..." },
    { "rol": "dialogpt", "mensaje": "..." },
    { "rol": "groq",     "mensaje": "..." },
    { "rol": "dialogpt", "mensaje": "..." }
  ],
  "veredicto": "PASS | FAIL | PARCIAL",
  "analisis": "Explicación breve del resultado escrita por Groq"
}
```

---

## Notas importantes

- DialoGPT puede tardar hasta 30 segundos en responder la primera vez (cold start). El script reintenta automáticamente.
- No subas el archivo `.env` a GitHub — agrega `.env` a tu `.gitignore`.
- El modelo de Groq usado es `llama-3.1-8b-instant`.
