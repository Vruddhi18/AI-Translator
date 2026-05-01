from langchain_community.llms import Ollama
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceEmbeddings
import chromadb

class TranslationEngine:
    def __init__(self, model_name="llama3.1"):
        self.llm = Ollama(model=model_name)
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.chroma_client = chromadb.Client()
        self.vectorstores = {}

    def index_document(self, session_id: str, text: str):
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)
        
        collection_name = f"sess_{session_id.replace('-', '')}"
        
        vectorstore = Chroma.from_texts(
            texts=chunks,
            embedding=self.embeddings,
            client=self.chroma_client,
            collection_name=collection_name
        )
        self.vectorstores[session_id] = vectorstore
        return True

    def translate(self, text: str, target_language: str) -> str:
        # If text is too long, we might need to chunk it, but for simplicity let's rely on LLM context length first
        prompt = f"Translate the following text into {target_language}. Respond ONLY with the translation, nothing else.\n\nText to translate:\n{text[:10000]}..."
        response = self.llm.invoke(prompt)
        return response.strip()

    def summarize(self, text: str) -> str:
        prompt = f"Provide a comprehensive summary of the following text and generate key notes.\n\nText:\n{text[:10000]}..."
        response = self.llm.invoke(prompt)
        return response.strip()

    def chat(self, session_id: str, query: str, target_language: str = "English") -> str:
        if session_id not in self.vectorstores:
            return "No document indexed for this session."
            
        vectorstore = self.vectorstores[session_id]
        
        enhanced_query = f"{query}\n\n[Instruction: Please respond to the above question entirely in {target_language}.]"
        
        prompt_template = """Use the following pieces of context to answer the question at the end. 

        Context:
        {context}

        Question: {question}
        Answer:"""
        PROMPT = PromptTemplate(
            template=prompt_template, input_variables=["context", "question"]
        )
        
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=vectorstore.as_retriever(),
            chain_type_kwargs={"prompt": PROMPT}
        )
        
        return qa_chain.invoke(enhanced_query)["result"]
