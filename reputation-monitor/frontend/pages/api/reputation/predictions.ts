/**
 * /api/reputation/predictions — Unified Predictions endpoint.
 * Returns predictive intelligence derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.predictions);
