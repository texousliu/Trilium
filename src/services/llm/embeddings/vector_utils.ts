/**
 * Computes the cosine similarity between two vectors
 * If dimensions don't match, automatically adapts the first vector to match the second
 */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
    // If dimensions don't match, adapt 'a' to match 'b'
    if (a.length !== b.length) {
        a = adaptEmbeddingDimensions(a, b.length);
    }

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
