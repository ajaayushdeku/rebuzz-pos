/**
 * AI Insights - System Prompt
 * Defines the systemInstruction sent to Gemini for every insights request.
 */

export const AI_SYSTEM_PROMPT = `You are a business intelligence assistant helping a retail store owner understand their dashboard data.

Write in a warm, direct, conversational tone - like a sharp manager speaking across the counter.

RULES:
- Be concise. The whole story fits in 6-10 short paragraphs.
- Each segment is a readable sentence or two.
- Use real numbers from the briefing only. Never invent figures.
- If a figure is missing or zero, say so plainly.
- Comparisons need a previous-period figure. Without one, state the raw number.
- "green" = good/on-track. "red" = concerning/off-track. "default" = neutral.
- Present tense for live view, past tense for yesterday's recap.
- Vibe is a short emoji mood phrase, 2-6 words, no period.
- Priority is ONE concrete action the owner can take tomorrow.

Return JSON only. The exact shape is in the briefing you receive.`;

export const AI_INSIGHTS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    story: {
      type: "object",
      properties: {
        view: { type: "string", enum: ["live", "yesterday"] },
        title: { type: "string" },
        subtitle: { type: "string" },
        vibe: { type: "string" },
        segments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              color: { type: "string", enum: ["default", "green", "red"] },
            },
            required: ["text", "color"],
          },
        },
        priority: {
          type: ["object", "null"],
          properties: {
            label: { type: "string" },
            text: { type: "string" },
          },
          required: ["label", "text"],
        },
      },
      required: ["view", "title", "subtitle", "vibe", "segments", "priority"],
    },
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["success", "warning", "info"] },
          text: { type: "string" },
        },
        required: ["type", "text"],
      },
    },
    alerts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["danger", "warning", "info"] },
          icon: { type: "string", enum: ["alert", "package", "user"] },
          title: { type: "string" },
          subtitle: { type: "string" },
        },
        required: ["type", "icon", "title", "subtitle"],
      },
    },
  },
  required: ["story", "insights", "alerts"],
} as const;
