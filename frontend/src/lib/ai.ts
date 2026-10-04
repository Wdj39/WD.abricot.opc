import 'server-only';
import { Document, MetadataMode, Settings, VectorStoreIndex } from 'llamaindex';
import { MistralAI, MistralAIEmbedding } from '@llamaindex/mistral';
import type { Task } from '@/types';

/** Tâche proposée par l'IA, avant validation par l'utilisateur */
export interface GeneratedTask {
  title: string;
  description: string;
}

const MAX_TASKS = 8;
const SIMILAR_TASKS_COUNT = 5;

/** Erreur dont le message peut être montré tel quel à l'utilisateur */
export class AiError extends Error {}

function getApiKey(): string {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new AiError("La génération par IA n'est pas configurée (clé MISTRAL_API_KEY manquante).");
  }
  return apiKey;
}

/**
 * Étape 1 du RAG (Retrieval-Augmented Generation) avec LlamaIndex :
 * les tâches existantes du projet sont converties en vecteurs (embeddings
 * Mistral), indexées en mémoire, puis on récupère celles dont le sens est le
 * plus proche de la demande. Elles serviront de contexte à l'IA pour proposer
 * des tâches cohérentes avec le projet, sans doublon.
 */
async function findSimilarTasks(prompt: string, tasks: Task[], apiKey: string) {
  if (tasks.length === 0) return [];

  const documents = tasks.map(
    (task) =>
      new Document({
        text: `${task.title}\n${task.description ?? ''}`.trim(),
        metadata: { status: task.status },
      })
  );

  const embedModel = new MistralAIEmbedding({ apiKey });
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

/** Génère des tâches à partir d'une demande en langage naturel */
export async function generateTasks(
  prompt: string,
  project: { name: string; description: string | null },
  existingTasks: Task[]
): Promise<GeneratedTask[]> {
  const apiKey = getApiKey();

  try {
    const similarTasks = await findSimilarTasks(prompt, existingTasks, apiKey);

    const llm = new MistralAI({ apiKey, model: 'mistral-small-latest', temperature: 0.3 });
    const response = await llm.chat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(prompt, project, similarTasks) },
      ],
    });

    const content = response.message.content;
    const text = typeof content === 'string' ? content : JSON.stringify(content);
    return parseGeneratedTasks(text);
  } catch (error) {
    if (error instanceof AiError) throw error;
    // Erreur du service Mistral (clé invalide, quota, réseau...) : détail dans le terminal
    console.error('Erreur IA :', error);
    const message = String((error as Error)?.message ?? '');
    if (message.includes('401') || message.toLowerCase().includes('unauthorized')) {
      throw new AiError('La clé API Mistral est invalide.');
    }
    if (message.includes('429')) {
      throw new AiError("Trop de demandes envoyées à l'IA. Patientez un instant puis réessayez.");
    }
    throw new AiError("Le service d'IA est momentanément indisponible. Réessayez plus tard.");
  }
}
