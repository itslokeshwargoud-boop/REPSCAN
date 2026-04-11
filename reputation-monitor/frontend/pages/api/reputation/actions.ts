/**
 * /api/reputation/actions — Unified Actions endpoint.
 * Returns recommended actions derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.actions);
