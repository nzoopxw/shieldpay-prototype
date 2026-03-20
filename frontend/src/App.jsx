import { useState } from "react"
import axios from "axios"

const API = "https://shieldpay-prototype-production.up.railway.app"

const PLATFORMS = ["zepto","blinkit","instamart","bigbasket"]
const ROLES     = ["picker","packer","rider","inventory"]
const SHIFTS    = ["morning","afternoon","night"]
const TIERS     = ["basic","standard","premium"]
const ZONES     = [
  "bengaluru-koramangala","bengaluru-indiranagar","delhi-connaught",
  "delhi-rohini","chennai-adyar","chennai-anna-nagar",
  "mumbai-andheri","mumbai-bandra"
]
const TRIGGERS  = ["rain","aqi","bandh","power","platform_outage"]

const tier_info = {
  basic:    { price: "₹29 min/wk", coverage: "50% income replaced" },
  standard: { price: "₹59 min/wk", coverage: "70% income replaced" },
  premium:  { price: "₹99 min/wk", coverage: "100% income replaced" },
}

function Badge({ text, color }) {
  const colors = {
    green:  { bg: "#EAF3DE", fg: "#3B6D11" },
    amber:  { bg: "#FAEEDA", fg: "#854F0B" },
    red:    { bg: "#FCEBEB", fg: "#A32D2D" },
    blue:   { bg: "#E6F1FB", fg: "#185FA5" },
    purple: { bg: "#EEEDFE", fg: "#3C3489" },
  }
  const c = colors[color] || colors.blue
  return (
    <span style={{
      background: c.bg, color: c.fg,
      borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600
    }}>{text}</span>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: 20,
      boxShadow: "0 1px 6px rgba(0,0,0,0.08)", marginBottom: 16, ...style
    }}>{children}</div>
  )
}

function Label({ children }) {
  return <p style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 4, marginTop: 0 }}>{children}</p>
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "10px 12px", borderRadius: 8,
      border: "1px solid #ddd", fontSize: 14, marginBottom: 12,
      background: "#fff", appearance: "auto"
    }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Btn({ onClick, children, color = "blue", disabled, style }) {
  const bg = { blue: "#185FA5", green: "#3B6D11", red: "#A32D2D" }
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "#aaa" : bg[color],
      color: "#fff", border: "none", borderRadius: 10,
      padding: "12px 20px", fontSize: 15, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", width: "100%", ...style
    }}>{children}</button>
  )
}

// ── SCREEN 1: Onboarding ────────────────────────────────────────────────────
function OnboardScreen({ onDone }) {
  const [form, setForm] = useState({
    phone: "", platform: "", platform_id: "", role: "",
    zone: "", shift: "", experience_weeks: 12, income_correction: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const ready = form.phone && form.platform && form.platform_id &&
                form.role && form.zone && form.shift

  const submit = async () => {
    setLoading(true); setError("")
    try {
      const payload = {
        ...form,
        experience_weeks: parseInt(form.experience_weeks) || 12,
        income_correction: form.income_correction ? parseFloat(form.income_correction) : null
      }
      const res = await axios.post(`${API}/onboard`, payload)
      onDone(res.data, form)
    } catch (e) {
      setError(e.response?.data?.detail || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#185FA5", margin: 0 }}>ShieldPay</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Income protection for q-commerce workers</p>

      <Card>
        <Label>Phone number</Label>
        <input value={form.phone} onChange={e => set("phone", e.target.value)}
          placeholder="+91 98765 43210" style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box"
          }} />

        <Label>Platform</Label>
        <Select value={form.platform} onChange={v => set("platform", v)}
          options={PLATFORMS} placeholder="Select platform" />

        <Label>Platform worker ID</Label>
        <input value={form.platform_id} onChange={e => set("platform_id", e.target.value)}
          placeholder="e.g. ZPT-884921" style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box"
          }} />

        <Label>Your role</Label>
        <Select value={form.role} onChange={v => set("role", v)}
          options={ROLES} placeholder="Select role" />

        <Label>Store zone</Label>
        <Select value={form.zone} onChange={v => set("zone", v)}
          options={ZONES} placeholder="Select your store zone" />

        <Label>Shift</Label>
        <Select value={form.shift} onChange={v => set("shift", v)}
          options={SHIFTS} placeholder="Select shift" />

        <Label>Experience (weeks)</Label>
        <input type="number" value={form.experience_weeks}
          onChange={e => set("experience_weeks", e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box"
          }} />

        <Label>Estimated daily income (optional — we'll calculate if blank)</Label>
        <input value={form.income_correction} onChange={e => set("income_correction", e.target.value)}
          placeholder="₹ per day"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #ddd", fontSize: 14, marginBottom: 12, boxSizing: "border-box"
          }} />

        {error && <p style={{ color: "#A32D2D", fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <Btn onClick={submit} disabled={!ready || loading}>
          {loading ? "Setting up..." : "Get my coverage →"}
        </Btn>
      </Card>
    </div>
  )
}

// ── SCREEN 2: Tier selection ────────────────────────────────────────────────
function TierScreen({ worker, formData, onDone }) {
  const [tier, setTier]       = useState("standard")
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const calculate = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/premium/calculate`, {
        worker_id: worker.worker_id, tier
      })
      setResult(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 16px", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontWeight: 800, marginBottom: 4 }}>Your coverage</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ color: "#555", fontSize: 14 }}>AI baseline: ₹{worker.daily_baseline}/day</span>
        {worker.flagged && <Badge text="Income flagged — using conservative estimate" color="amber" />}
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {TIERS.map(t => (
            <div key={t} onClick={() => setTier(t)} style={{
              border: `2px solid ${tier === t ? "#185FA5" : "#e5e5e0"}`,
              borderRadius: 10, padding: "14px 10px", cursor: "pointer", textAlign: "center",
              background: tier === t ? "#E6F1FB" : "#fff"
            }}>
              <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{t}</div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{tier_info[t].coverage}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{tier_info[t].price}</div>
            </div>
          ))}
        </div>

        <Btn onClick={calculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate my weekly premium"}
        </Btn>
      </Card>

      {result && (
        <Card>
          <p style={{ fontWeight: 700, marginTop: 0 }}>Premium breakdown</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#185FA5" }}>₹{result.weekly_premium}</div>
              <div style={{ fontSize: 12, color: "#888" }}>per week</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>₹{result.weekly_baseline}</div>
              <div style={{ fontSize: 12, color: "#888" }}>weekly baseline</div>
            </div>
          </div>

          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Trigger risk breakdown</p>
          {Object.entries(result.breakdown).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#555", textTransform: "capitalize" }}>{k.replace("_", " ")}</span>
              <span style={{ fontWeight: 600 }}>₹{v}</span>
            </div>
          ))}

          <Btn onClick={() => onDone(result)} color="green" style={{ marginTop: 16 }}>
            Activate coverage →
          </Btn>
        </Card>
      )}
    </div>
  )
}

// ── SCREEN 3: Home / Trigger simulation ────────────────────────────────────
function HomeScreen({ worker, premium, formData }) {
  const [triggerType, setTriggerType] = useState("rain")
  const [severity, setSeverity]       = useState("partial")
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState("")

  const fire = async () => {
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await axios.post(`${API}/trigger/simulate`, {
        zone: formData.zone, trigger_type: triggerType, severity
      })
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail || "Trigger check failed")
    }
    setLoading(false)
  }

  const myPayout = result?.payouts?.find(p => p.worker_id === worker.worker_id)

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontWeight: 800, color: "#185FA5" }}>ShieldPay</h2>
        <Badge text="Active" color="green" />
      </div>
      <p style={{ color: "#888", fontSize: 13, marginBottom: 20 }}>
        {formData.zone} · {formData.role} · {formData.shift} shift
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <Card style={{ textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#185FA5" }}>₹{premium.weekly_premium}</div>
          <div style={{ fontSize: 11, color: "#888" }}>weekly premium</div>
        </Card>
        <Card style={{ textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>₹{worker.daily_baseline}</div>
          <div style={{ fontSize: 11, color: "#888" }}>daily baseline</div>
        </Card>
        <Card style={{ textAlign: "center", marginBottom: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, textTransform: "capitalize" }}>{premium.tier}</div>
          <div style={{ fontSize: 11, color: "#888" }}>tier</div>
        </Card>
      </div>

      <Card>
        <p style={{ fontWeight: 700, marginTop: 0, marginBottom: 12 }}>Simulate a disruption event</p>
        <Label>Trigger type</Label>
        <Select value={triggerType} onChange={setTriggerType} options={TRIGGERS} placeholder="Select trigger" />
        <Label>Severity</Label>
        <Select value={severity} onChange={setSeverity} options={["partial", "full"]} placeholder="Select severity" />
        <Btn onClick={fire} disabled={loading}>
          {loading ? "Checking signals..." : "Fire trigger →"}
        </Btn>
      </Card>

      {error && (
        <Card style={{ background: "#FCEBEB" }}>
          <p style={{ fontWeight: 700, color: "#A32D2D", margin: 0 }}>No payout</p>
          <p style={{ color: "#A32D2D", margin: "4px 0 0" }}>{error}</p>
        </Card>
      )}

      {result && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Badge text="Trigger confirmed" color="green" />
            <Badge text={result.severity} color="amber" />
          </div>
          <p style={{ fontSize: 13, color: "#555", margin: "0 0 12px" }}>
            Zone: {result.zone} · {result.trigger_type} · {result.severity}
          </p>

          {myPayout && (
            <div style={{ background: "#EAF3DE", borderRadius: 10, padding: 14 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: 13 }}>
                {myPayout.status === "processed" ? "Payout transferred to your UPI" : "Payout held for review"}
              </p>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#3B6D11" }}>
                ₹{myPayout.amount.toFixed(0)}
              </div>
              <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0" }}>{myPayout.fraud_note}</p>
            </div>
          )}

          <p style={{ fontSize: 12, color: "#888", marginBottom: 0, marginTop: 10 }}>
            {result.workers_found} worker(s) in zone · ₹{result.total_disbursed.toFixed(0)} total disbursed
          </p>
        </Card>
      )}
    </div>
  )
}

// ── Root app with screen routing ────────────────────────────────────────────
export default function App() {
  const [screen,   setScreen]   = useState("onboard")
  const [worker,   setWorker]   = useState(null)
  const [formData, setFormData] = useState(null)
  const [premium,  setPremium]  = useState(null)

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f0" }}>
      {screen === "onboard" && (
        <OnboardScreen onDone={(data, form) => {
          setWorker(data); setFormData(form); setScreen("tier")
        }} />
      )}
      {screen === "tier" && (
        <TierScreen worker={worker} formData={formData} onDone={p => {
          setPremium(p); setScreen("home")
        }} />
      )}
      {screen === "home" && (
        <HomeScreen worker={worker} premium={premium} formData={formData} />
      )}
    </div>
  )
}
