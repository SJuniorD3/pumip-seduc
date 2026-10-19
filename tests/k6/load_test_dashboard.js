import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * PUMIP-SEDUC: Teste de Carga e Estresse de Performance (Etapa 8 / Achado N-12)
 * Avalia a latência das rotas e capacidade de resposta com usuários concorrentes.
 */

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up rápido para 20 VUs
    { duration: '30s', target: 50 },  // Sustentação em 50 VUs
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% das requisições devem responder em menos de 300ms
    http_req_failed: ['rate<0.01'],   // Menos de 1% de falhas
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Diagnóstico de Saúde da Aplicação
  const saudeRes = http.get(`${BASE_URL}/api/saude`);
  check(saudeRes, {
    'Status 200 na rota /api/saude': (r) => r.status === 200,
    'Resposta em menos de 200ms': (r) => r.timings.duration < 200,
  });

  // 2. Consulta à página principal do Dashboard
  const dashRes = http.get(`${BASE_URL}/`);
  check(dashRes, {
    'Status 200 ou 307 no Dashboard': (r) => r.status === 200 || r.status === 307,
  });

  sleep(1);
}
