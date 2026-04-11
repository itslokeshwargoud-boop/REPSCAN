/**
 * /api/reputation/campaigns — Unified Campaigns endpoint.
 * Returns campaign impact analysis derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.campaigns);
