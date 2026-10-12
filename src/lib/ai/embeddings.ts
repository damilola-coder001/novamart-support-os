// NovaMart Semantic Policy Retrieval Engine
// High-efficiency Vector Space Model (TF-IDF + Bigram Cosine Similarity)

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  tags?: string[];
  vector?: Map<string, number>;
}

export class SemanticPolicyIndex {
  private documents: KnowledgeDoc[] = [];
  private idfMap: Map<string, number> = new Map();
  private isIndexed: boolean = false;

  private tokenize(text: string): string[] {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const words = clean.split(/\s+/).filter((w) => w.length > 1);
    const tokens: string[] = [...words];

    // Add bigrams for context capture (e.g. "return policy", "money back", "duplicate charge")
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
    }
    return tokens;
  }

  private computeTermFrequencies(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }
    // Sublinear scaling
    const normalized = new Map<string, number>();
    for (const [token, count] of tf.entries()) {
      normalized.set(token, 1 + Math.log(count));
    }
    return normalized;
  }

  public indexDocuments(docs: Array<{ id: string; title: string; category: string; content: string; tags?: string[] }>) {
    this.documents = docs.map((d) => ({ ...d }));
    const docCount = this.documents.length;
    if (docCount === 0) return;

    // 1. Calculate Document Frequency (DF) for each term
    const dfMap = new Map<string, number>();
    const docTokenMap: Array<Map<string, number>> = [];

    for (const doc of this.documents) {
      const tagsStr = Array.isArray(doc.tags) ? doc.tags.join(" ") : String(doc.tags || "");
      const fullText = `${doc.title} ${doc.title} ${doc.category} ${tagsStr} ${doc.content}`;
      const tokens = this.tokenize(fullText);
      const tf = this.computeTermFrequencies(tokens);
      docTokenMap.push(tf);

      for (const token of tf.keys()) {
        dfMap.set(token, (dfMap.get(token) || 0) + 1);
      }
    }

    // 2. Compute Inverse Document Frequency (IDF)
    this.idfMap.clear();
    for (const [token, df] of dfMap.entries()) {
      this.idfMap.set(token, Math.log((docCount + 1) / (df + 1)) + 1);
    }

    // 3. Compute TF-IDF vectors for all documents
    for (let i = 0; i < this.documents.length; i++) {
      const tf = docTokenMap[i];
      const vector = new Map<string, number>();
      let normSq = 0;

      for (const [token, tfVal] of tf.entries()) {
        const idf = this.idfMap.get(token) || 1;
        const weight = tfVal * idf;
        vector.set(token, weight);
        normSq += weight * weight;
      }

      // Normalize vector
      const norm = Math.sqrt(normSq) || 1;
      for (const [token, val] of vector.entries()) {
        vector.set(token, val / norm);
      }

      this.documents[i].vector = vector;
    }

    this.isIndexed = true;
  }

  public search(query: string, topK: number = 3): Array<{ doc: KnowledgeDoc; score: number }> {
    if (!this.isIndexed || this.documents.length === 0) {
      return [];
    }

    const queryTokens = this.tokenize(query);
    const queryTf = this.computeTermFrequencies(queryTokens);
    const queryVector = new Map<string, number>();
    let normSq = 0;

    for (const [token, tfVal] of queryTf.entries()) {
      const idf = this.idfMap.get(token) || 0;
      if (idf > 0) {
        const weight = tfVal * idf;
        queryVector.set(token, weight);
        normSq += weight * weight;
      }
    }

    if (queryVector.size === 0) {
      return [];
    }

    const norm = Math.sqrt(normSq) || 1;
    for (const [token, val] of queryVector.entries()) {
      queryVector.set(token, val / norm);
    }

    // Cosine similarity against all documents
    const results: Array<{ doc: KnowledgeDoc; score: number }> = [];

    for (const doc of this.documents) {
      if (!doc.vector) continue;
      let dotProduct = 0;

      for (const [token, qWeight] of queryVector.entries()) {
        const dWeight = doc.vector.get(token) || 0;
        dotProduct += qWeight * dWeight;
      }

      if (dotProduct > 0.05) {
        results.push({ doc, score: dotProduct });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
}

// Global shared index instance
const globalForSemantic = globalThis as unknown as {
  semanticPolicyIndex: SemanticPolicyIndex | undefined;
};

export const policySemanticIndex = globalForSemantic.semanticPolicyIndex ?? new SemanticPolicyIndex();
if (process.env.NODE_ENV !== "production") {
  globalForSemantic.semanticPolicyIndex = policySemanticIndex;
}
