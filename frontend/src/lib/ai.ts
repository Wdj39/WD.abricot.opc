import 'server-only';
import {
  Document,
  MetadataMode,
  Settings,
  VectorStoreIndex,
  type BaseEmbedding,
  type LLM,
} from 'llamaindex';
import { MistralAI, MistralAIEmbedding } from '@llamaindex/mistral';
import {
  GEMINI_MODEL,
  Gemini,
  GeminiEmbedding,
  type GEMINI_EMBEDDING_MODEL,
} from '@llamaindex/google';
import type { Task } from '@/types';

/** Tâche proposée par l'IA, avant validation par l'utilisateur */
export interface GeneratedTask {
  title: string;
  description: string;
}

const MAX_TASKS = 8;

// Modèle recommandé par Google pour les nouveaux comptes (octobre 2026)
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const SIMILAR_TASKS_COUNT = 5;

/** Erreur dont le message peut être montré tel quel à l'utilisateur */
export class AiError extends Error {}

/**
 * Fournisseur d'IA, choisi dans .env.local avec AI_PROVIDER ("gemini" ou "mistral").
 * Le cahier des charges prévoyait Mistral ; son offre gratuite ne donnant plus
 * accès à l'API, Gemini est utilisé par défaut (avec l'accord du mentor).
 * Changer de fournisseur ne demande qu'une ligne de configuration : le reste du
 * code (RAG LlamaIndex, prompt, validation) est identique.
 */
type ProviderName = 'gemini' | 'mistral';

interface AiProvider {
  label: string; // nom affiché dans les messages d'erreur
  llm: LLM;
  embedModel: BaseEmbedding;
}

function getProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase() as ProviderName;

  if (name === 'mistral') {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new AiError(missingKeyMessage('MISTRAL_API_KEY'));
    return {
      label: 'Mistral',
      llm: new MistralAI({
        apiKey,
        model: (process.env.AI_MODEL || 'mistral-small-latest') as 'mistral-small-latest',
        temperature: 0.3,
      }),
      embedModel: new MistralAIEmbedding({ apiKey }),
    };
  }

  if (name === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AiError(missingKeyMessage('GEMINI_API_KEY'));
    return {
      label: 'Gemini',
      // Les fournisseurs retirent régulièrement d'anciens modèles : le nom se
      // règle dans .env.local (AI_MODEL) sans toucher au code
      llm: new Gemini({
        apiKey,
        model: (process.env.AI_MODEL || DEFAULT_GEMINI_MODEL) as GEMINI_MODEL,
        temperature: 0.3,
      }),
      embedModel: new GeminiEmbedding({
        apiKey,
        // Modèle d'embedding actuel de Google, plus récent que la liste connue
        // de LlamaIndex : on le précise donc nous-mêmes
        model: 'gemini-embedding-001' as GEMINI_EMBEDDING_MODEL,
      }),
    };
  }

  throw new AiError(`Fournisseur d'IA inconnu : "${name}". Valeurs possibles : gemini, mistral.`);
}

function missingKeyMessage(variable: string): string {
  return `La génération par IA n'est pas configurée (clé ${variable} manquante).`;
}

/**
 * Étape 1 du RAG (Retrieval-Augmented Generation) avec LlamaIndex :
 * les tâches existantes du projet sont converties en vecteurs (embeddings), indexées en mémoire, puis on récupère celles dont le sens est le
 * plus proche de la demande. Elles serviront de contexte à l'IA pour proposer
 * des tâches cohérentes avec le projet, sans doublon.
 */
async function findSimilarTasks(prompt: string, tasks: Task[], embedModel: BaseEmbedding) {
  if (tasks.length === 0) return [];

  const documents = tasks.map(
    (task) =>
      new Document({
        text: `${task.title}\n${task.description ?? ''}`.trim(),
        metadata: { status: task.status },
      })
  );

  // withEmbedModel : le modèle d'embedding ne s'applique qu'à cet appel
  return Settings.withEmbedModel(embedModel, async () => {
    const index = await VectorStoreIndex.fromDocuments(documents);
    const retriever = index.asRetriever({ similarityTopK: SIMILAR_TASKS_COUNT });
    const results = await retriever.retrieve(prompt);
    return results.map((result) => result.node.getContent(MetadataMode.NONE));
  });
}

const SYSTEM_PROMPT = `Tu es un assistant de gestion de projet pour l'application Abricot.
À partir de la demande de l'utilisateur, tu proposes une liste de tâches concrètes et actionnables.

Règles :
- Réponds UNIQUEMENT avec un tableau JSON, sans texte autour ni balises Markdown.
- Format : [{"title": "...", "description": "..."}]
- Entre 1 et ${MAX_TASKS} tâches.
- "title" : court et commençant par un verbe d'action (200 caractères maximum).
- "description" : une ou deux phrases qui précisent le travail attendu (1000 caractères maximum).
- Rédige en français.
- Ne propose pas de tâche qui existe déjà dans le projet.`;

/** Construit la demande envoyée au modèle, enrichie du contexte du projet */
function buildUserMessage(
  prompt: string,
  project: { name: string; description: string | null },
  similarTasks: string[]
): string {
  const context =
    similarTasks.length > 0
      ? similarTasks.map((t) => `- ${t.replace(/\n/g, ' : ')}`).join('\n')
      : '(aucune tâche pour le moment)';

  return `Projet : ${project.name}
Description du projet : ${project.description || 'non renseignée'}

Tâches existantes les plus proches de la demande :
${context}

Demande de l'utilisateur :
${prompt}`;
}

/**
 * Extrait et valide le tableau JSON renvoyé par le modèle.
 * On ne fait jamais confiance aveuglément à la sortie d'une IA : format,
 * types et longueurs sont vérifiés avant d'être montrés à l'utilisateur.
 */
export function parseGeneratedTasks(raw: string): GeneratedTask[] {
  // Le modèle entoure parfois sa réponse de ```json ... ``` malgré la consigne
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end <= start) {
    throw new AiError("L'IA n'a pas renvoyé de liste de tâches exploitable. Réessayez.");
  }

  let data: unknown;
  try {
    data = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new AiError("La réponse de l'IA est mal formée. Réessayez.");
  }
  if (!Array.isArray(data)) {
    throw new AiError("L'IA n'a pas renvoyé de liste de tâches exploitable. Réessayez.");
  }

  const tasks = data
    .filter(
      (item): item is { title: unknown; description?: unknown } =>
        typeof item === 'object' && item !== null && 'title' in item
    )
    .map((item) => ({
      title: String(item.title ?? '')
        .trim()
        .slice(0, 200),
      description: String(item.description ?? '')
        .trim()
        .slice(0, 1000),
    }))
    .filter((task) => task.title.length >= 2)
    .slice(0, MAX_TASKS);

  if (tasks.length === 0) {
    throw new AiError("L'IA n'a proposé aucune tâche. Essayez de préciser votre demande.");
  }
  return tasks;
}

/**
 * Erreurs temporaires du fournisseur (503 surcharge, 500/502/504) : on réessaie
 * automatiquement avec une attente qui double à chaque fois (2 s, puis 4 s).
 * Les erreurs définitives (clé invalide, quota, modèle retiré) ne sont pas
 * réessayées : elles échoueraient de la même façon.
 */
const RETRY_DELAYS_MS = [2000, 4000];

function isTemporaryError(error: unknown): boolean {
  const message = String((error as Error)?.message ?? '').toLowerCase();
  return ['503', '500', '502', '504', 'unavailable', 'overloaded', 'high demand'].some((code) =>
    message.includes(code)
  );
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined || !isTemporaryError(error)) throw error;
      console.warn(`IA temporairement indisponible, nouvel essai dans ${delay / 1000} s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/** Génère des tâches à partir d'une demande en langage naturel */
export async function generateTasks(
  prompt: string,
  project: { name: string; description: string | null },
  existingTasks: Task[]
): Promise<GeneratedTask[]> {
  const provider = getProvider();

  try {
    const similarTasks = await findSimilarTasks(prompt, existingTasks, provider.embedModel);

    const response = await withRetry(() =>
      provider.llm.chat({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(prompt, project, similarTasks) },
        ],
      })
    );

    const content = response.message.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return parseGeneratedTasks(text);
  } catch (error) {
    if (error instanceof AiError) throw error;
    // Erreur du fournisseur (clé invalide, quota, réseau...) : détail dans le terminal
    console.error(`Erreur IA (${provider.label}) :`, error);
    throw new AiError(toUserMessage(error, provider.label));
  }
}

/** Traduit une erreur technique du fournisseur en message compréhensible */
function toUserMessage(error: unknown, label: string): string {
  const message = String((error as Error)?.message ?? '');
  const lower = message.toLowerCase();

  // Mistral : 401 | Gemini : 400 "API key not valid" ou 403
  if (
    message.includes('401') ||
    lower.includes('unauthorized') ||
    lower.includes('api key not valid') ||
    lower.includes('api_key_invalid') ||
    lower.includes('permission_denied')
  ) {
    return `La clé API ${label} est invalide.`;
  }
  // 429 : quota atteint, ou quota à zéro sur certaines offres gratuites
  if (
    message.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit')
  ) {
    return `Le quota de l'API ${label} est atteint, ou n'est pas disponible avec votre offre. Réessayez plus tard ou vérifiez votre compte ${label}.`;
  }
  // 404 : modèle retiré ou inconnu chez le fournisseur
  if (message.includes('404') || lower.includes('not_found')) {
    return `Le modèle d'IA configuré n'est plus disponible chez ${label}. Indiquez un modèle récent dans AI_MODEL (fichier .env.local).`;
  }
  return "Le service d'IA est momentanément surchargé ou indisponible. Réessayez dans quelques instants.";
}
