/**
 * Computes the cosine similarity between two vectors
 * If dimensions don't match, automatically adapts using the enhanced approach
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    // Use the enhanced approach that preserves more information
    return enhancedCosineSimilarity(a, b);
}

/**
 * Enhanced cosine similarity that adaptively handles different dimensions
 * Instead of truncating larger embeddings, it pads smaller ones to preserve information
 */
export function enhancedCosineSimilarity(a: Float32Array, b: Float32Array): number {
    // If dimensions match, use standard calculation
    if (a.length === b.length) {
        return standardCosineSimilarity(a, b);
    }

    // Always adapt smaller embedding to larger one to preserve maximum information
    if (a.length > b.length) {
        // Pad b to match a's dimensions
        const adaptedB = adaptEmbeddingDimensions(b, a.length);
        return standardCosineSimilarity(a, adaptedB);
    } else {
        // Pad a to match b's dimensions
        const adaptedA = adaptEmbeddingDimensions(a, b.length);
        return standardCosineSimilarity(adaptedA, b);
    }
}

/**
 * Standard cosine similarity for same-dimension vectors
 */
function standardCosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        aMagnitude += a[i] * a[i];
        bMagnitude += b[i] * b[i];
    }

    aMagnitude = Math.sqrt(aMagnitude);
    bMagnitude = Math.sqrt(bMagnitude);

    if (aMagnitude === 0 || bMagnitude === 0) {
        return 0;
    }

    return dotProduct / (aMagnitude * bMagnitude);
}

/**
 * Identifies the optimal embedding when multiple are available
 * Prioritizes higher-dimensional embeddings as they contain more information
 */
export function selectOptimalEmbedding(embeddings: Array<{
    providerId: string;
    modelId: string;
    dimension: number;
    count?: number;
}>): {providerId: string; modelId: string; dimension: number} | null {
    if (!embeddings || embeddings.length === 0) return null;

    // First prioritize by dimension (higher is better)
    let optimal = embeddings.reduce((best, current) =>
        current.dimension > best.dimension ? current : best,
        embeddings[0]
    );

    return optimal;
}

/**
 * Adapts an embedding to match target dimensions
 * Uses a simple truncation (if source is larger) or zero-padding (if source is smaller)
 *
 * @param sourceEmbedding The original embedding
 * @param targetDimension The desired dimension
 * @returns A new embedding with the target dimensions
 */
export function adaptEmbeddingDimensions(sourceEmbedding: Float32Array, targetDimension: number): Float32Array {
    const sourceDimension = sourceEmbedding.length;

    // If dimensions already match, return the original
    if (sourceDimension === targetDimension) {
        return sourceEmbedding;
    }

    // Create a new embedding with target dimensions
    const adaptedEmbedding = new Float32Array(targetDimension);

    if (sourceDimension < targetDimension) {
        // If source is smaller, copy all values and pad with zeros
        adaptedEmbedding.set(sourceEmbedding);
        // Rest of the array is already initialized to zeros
    } else {
        // If source is larger, truncate to target dimension
        for (let i = 0; i < targetDimension; i++) {
            adaptedEmbedding[i] = sourceEmbedding[i];
        }
    }

    // Normalize the adapted embedding to maintain unit length
    let magnitude = 0;
    for (let i = 0; i < targetDimension; i++) {
        magnitude += adaptedEmbedding[i] * adaptedEmbedding[i];
    }

    magnitude = Math.sqrt(magnitude);
    if (magnitude > 0) {
        for (let i = 0; i < targetDimension; i++) {
            adaptedEmbedding[i] /= magnitude;
        }
    }

    return adaptedEmbedding;
}

/**
 * Converts embedding Float32Array to Buffer for storage in SQLite
 */
export function embeddingToBuffer(embedding: Float32Array): Buffer {
    return Buffer.from(embedding.buffer);
}

/**
 * Converts Buffer from SQLite back to Float32Array
 */
export function bufferToEmbedding(buffer: Buffer, dimension: number): Float32Array {
    return new Float32Array(buffer.buffer, buffer.byteOffset, dimension);
}
