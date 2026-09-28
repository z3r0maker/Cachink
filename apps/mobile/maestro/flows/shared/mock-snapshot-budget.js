// Mock-only: POST /__mock/snapshot-budget — a smaller snapshot page so the
// fixture business downloads in several pages (C-23, DS-10); ROWS "" restores
// the contract's budget.
// Inputs: MOCK_API, ROWS.
const body = ROWS === '' ? {} : { rows: Number(ROWS) };
const res = http.post(`${MOCK_API}/__mock/snapshot-budget`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
output.mockSnapshotBudget = res.body;
