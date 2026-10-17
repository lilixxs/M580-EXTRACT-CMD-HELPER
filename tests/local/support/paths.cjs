const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const runId = process.env.LOCAL_CHECK_RUN_ID || 'manual';
const lane = process.env.LOCAL_CHECK_LANE || 'manual';
if (![runId, lane].every(value => /^[a-zA-Z0-9_-]+$/.test(value))) {
  throw new Error('ENV_BLOCKED: invalid run ID or lane');
}
const laneDir = path.join(root, 'artifacts', 'local-check', runId, lane);
module.exports = { root, runId, lane, laneDir };
