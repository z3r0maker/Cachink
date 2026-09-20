// Mock-only: POST /__mock/reset — fixtures, codes and devices back to start.
// Inputs: MOCK_API.
const res = http.post(`${MOCK_API}/__mock/reset`, { body: '' });
output.mockReset = res.body;
