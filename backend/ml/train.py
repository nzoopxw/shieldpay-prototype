import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
import joblib, os

# --- Synthetic training data ---
# Features: platform, role, shift, city_risk_score, weeks_experience
# Target: daily_income (INR)

np.random.seed(42)
N = 2000

platforms  = ["zepto", "blinkit", "instamart", "bigbasket"]
roles      = ["picker", "packer", "rider", "inventory"]
shifts     = ["morning", "afternoon", "night"]
city_risks = {"bengaluru": 0.7, "delhi": 0.85, "chennai": 0.65, "mumbai": 0.75}

rows = []
for _ in range(N):
    platform    = np.random.choice(platforms)
    role        = np.random.choice(roles)
    shift       = np.random.choice(shifts)
    city        = np.random.choice(list(city_risks.keys()))
    experience  = np.random.randint(1, 104)  # weeks

    # Base income by role
    base = {"picker": 650, "packer": 620, "rider": 900, "inventory": 700}[role]

    # Modifiers
    platform_mod = {"zepto": 1.05, "blinkit": 1.03, "instamart": 0.98, "bigbasket": 0.95}[platform]
    shift_mod    = {"morning": 1.0, "afternoon": 1.08, "night": 1.12}[shift]
    exp_mod      = 1 + min(experience / 200, 0.3)
    noise        = np.random.normal(1.0, 0.08)

    daily_income = base * platform_mod * shift_mod * exp_mod * noise
    daily_income = max(300, round(daily_income, 2))

    rows.append({
        "platform": platform, "role": role, "shift": shift,
        "city": city, "experience_weeks": experience,
        "daily_income": daily_income
    })

df = pd.DataFrame(rows)

# Encode categoricals
le_platform = LabelEncoder().fit(platforms)
le_role     = LabelEncoder().fit(roles)
le_shift    = LabelEncoder().fit(shifts)
le_city     = LabelEncoder().fit(list(city_risks.keys()))

df["platform_enc"] = le_platform.transform(df["platform"])
df["role_enc"]     = le_role.transform(df["role"])
df["shift_enc"]    = le_shift.transform(df["shift"])
df["city_enc"]     = le_city.transform(df["city"])

X = df[["platform_enc", "role_enc", "shift_enc", "city_enc", "experience_weeks"]]
y = df["daily_income"]

model = GradientBoostingRegressor(n_estimators=100, max_depth=4, random_state=42)
model.fit(X, y)

# Save model and encoders together
os.makedirs(os.path.dirname(__file__), exist_ok=True)
joblib.dump({
    "model":       model,
    "le_platform": le_platform,
    "le_role":     le_role,
    "le_shift":    le_shift,
    "le_city":     le_city
}, os.path.join(os.path.dirname(__file__), "baseline_model.joblib"))

print("Model trained. Sample predictions:")
test_cases = [
    ("zepto",    "rider",     "night",    "delhi",     52),
    ("blinkit",  "picker",    "morning",  "bengaluru", 10),
    ("instamart","inventory", "afternoon","chennai",   26),
]
for p, r, s, c, e in test_cases:
    x = pd.DataFrame([[
        le_platform.transform([p])[0],
        le_role.transform([r])[0],
        le_shift.transform([s])[0],
        le_city.transform([c])[0],
        e
    ]], columns=["platform_enc","role_enc","shift_enc","city_enc","experience_weeks"])
    pred = model.predict(x)[0]
    print(f"  {r} on {p} {s} shift in {c}: ₹{pred:.0f}/day")