"""
LangChain RAG Implementation for Oil India SAMANWAY Pipeline
Production-ready RAG system using open-source LangChain framework
"""

import os
from typing import List, Dict, Any
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import Ollama
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.document_loaders import TextLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import Document


class SamwayRAGSystem:
    """
    LangChain-based RAG system for Oil India Primavera task matching.
    Integrates LOCAL Claude with vector search for intelligent field report matching.
    """

    def __init__(self):
        """Initialize LangChain RAG with local embeddings and Claude."""

        # Use sentence-transformers for embeddings (no external API)
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",  # Lightweight, production-ready
            model_kwargs={"device": "cpu"}
        )

        # Initialize local Claude via Ollama
        self.llm = Ollama(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            model=os.getenv("LLM_MODEL_NAME", "llama3.2"),
            temperature=0.3,
        )

        # Vector store for Primavera tasks
        self.vector_store = None
        self._load_primavera_tasks()

    def _load_primavera_tasks(self):
        """Load Primavera tasks into FAISS vector store."""

        # Sample Primavera tasks with descriptions
        primavera_tasks = [
            {
                "id": "L6-PIP-402",
                "name": "Hydro-testing primary cooling water line",
                "discipline": "piping",
                "description": "24-inch primary cooling water line hydro testing at Sector 4. Testing and commissioning activity. Includes pressure testing, alignment checks, and quality verification."
            },
            {
                "id": "L6-PIP-403",
                "name": "Alignment and welding of 6-inch cooling pipe",
                "discipline": "piping",
                "description": "6-inch cooling pipe alignment and welding. Includes fabrication, welding inspection, joint alignment verification. Piping discipline work."
            },
            {
                "id": "L6-CIV-402",
                "name": "Completed excavation for foundation block B4",
                "discipline": "civil",
                "description": "Foundation block B4 excavation completed. Soil work, earthworks, excavation activities. Civil discipline. Ready for concreting."
            },
            {
                "id": "L6-ELE-301",
                "name": "Cable pulling and termination Unit A",
                "discipline": "electrical",
                "description": "Electrical cable pulling and installation. Cable laying, termination work. Unit A area. Electrical discipline."
            },
            {
                "id": "L6-INS-201",
                "name": "Pressure transmitter calibration and installation",
                "discipline": "instrumentation",
                "description": "Transmitter calibration, pressure gauge installation. Instrumentation discipline. Testing and commissioning."
            },
        ]

        # Convert to LangChain documents
        documents = [
            Document(
                page_content=f"{task['name']}. {task['description']}",
                metadata={
                    "id": task["id"],
                    "discipline": task["discipline"],
                    "task_name": task["name"]
                }
            )
            for task in primavera_tasks
        ]

        # Create FAISS vector store
        self.vector_store = FAISS.from_documents(documents, self.embeddings)

    def extract_and_match(self, field_report: str) -> Dict[str, Any]:
        """
        Extract keywords from field report and match to Primavera tasks using RAG.

        Args:
            field_report: Raw field progress report text

        Returns:
            Dictionary with extracted keywords and matched Primavera tasks
        """

        # RAG Prompt template for intelligent extraction
        rag_prompt = PromptTemplate(
            template="""You are an expert Oil & Gas project manager.

Extract structured information from this field report and match to Primavera tasks:

Field Report: {context}

EXTRACT:
1. Activity name (handle spelling mistakes: "spol"="spool", "errection"="erection")
2. Discipline (piping, civil, electrical, instrumentation)
3. Location/Sector
4. Completion status
5. Best matching Primavera task ID

Return JSON format:
{{
  "activity": "normalized activity name",
  "discipline": "piping|civil|electrical|instrumentation",
  "location": "sector/area",
  "status": "completed|in_progress|pending",
  "confidence": 0.0-1.0,
  "matched_task_id": "L6-XXX-YYY",
  "rationale": "why this task matched"
}}
""",
            input_variables=["context"]
        )

        # Create QA chain with RAG
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_store.as_retriever(search_kwargs={"k": 3}),
            prompt=rag_prompt,
            return_source_documents=True
        )

        # Execute RAG extraction
        result = qa_chain({"query": field_report})

        return {
            "success": True,
            "field_report": field_report,
            "rag_result": result["result"],
            "matched_tasks": self._extract_matched_tasks(result),
            "source_documents": [
                {
                    "id": doc.metadata.get("id"),
                    "name": doc.metadata.get("task_name"),
                    "discipline": doc.metadata.get("discipline")
                }
                for doc in result.get("source_documents", [])
            ]
        }

    def _extract_matched_tasks(self, rag_result: Dict) -> List[Dict]:
        """Extract matched task information from RAG result."""
        import json

        try:
            # Parse LLM response as JSON
            response_text = rag_result.get("result", "{}")
            matched_data = json.loads(response_text)
            return [matched_data]
        except (json.JSONDecodeError, ValueError):
            return []

    def semantic_search(self, query: str, k: int = 5) -> List[Dict]:
        """
        Semantic search for Primavera tasks using vector similarity.

        Args:
            query: Search query
            k: Number of results to return

        Returns:
            List of matching tasks with scores
        """

        results = self.vector_store.similarity_search_with_score(query, k=k)

        return [
            {
                "id": doc.metadata.get("id"),
                "name": doc.metadata.get("task_name"),
                "discipline": doc.metadata.get("discipline"),
                "similarity_score": score,
                "content": doc.page_content[:200]
            }
            for doc, score in results
        ]


# Singleton instance
_rag_system = None


def get_rag_system() -> SamwayRAGSystem:
    """Get or create singleton RAG system."""
    global _rag_system
    if _rag_system is None:
        _rag_system = SamwayRAGSystem()
    return _rag_system
