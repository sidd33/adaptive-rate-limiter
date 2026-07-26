import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '20s',
};

const endpoints = [
  '/api/login',    // fixed window
  '/api/upload',   // token bucket
  '/api/payments', // leaky bucket
  '/api/billing',  // sliding window log
];

export default function () {
  // each virtual user hits a random endpoint each iteration,
  // so all four algorithms get exercised concurrently
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`http://localhost:3000${endpoint}`, {
    tags: { endpoint }, // tag the request so k6 can break down stats per endpoint
  });

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.1);
}