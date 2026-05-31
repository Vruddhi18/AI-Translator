import os
import chromadb
from chromadb.utils import embedding_functions
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate


class TranslationEngine:
    def __init__(self):
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")

        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",  # free, open-source, fast
            api_key=groq_api_key,
            temperature=0.3,
        )

        # ChromaDB's built-in embeddings — no sentence_transformers needed
        self.chroma_client = chromadb.Client()
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        self.collections = {}

    def index_document(self, session_id: str, text: str):
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)

        collection_name = f"sess_{session_id.replace('-', '')}"

        collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )
        collection.add(
            documents=chunks,
            ids=[f"{session_id}_{i}" for i in range(len(chunks))]
        )
        self.collections[session_id] = collection
        return True

    def _invoke(self, prompt: str) -> str:
        from langchain_core.messages import HumanMessage
        response = self.llm.invoke([HumanMessage(content=prompt)])
        return response.content.strip()

    def translate(self, text: str, target_language: str) -> str:
        prompt = (
            f"Translate the following text into {target_language}. "
            f"Respond ONLY with the translation, nothing else.\n\n"
            f"Text to translate:\n{text[:10000]}"
        )
        return self._invoke(prompt)

    def summarize(self, text: str) -> str:
        prompt = (
            f"Provide a comprehensive summary of the following text and generate key notes.\n\n"
            f"Text:\n{text[:10000]}"
        )
        return self._invoke(prompt)

    def chat(self, session_id: str, query: str, target_language: str = "English") -> str:
        if session_id not in self.collections:
            return "No document indexed for this session. Please upload a file first."

        collection = self.collections[session_id]

        # Retrieve relevant chunks
        results = collection.query(query_texts=[query], n_results=4)
        context = "\n\n".join(results["documents"][0]) if results["documents"] else ""

        prompt = (
            f"Use the following context to answer the question. "
            f"Respond entirely in {target_language}.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            f"Answer:"
        )
        return self._invoke(prompt)