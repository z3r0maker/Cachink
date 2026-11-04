// Mock-only: POST /__mock/<ACTION> — ACTION is "down" (the server vanishes:
// every contract route drops the socket, the phone sees NETWORK, exactly as
// airplane mode) or "up" (it is back). The controls themselves keep answering
// while down, which is how a flow brings the server back.
// Inputs: MOCK_API, ACTION.
// Maestro's http.post refuses a bodiless POST; the control takes `{}`.
const res = http.post(`${MOCK_API}/__mock/${ACTION}`, {
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});
output.mockDown = res.body;
