import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 100 },  // spike to 100 concurrent users almost instantly
    { duration: '10s', target: 100 }, // hold at 100 for 10s
    { duration: '5s', target: 0 },    // ramp back down
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/upload'); // token bucket, allows bursts

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time OK': (r) => r.timings.duration < 100, // flag anything unusually slow
  });
}