# Prueba Técnica — QA

Script en Node.js que simula una conversación entre **Groq (LLaMA)** como usuario simulado y **DialoGPT** como chatbot, ejecutando 4 escenarios con 4 turnos cada uno y generando un análisis de calidad.

---

## Requisitos

- Node.js v18 o superior
- Cuenta en [Groq](https://console.groq.com) con API Key

---

## Ejecución

```bash
node index.js
```

El script ejecutará los 4 escenarios automáticamente y guardará los resultados en la carpeta `/output`.

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
- El modelo de Groq usado es `llama-3.1-8b-instant` y `llama-3.3-70b-versatile`.
