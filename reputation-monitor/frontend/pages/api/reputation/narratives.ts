/**
 * /api/reputation/narratives — Unified Narratives endpoint.
 * Returns narrative clusters derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.narratives);
