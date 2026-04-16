<p align="center">
  <h1>ShieldPay</h1>
  <strong>Parametric income protection for India's q-commerce workforce.</strong><br/>
  Built for Guidewire DevTrails 2026.
</p>

---

> Ravi is a Zepto rider in Koramangala. Last Tuesday it rained 60mm in two hours.
> He made ₹0 that day. No warning. No backup. No claim to file.
> **ShieldPay fixes that.**

---

## What this is

ShieldPay is an AI-powered parametric insurance platform purpose-built for dark store workers — pickers, packers, delivery riders, and inventory associates at Zepto, Blinkit, Swiggy Instamart, and BigBasket Now.

When an external disruption verifiably cuts a worker's ability to earn, ShieldPay automatically replaces their lost income. No claim filed. No form filled. No approval waited on. The trigger either crossed the threshold or it didn't — and if it did, the money moves within 2 hours, directly to the worker's UPI ID, with zero intervention required from either party.

This is not a generic gig worker insurance product with a q-commerce skin. It is purpose-built for the 10-minute delivery economy — priced at dark store granularity, verified by two independent signals, and designed around the operational reality of a worker who lives and earns inside a 2km radius.

---

## The problem, precisely

India's q-commerce sector employs millions of dark store workers across four roles:

- **Delivery partners** — outdoor, last-mile, fully exposed to weather and AQI
- **Pickers** — indoor, pulling items from shelves, affected by platform outages and civil disruptions
- **Packers** — indoor, bagging and staging orders, same profile as pickers
- **Inventory associates** — managing stock and cold chain, uniquely vulnerable to power outages

When a disruption hits — heavy rain, hazardous AQI, a bandh, a platform outage — order volumes collapse. Workers go home early or don't come in at all. They lose 20–30% of their monthly income in a single event. The platform owes them nothing beyond what was actually delivered.

No existing insurance product covers this. Health insurance covers illness. Vehicle insurance covers accidents. There is nothing for the income lost on a Tuesday when it rained too hard to ride.

---

## Why parametric

Traditional insurance requires a worker to prove their loss — submit a claim, wait for adjudication, hope for approval. That process assumes paperwork, documentation, and time. None of those exist in a worker's life.

Parametric insurance removes all of that. We don't measure the worker's loss directly. We measure an independent external index — rainfall in mm/hr from IMD, AQI from CPCB, a disaster advisory from NDMA — and when that index crosses a pre-agreed threshold, the payout fires automatically.

The trigger is a publicly verifiable, tamper-proof number from a government data source. The worker doesn't prove anything. We don't investigate anything. The math runs, the money moves.

This design choice eliminates claims fraud structurally — not through detection after the fact, but by removing the claims process entirely.

---

## What we cover

### Category A — Weather

| Trigger | Threshold | Payout | Base coefficient | Data source |
|---|---|---|---|---|
| Heavy rainfall | Partial: >15mm/hr | 50% | 0.55 | IMD API |
| Heavy rainfall | Full: >50mm/hr | 100% | 0.80 | IMD API |
| Dense fog | Visibility <200m sustained >2 hrs | 50% | 0.45 | IMD visibility data |
| Extreme heat | Heat index >47°C sustained >4 hrs | 50% | 0.40 | IMD temperature data |
| Cyclone warning | IMD Category 1+ advisory for district | Full week | 1.00 | IMD bulletin |

### Category B — Air quality

| Trigger | Threshold | Payout | Base coefficient | Data source |
|---|---|---|---|---|
| Poor AQI | Partial: >300 | 50% | 0.45 | CPCB API |
| Poor AQI | Full: >450 | 100% | 0.75 | CPCB API |

### Category C — Civil and administrative

| Trigger | Threshold | Payout | Base coefficient | Data source |
|---|---|---|---|---|
| Section 144 / curfew | Prohibitory order in worker's registered zone | 100% | 1.00 | Govt gazette |
| Declared bandh | Bandh affecting district >4 hrs | 100% | 0.85 | News + platform signal |
| Road closure | >60% arterial roads in zone closed >4 hrs | 50% | 0.50 | Traffic API |
| State disaster alert | NDMA / state govt official advisory | Full week | 1.00 | NDMA feed |

### Category D — Infrastructure

| Trigger | Threshold | Payout | Base coefficient | Data source |
|---|---|---|---|---|
| Power outage | DISCOM outage in dark store zone >3 hrs | 50% | 0.55 (0.90 for cold chain stores) | DISCOM alerts |
| Internet / network outage | TRAI-reported outage in zone >2 hrs | 50% | 0.50 | TRAI outage feed |
| Platform outage | Zepto/Blinkit app confirmed down >90 min | 100% | 1.00 | Downdetector + platform |

**On the internet outage trigger:** A dark store without network connectivity cannot receive orders, cannot process payments, and cannot dispatch riders. Workers are effectively stood down. TRAI publishes network outage data per zone. We cross-reference with the two-signal order drop check — if orders stopped and the network was down, both signals confirm independently.

### The two-signal rule

**An external trigger crossing its threshold is necessary but not sufficient.**

Before any payout fires, a second signal must confirm: did the dark store in the worker's 2km zone actually experience an order volume drop greater than 40%?

If the trigger fired but the worker covered all their active orders with no delay — no payout. This is not a policy constraint. It is structural. The second signal is always checked. A worker who performs normally during a trigger event experienced no income loss and receives nothing. This is correct.

**On payout percentages and thresholds:** The disruption coefficients (0.55 for full rain, 0.45 for AQI, etc.) are calibrated estimates derived from IMD rainfall-mobility correlation patterns and synthetic store-level order drop data. They reflect reasonable approximations of real operational impact — for example, published urban mobility research consistently shows 50–70% reduction in two-wheeler movement during rainfall above 50mm/hr in Indian cities. The exact coefficients are prototype-stage estimates, explicitly designed to be replaced by real platform order drop data once API integration is live. We do not present them as production-validated figures.

### Role-adjusted coefficients

Not every trigger affects every role equally. A picker working indoors is not affected by rain the way a rider is. A power outage hits an inventory associate managing cold chain far harder than it hits a delivery partner.

| Trigger | Delivery partner | Picker / Packer | Inventory associate |
|---|---|---|---|
| Rain / fog / heat | Full coefficient | 40% of coefficient | 35% of coefficient |
| AQI | Full coefficient | 40% of coefficient | 35% of coefficient |
| Power outage | Full coefficient | 40% of coefficient | **90% of coefficient** |
| Bandh / curfew / disaster | Full coefficient | 40% of coefficient | 40% of coefficient |
| Platform outage | Full coefficient | Full coefficient | Full coefficient |

Platform outages and declared disasters apply at full coefficient for every role — these events stop all operations regardless of whether you work indoors or outdoors.

**How the final payout coefficient is assembled:**

`final coefficient = base coefficient × role multiplier × tier coverage ratio`

Example — Zepto rider, full rain trigger, Standard tier:
`0.80 × 1.00 × 0.70 = 0.56 → worker receives 56% of their daily baseline`

Example — Blinkit picker, full rain trigger, Standard tier:
`0.80 × 0.40 × 0.70 = 0.224 → worker receives 22.4% of their daily baseline`

This is correct. The picker was indoors. Their loss was real but partial. The coefficient reflects that honestly.

---

## Weekly premium model

### How AI calculates your weekly premium — the full pipeline

The weekly premium is not looked up from a table. It is computed fresh every Sunday night for every active worker using three ML models chained together:

```
STEP 1 — Model 1 (XGBoost income baseline)
Input:  platform, role, zone, shift, weeks of experience, earnings history
Output: predicted daily income baseline (₹X/day) — personalised to this worker

          ↓

STEP 2 — Model 2 (Prophet disruption forecaster)
Input:  IMD 48-hr rainfall forecast, CPCB AQI prediction, historical trigger frequency for this zone
Output: P(trigger fires this week) per trigger type — e.g. P(rain)=0.30, P(AQI)=0.04

          ↓

STEP 3 — Model 3 (Disruption coefficient regression)
Input:  zone, trigger type, severity, role, shift time
Output: disruption coefficient per trigger — what % of income is lost when this trigger fires for this worker

          ↓

STEP 4 — Premium formula (deterministic, not ML)
E[L]_daily = Σ P(trigger_i) × daily_baseline × coeff_i × role_multiplier_i × coverage_ratio
E[L]_weekly = E[L]_daily × working_days
P_weekly = max(₹29, min(E[L]_weekly ÷ 0.35, 2% of weekly_baseline))

          ↓

OUTPUT: Worker's personalised weekly premium
        Collected Monday morning after their platform payout settles
```

Three models. One formula. One number. Recalculated every week. The same worker pays ₹45 in January and ₹110 in July because the forecast model sees different risk each week.

### What happens to every ₹100 collected

| Allocation | Percentage | Purpose |
|---|---|---|
| Claims pool | 35% | Paid out to workers on trigger days |
| Risk reserve | 20% | Buffer for catastrophic weeks. Invested in liquid mutual funds at ~6.5% p.a. |
| Operations | 25% | Tech infrastructure, APIs, Razorpay fees, salaries |
| Profit margin | 20% | Sustainable business floor |

The expense ratio is 45% (operations + reserve). Only 35 paise of every rupee goes to claims — which means the premium must be scaled accordingly.

**On the expense ratio:** The 45% target ratio is constructed from Indian insurtech operational benchmarks — tech-first insurers in India typically run 30–40% expense ratios, with the higher end applying to early-stage operations before distribution costs are amortised. Our 25% ops allocation is a design target, not a validated figure. It will be confirmed against real operational costs during the pilot phase. We state this openly.

### The formula

```
E[L]_weekly = Σ P(trigger_i) × daily_baseline × coeff_i × role_multiplier_i × coverage_ratio × working_days

P_weekly = max( floor_premium,  min( E[L] ÷ 0.35,  cap_premium ) )

floor_premium = ₹29 / week   ← non-negotiable minimum. Like an auto meter.
cap_premium   = 2% of worker's weekly income baseline
```

The floor exists because below ₹29/week we cannot sustainably cover anyone. The cap exists because a gig worker should never pay more than 2% of their weekly income for income protection — set at the midpoint of the 1.5–3% of income range that insurance penetration research in India's informal sector identifies as the affordable threshold for discretionary financial products.

The gap between what the actuarial formula produces and what the cap allows is covered by geographic pooling. Low-risk workers in dry seasons subsidise high-risk workers in monsoon zones. This is how insurance is supposed to work.

### Worked example

**Worker:** Zepto delivery partner, Bengaluru-Koramangala, night shift, 52 weeks experience.
**Tier:** Standard (70% income coverage).
**AI baseline:** ₹950/day.

| Trigger | P(event) | Coefficient | Expected daily loss |
|---|---|---|---|
| Rain | 0.30 | 0.55 × 1.00 × 0.70 = 0.385 | ₹950 × 0.30 × 0.385 = ₹109.73 |
| AQI | 0.04 | 0.45 × 1.00 × 0.70 = 0.315 | ₹950 × 0.04 × 0.315 = ₹11.97 |
| Bandh | 0.01 | 0.85 × 1.00 × 0.70 = 0.595 | ₹950 × 0.01 × 0.595 = ₹5.65 |
| Power | 0.05 | 0.55 × 1.00 × 0.70 = 0.385 | ₹950 × 0.05 × 0.385 = ₹18.29 |

**Daily E[L]:** ₹145.64  
**Weekly E[L]** (× 6 working days): ₹873.84  
**Raw premium** (÷ 0.35): ₹2,496.69  
**Weekly baseline** (₹950 × 6): ₹5,700  
**Cap** (2% of ₹5,700): **₹114**  
**Charged:** ₹114/week

The cap is doing real work. The actuarially correct premium for a high-risk monsoon week is ₹2,497. The worker pays ₹114. The difference is covered by the pool. That's the design.

### Seasonal premium range — same worker

| Season | Weekly premium |
|---|---|
| January (low risk) | ₹29–45 (floor applies) |
| April (pre-monsoon) | ₹55–75 |
| July (peak monsoon) | ₹100–115 (cap applies) |
| October (AQI season) | ₹65–85 |

Premium is recalculated every Sunday night using the next week's weather forecast. Workers are notified before the deduction.

### Coverage tiers

| Tier | Weekly premium | Income coverage | Triggers included |
|---|---|---|---|
| Basic | ₹29 minimum | 50% of lost income | Weather + AQI |
| Standard | ₹59 minimum | 70% of lost income | Weather + AQI + Civil |
| Premium | ₹99 minimum | 100% of lost income | All triggers |

---

## AI and ML — what each model actually does

### Model 1 — Income baseline (GradientBoostingRegressor / XGBoost)

**What it does:** Predicts a worker's expected daily income from their platform, role, zone, shift, and weeks of experience.

**Why it matters:** Payouts are proportional to income. A flat payout ignores that a Zepto rider in Delhi earns differently from a Blinkit picker in Chennai. The model makes payouts fair.

**Inputs:** Platform, role, shift, city zone, experience weeks.  
**Output:** Predicted daily income in INR.  
**Training data:** Synthetic dataset of 2,000 workers generated from realistic earnings distributions per role and platform. Designed to be replaced by real anonymised platform payout data in production.

**Cold start — new workers with no history:**

New workers cannot have a personalised baseline on day one. Instead they receive the cohort median — the midpoint earnings of all verified workers in the same platform × role × zone × shift combination.

The transition from cohort to personal data is blended, not switched:

| Week | Baseline composition |
|---|---|
| Week 1–2 | 100% cohort median |
| Week 3–4 | 70% cohort, 30% actual platform payout data |
| Week 5–6 | 30% cohort, 70% actual data |
| Week 7+ | 100% personal — cohort dropped entirely |

This prevents a new worker from being immediately disadvantaged by a low cohort median if their actual earnings are higher, while protecting the pool from inflated baselines if a worker overstated their income at enrollment. The blend is transparent — workers can see the composition of their current baseline in the app.

### Model 2 — Disruption forecaster (Prophet / LSTM)

**What it does:** Runs nightly on IMD 48-hour forecasts and CPCB AQI predictions. Outputs per-zone trigger probability for the next 7 days.

**Why it matters:** Two uses. First: feeds into next week's premium calculation — a Bengaluru worker's premium is higher the week before a predicted monsoon surge. Second: powers the pre-event surge upgrade notification sent to workers 24 hours before a high-probability event.

**Inputs:** IMD rainfall forecast, CPCB AQI prediction, historical trigger frequency per zone.  
**Output:** P(trigger) per trigger type per zone per day for the next 7 days.

### Model 3 — Disruption coefficient (sklearn Regression)

**What it does:** Maps (zone, trigger type, severity, role, shift time) to a predicted order volume drop percentage. This is the `coeff_i` in the payout formula.

**Why it matters:** A rainfall event in Bengaluru drops order volumes differently than the same rainfall in Delhi. A night shift rider is affected differently from a morning shift picker. The coefficient captures this granularity.

**Training data:** Synthetic store-level order drop data calibrated from IMD rainfall-mobility correlation patterns. Designed for real platform order data in production.

### Model 4 — Fraud detection (Isolation Forest)

**What it does:** Scores each claim event against the learned distribution of legitimate claims. High anomaly score → soft hold for review. Low score → auto-approved.

**Inputs:** Claim amount, trigger type, worker role, zone, time of day, store loss ratio, fraud history.  
**Output:** Anomaly score 0–1. Threshold for soft hold: 0.65.

**Important:** The Isolation Forest is the third layer of fraud detection, not the first. The structural layers come first — see Fraud Detection section.

**Note on coefficients and training data:** Initial coefficients are derived from IMD rainfall-mobility correlation studies and calibrated synthetic platform data. They are explicitly designed to be replaced by real store-level order drop signals from platform API integration in production. We state this openly rather than presenting prototype-stage estimates as production-validated figures.

---

## Fraud detection

### The foundational layer — parametric design

The most important fraud prevention mechanism in ShieldPay is not a model. It is the architecture.

Because payouts are triggered by an external government index — not a worker's self-report — the entire category of claims fraud (fabricating a loss, exaggerating a loss, submitting duplicate claims for the same event) is structurally eliminated. Nobody can fake an IMD rainfall reading or a CPCB AQI station output.

What remains are three residual fraud vectors: enrollment fraud, location fraud, and duplicate registration. We address all three.

### Pillar 1 — Anomaly detection in claims

**Enrollment anomaly detection:** At signup, a worker's stated income is scored against the distribution of verified workers in their cohort (platform × role × zone × shift). If the stated income exceeds the 95th percentile of the cohort, the system applies a soft flag — not a denial. The worker's payout cap is set to the cohort median until 4 weeks of real platform payout data confirms or corrects the claim. The worker is told this explicitly. No hidden policies.

**In-claim anomaly detection:** The Isolation Forest model scores each payout calculation. Signals that raise the fraud score:
- Claim amount more than 2× the cohort average for the same trigger type
- Trigger event claimed during unregistered shift hours
- Consistent pattern of claiming on every trigger event for 8+ consecutive weeks
- Claim initiated within 48 hours of account creation

High fraud score → payout held in a soft hold queue for manual review. Not denied — held. A legitimate edge case should not be auto-denied.

### Pillar 2 — Location and activity validation

**GPS zone checkpoint (single, passive, disclosed):** On a trigger day, when a payout is being processed, one GPS check is performed — was the worker's app active and GPS-present within their registered 2km zone during the trigger window? This is the only location data we use. It is disclosed at onboarding. Workers who were genuinely at work pass automatically.

| GPS result | Outcome |
|---|---|
| In registered zone during trigger window | Proceeds to payout calculation |
| In a different city entirely | Blocked |
| App offline / GPS unavailable | Soft hold — worker notified to confirm |

**Activity validation:** For delivery partners, order completion rate during the trigger window is cross-referenced with platform data (simulated in prototype; real API in production). If a worker completed all their active orders on time during the trigger window, no income loss occurred and no payout fires — regardless of whether the external trigger index was breached.

This is the two-signal rule in action. External index alone is not enough. The worker's actual operational reality must confirm the loss.

### Pillar 3 — Duplicate claim prevention

| Duplicate vector | Prevention mechanism |
|---|---|
| Same worker, same trigger, two payout attempts | Event ID + worker ID composite unique key in DB |
| Worker registered on two platforms claiming same event | Phone number + zone deduplication at payout stage |
| Two workers sharing same UPI ID | UPI ID uniqueness enforced at enrollment |
| Same platform worker ID on two accounts | Platform ID uniqueness constraint in DB |
| Trigger event logged twice due to API retry | Idempotency key on trigger event logging |

Because ShieldPay is parametric — there is no claim submission step — the majority of duplicate claim scenarios are impossible by design. The deduplication layer handles the remaining edge cases at database level, not just application level.

---

## Onboarding

### Platforms covered

Zepto · Blinkit · Swiggy Instamart · BigBasket Now

Q-commerce only. Deliberately excludes Swiggy food, Zomato, Amazon, and Flipkart — different operational model, different risk profile, different product.

### Roles

| Role | Environment | Primary triggers | Premium profile |
|---|---|---|---|
| Delivery partner | Outdoor | Rain, fog, AQI, road closure | Highest — full coefficients |
| Picker | Indoor | Platform outage, bandh, power | Lowest — 40% weather coefficient |
| Packer / Sorter | Indoor | Platform outage, bandh, power | Low — 40% weather coefficient |
| Inventory associate | Mixed | Power outage, supplier closure, weather | Custom — 90% power coefficient |

The inventory associate role is specifically designed for the cold chain dependency of dark store operations. A power outage at a store with large perishables sections is a fundamentally different event from a power outage at a dry goods store. This role captures that distinction.

### The onboarding flow

| Step | What we collect | Why |
|---|---|---|
| 1 | Phone number + OTP | Identity. No email, no name required at this stage. |
| 2 | Platform | Determines cohort and coefficient table. |
| 3 | Platform worker ID | Verified against platform API within 24 hrs. Coverage begins immediately; paused (not cancelled) if verification fails. |
| 4 | Role | Determines which coefficient multipliers apply. |
| 5 | Dark store pin (GPS drop) | Sets the 2km geofence for trigger monitoring. |
| 6 | Shift window | Determines which hours trigger monitoring is active for this worker. |
| 7 | AI baseline shown | Worker sees their predicted daily income. Can correct it. Corrections above 95th percentile are soft-flagged and capped. |
| 8 | Tier selection | Three tiers shown with their specific calculated weekly premium — not generic pricing. |
| 9 | Razorpay UPI AutoPay | One-time mandate. Weekly deduction authorised. Coverage begins immediately. |
| 10 (background) | Platform ID verification | Confirmed via API within 24 hrs. Worker notified either way. |

Total onboarding time: under 4 minutes. No document upload. No income proof. No KYC at signup.

### Platform worker ID verification

Workers enter their platform-assigned worker ID (e.g. ZPT-884921 for Zepto, BLK-229103 for Blinkit) at step 3 of onboarding. In production, this ID is verified in the background via each platform's partner API within 24 hours of enrollment.

Coverage begins immediately on submission — we do not make workers wait for verification before they are protected. If verification fails (ID not found, account inactive, or platform API unavailable), coverage is paused — not cancelled — and the worker is notified with a clear explanation and a re-verification prompt. Premium is not charged during a verification pause.

This design reflects a deliberate tradeoff: a genuine worker should never be left unprotected because of a slow API handshake. The fraud risk from a brief unverified coverage window is low — a fraudster cannot trigger a payout without a real external event and real order drop data confirming the loss.

In the prototype, platform ID validation is simulated. The production integration targets the partner APIs maintained by each platform for their gig workforce management systems.

---

## Real-time trigger monitoring

The trigger monitoring pipeline runs continuously, polling government data sources at two intervals:

- **Every 30 minutes** during active weather windows (IMD warning issued, AQI above 200, or any trigger currently active in any covered zone)
- **Every 6 hours** during normal conditions

Each reading is normalised and mapped to the 2km zone grid. When a threshold is crossed, the two-signal check runs immediately. If both signals confirm, the payout pipeline initiates automatically.

**From trigger confirmation to UPI transfer: target under 2 hours.**

```
IMD / CPCB / NDMA / DISCOM APIs
         ↓ (polled every 30 min during active weather)
Signal aggregator — normalises readings to 2km zone grid
         ↓
Threshold engine — partial or full trigger classification
         ↓
Two-signal check — dark store order drop >40% in zone?
    ↓ No drop             ↓ Confirmed
  No payout           GPS zone checkpoint
                           ↓
                    Activity validation — did worker complete orders normally?
                    ↓ Yes              ↓ No income loss confirmed
                  No payout        Payout calculation
                                        ↓
                              Isolation Forest fraud score
                              ↓ High score      ↓ Clear
                           Soft hold        Razorpay Payout API
                                                 ↓
                                        UPI transfer + push notification
```

Trigger events are logged with an idempotency key (zone_id + trigger_type + timestamp rounded to nearest hour). Duplicate API responses from retries cannot create duplicate trigger events.

---

## Payment flows

### Weekly premium collection

Workers set up a Razorpay UPI AutoPay mandate once at onboarding. Every Sunday evening, the system calculates the following week's premium using the forecast model. Every Monday morning, after the worker's weekly platform payout has settled, the premium is deducted automatically.

**Earn first, then the premium comes out.** This is not accidental — it is the core affordability design principle.

If the deduction fails: 24-hour grace period with one retry. Coverage continues during the grace period. Coverage lapses only on second consecutive failure. Worker notified at each stage.

### Payout disbursement

When both signals confirm a disruption, ShieldPay initiates a seamless, zero-touch payout — no form, no call, no approval required from the worker. The Razorpay Payout API transfers directly to the worker's registered UPI ID within 2 hours of trigger confirmation. A push notification is sent on initiation and again on confirmation. The worker receives their money before they've even filed anything, because there is nothing to file.

Worker notification format: *"Rain trigger confirmed in your zone. ₹480 is being transferred to your UPI ID. Expected: within 2 hours."*

No claim form. No reference number. No call centre.

---

## Dark store granularity

ShieldPay prices and triggers at 2km resolution — not city level, not district level. This is the technical differentiator that makes every other parametric insurance product incomparable.

### How 2km granularity changes the product

**Store-level risk scores:** Each dark store has its own historical loss ratio tracked separately. Workers at a store in a flood-prone zone of Bengaluru pay a higher premium than workers at a store on elevated ground in the same city. Same city, same platform, same role — different premium because the zone history is different.

**Store rerouting surge coverage:** When a trigger fires at Store A and operations halt, Zepto reroutes orders to Store B. Workers at Store B now absorb 1.5–2× normal volume in worse conditions. ShieldPay detects this order density spike. If a worker's store crosses 150% of normal order volume during an active adjacent trigger, they receive a 1.25× surge multiplier on their payout. The disruption intensified their work rather than stopping it — they are compensated for that.

**Store-level micro risk pool:** Workers at the same dark store share a visible micro pool. Their dashboard shows the store's collective loss ratio, number of enrolled workers, and pool health. Community transparency. Actuarial signal. And a natural prompt for word-of-mouth enrollment — workers recruit their colleagues.

**Cold chain power coefficient:** Inventory associates at stores with significant cold chain infrastructure receive a 0.90 power outage coefficient instead of the standard 0.55. Determined at onboarding when the worker pins their store. The store's product category profile (cold chain vs dry goods) informs the coefficient automatically.

---

## ShieldCredit Score — building financial visibility

ShieldPay generates something no bank has ever had access to for gig workers: a verified, timestamped record of consistent financial behaviour — premium payments made on time, claims filed honestly, income earned and tracked.

50 million gig workers in India are credit invisible. No salary slips. No formal employment. No loan history. Banks cannot reach them. ShieldPay changes that — building financial visibility for workers who have never had a bank loan, one clean week at a time.

After consistent premium payment with no fraud flags, ShieldPay workers receive a ShieldCredit Score — a structured financial credibility rating built from their insurance behaviour.

| Milestone | Reward |
|---|---|
| 1 clean quarter (13 weeks) | 15% discount on next quarter's premium |
| 2 consecutive clean quarters | 20% discount + first ShieldCredit Score entry |
| 3 consecutive clean quarters | 25% discount + pre-approved ₹5,000–10,000 emergency credit line via NBFC partner |
| 6 months consistent | Eligible for formal credit report entry |
| 12 months consistent | Eligible for collateral-free equipment loan (e-bike, smartphone) |

Discounts are applied to the following quarter's premium — not as UPI cashback. The money stays in the ecosystem, our cash outflow is reduced, and the worker has a tangible reason to stay enrolled through low-risk seasons.

Legitimate claims do not reset the streak or affect the ShieldCredit Score. A worker who claims what they are owed is not penalised. Only fraudulent flags affect the score.

The NBFC credit line is referred, not issued by ShieldPay. We are not a bank. We share the worker's payment record (with explicit consent) with an NBFC partner who issues the line and pays ShieldPay a referral fee per activation.

---

## Innovations

### Pre-event surge upgrade window
24 hours before a high-probability trigger event (≥78% from the forecasting model), workers receive: *"Heavy rain likely in your zone tomorrow. Upgrade to full coverage for this week — ₹15 extra."* One tap. Workers who upgrade have self-selected based on their own belief about tomorrow's weather. We collect a better premium from the highest-risk segment at exactly the right moment.

### Overtime order protection
If a worker accepts an order outside their registered shift window and a trigger fires before the order is completed, they receive coverage for that order's estimated income value. Verifiable via order acceptance timestamp. Not exploitable without a real accepted order in the system.

### Peer city solidarity pool (visible)
Workers in low-risk zones see their contribution to the cross-city pool. *"Your city had 0 trigger days this quarter. Your premium helped cover 847 disruption days across Chennai and Delhi."* Community badge awarded. Small additional premium discount for staying in the cross-city pool. Adverse selection solved socially.

### Risk reserve in liquid mutual funds
The 20% risk reserve is not held idle. Parked in liquid mutual funds (Groww / Zerodha Coin) earning ~6.5% annual returns with T+1 liquidity. We never touch equities — payout liability is daily, so same-day liquidity is non-negotiable. At ₹1 crore in reserve, this generates ~₹65,000/month in passive income that improves our combined ratio without additional risk.

---

## Business model

| Revenue stream | Mechanism | Scale |
|---|---|---|
| Weekly premium pool | Core insurance float. 20% margin after claims, ops, and reserve. | Scales with worker enrollment. |
| Dark store B2B hedge | Zepto / Blinkit pay a monthly premium to cover inventory spoilage on trigger days. Makes platforms recommend ShieldPay at worker onboarding. | High ACV, low marginal cost. |
| ShieldCredit NBFC referral | Referral fee per credit line activated — ₹200–500 per worker. | ₹2–5L/quarter at 1,000 eligible workers. |
| Liquid MF returns | Risk reserve earns ~6.5% p.a. in liquid mutual funds. | ~₹65,000/month at ₹1Cr reserve. |
| Pre-event surge upgrades | Higher premium collected from highest-risk workers 24 hrs before events. | Improves weekly loss ratio during high-risk weeks. |

---

## Why q-commerce. Why not food delivery or e-commerce.

**vs food delivery (Swiggy/Zomato riders):**
A food delivery disruption affects one type of worker — the rider. A q-commerce disruption affects three simultaneously: the picker can't pick, the packer can't pack, the rider can't ride. Three victims, one event. ShieldPay covers all three with role-adjusted coefficients. No food delivery insurance product has this structure.

**vs e-commerce (Amazon/Flipkart):**
E-commerce delivery windows are hours or days. A disruption means rescheduling. Q-commerce is 10 minutes — a disruption means complete income loss with zero rescheduling option. Fundamentally different risk profile. Fundamentally different product.

**vs other insurance products:**
Every existing or conceivable parametric product prices at city level and day level. ShieldPay prices at 2km resolution and shift-hour resolution. Our trigger is verified by two independent signals — external index and store-level order drop. Our product builds financial identity as a side effect of working correctly.

**The phrase that owns this category:**

> *"We are the first chronologically parametric insurance platform in India — priced at dark store granularity, verified by two independent signals, and purpose-built for the 10-minute delivery economy."*

---

## Platform choice — mobile, not web

ShieldPay is a mobile-first product. There is no scenario in which a Zepto rider pulls out a laptop between deliveries.

**Why mobile:**
- Workers are on their phones all day — their platform app, their UPI, their bank notifications all live there. ShieldPay belongs in the same place.
- Push notifications are non-negotiable. Trigger alerts, payout confirmations, and pre-event surge upgrade prompts must reach workers in real time. Web push is unreliable. Native push via Expo is not.
- UPI AutoPay mandate setup requires a handoff to the worker's UPI app — a native mobile flow. On web this breaks.
- The single passive GPS checkpoint for zone validation requires device location permissions — cleanly handled by Expo Location on mobile.
- The entire financial life of a gig worker — UPI, platform earnings, bank notifications — is already on their phone. ShieldPay integrates into that ecosystem, not alongside it.

**The admin dashboard is web-only.** Operators reviewing fraud queues, monitoring loss ratios, and watching live trigger events do this at a desk. No mobile needed. Two separate products, two separate surfaces, one backend.

**Production:** React Native with Expo — iOS and Android from a single codebase.  
**Prototype:** React + Vite, mobile-responsive, runs in phone browser. Same demo effect, zero native build complexity for Phase 2.

---

## Analytics dashboard

### Worker-facing (mobile app)

Every worker sees their own slice of the system in real time:

- **Coverage status** — active / paused / lapsed. Clear, top of screen, always visible.
- **Live zone alerts** — any active trigger in their registered 2km zone, with severity and estimated duration.
- **Current week's premium** — what was deducted Monday, what it covers.
- **Payout history** — itemised list of every trigger event, amount paid, date, trigger type. Full audit trail for the worker.
- **ShieldCredit score panel** — current streak in weeks, loyalty discount earned, progress bar toward next milestone, credit eligibility status.
- **Store micro pool** — their dark store's collective loss ratio, enrolled worker count, pool health indicator. Visible community context.
- **Surge upgrade prompt** — 24 hours before a predicted event, a banner appears with one-tap upgrade option and the probability score driving it.

### Operator-facing (web dashboard)

The admin dashboard is the financial nerve centre of the platform. Every metric that matters for viability is visible in real time:

- **Active policies** — by city, by platform, by tier, by role. Live count. Enrollment trend over time.
- **Weekly premium collected vs payouts disbursed** — the core financial health metric. If the ratio drifts above 0.65 (loss ratio), the reserve is being drawn on. Alert fires at 0.70.
- **Loss ratio by dimension** — sliced by city, trigger type, role, and individual dark store. Lets us identify zones where pricing needs review.
- **Trigger monitor** — live feed of all API readings per zone. Which zones are active. Which triggers are currently firing. Two-signal status for each.
- **Fraud flag queue** — all soft-hold payouts awaiting manual review. Fraud score, trigger context, worker history, one-click approve or escalate.
- **Cohort model accuracy** — how closely the AI baseline predictions track actual worker earnings as real data accumulates. This is the model drift monitor. If predictions consistently over- or under-shoot actual earnings by more than 15%, the model needs retraining.
- **Pool health** — current reserve balance vs expected weekly liability. Reserve adequacy ratio. Alert if reserve drops below 8 weeks of expected claims.
- **ShieldCredit pipeline** — workers approaching credit eligibility milestone, total NBFC referrals issued, referral fee revenue to date.
- **Pre-event upgrade conversion** — what percentage of workers who received a surge upgrade notification actually upgraded. Conversion rate by city and trigger type. This tells us whether the notification is working.
- **Store-level loss ratio heatmap** — each enrolled dark store plotted by its historical loss ratio. Stores consistently above 0.80 flagged for premium review.

---

## Tech stack

### Prototype (Phase 2 — built for this submission)

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + Vite (web, mobile-responsive) | Zero native setup. Full demo in browser. Swappable for React Native without touching backend. |
| Backend | FastAPI (Python) | Async, fast, auto-generates Swagger docs. One language across backend and ML. |
| Database | SQLite | Zero configuration for prototype. Single file. Swaps to PostgreSQL in production without schema changes. |
| ML models | scikit-learn GradientBoostingRegressor + Isolation Forest | Trains on synthetic data in minutes. Serialised with joblib. Loaded in-process — no separate ML server needed. |
| Payments | Mocked | Payment confirmation screen simulated. Razorpay integration in Phase 3. |
| Trigger monitoring | Manual simulation endpoint | "Fire trigger" button in UI demonstrates the full pipeline without live API polling. |
| External APIs | Mocked with realistic synthetic data | IMD, CPCB, NDMA integrated in Phase 3. |
| Backend deployment | Railway | Auto-deploy from GitHub. Free tier. Always-on. |
| Frontend deployment | Vercel | Auto-deploy from GitHub. CDN-served. |

### Production (Phase 3 onwards)

| Layer | Technology | Rationale |
|---|---|---|
| Mobile app | React Native + Expo | iOS and Android from one codebase. Expo handles push notifications and GPS. |
| Admin dashboard | React + Vite (web) | Operator-facing only. No mobile needed for admin. |
| Backend | FastAPI (Python) | Unchanged from prototype. |
| Database | PostgreSQL via Supabase | Managed hosting, real-time subscriptions for live dashboard, built-in phone OTP auth. |
| Cache | Redis (Upstash) | Idempotency keys, trigger state cache, rate limiting. Free serverless tier. |
| ML models | XGBoost + Prophet + sklearn + Isolation Forest | Production model versions with real training data. |
| Trigger monitoring | APScheduler inside FastAPI | Polls IMD/CPCB/NDMA every 30 min during active weather, every 6 hrs otherwise. |
| Payments | Razorpay Subscriptions + Payout API | UPI AutoPay mandate for weekly collection. Payout API for disbursements. Webhooks for state updates. |
| External APIs | IMD (free), CPCB (free), NDMA (free), OpenWeatherMap (free tier) | All publicly accessible. Real data. No cost. |
| Deployment | Render (backend) + Vercel (frontend) | Auto-deploy from GitHub. Free tiers sufficient for pilot scale. |
| CI | GitHub Actions | Tests on push. Auto-deploy on merge to main. |

---

## Phase 3 roadmap

What we're building next:

- **Push notifications** — trigger alerts, payout confirmations, pre-event surge upgrade prompts
- **Pre-event surge upgrades** — 24hr before predicted event, one-tap tier upgrade in app
- **ShieldCredit full implementation** — streak tracking, discount application, NBFC credit line activation
- **Admin dashboard** — active policies, loss ratio by zone, live trigger monitor, fraud queue
- **Razorpay live integration** — real UPI AutoPay mandate and Payout API replacing mock
- **Real IMD / CPCB / NDMA APIs** — replacing manual trigger simulation with live polling
- **APScheduler** — automatic trigger monitoring, no manual fire button
- **React Native mobile app** — proper iOS/Android build with GPS and push notifications
- **PostgreSQL via Supabase** — replacing SQLite for production scale

---

## Development plan

### Step 1 — Foundation
- FastAPI project structure, routing, error handling
- Database schema — workers, policies, trigger events, payouts, fraud flags, loyalty streaks
- Supabase setup — hosted DB, phone OTP auth, real-time config
- Synthetic dataset generation across 4 cities, 4 roles, all trigger types
- Train and serialise all four ML models
- Core API endpoints — onboarding, premium calculation, policy activation

**Milestone:** Any worker profile in → correct personalised weekly premium out. All models returning real values.

### Step 2 — Trigger and payout pipeline
- APScheduler — polling IMD, CPCB, NDMA at configured intervals
- Threshold engine — zone matching, partial vs full trigger, role-adjusted coefficients
- Two-signal confirmation — simulated store order drop API
- Full fraud validation — GPS checkpoint, activity validation, Isolation Forest scoring, duplicate prevention
- Razorpay integration — UPI AutoPay mandate, Payout API, webhook handling
- Redis — idempotency keys, trigger state cache

**Milestone:** Real IMD trigger fires → two signals confirmed → fraud cleared → Razorpay sandbox disburses → payout logged.

### Step 3 — Worker mobile app
- React Native onboarding — all 10 screens wired to API
- Home screen — coverage status, live trigger alerts, current premium, payout history
- ShieldCredit score screen — streak counter, loyalty discount, credit eligibility progress
- Expo push notifications — trigger alert, payout confirmation, surge upgrade prompt
- Expo Location — single passive GPS checkpoint

**Milestone:** Worker onboards in under 4 minutes on device. Push notification on trigger. Payout visible in history.

### Step 4 — Admin dashboard
- Overview — active policies, tier distribution, weekly premium vs payouts
- Live trigger monitor — API readings per zone, two-signal status
- Loss ratio dashboard — by city, trigger type, role, store
- Fraud queue — soft hold review UI, audit log
- Store-level micro pool view — per-store loss ratio, enrolled workers, pool health
- ShieldCredit pipeline — eligibility tracker, NBFC referral queue

**Milestone:** Admin watches a trigger fire, two-signal confirmation, payout, dashboard update — all in real time.

### Step 5 — QA, demo prep, submission
- End-to-end testing for all four roles across three trigger types
- Demo scenario seeded — 20–30 synthetic workers across Bengaluru, Delhi, Chennai, Mumbai
- Trigger simulation button in admin — controlled demo without waiting for real weather
- Deployment verified — Render backend live, Supabase connected, mobile build on TestFlight
- README final version pushed

**Milestone:** Full demo walkable in 5 minutes. Every feature in this README demonstrable live.

---

## Adversarial defense and anti-spoofing

### The attack we designed against

The two-signal rule validates the zone. It does not validate the individual worker inside it.

That gap is exploitable. A coordinated group of workers — organizing over Telegram, using readily available GPS-spoofing apps — can place themselves inside an active trigger zone while sitting at home. The weather is real. The order drop is real. Their location is not. The parametric trigger fires correctly. Our second signal confirms correctly. And the pool drains.

This is not a theoretical attack. It has happened to beta parametric platforms in India. We designed ShieldPay's fraud layer with this specific scenario in mind from the start.

---

### Why GPS alone was never enough

A spoofing app fakes one thing: coordinates. It cannot simultaneously fake accelerometer readings, cell tower IDs, IP geolocation, app activity logs, battery drain patterns, and historical movement trajectories.

A real rider caught in a storm leaves a trail of correlated signals. Their GPS accuracy degrades — rain causes multipath interference that widens the accuracy radius. Their altitude reading fluctuates as they move. Their accelerometer shows the micro-vibrations of a moving vehicle. Their cell tower ID matches their claimed location. Their platform app shows order accept and decline events. Their battery is draining faster than idle.

A spoofer at home has none of this. Their GPS accuracy is suspiciously perfect — spoofing apps lock coordinates with no natural variance. Their altitude is dead flat. Their accelerometer is stationary. Their cell tower matches their home, not the zone they claim to be in. Their app is idle.

We don't check coordinates. We score a confidence vector across all of these signals simultaneously. A single anomalous reading is noise. A pattern of anomalies across the full vector is fraud.

The single most reliable signal is trajectory. **Real workers don't teleport.** If a worker's last known location was 6km from the trigger zone and they appear inside it four minutes later with no plausible travel path, that is a hard flag regardless of what any other signal says.

---

### Detecting the syndicate, not just the individual

Individual fraud detection catches amateurs. Syndicate detection requires looking at the population, not the person.

When a trigger fires, our Isolation Forest model runs on the full cohort of claimants — not each worker in isolation. A syndicate produces a statistically abnormal cluster that no collection of genuine workers would produce.

**Coordinate entropy.** Genuine workers spread naturally across a zone. They're at different intersections, sheltering in different spots, moving along different routes. Spoofers cluster. If thirty workers have GPS coordinates within fifty metres of each other, that is a spoofing app's default drop pin, not a dark store zone.

**Timing distribution.** When a real disruption hits, workers trickle into the affected area over fifteen to thirty minutes as conditions develop. A syndicate coordinates on Telegram and acts simultaneously. A spike of forty location pings within a ninety-second window at trigger onset is a syndicate signature, not organic worker behavior.

**Device fingerprint graph.** We fingerprint the app stack, not just the device ID — device IDs can be rotated. The same device model, Android version, and mock location app signature appearing across multiple worker accounts is a network edge. We map these edges. Connected components that activate together during triggers are syndicate candidates.

**Payout velocity.** A worker who successfully claims on every single trigger event in their city, across multiple zone types and shifts, is statistically implausible. Genuine workers miss triggers — they were off shift, they'd already gone home before it started, their zone wasn't directly affected. A perfect claim record over time is a red flag, not a loyalty signal.

The syndicate's coordination is their own undoing. Mass fraud at scale leaves statistical fingerprints that no individual fraud does. The larger the group, the more visible the anomaly.

---

### Handling false flags without punishing honest workers

A genuine rider in a heavy rainstorm will have degraded GPS. They may be sheltering under a flyover, which causes a cell tower mismatch. They may have closed background apps to save battery. These signals overlap with fraud signals. A binary block would punish them.

We don't block. We tier.

Every payout is assigned a confidence score from 0–100 based on the full signal vector. The score determines what happens next — not whether the payout happens.

| Score | Response |
|---|---|
| 75–100 | Auto-approved. Payout within 10 minutes. No friction. |
| 50–74 | Soft hold. Worker is told their payout is processing and no action is needed. The system re-checks signals passively over the next 90 minutes. If they stabilise, the payout auto-approves. |
| 25–49 | Single micro-verification prompt — one button: *"Confirm you're currently working in [zone]."* Genuine workers respond in seconds. Bots and idle spoofers don't. |
| 0–24 | Human review queue. Worker is told their payout is under a brief security review and will complete within four hours. If cleared, it fires immediately. |

We never tell a worker they are suspected of fraud. The language is always about confirming signals or processing. A legitimate worker delayed by bad weather degrading their GPS should experience a brief wait, not an accusation.

Workers with eight or more weeks of clean history — no fraud flags, consistent zone behavior, normal payout velocity — receive a trust buffer. Their auto-approval threshold is fifteen points lower. A long-tenure worker with one anomalous reading gets the benefit of the doubt. A brand-new account with no history gets the stricter threshold. This is structurally correct: syndicates spin up fresh accounts. Genuine workers accumulate history.

Finally, our fraud model is trigger-context aware. During active severe weather, we expect GPS and network quality to degrade across the entire zone. The variance thresholds widen accordingly. We do not penalise a worker for having imperfect GPS in a storm. We flag a worker for having suspiciously perfect GPS in one.

---

## Persona scenarios

### Scenario 1 — Arjun, Zepto delivery partner, Delhi, October
AQI crosses 420 at 9pm during Arjun's night shift. CPCB feed triggers. Delhi north zone order volume drops 71%. Two-signal confirmed. GPS shows Arjun in his registered zone. He hadn't completed any orders in the last 45 minutes — platform data confirms. Payout: ₹950 × 0.45 × 1.00 × 0.70 = ₹299.25. Transferred to his UPI by 11pm. He gets a push notification and goes to sleep knowing the night wasn't a total loss.

### Scenario 2 — Meena, Blinkit picker, Chennai, July
120mm of rain in 3 hours. Full rain trigger. Chennai-Adyar store order volume drops 68%. Two-signal confirmed. Meena is indoors — role multiplier 0.40 applies. Her payout: ₹700 × 0.55 × 0.40 × 0.70 = ₹107.80. Smaller than a rider's payout, but accurate — she was sheltered. She still receives what she's owed.

### Scenario 3 — Sundar, BigBasket Now inventory associate, Bengaluru, any season
DISCOM power outage in his zone for 4.5 hours. Cold chain at his store starts warming. Two-signal confirmed (order volume collapsed — no picking, no packing, no dispatch). Power outage coefficient for inventory associates: 0.90. His payout: ₹750 × 0.90 × 0.90 × 1.00 (Premium tier) = ₹607.50. The cold chain clause recognised his specific vulnerability. No other insurance product would have.

### Scenario 4 — Priya, 3 clean quarters, Zepto packer, Mumbai
Priya has had zero trigger payouts for 9 consecutive weeks — three full quarters. She receives a notification: *"You've gone 3 clean quarters. Your Q4 premium is 25% lower. And your ShieldCredit Score just unlocked a ₹7,500 emergency credit line."* She didn't plan for this. ShieldPay built her financial visibility as a side effect of her doing her job.

---

*ShieldPay — built for Guidewire DevTrails 2026.*  
*Team: CosmoCoders*  
*GitHub: https://github.com/nzoopxw/shieldpay-prototype*


## References and further reading

The disruption coefficients, trigger thresholds, and income impact estimates in ShieldPay are 
prototype-stage approximations. The research below informed our assumptions and validates 
the core problem we are solving.

**On weather and worker productivity**

- Somanathan et al. (2021). *The Impact of Temperature on Productivity and Labor Supply: 
  Evidence from Indian Manufacturing.* Journal of Political Economy, 129(6).  
  https://www.journals.uchicago.edu/doi/10.1086/713733  
  — Documents measurable output loss and absenteeism on high-heat days in Indian 
  labour-intensive industries. Directly relevant to our heat index trigger.

- Colmer, J. (2021). *Temperature, Labour Reallocation, and Industrial Production: Evidence 
  from India.* American Economic Journal: Applied Economics, 13(4).  
  https://www.ideasforindia.in/topics/productivity-innovation/temperature-labour-reallocation-and-industrial-production  
  — Estimates a 1°C within-district temperature increase is associated with a 12% reduction 
  in agricultural production and a 7-percentage point drop in employment.

**On AQI and gig workers specifically**

- Siddiqui, Sakunia & Mahmud (2024). *Riders in the smog: Pollution is poisoning gig workers.*  
  Rest of World.  
  https://restofworld.org/2024/riders-in-the-smog-gig-workers-pollution/  
  — Rest of World equipped delivery riders in New Delhi, Lahore, and Dhaka with personal 
  air quality monitors. Readings across shifts were significantly above WHO safety limits. 
  25 workers interviewed, all reported symptoms consistent with chronic pollutant exposure. 
  The most directly relevant external study to our AQI trigger design.

- Newsclick (2023). *Gig Workers Amid Rising Air Pollution.*  
  https://www.newsclick.in/gig-workers-amid-rising-air-pollution  
  — Covers the disproportionate impact of poor AQI on platform workers in Delhi NCR 
  and the absence of any employer protection for outdoor gig workers.

- LSE Business Review (2025). *How air pollution is holding back India's economy.*  
  https://blogs.lse.ac.uk/businessreview/2025/12/12/how-air-pollution-is-holding-back-indias-economy/  
  — Describes air pollution as "a highly regressive tax on labour, reducing earnings precisely 
  among those who are least able to bear the loss." Estimates ₹36.8 billion in economic 
  losses from premature mortality and morbidity in India in 2019 alone.

**On the q-commerce sector and gig worker vulnerability**

- Business Standard Editorial (2026). *Gig workers' strike exposes the hard limits of India's 
  quick commerce model.*  
  https://www.business-standard.com/opinion/editorial/gig-workers-strike-exposes-the-hard-limits-of-india-s-quick-commerce-model-126010100961_1.html  
  — Cites a NITI Aayog 2024 survey finding that 90% of gig workers had no savings. 
  Platform disconnection policies mean a single bad week — caused by weather, disruption, 
  or illness — can erase a month of progress.

- IBEF (2026). *The Evolution of Quick Commerce in India: A Sectoral Analysis.*  
  https://www.ibef.org/research/case-study/the-evolution-of-quick-commerce-in-india-a-sectoral-analysis  
  — Q-commerce GMV in India reached approximately ₹65,000 crore in FY25. The sector 
  employs 250,000–300,000 delivery partners. Kearney estimates 62–64 jobs created per 
  ₹100 crore GMV — the highest employment intensity of any retail format.

- Drishti IAS (2025). *Rise of Quick Commerce in India.*  
  https://www.drishtiias.com/daily-updates/daily-news-editorials/rise-of-quick-commerce-in-india  
  — Documents labor protection gaps, absence of insurance, and earnings volatility for 
  dark store workers. Notes that riders earn ₹40–50 per delivery with no fixed income floor.