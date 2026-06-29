"""Crop NPK + climate reference data used for recommendations.
Compiled from common agronomy references (similar to the Kaggle crop NPK dataset).
Each entry lists the IDEAL ranges for that crop. Confidence is computed by
how close the user's soil reading is to the crop's ideal centroid.
"""

# Each row: name, N(ppm), P(ppm), K(ppm), ph, temp_c, humidity, rainfall_mm,
#           soil_types (list), season (Spring/Summer/Fall/Winter), growth_days
CROPS = [
    {"name": "Rice",        "N": 80,  "P": 47,  "K": 39,  "ph": 6.4, "temp": 23, "humidity": 82, "rainfall": 236, "soils": ["clay", "loam"],         "season": "Summer", "days": 120},
    {"name": "Maize",       "N": 78,  "P": 48,  "K": 20,  "ph": 6.5, "temp": 22, "humidity": 65, "rainfall":  85, "soils": ["loam", "sandy"],        "season": "Spring", "days":  95},
    {"name": "Wheat",       "N": 50,  "P": 53,  "K": 39,  "ph": 6.4, "temp": 18, "humidity": 50, "rainfall":  60, "soils": ["loam", "clay"],         "season": "Winter", "days": 130},
    {"name": "Chickpea",    "N": 40,  "P": 67,  "K": 80,  "ph": 7.3, "temp": 19, "humidity": 16, "rainfall":  80, "soils": ["sandy", "loam"],        "season": "Winter", "days":  95},
    {"name": "Kidney Bean", "N": 21,  "P": 67,  "K": 20,  "ph": 5.7, "temp": 20, "humidity": 22, "rainfall": 105, "soils": ["loam"],                 "season": "Spring", "days":  90},
    {"name": "Pigeon Pea",  "N": 21,  "P": 67,  "K": 20,  "ph": 5.8, "temp": 27, "humidity": 50, "rainfall": 150, "soils": ["loam", "sandy"],        "season": "Summer", "days": 160},
    {"name": "Lentil",      "N": 18,  "P": 68,  "K": 20,  "ph": 6.9, "temp": 24, "humidity": 64, "rainfall":  45, "soils": ["loam", "sandy"],        "season": "Winter", "days": 100},
    {"name": "Banana",      "N": 100, "P": 82,  "K": 50,  "ph": 6.0, "temp": 27, "humidity": 80, "rainfall": 105, "soils": ["loam", "silt"],         "season": "Summer", "days": 300},
    {"name": "Mango",       "N": 20,  "P": 27,  "K": 30,  "ph": 5.8, "temp": 31, "humidity": 50, "rainfall":  95, "soils": ["loam", "sandy"],        "season": "Summer", "days": 365},
    {"name": "Grapes",      "N": 23,  "P":132,  "K":200,  "ph": 6.2, "temp": 23, "humidity": 81, "rainfall":  69, "soils": ["loam", "sandy"],        "season": "Spring", "days": 165},
    {"name": "Watermelon",  "N": 99,  "P": 17,  "K": 50,  "ph": 6.5, "temp": 25, "humidity": 85, "rainfall":  50, "soils": ["sandy", "loam"],        "season": "Summer", "days":  85},
    {"name": "Apple",       "N": 21,  "P":134,  "K":200,  "ph": 5.9, "temp": 22, "humidity": 92, "rainfall": 113, "soils": ["loam"],                 "season": "Fall",   "days": 180},
    {"name": "Orange",      "N": 19,  "P": 16,  "K": 10,  "ph": 7.0, "temp": 22, "humidity": 92, "rainfall": 110, "soils": ["loam", "sandy"],        "season": "Winter", "days": 240},
    {"name": "Papaya",      "N": 49,  "P": 59,  "K": 50,  "ph": 6.7, "temp": 33, "humidity": 92, "rainfall": 142, "soils": ["loam"],                 "season": "Summer", "days": 270},
    {"name": "Coconut",     "N": 22,  "P": 17,  "K": 30,  "ph": 5.9, "temp": 27, "humidity": 95, "rainfall": 175, "soils": ["sandy", "loam"],        "season": "Summer", "days": 365},
    {"name": "Cotton",      "N":117,  "P": 46,  "K": 19,  "ph": 6.9, "temp": 23, "humidity": 80, "rainfall":  80, "soils": ["loam", "clay"],         "season": "Summer", "days": 180},
    {"name": "Jute",        "N": 78,  "P": 46,  "K": 39,  "ph": 6.7, "temp": 24, "humidity": 79, "rainfall": 175, "soils": ["loam", "silt"],         "season": "Summer", "days": 120},
    {"name": "Coffee",      "N":101,  "P": 28,  "K": 29,  "ph": 6.8, "temp": 25, "humidity": 58, "rainfall": 158, "soils": ["loam"],                 "season": "Fall",   "days": 365},
    {"name": "Tomato",      "N": 75,  "P": 60,  "K": 80,  "ph": 6.4, "temp": 22, "humidity": 65, "rainfall":  70, "soils": ["loam", "sandy"],        "season": "Spring", "days":  80},
    {"name": "Potato",      "N": 90,  "P": 60,  "K":100,  "ph": 5.8, "temp": 17, "humidity": 65, "rainfall":  60, "soils": ["loam", "sandy"],        "season": "Spring", "days": 100},
    {"name": "Onion",       "N": 65,  "P": 45,  "K": 60,  "ph": 6.4, "temp": 18, "humidity": 60, "rainfall":  55, "soils": ["loam", "sandy"],        "season": "Spring", "days": 120},
    {"name": "Carrot",      "N": 50,  "P": 40,  "K": 70,  "ph": 6.3, "temp": 18, "humidity": 65, "rainfall":  60, "soils": ["sandy", "loam"],        "season": "Fall",   "days":  75},
    {"name": "Lettuce",     "N": 55,  "P": 35,  "K": 55,  "ph": 6.5, "temp": 16, "humidity": 70, "rainfall":  55, "soils": ["loam"],                 "season": "Spring", "days":  55},
    {"name": "Cabbage",     "N": 60,  "P": 40,  "K": 65,  "ph": 6.6, "temp": 17, "humidity": 70, "rainfall":  60, "soils": ["loam"],                 "season": "Fall",   "days":  90},
    {"name": "Spinach",     "N": 70,  "P": 35,  "K": 50,  "ph": 6.6, "temp": 16, "humidity": 65, "rainfall":  60, "soils": ["loam"],                 "season": "Fall",   "days":  45},
    {"name": "Sugarcane",   "N":110,  "P": 60,  "K":110,  "ph": 6.7, "temp": 26, "humidity": 75, "rainfall": 175, "soils": ["loam", "clay"],         "season": "Summer", "days": 365},
    {"name": "Groundnut",   "N": 30,  "P": 50,  "K": 50,  "ph": 6.3, "temp": 26, "humidity": 65, "rainfall":  85, "soils": ["sandy", "loam"],        "season": "Summer", "days": 110},
    {"name": "Soybean",     "N": 35,  "P": 60,  "K": 75,  "ph": 6.5, "temp": 23, "humidity": 65, "rainfall":  90, "soils": ["loam"],                 "season": "Summer", "days": 115},
]

# Indicative national-average yields (t/ha) used for the yield estimator.
YIELDS = {
    "Rice": 4.3, "Maize": 5.7, "Wheat": 3.4, "Chickpea": 1.1, "Kidney Bean": 1.9,
    "Pigeon Pea": 0.9, "Lentil": 1.1, "Banana": 35.0, "Mango": 9.0, "Grapes": 22.0,
    "Watermelon": 28.0, "Apple": 18.0, "Orange": 16.0, "Papaya": 40.0, "Coconut": 12.0,
    "Cotton": 2.0, "Jute": 2.5, "Coffee": 0.9, "Tomato": 45.0, "Potato": 22.0,
    "Onion": 25.0, "Carrot": 30.0, "Lettuce": 20.0, "Cabbage": 32.0, "Spinach": 12.0,
    "Sugarcane": 70.0, "Groundnut": 1.7, "Soybean": 2.7,
}

# Crop rotation families — rotate AWAY from same family next season.
FAMILIES = {
    "Rice": "grass", "Maize": "grass", "Wheat": "grass", "Sugarcane": "grass", "Jute": "fiber",
    "Chickpea": "legume", "Kidney Bean": "legume", "Pigeon Pea": "legume", "Lentil": "legume",
    "Groundnut": "legume", "Soybean": "legume",
    "Tomato": "solanaceae", "Potato": "solanaceae",
    "Onion": "allium",
    "Carrot": "umbellifer",
    "Lettuce": "leafy", "Cabbage": "brassica", "Spinach": "leafy",
    "Banana": "fruit_tree", "Mango": "fruit_tree", "Grapes": "fruit_tree",
    "Apple": "fruit_tree", "Orange": "fruit_tree", "Papaya": "fruit_tree", "Coconut": "fruit_tree",
    "Watermelon": "cucurbit", "Cotton": "fiber", "Coffee": "shrub",
}

ROTATE_TO = {
    "grass": ["legume", "brassica", "leafy"],
    "legume": ["grass", "solanaceae", "leafy"],
    "solanaceae": ["legume", "brassica", "allium"],
    "brassica": ["legume", "grass"],
    "leafy": ["legume", "umbellifer"],
    "allium": ["leafy", "legume"],
    "umbellifer": ["legume", "leafy"],
    "cucurbit": ["legume", "leafy"],
    "fiber": ["legume", "leafy"],
    "fruit_tree": ["legume", "leafy"],
    "shrub": ["legume", "leafy"],
}
