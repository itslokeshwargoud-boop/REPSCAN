"""
Per-tenant sample data generators for REPUTATION OS endpoints.

Each tenant has distinct data characteristics:
- vijayx  : Higher positive sentiment, strong supporter base, low bot activity
- prabhasx: More bot activity, negative narrative pressure, volatile sentiment
- default : Balanced/moderate profile suitable for demos
"""

from datetime import datetime, timezone, timedelta

SUPPORTED_TENANTS = {"vijayx", "prabhasx", "default"}


# ---------------------------------------------------------------------------
# Reputation score inputs  (positive, negative, neutral counts)
# ---------------------------------------------------------------------------

def get_reputation_inputs(tenant_id: str) -> dict:
    profiles = {
        "vijayx": {"positive": 4200, "negative": 380, "neutral": 1420},
        "prabhasx": {"positive": 1800, "negative": 1950, "neutral": 1250},
        "default": {"positive": 2800, "negative": 900, "neutral": 1300},
    }
    return profiles.get(tenant_id, profiles["default"])


# ---------------------------------------------------------------------------
# Narrative texts
# ---------------------------------------------------------------------------

def get_narrative_texts(tenant_id: str) -> list[str]:
    base = [
        "Great video, the editing is absolutely fantastic!",
        "Love the new content style, keep it up!",
        "This is the best tutorial I have seen this year",
        "Amazing quality, subscribed immediately",
        "The music choice was perfect for this video",
        "Terrible clickbait, content was nothing like the title",
        "Worst video ever, total waste of time",
        "This is clearly a scam, do not trust this channel",
        "Fake reviews and paid promotions everywhere",
        "The lighting could be improved but overall decent",
        "Not bad, but I expected more in-depth analysis",
        "Pretty average, nothing special",
        "How does this compare to the competitor product?",
        "What camera equipment is being used here?",
        "Love the production quality, very professional",
    ]
    extras = {
        "vijayx": [
            "Vijay's content quality keeps improving every week",
            "Best creator in the tech space hands down",
            "Incredible how consistent the uploads are",
            "The collaboration videos are amazing, wonderful chemistry",
            "Hands down the most helpful channel for beginners",
            "Excellent deep dive, learned so much from this",
            "Perfect explanation, I finally understand the topic",
            "Absolutely love the humour in the editing",
            "Subscribed and hit the bell, fantastic work!",
            "Recommending this to everyone I know, superb content",
        ],
        "prabhasx": [
            "The recent controversy really hurt this channel",
            "I used to like this content but quality has dropped",
            "Terrible take on the issue, lost my respect",
            "Clearly biased review, paid promotion disguised as opinion",
            "This channel spreads misinformation regularly",
            "The comment section feels full of bots lately",
            "Who is even watching this garbage anymore",
            "Another disappointing upload, worst channel on the platform",
            "The sponsors are ruining the content quality",
            "Unsubscribing after this awful video",
        ],
        "default": [
            "Solid content as always, good production value",
            "The topic selection could be more creative",
            "Some interesting points mixed with filler content",
            "Decent video but the pacing was a bit slow",
            "Looking forward to the next upload, nice work overall",
            "The analysis was thorough, appreciate the research",
            "Audio quality needs improvement in outdoor segments",
            "Good effort but competitors are doing it better",
            "Nice thumbnail and editing transitions",
            "Could use more real-world examples in tutorials",
        ],
    }
    return base + extras.get(tenant_id, extras["default"])


# ---------------------------------------------------------------------------
# Bot detection comments
# ---------------------------------------------------------------------------

def get_bot_comments(tenant_id: str) -> list[dict]:
    base_time = datetime(2025, 6, 15, 14, 0, 0, tzinfo=timezone.utc)
    legitimate = [
        {
            "text": "Really enjoyed this tutorial, thanks!",
            "author": "alice_fan",
            "timestamp": base_time,
            "author_age_days": 800,
            "followers": 320,
        },
        {
            "text": "Can you do a follow-up on this topic?",
            "author": "bob_viewer",
            "timestamp": base_time + timedelta(minutes=5),
            "author_age_days": 450,
            "followers": 150,
        },
        {
            "text": "Bookmarked for later, great resource",
            "author": "carol_dev",
            "timestamp": base_time + timedelta(minutes=12),
            "author_age_days": 1200,
            "followers": 980,
        },
        {
            "text": "The production quality keeps getting better",
            "author": "long_time_sub",
            "timestamp": base_time + timedelta(hours=1),
            "author_age_days": 2000,
            "followers": 500,
        },
    ]

    bots_light = [
        {
            "text": "Check out my channel for free gift cards!!!",
            "author": "promo_bot_1",
            "timestamp": base_time + timedelta(seconds=10),
            "author_age_days": 2,
            "followers": 0,
        },
        {
            "text": "Check out my channel for free gift cards!!!",
            "author": "promo_bot_2",
            "timestamp": base_time + timedelta(seconds=15),
            "author_age_days": 3,
            "followers": 1,
        },
    ]

    bots_heavy = bots_light + [
        {
            "text": "Check out my channel for free gift cards!!!",
            "author": "promo_bot_3",
            "timestamp": base_time + timedelta(seconds=20),
            "author_age_days": 1,
            "followers": 0,
        },
        {
            "text": "Amazing video subscribe to my channel!!!",
            "author": "spam_king",
            "timestamp": base_time + timedelta(seconds=2),
            "author_age_days": 4,
            "followers": 2,
        },
        {
            "text": "Amazing video subscribe to my channel!!!",
            "author": "spam_queen",
            "timestamp": base_time + timedelta(seconds=5),
            "author_age_days": 1,
            "followers": 0,
        },
        {
            "text": "This is terrible content unsubscribe now",
            "author": "hater_bot_a",
            "timestamp": base_time + timedelta(seconds=30),
            "author_age_days": 7,
            "followers": 3,
        },
        {
            "text": "This is terrible content unsubscribe now",
            "author": "hater_bot_b",
            "timestamp": base_time + timedelta(seconds=32),
            "author_age_days": 5,
            "followers": 1,
        },
        {
            "text": "Worst channel ever do not watch",
            "author": "negative_burst",
            "timestamp": base_time + timedelta(seconds=1),
            "author_age_days": 3,
            "followers": 0,
        },
        {
            "text": "Absolute garbage content",
            "author": "negative_burst",
            "timestamp": base_time + timedelta(seconds=25),
            "author_age_days": 3,
            "followers": 0,
        },
        {
            "text": "Nobody should follow this channel",
            "author": "negative_burst",
            "timestamp": base_time + timedelta(seconds=50),
            "author_age_days": 3,
            "followers": 0,
        },
    ]

    profiles = {
        "vijayx": legitimate + bots_light,
        "prabhasx": legitimate + bots_heavy,
        "default": legitimate + bots_light + [
            {
                "text": "This product is amazing I bought three!",
                "author": "shill_account",
                "timestamp": base_time + timedelta(minutes=1),
                "author_age_days": 10,
                "followers": 5,
            },
        ],
    }
    return profiles.get(tenant_id, profiles["default"])


# ---------------------------------------------------------------------------
# Sentiment velocity data points
# ---------------------------------------------------------------------------

def get_velocity_data(tenant_id: str) -> list[tuple]:
    base = datetime(2025, 6, 15, 8, 0, 0, tzinfo=timezone.utc)
    score_profiles = {
        "vijayx": [
            72, 74, 71, 73, 75, 76, 78, 77, 80, 79,
            81, 82, 80, 83, 82, 84, 83, 85, 84, 86,
            85, 87, 86, 88, 87,
        ],
        "prabhasx": [
            68, 65, 60, 55, 48, 42, 35, 28, 22, 18,
            15, 20, 22, 25, 28, 30, 32, 35, 33, 31,
            29, 27, 30, 28, 26,
        ],
        "default": [
            72, 74, 71, 73, 75, 65, 50, 38, 30, 25,
            28, 32, 35, 40, 44, 48, 52, 55, 58, 60,
            61, 62, 60, 63, 62,
        ],
    }
    scores = score_profiles.get(tenant_id, score_profiles["default"])
    return [(base + timedelta(hours=i), s) for i, s in enumerate(scores)]


# ---------------------------------------------------------------------------
# Prediction history
# ---------------------------------------------------------------------------

def get_prediction_history(tenant_id: str) -> list[dict]:
    base = datetime(2025, 6, 14, 0, 0, 0, tzinfo=timezone.utc)
    score_profiles = {
        "vijayx": [
            70, 72, 71, 73, 74, 76, 75, 77, 78, 80,
            79, 81, 82, 80, 83, 82, 84, 83, 85, 84,
            86, 85, 87, 88,
        ],
        "prabhasx": [
            55, 52, 48, 45, 42, 38, 35, 32, 30, 28,
            25, 23, 25, 27, 30, 28, 26, 24, 22, 25,
            23, 20, 22, 24,
        ],
        "default": [
            65, 66, 64, 63, 60, 58, 55, 50, 45, 42,
            40, 38, 40, 43, 46, 50, 53, 55, 57, 58,
            60, 61, 59, 62,
        ],
    }
    scores = score_profiles.get(tenant_id, score_profiles["default"])
    return [
        {"timestamp": base + timedelta(hours=i), "score": s}
        for i, s in enumerate(scores)
    ]


# ---------------------------------------------------------------------------
# Influencer user data
# ---------------------------------------------------------------------------

def get_influencer_users(tenant_id: str) -> list[dict]:
    profiles = {
        "vijayx": [
            {"username": "tech_guru_sam", "posts": 55, "sentiment_avg": 0.82, "reach": 320000, "engagement": 9.5},
            {"username": "review_queen", "posts": 40, "sentiment_avg": 0.75, "reach": 180000, "engagement": 8.0},
            {"username": "fan_club_vj", "posts": 90, "sentiment_avg": 0.90, "reach": 15000, "engagement": 18.0},
            {"username": "daily_vlogs", "posts": 30, "sentiment_avg": 0.45, "reach": 95000, "engagement": 5.5},
            {"username": "honest_critic", "posts": 20, "sentiment_avg": -0.35, "reach": 120000, "engagement": 6.0},
            {"username": "news_today", "posts": 12, "sentiment_avg": 0.10, "reach": 450000, "engagement": 3.5},
            {"username": "casual_watcher", "posts": 8, "sentiment_avg": 0.20, "reach": 800, "engagement": 1.2},
            {"username": "brand_partner", "posts": 25, "sentiment_avg": 0.65, "reach": 200000, "engagement": 7.0},
        ],
        "prabhasx": [
            {"username": "drama_channel", "posts": 35, "sentiment_avg": -0.78, "reach": 280000, "engagement": 11.0},
            {"username": "expose_truth", "posts": 28, "sentiment_avg": -0.85, "reach": 150000, "engagement": 9.0},
            {"username": "angry_mob_lead", "posts": 45, "sentiment_avg": -0.70, "reach": 95000, "engagement": 14.0},
            {"username": "loyal_defender", "posts": 60, "sentiment_avg": 0.80, "reach": 8000, "engagement": 16.0},
            {"username": "balanced_view", "posts": 15, "sentiment_avg": 0.05, "reach": 200000, "engagement": 4.5},
            {"username": "media_outlet", "posts": 10, "sentiment_avg": -0.15, "reach": 500000, "engagement": 3.0},
            {"username": "silent_majority", "posts": 5, "sentiment_avg": 0.10, "reach": 1200, "engagement": 0.8},
            {"username": "former_fan", "posts": 22, "sentiment_avg": -0.55, "reach": 65000, "engagement": 7.5},
        ],
        "default": [
            {"username": "mega_reviewer", "posts": 45, "sentiment_avg": 0.72, "reach": 250000, "engagement": 8.5},
            {"username": "tech_critic", "posts": 30, "sentiment_avg": -0.65, "reach": 180000, "engagement": 7.2},
            {"username": "casual_viewer", "posts": 5, "sentiment_avg": 0.10, "reach": 500, "engagement": 1.0},
            {"username": "brand_ambassador", "posts": 60, "sentiment_avg": 0.88, "reach": 120000, "engagement": 12.0},
            {"username": "angry_blogger", "posts": 25, "sentiment_avg": -0.80, "reach": 95000, "engagement": 6.0},
            {"username": "news_outlet", "posts": 15, "sentiment_avg": -0.05, "reach": 500000, "engagement": 4.0},
            {"username": "micro_fan", "posts": 80, "sentiment_avg": 0.55, "reach": 3000, "engagement": 15.0},
            {"username": "industry_analyst", "posts": 10, "sentiment_avg": 0.30, "reach": 75000, "engagement": 5.5},
        ],
    }
    return profiles.get(tenant_id, profiles["default"])


# ---------------------------------------------------------------------------
# Moodmap comments + video duration
# ---------------------------------------------------------------------------

def get_moodmap_data(tenant_id: str) -> tuple[list[dict], int]:
    video_duration = 600  # 10-minute video

    profiles = {
        "vijayx": [
            {"timestamp_seconds": 5, "text": "Love the new intro, amazing!"},
            {"timestamp_seconds": 15, "text": "Best intro ever, fantastic editing"},
            {"timestamp_seconds": 30, "text": "Great start, really impressive quality"},
            {"timestamp_seconds": 50, "text": "The music is perfect here"},
            {"timestamp_seconds": 80, "text": "Interesting topic, good explanation"},
            {"timestamp_seconds": 120, "text": "This is really helpful, excellent content"},
            {"timestamp_seconds": 160, "text": "Nice breakdown, very clear"},
            {"timestamp_seconds": 200, "text": "Wonderful examples used here"},
            {"timestamp_seconds": 240, "text": "Great point, never thought of it that way"},
            {"timestamp_seconds": 280, "text": "This section is brilliant, superb"},
            {"timestamp_seconds": 310, "text": "Solid analysis, impressive research"},
            {"timestamp_seconds": 350, "text": "The editing transitions are so smooth"},
            {"timestamp_seconds": 390, "text": "Love this segment, fantastic work"},
            {"timestamp_seconds": 420, "text": "Beautiful visuals and great pacing"},
            {"timestamp_seconds": 460, "text": "Getting better and better"},
            {"timestamp_seconds": 500, "text": "Great conclusion, love it!"},
            {"timestamp_seconds": 530, "text": "Excellent summary, very impressive"},
            {"timestamp_seconds": 550, "text": "Amazing ending, best video yet"},
            {"timestamp_seconds": 570, "text": "Brilliant work, superb quality"},
            {"timestamp_seconds": 590, "text": "Perfect ending, subscribed immediately!"},
        ],
        "prabhasx": [
            {"timestamp_seconds": 5, "text": "Let's see if this is any good"},
            {"timestamp_seconds": 20, "text": "Clickbait title as usual, disappointing"},
            {"timestamp_seconds": 50, "text": "The intro is way too long and boring"},
            {"timestamp_seconds": 90, "text": "Getting to the point would be nice"},
            {"timestamp_seconds": 130, "text": "This take is terrible and wrong"},
            {"timestamp_seconds": 170, "text": "Worst argument I have ever heard"},
            {"timestamp_seconds": 200, "text": "Disgusting misinformation here"},
            {"timestamp_seconds": 230, "text": "This is garbage, completely fake"},
            {"timestamp_seconds": 260, "text": "Awful take, disappointing content"},
            {"timestamp_seconds": 290, "text": "Hate this section, pathetic effort"},
            {"timestamp_seconds": 320, "text": "Lost all respect after this part"},
            {"timestamp_seconds": 350, "text": "Who even believes this trash"},
            {"timestamp_seconds": 380, "text": "Okay this part is slightly better"},
            {"timestamp_seconds": 420, "text": "Still not great but improving"},
            {"timestamp_seconds": 460, "text": "The ending actually had some good points"},
            {"timestamp_seconds": 500, "text": "Decent conclusion at least"},
            {"timestamp_seconds": 540, "text": "Should have started with this quality"},
            {"timestamp_seconds": 580, "text": "Too little too late, unsubscribing"},
        ],
        "default": [
            {"timestamp_seconds": 5, "text": "Love the new intro, amazing!"},
            {"timestamp_seconds": 12, "text": "Best intro ever, fantastic editing"},
            {"timestamp_seconds": 30, "text": "Great start, really impressive"},
            {"timestamp_seconds": 45, "text": "The music is perfect here"},
            {"timestamp_seconds": 70, "text": "Interesting point, good explanation"},
            {"timestamp_seconds": 100, "text": "This is pretty helpful content"},
            {"timestamp_seconds": 130, "text": "Nice breakdown of the topic"},
            {"timestamp_seconds": 160, "text": "Not bad, decent analysis"},
            {"timestamp_seconds": 200, "text": "This take is terrible and wrong"},
            {"timestamp_seconds": 220, "text": "Worst argument I have ever heard"},
            {"timestamp_seconds": 250, "text": "Disgusting misinformation here"},
            {"timestamp_seconds": 270, "text": "This is garbage, completely fake"},
            {"timestamp_seconds": 290, "text": "Awful take, disappointing"},
            {"timestamp_seconds": 310, "text": "Hate this section, pathetic"},
            {"timestamp_seconds": 340, "text": "Lost all respect after this part"},
            {"timestamp_seconds": 370, "text": "Okay this part is a bit better"},
            {"timestamp_seconds": 400, "text": "Getting back on track now"},
            {"timestamp_seconds": 430, "text": "This example was actually nice"},
            {"timestamp_seconds": 460, "text": "Good recovery, helpful tip"},
            {"timestamp_seconds": 500, "text": "Great conclusion, love it!"},
            {"timestamp_seconds": 530, "text": "Excellent summary, very impressive"},
            {"timestamp_seconds": 550, "text": "Amazing ending, best part of the video"},
            {"timestamp_seconds": 570, "text": "Brilliant work, superb quality"},
            {"timestamp_seconds": 590, "text": "Perfect ending, subscribed!"},
        ],
    }
    return profiles.get(tenant_id, profiles["default"]), video_duration


# ---------------------------------------------------------------------------
# Campaign before / after metrics
# ---------------------------------------------------------------------------

def get_campaign_data(tenant_id: str) -> tuple[dict, dict, str]:
    profiles = {
        "vijayx": (
            {
                "sentiment_score": 68.0,
                "positive_mentions": 3200,
                "negative_mentions": 450,
                "engagement_rate": 6.5,
                "follower_growth": 800,
                "bot_percentage": 8.0,
                "share_of_voice": 28.0,
                "reach": 180000,
            },
            {
                "sentiment_score": 82.0,
                "positive_mentions": 4800,
                "negative_mentions": 280,
                "engagement_rate": 9.2,
                "follower_growth": 1500,
                "bot_percentage": 5.0,
                "share_of_voice": 35.0,
                "reach": 260000,
            },
            "Brand Amplification Q2",
        ),
        "prabhasx": (
            {
                "sentiment_score": 35.0,
                "positive_mentions": 1200,
                "negative_mentions": 1800,
                "engagement_rate": 4.0,
                "follower_growth": 200,
                "bot_percentage": 28.0,
                "share_of_voice": 15.0,
                "reach": 90000,
            },
            {
                "sentiment_score": 42.0,
                "positive_mentions": 1600,
                "negative_mentions": 1500,
                "engagement_rate": 4.8,
                "follower_growth": 350,
                "bot_percentage": 22.0,
                "share_of_voice": 18.0,
                "reach": 105000,
            },
            "Crisis Recovery Campaign",
        ),
        "default": (
            {
                "sentiment_score": 42.0,
                "positive_mentions": 120,
                "negative_mentions": 85,
                "engagement_rate": 3.2,
                "follower_growth": 150,
                "bot_percentage": 22.0,
                "share_of_voice": 18.5,
                "reach": 50000,
            },
            {
                "sentiment_score": 61.0,
                "positive_mentions": 210,
                "negative_mentions": 55,
                "engagement_rate": 5.1,
                "follower_growth": 380,
                "bot_percentage": 12.0,
                "share_of_voice": 24.0,
                "reach": 82000,
            },
            "Summer Reputation Recovery",
        ),
    }
    return profiles.get(tenant_id, profiles["default"])
