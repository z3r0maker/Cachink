// Mock-only: POST /__mock/scenario — default scenario for requests without
// X-Mock-Scenario, plus an optional record-limit override.
// Inputs: MOCK_API, SCENARIO, RECORDS_PER_MONTH ("" = plan default).
const body = { scenario: SCENARIO };
if (typeof RECORDS_PER_MONTH !== 'undefined' && RECORDS_PER_MONTH !== '') {
  body.recordsPerMonth = Number(RECORDS_PER_MONTH);
}
const res = http.post(`${MOCK_API}/__mock/scenario`, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
output.mockScenario = res.body;
