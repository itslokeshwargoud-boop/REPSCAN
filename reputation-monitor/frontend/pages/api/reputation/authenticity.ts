/**
 * /api/reputation/authenticity — Unified Authenticity endpoint.
 * Returns engagement authenticity analysis derived from real Talk + Feed data.
 */

import { createReputationHandler } from "@/lib/reputationApiHandler";

export default createReputationHandler((p) => p.authenticity);
