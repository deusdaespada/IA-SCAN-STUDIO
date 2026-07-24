import type { TranslateRequest, ReviewRequest } from './types';

export function buildTranslationPrompt(req: TranslateRequest): string {
  const glossaryLines = req.context.glossary
    .map((g) => `- "${g.term_original}" → "${g.term_translated}" (${g.category})`)
    .join('\n');

  return `Você é um tradutor profissional especializado em mangás, manhwas e manhuas.

Traduza os textos abaixo de ${req.context.sourceLanguage} para ${req.context.targetLanguage}.

REGRAS IMPORTANTES:
- Preserve o tom, a personalidade dos personagens, gírias e expressões idiomáticas.
- Mantenha honoríficos quando fizerem sentido para o contexto cultural.
- Use o glossário abaixo para manter termos consistentes:
${glossaryLines || '(nenhum termo cadastrado ainda)'}

${req.context.previousChapterSummary ? `Contexto de capítulos anteriores: ${req.context.previousChapterSummary}` : ''}
${req.context.characterNotes ? `Notas sobre personagens: ${req.context.characterNotes}` : ''}

Textos para traduzir (formato JSON de entrada):
${JSON.stringify(req.texts, null, 2)}

Responda APENAS com um JSON válido no formato exato:
{"translations": [{"id": "<id do texto>", "translated": "<tradução>"}]}`;
}

export function buildReviewPrompt(req: ReviewRequest): string {
  return `Você é um revisor profissional de traduções de mangás/manhwas/manhuas.

Texto original (${req.context.sourceLanguage}): "${req.original}"
Tradução atual (${req.context.targetLanguage}): "${req.translated}"

Revise a tradução considerando gramática, ortografia, pontuação, fluidez, naturalidade e consistência
com o glossário do projeto. Se a tradução já estiver ótima, retorne "suggestion": null.

Responda APENAS com um JSON válido no formato exato:
{"suggestion": "<texto sugerido ou null>", "reasoning": "<breve explicação da sugestão>"}`;
}

export function parseJsonResponse<T>(text: string): T {
  // Remove possíveis blocos de código markdown (```json ... ```) que alguns modelos retornam
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Resposta da IA não é um JSON válido: ${cleaned.slice(0, 200)}`);
  }
}
