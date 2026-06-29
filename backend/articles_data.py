"""Curated guide articles for Root to Route.
Each article has an image_url that visually matches the topic.
"""

CURATED_ARTICLES = [
    {
        "id": "planting-basics",
        "title": "Planting 101 — From Seed to Sprout",
        "summary": "Soil prep, sowing depth, spacing, and germination care for absolute beginners.",
        "category": "Planting",
        "image_url": "https://images.pexels.com/photos/7944396/pexels-photo-7944396.jpeg",
        "content": (
            "Good planting starts with good soil. Loosen the top 15-20 cm, remove rocks and weed roots, "
            "and mix in 2-3 cm of mature compost.\n\n"
            "**Sowing depth rule:** seed depth = 2 × seed diameter. Small lettuce seeds barely covered; "
            "bean seeds 2-3 cm deep.\n\n"
            "**Spacing:** crowded seedlings = weak roots. Thin to recommended spacing after the first true leaves.\n\n"
            "**Watering:** keep the seedbed evenly moist (never soggy) until germination. Mist with a fine spray.\n\n"
            "**First 14 days:** protect from harsh sun with shade cloth; transplant only after seedlings show 3-4 true leaves."
        ),
    },
    {
        "id": "homemade-fertilizer",
        "title": "Homemade Fertilizers — Foods High in NPK",
        "summary": "Kitchen-scrap recipes for Nitrogen, Phosphorus, and Potassium boosts.",
        "category": "Fertilizer",
        "image_url": "https://images.unsplash.com/photo-1492496913980-501348b61469",
        "content": (
            "**Nitrogen (N) sources:** coffee grounds, grass clippings, comfrey tea, urine (diluted 1:10), legume cover crops.\n\n"
            "**Phosphorus (P) sources:** bone meal, banana peels (chopped into compost), fish-bone broth, rock phosphate.\n\n"
            "**Potassium (K) sources:** wood ash (sparingly — raises pH), banana peel tea, kelp/seaweed extract, comfrey tea.\n\n"
            "**Banana-Peel Tea:** soak 3-4 chopped peels in 1 L water for 5 days. Dilute 1:5 and water around fruiting plants weekly.\n\n"
            "**Compost Tea:** 1 part mature compost to 5 parts water, steep 48h with daily stirring. Apply as a foliar spray at dawn."
        ),
    },
    {
        "id": "ph-balancing",
        "title": "pH Balancing — Foods & Amendments",
        "summary": "How to raise or lower soil pH using everyday materials.",
        "category": "Soil",
        "image_url": "https://images.pexels.com/photos/2113622/pexels-photo-2113622.jpeg",
        "content": (
            "**Soil too acidic (pH < 6):** add agricultural lime, wood ash (small amounts), crushed eggshells (slow), or dolomite.\n\n"
            "**Soil too alkaline (pH > 7.5):** add elemental sulphur, pine needles, peat moss, used coffee grounds, or composted oak leaves.\n\n"
            "**Foods to compost for neutral pH:** vegetable peels, coffee grounds (mildly acidic), eggshells (mildly alkaline) — balance the two.\n\n"
            "Always retest pH 4-6 weeks after amending — corrections are slow but durable."
        ),
    },
    {
        "id": "soil-moisture",
        "title": "How to Keep Your Soil Moist",
        "summary": "Mulching, drip irrigation, and water-wise techniques.",
        "category": "Irrigation",
        "image_url": "https://images.pexels.com/photos/12113255/pexels-photo-12113255.jpeg",
        "content": (
            "**Mulch is king.** A 5-7 cm layer of straw, dry leaves, or wood chips can cut evaporation by up to 70%.\n\n"
            "**Water early or late.** Morning watering reduces fungal risk; evening watering reduces evaporation in hot zones.\n\n"
            "**Drip irrigation** delivers water at the root zone — 30-50% less water than overhead sprinklers.\n\n"
            "**Sunken beds** (in arid regions) hold rain; **raised beds** (in wet regions) drain excess.\n\n"
            "**Cover crops** like clover act as a living mulch, shading the soil and trapping moisture."
        ),
    },
    {
        "id": "pests-and-disease",
        "title": "Combating Pests & Disease — Organic First",
        "summary": "Identify, prevent, and treat the most common garden problems.",
        "category": "Pest Control",
        "image_url": "https://images.pexels.com/photos/32567706/pexels-photo-32567706.jpeg",
        "content": (
            "**Prevention is 80% of the battle:** rotate crops, encourage biodiversity, water at the root (not leaves), space plants properly.\n\n"
            "**Aphids:** spray with diluted soap water (1 tsp / L) or release ladybirds.\n\n"
            "**Caterpillars:** hand-pick at dawn, use BT (Bacillus thuringiensis) as a last resort.\n\n"
            "**Fungal leaf spot:** prune affected leaves, spray diluted milk (1:9) or baking soda (5 g / L) weekly.\n\n"
            "**Slugs/snails:** beer traps, copper tape barriers, crushed eggshell rings.\n\n"
            "**Always inspect new plants before introducing them to your garden.**"
        ),
    },
    {
        "id": "leaf-disease",
        "title": "Reading Leaves — A Visual Disease Guide",
        "summary": "Yellowing, holes, spots — what each symptom tells you.",
        "category": "Pest Control",
        "image_url": "https://images.pexels.com/photos/2974409/pexels-photo-2974409.jpeg",
        "content": (
            "**Yellow leaves, green veins:** iron deficiency (chlorosis) — apply chelated iron or compost.\n\n"
            "**Uniform yellowing of old leaves:** nitrogen deficiency — side-dress with compost or fish emulsion.\n\n"
            "**Holes with ragged edges:** caterpillar or beetle feeding — inspect at dawn.\n\n"
            "**Brown spots with yellow halo:** bacterial leaf spot — prune, do not compost affected leaves.\n\n"
            "**Powdery white film:** powdery mildew — increase airflow, spray milk solution.\n\n"
            "**Curling leaves:** aphids, viruses, or heat stress — check the underside first."
        ),
    },
    {
        "id": "indigenous-farming",
        "title": "Indigenous Farming Wisdom",
        "summary": "Time-tested techniques: Three Sisters, agroforestry, terracing.",
        "category": "Heritage",
        "image_url": "https://images.pexels.com/photos/32065199/pexels-photo-32065199.jpeg",
        "content": (
            "**The Three Sisters (North America):** corn, beans, and squash grown together. Corn supports beans, beans fix nitrogen, squash shades the soil.\n\n"
            "**Agroforestry (West Africa):** intercropping millet/sorghum with Faidherbia trees that drop leaves in the wet season (free mulch + N).\n\n"
            "**Terracing (Andes, East Africa):** stops erosion on slopes, creates microclimates, increases arable land.\n\n"
            "**Zai pits (Sahel):** small planting pits filled with compost concentrate water and nutrients for each plant.\n\n"
            "**Seed saving:** every indigenous tradition selects the strongest plants for next year — try saving seeds from your best yields."
        ),
    },
    {
        "id": "crop-rotation",
        "title": "Crop Rotation — Why Last Year's Bed Matters",
        "summary": "A simple 4-bed rotation to keep soil healthy without inputs.",
        "category": "Soil",
        "image_url": "https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg",
        "content": (
            "Rotating crop families breaks pest cycles and rebalances nutrients.\n\n"
            "**Year 1 (Bed A):** Legumes (beans, peas) — fix nitrogen.\n"
            "**Year 2 (Bed A):** Leafy greens / brassicas — use that nitrogen.\n"
            "**Year 3 (Bed A):** Fruiting crops (tomato, peppers) — need balanced NPK.\n"
            "**Year 4 (Bed A):** Roots (carrots, potatoes) — light feeders.\n\n"
            "Move every crop one bed forward each season. After 4 years, you've reset every bed naturally."
        ),
    },
    {
        "id": "weather-adaptation",
        "title": "Reading the Weather Like a Farmer",
        "summary": "Frost dates, rain windows, and microclimates.",
        "category": "Weather",
        "image_url": "https://images.pexels.com/photos/258197/pexels-photo-258197.jpeg",
        "content": (
            "**Frost dates:** plant tender crops only after the last spring frost; harvest cold-sensitive crops before the first autumn frost.\n\n"
            "**Rain windows:** transplant 1-2 days before a forecast rain to reduce transplant shock.\n\n"
            "**Microclimates:** a south-facing wall traps heat; a hollow collects cold air. Use them wisely.\n\n"
            "**Heatwave prep:** mulch deeply, water at dusk, shade young plants with 30% shade cloth.\n\n"
            "**Drought signs:** wilting at midday but recovering at dusk = stress. Persistent wilting = water now."
        ),
    },
]
