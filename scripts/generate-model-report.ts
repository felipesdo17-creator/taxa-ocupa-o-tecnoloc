import fs from 'fs';
import path from 'path';
import { identifyModel, normalizeStatus } from '../utils/dataProcessor';

function parseCSV(content: string) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(/,|;|\t/).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(/,|;|\t/);
    const obj: any = {};
    headers.forEach((h, i) => (obj[h] = (cols[i] || '').trim()));
    return obj;
  });
  return rows;
}

function loadData(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf8');
  if (ext === '.json') return JSON.parse(content);
  if (ext === '.csv' || ext === '.txt') return parseCSV(content);
  throw new Error('Unsupported file type. Use .csv or .json');
}

function pickField(row: any, candidates: string[]) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const key = keys.find(k => k.toLowerCase().includes(c));
    if (key) return row[key];
  }
  return '';
}

function main() {
  const fp = process.argv[2];
  if (!fp) {
    console.error('Usage: npx ts-node scripts/generate-model-report.ts <data.csv|data.json>');
    process.exit(1);
  }

  const rows = loadData(fp);
  const report: Record<string, number> = {};
  const details: Array<{ patrimonio: string; nome: string; status: string; modelo: string }> = [];

  for (const r of rows) {
    const pat = (pickField(r, ['patrimonio', 'pat.','pat']) || '').toString();
    const nome = (pickField(r, ['nome', 'nome do bem', 'nome_bem', 'bem']) || '').toString();
    const statusRaw = (pickField(r, ['status', 'status bem']) || '').toString();

    const modelo = identifyModel(nome, pat);
    const status = normalizeStatus(statusRaw as any);

    report[modelo] = (report[modelo] || 0) + 1;
    details.push({ patrimonio: pat, nome, status: String(status), modelo });
  }

  console.log('=== Resumo por modelo ===');
  Object.keys(report).sort().forEach(m => console.log(m.padEnd(30), report[m]));

  console.log('\n=== Detalhes (primeiras 200) ===');
  details.slice(0, 200).forEach(d => console.log(d.patrimonio.padEnd(12), d.modelo.padEnd(30), d.status.padEnd(15), '-', d.nome));

  const count500 = report['Grupo Gerador 500KVA'] || 0;
  console.log(`\nTotal detectados como Grupo Gerador 500KVA: ${count500}`);
}

main();
