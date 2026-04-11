/**
 * /api/reputation/influencers — Unified Influencers endpoint.
 * Returns influencer rankings derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.influencers);
