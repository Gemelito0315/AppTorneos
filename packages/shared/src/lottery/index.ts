/**
 * Motor del sorteo verificable y determinístico.
 * Este módulo se puede ejecutar de forma idéntica tanto en el backend (Node.js)
 * como en el frontend (navegador) para verificación criptográfica y transparencia.
 */

/**
 * Generador pseudoaleatorio determinístico mulberry32 a partir de una semilla numérica de 32 bits.
 */
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function (): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Convierte una semilla de texto (hex, frase o hash) a un entero de 32 bits.
 */
export function hashSeedToUint32(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    const char = seedStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0;
}

/**
 * Baraja determinística de Fisher-Yates utilizando una función PRNG.
 * No muta el arreglo original.
 */
export function deterministicShuffle<T>(items: readonly T[], randomFn: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

export interface LotteryConfig {
  seed: string;
  groupSize: number;
}

export interface LotteryParticipant {
  id: string;
  name: string;
  clubOrCity?: string;
  seedRank?: number;
}

export interface LotteryGroup {
  groupNumber: number;
  participants: LotteryParticipant[];
}

export interface LotteryResult {
  seed: string;
  totalParticipants: number;
  groups: LotteryGroup[];
  executedAt: string;
}

/**
 * Algoritmo base de sorteo de grupos determinístico (placeholder para Fase 1).
 */
export function executeDeterministicLottery(
  participants: readonly LotteryParticipant[],
  config: LotteryConfig,
): LotteryResult {
  if (participants.length === 0) {
    return {
      seed: config.seed,
      totalParticipants: 0,
      groups: [],
      executedAt: new Date().toISOString(),
    };
  }

  const numericSeed = hashSeedToUint32(config.seed);
  const prng = createMulberry32(numericSeed);
  const shuffled = deterministicShuffle(participants, prng);

  const groupSize = Math.max(2, config.groupSize || 3);
  const groups: LotteryGroup[] = [];

  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push({
      groupNumber: groups.length + 1,
      participants: shuffled.slice(i, i + groupSize),
    });
  }

  return {
    seed: config.seed,
    totalParticipants: participants.length,
    groups,
    executedAt: new Date().toISOString(),
  };
}
