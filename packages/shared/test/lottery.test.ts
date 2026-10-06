import { describe, it, expect } from 'vitest';
import {
  createMulberry32,
  deterministicShuffle,
  executeDeterministicLottery,
  hashSeedToUint32,
  LotteryParticipant,
} from '../src/lottery';

describe('Sorteo Determinístico (@billar/shared)', () => {
  it('debe producir exactamente la misma secuencia con la misma semilla', () => {
    const seed = 'billar-torneo-semilla-2026';
    const numSeed = hashSeedToUint32(seed);

    const prng1 = createMulberry32(numSeed);
    const prng2 = createMulberry32(numSeed);

    const seq1 = [prng1(), prng1(), prng1(), prng1()];
    const seq2 = [prng2(), prng2(), prng2(), prng2()];

    expect(seq1).toEqual(seq2);
  });

  it('debe barajar los participantes de forma determinística', () => {
    const participants: LotteryParticipant[] = [
      { id: '1', name: 'Dick Jaspers' },
      { id: '2', name: 'Torbjörn Blomdahl' },
      { id: '3', name: 'Dani Sánchez' },
      { id: '4', name: 'Frédéric Caudron' },
      { id: '5', name: 'Marco Zanetti' },
      { id: '6', name: 'Eddy Merckx' },
    ];

    const seed = 'semilla-fija-12345';
    const result1 = executeDeterministicLottery(participants, { seed, groupSize: 3 });
    const result2 = executeDeterministicLottery(participants, { seed, groupSize: 3 });

    expect(result1.groups.length).toBe(2);
    expect(result1.groups[0].participants.map((p) => p.name)).toEqual(
      result2.groups[0].participants.map((p) => p.name),
    );
    expect(result1.groups[1].participants.map((p) => p.name)).toEqual(
      result2.groups[1].participants.map((p) => p.name),
    );
  });

  it('debe producir orden diferente con una semilla distinta', () => {
    const participants: LotteryParticipant[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Jugador ${i + 1}`,
    }));

    const resultA = executeDeterministicLottery(participants, { seed: 'semilla-A', groupSize: 3 });
    const resultB = executeDeterministicLottery(participants, { seed: 'semilla-B', groupSize: 3 });

    const orderA = resultA.groups.flatMap((g) => g.participants.map((p) => p.id));
    const orderB = resultB.groups.flatMap((g) => g.participants.map((p) => p.id));

    expect(orderA).not.toEqual(orderB);
  });
});
