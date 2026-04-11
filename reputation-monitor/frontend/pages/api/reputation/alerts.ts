/**
 * /api/reputation/alerts — Unified Alerts endpoint.
 * Returns alerts derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.alerts);
