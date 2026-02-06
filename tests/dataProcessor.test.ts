import { describe, it, expect } from 'vitest';
import { categorizeGrupoGerador } from '../utils/dataProcessor';

describe('categorizeGrupoGerador - basic cases', () => {
  const cases: Array<{ nome: string; patr?: string; expected: string | null }> = [
    {
      nome: 'GRUPO GERADOR CUMMINS C400D6-4 - 500 KVA',
      expected: 'Grupo Gerador 500KVA',
    },
    { nome: 'GRUPO GERADOR GSW500S GENERAC - 500KVA', expected: 'Grupo Gerador 500KVA' },
    { nome: 'STEMAC 500/455 KVA', expected: 'Grupo Gerador 500KVA' },
    { nome: 'BRANCO DIESEL 19 KVA', expected: 'Grupo Gerador 19KVA' },
    { nome: 'PRAMAC 22 KVA', expected: 'Grupo Gerador 22KVA' },
    { nome: 'BRANCO DIESEL 33 KVA', expected: 'Grupo Gerador 33KVA' },
    { nome: 'ATLAS COPCO QAS 55', expected: 'Grupo Gerador 55KVA' },
    { nome: 'CUMMINS 80 KVA', expected: 'Grupo Gerador 81KVA' },
    { nome: 'PRAMAC 127 KVA', expected: 'Grupo Gerador 120KVA' },
    { nome: 'STEMAC 150/141', expected: 'Grupo Gerador 150KVA' },
    { nome: 'CUMMINS 170', expected: 'Grupo Gerador 170KVA' },
    { nome: 'CUMMINS 260 KVA', expected: 'Grupo Gerador 260KVA' },
    { nome: 'STEMAC 360/325', expected: 'Grupo Gerador 360KVA' },
  ];

  cases.forEach(({ nome, patr, expected }) => {
    it(`detects "${expected}" for "${nome}"`, () => {
      expect(categorizeGrupoGerador(nome, patr)).toBe(expected);
    });
  });
});
