/**
 * /api/reputation/overview — Unified Overview endpoint.
 * Returns aggregated reputation score derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.score);
