import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import connectDB from "../config/database.config.js";

import path from "path";
import { fileURLToPath } from "url";

import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vectorIndexName =
  process.env.MONGODB_VECTOR_INDEX || "edureach_vector_index";

const getMongoClient = async () => {
  return connectDB();
};

const getEmbeddings = () => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in .env!");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-embedding-001",
  });
};

export const getVectorStore = async () => {
  const client = await getMongoClient();
  const collection = client.db("edureach_db").collection("knowledge_docs");
  return new MongoDBAtlasVectorSearch(getEmbeddings(), {
    collection: collection,
    indexName: vectorIndexName,
    textKey: "text",
    embeddingKey: "embedding",
  });
};

export const initializeKnowledgeBase = async () => {
  const client = await getMongoClient();
  const collection = client.db("edureach_db").collection("knowledge_docs");

  // Check if docs exist WITH valid (non-empty) embeddings
  const docWithEmbedding = await collection.findOne({
    embedding: { $exists: true, $not: { $size: 0 } },
  });

  if (docWithEmbedding) {
    const count = await collection.countDocuments();
    console.log(` Knowledge base ready (${count} chunks with embeddings)`);
    return;
  }

  // Delete old chunks before re-indexing
  await collection.deleteMany({});
  console.log(" Indexing knowledge base...");

  // Initialize the embedding model and validate the API key
  const embeddings = getEmbeddings();
  try {
    const testResult = await embeddings.embedQuery("test");
    console.log(` API key OK — embedding dimensions: ${testResult.length}`);
  } catch (error) {
    console.error(" Embedding test failed!");
    console.error("   Error:", error.message || error);
    console.error("   Get key from: https://aistudio.google.com/apikey");
    throw error;
  }

  // Read the college data and validate content
  const filePath = path.join(
    __dirname,
    "../../knowledge-base/edureach-knowledge.txt",
  );
  const loader = new TextLoader(filePath);
  const docs = await loader.load();
  if (docs.length === 0) {
    throw new Error("No documents found in knowledge base file");
  }
  const totalCharacters = docs.reduce(
    (sum, doc) => sum + doc.pageContent.length,
    0,
  );
  console.log(`    Loaded ${totalCharacters} characters`);

  // Split into smaller chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);
  console.log(`    Split into ${allSplits.length} chunks`);

  // Convert chunks to embeddings and store them
  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection: collection,
    indexName: vectorIndexName,
    textKey: "text",
    embeddingKey: "embedding",
  });
  await vectorStore.addDocuments(allSplits);

  // Verify the stored embeddings
  const verifyDoc = await collection.findOne({
    embedding: { $exists: true, $not: { $size: 0 } },
  });
  if (
    verifyDoc &&
    Array.isArray(verifyDoc.embedding) &&
    verifyDoc.embedding.length > 0
  ) {
    console.log(
      `    ${allSplits.length} chunks stored (${verifyDoc.embedding.length}D embeddings)`,
    );
    console.log(
      `     IMPORTANT: Create Atlas Vector Search index with numDimensions: ${verifyDoc.embedding.length}`,
    );
  } else {
    await collection.deleteMany({});
    throw new Error(" Embeddings are empty! Google API returned no vectors.");
  }
};

const normalizeText = (value) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const deduplicateDocs = (docs = []) => {
  const uniqueDocs = [];
  const seen = new Set();

  for (const doc of docs) {
    const text = normalizeText(doc?.pageContent);
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    uniqueDocs.push({ ...doc, pageContent: text });
  }

  return uniqueDocs;
};

const getRelevantFacts = (question, docs) => {
  const normalizedQuestion = normalizeText(question).toLowerCase();
  const questionWords = new Set(
    normalizedQuestion.split(/\W+/).filter((word) => word.length > 2),
  );

  const sentenceMatches = [];

  for (const doc of docs) {
    const sentences = doc.pageContent.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const normalizedSentence = normalizeText(sentence);
      if (!normalizedSentence) {
        continue;
      }
      const lowered = normalizedSentence.toLowerCase();
      const score = [...questionWords].reduce((total, word) => {
        return total + (lowered.includes(word) ? 1 : 0);
      }, 0);

      sentenceMatches.push({ sentence: normalizedSentence, score });
    }
  }

  const ranked = sentenceMatches
    .sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length)
    .filter((entry, index, arr) => {
      return (
        index === 0 ||
        !arr
          .slice(0, index)
          .some(
            (previous) =>
              previous.sentence.toLowerCase() === entry.sentence.toLowerCase(),
          )
      );
    });

  const selectedFacts = ranked.slice(0, 3).map((entry) => entry.sentence);

  if (selectedFacts.length > 0) {
    return selectedFacts;
  }

  return docs
    .map((doc) => normalizeText(doc.pageContent))
    .filter(Boolean)
    .slice(0, 2);
};

export const buildGroundedAnswer = (question, docs = []) => {
  const uniqueDocs = deduplicateDocs(docs);

  if (!uniqueDocs.length) {
    return "I couldn’t find any relevant information in the knowledge base for that question.";
  }

  const facts = getRelevantFacts(question, uniqueDocs);

  return `Based on the college information, ${facts.join(" ")}`;
};

export const answerQuestion = async (question) => {
  const vectorStore = await getVectorStore();
  const docs = await vectorStore.similaritySearch(question, 4);
  const uniqueDocs = deduplicateDocs(docs);

  if (!uniqueDocs.length) {
    return "I couldn’t find any relevant information in the knowledge base for that question.";
  }

  const groundedFallback = buildGroundedAnswer(question, uniqueDocs);

  if (!process.env.GOOGLE_API_KEY) {
    return groundedFallback;
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
      temperature: 0.2,
      maxOutputTokens: 512,
    });

    const context = uniqueDocs
      .map((doc) => normalizeText(doc.pageContent))
      .filter(Boolean)
      .join("\n\n");

    const prompt = `You are EduReach's college assistant. Use only the context below to answer the user's question. If the answer is not in the context, say that the information is not available. Keep the answer concise and avoid repeating the same fact.\n\nQuestion: ${question}\n\nContext:\n${context}`;

    const response = await model.invoke([new HumanMessage(prompt)]);
    const rawAnswer =
      typeof response?.content === "string"
        ? response.content
        : Array.isArray(response?.content)
          ? response.content
              .map((part) =>
                typeof part === "string" ? part : (part?.text ?? ""),
              )
              .join("")
          : String(response ?? "");

    const finalAnswer = normalizeText(rawAnswer);
    if (finalAnswer) {
      return finalAnswer;
    }
  } catch (error) {
    console.warn(
      "Gemini answer generation failed, falling back to grounded summary.",
      error.message || error,
    );
  }

  return groundedFallback;
};
