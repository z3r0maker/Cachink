// Mock-only: POST /__mock/<ACTION> { table, id } — ACTION is "forget" (the
// server loses the row, as if purged in the portal) or "restore".
// Inputs: MOCK_API, ACTION, TABLE, ROW_ID.
const res = http.post(`${MOCK_API}/__mock/${ACTION}`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table: TABLE, id: ROW_ID }),
});
output.mockRow = res.body;
