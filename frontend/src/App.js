import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Upload, Database } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || "https://churn-prediction-1-cgd6.onrender.com";

const LIMITS = {
  tenure: { min: 1, max: 72, label: "Tenure must be between 1 and 72 months." },
  MonthlyCharges: { min: 20, max: 200, label: "Monthly charges must be between $20 and $200." }
};

// ── SHARED COMPONENTS ────────────────────────────────────────────────────────

function PredictionResult({ prediction }) {
  return (
    <AnimatePresence>
      {prediction && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="mt-6 p-6 rounded-xl bg-slate-800 border border-slate-700">
          <h2 className={`text-xl font-bold mb-1 ${prediction.churn ? 'text-red-400' : 'text-green-400'}`}>
            {prediction.churn ? "⚠️ High Churn Risk" : "✅ Low Churn Risk"}
          </h2>
          <p className="text-slate-500 text-xs mb-3">
            {prediction.churn
              ? "This customer has a high likelihood of cancelling their plan."
              : "This customer is likely to stay with their current plan."}
          </p>
          <p className="text-slate-300 mb-3">
            Churn Probability: {Math.round((prediction.confidence || 0) * 100)}%
          </p>
          <div className="h-2 bg-slate-700 rounded-full">
            <div style={{ width: `${(prediction.confidence || 0) * 100}%` }}
              className={`h-full rounded-full transition-all duration-500 ${prediction.churn ? 'bg-red-500' : 'bg-green-500'}`} />
          </div>
          {prediction.reasons && prediction.reasons.length > 0 && (
            <div className="mt-4">
              <p className="text-slate-400 text-sm mb-2">Why this prediction?</p>
              <ul className="text-sm text-slate-300 space-y-1">
                {prediction.reasons.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormField({ label, value, onChange, placeholder, min, max, error }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1 block">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max}
        className={`w-full p-2 rounded bg-slate-800 text-white border focus:outline-none placeholder-slate-600
          ${error ? 'border-red-500' : 'border-slate-700 focus:border-purple-500'}`} />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-purple-500">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

// ── TELECOM FORM ─────────────────────────────────────────────────────────────

function TelecomForm() {
  const [formData, setFormData] = useState({
    tenure: '', MonthlyCharges: '',
    Contract: 'Month-to-month', InternetService: 'DSL',
    TechSupport: 'No', PaymentMethod: 'Electronic check'
  });
  const [errors, setErrors] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const set = (key) => (v) => {
    setFormData({ ...formData, [key]: v });
    if (errors[key]) setErrors({ ...errors, [key]: null });
  };

  const validate = () => {
    const newErrors = {};
    for (const key of ['tenure', 'MonthlyCharges']) {
      const val = Number(formData[key]);
      if (!formData[key]) newErrors[key] = "This field is required.";
      else if (val < LIMITS[key].min || val > LIMITS[key].max) newErrors[key] = LIMITS[key].label;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateReasons = (formData, churn) => {
    const tenure = Number(formData.tenure);
    const monthlyCharges = Number(formData.MonthlyCharges);
    const reasons = [];
    if (churn) {
      if (formData.Contract === 'Month-to-month') reasons.push("Month-to-month contracts have the highest churn rate.");
      if (tenure < 12) reasons.push("Short tenure — new customers are more likely to leave.");
      if (monthlyCharges > 70) reasons.push("High monthly charges increase churn likelihood.");
      if (formData.PaymentMethod === 'Electronic check') reasons.push("Electronic check users churn more than automatic payment users.");
      if (formData.InternetService === 'Fiber optic') reasons.push("Fiber optic customers churn more, often due to higher costs.");
      if (formData.TechSupport === 'No') reasons.push("Lack of tech support is associated with higher churn.");
    } else {
      if (formData.Contract !== 'Month-to-month') reasons.push(`${formData.Contract} contract indicates strong commitment.`);
      if (tenure >= 12) reasons.push("Long tenure suggests a loyal, satisfied customer.");
      if (monthlyCharges <= 70) reasons.push("Reasonable monthly charges reduce churn risk.");
      if (formData.PaymentMethod !== 'Electronic check') reasons.push("Automatic payment method indicates stable billing behavior.");
      if (formData.TechSupport === 'Yes') reasons.push("Having tech support increases customer satisfaction and retention.");
    }
    return reasons.slice(0, 3).length > 0 ? reasons.slice(0, 3) : ["Prediction based on overall customer profile."];
  };

  const handlePredict = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setPrediction(null);
    const tenure = Number(formData.tenure);
    const monthlyCharges = Number(formData.MonthlyCharges);
    const data = {
      tenure, MonthlyCharges: monthlyCharges, TotalCharges: tenure * monthlyCharges,
      gender: 'Male', SeniorCitizen: 0, Partner: 'No', Dependents: 'No',
      PhoneService: 'Yes', MultipleLines: 'No', InternetService: formData.InternetService,
      OnlineSecurity: 'No', OnlineBackup: 'No', DeviceProtection: 'No',
      TechSupport: formData.TechSupport, StreamingTV: 'No', StreamingMovies: 'No',
      Contract: formData.Contract, PaperlessBilling: 'Yes', PaymentMethod: formData.PaymentMethod
    };
    try {
      const res = await fetch(`${API}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.error) {
        setPrediction({ churn: false, confidence: 0, reasons: ["Backend error: " + result.error] });
      } else {
        const churn = result.churn === 1;
        setPrediction({ churn, confidence: result.confidence ?? 0, reasons: generateReasons(formData, churn) });
      }
    } catch (e) {
      setPrediction({ churn: false, confidence: 0, reasons: ["Error fetching prediction. Try again."] });
    }
    setIsLoading(false);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tenure (months)" value={formData.tenure} onChange={set('tenure')} placeholder="1 – 72" min={1} max={72} error={errors.tenure} />
        <FormField label="Monthly Charges ($)" value={formData.MonthlyCharges} onChange={set('MonthlyCharges')} placeholder="$20 – $200" min={20} max={200} error={errors.MonthlyCharges} />
        <SelectField label="Contract Type" value={formData.Contract} onChange={set('Contract')} options={['Month-to-month', 'One year', 'Two year']} />
        <SelectField label="Internet Service" value={formData.InternetService} onChange={set('InternetService')} options={['DSL', 'Fiber optic', 'No']} />
        <SelectField label="Tech Support" value={formData.TechSupport} onChange={set('TechSupport')} options={['Yes', 'No']} />
        <SelectField label="Payment Method" value={formData.PaymentMethod} onChange={set('PaymentMethod')} options={['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)']} />
      </div>
      <button onClick={handlePredict} disabled={isLoading}
        className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
        {isLoading ? "Analyzing..." : "Predict Churn"}
      </button>
      <PredictionResult prediction={prediction} />
    </div>
  );
}

// ── CUSTOM CSV FLOW ──────────────────────────────────────────────────────────

function CustomForm() {
  const [step, setStep] = useState('upload');
  const [sessionId, setSessionId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [targetColumn, setTargetColumn] = useState('');
  const [schema, setSchema] = useState([]);
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState(null);

  const reset = () => {
    setStep('upload');
    setPrediction(null);
    setSchema([]);
    setColumns([]);
    setSessionId(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/upload-csv`, { method: "POST", body: form });
      const result = await res.json();
      if (result.error) { setError(result.error); setIsLoading(false); return; }
      setSessionId(result.session_id);
      setColumns(result.columns);
      setRowCount(result.row_count);
      setTargetColumn(result.columns[result.columns.length - 1]);
      setStep('select-target');
    } catch (e) {
      setError("Upload failed. Please check your backend is running.");
    }
    setIsLoading(false);
  };

  const handleTrain = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/train`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, target_column: targetColumn })
      });
      const result = await res.json();
      if (result.error) { setError(result.error); setIsLoading(false); return; }
      setSchema(result.schema);
      const defaults = {};
      result.schema.forEach(f => {
        defaults[f.name] = f.type === 'numeric' ? String(f.mean) : f.options[0];
      });
      setFormData(defaults);
      setStep('form');
    } catch (e) {
      setError("Training failed. Please try again.");
    }
    setIsLoading(false);
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setPrediction(null);
    try {
      const res = await fetch(`${API}/predict-custom`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, data: formData })
      });
      const result = await res.json();
      if (result.error) {
        setPrediction({ churn: false, confidence: 0, reasons: ["Error: " + result.error] });
      } else {
        // No reasons for custom datasets — they're dataset-specific
        setPrediction({ churn: result.churn === 1, confidence: result.confidence ?? 0 });
      }
    } catch (e) {
      setPrediction({ churn: false, confidence: 0, reasons: ["Error fetching prediction. Try again."] });
    }
    setIsLoading(false);
  };

  if (step === 'upload') return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <div className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center w-full hover:border-purple-500 transition-colors">
        <Upload className="mx-auto mb-3 text-slate-400 w-8 h-8" />
        <p className="text-slate-400 mb-1">Upload a CSV with a churn column</p>
        <p className="text-slate-600 text-xs mb-4">Supports any binary churn target (Yes/No, 1/0, True/False)</p>
        <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
          {isLoading ? "Uploading..." : "Choose CSV File"}
          <input type="file" accept=".csv" className="hidden" onChange={handleUpload} disabled={isLoading} />
        </label>
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );

  if (step === 'select-target') return (
    <div className="flex flex-col gap-4">
      <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-400">
        ✅ Uploaded <span className="text-white font-medium">{rowCount} rows</span> with{' '}
        <span className="text-white font-medium">{columns.length} columns</span>
      </div>
      <div>
        <label className="text-sm text-slate-400 mb-1 block">Which column is the churn target?</label>
        <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}
          className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-purple-500">
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <p className="text-slate-600 text-xs mt-1">This should be a binary column (Yes/No or 1/0)</p>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button onClick={handleTrain} disabled={isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
        {isLoading ? "Training model..." : "Train Model →"}
      </button>
      <button onClick={reset} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
        ← Upload a different CSV
      </button>
    </div>
  );

  if (step === 'form') return (
    <div>
      <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
        {schema.map(field => (
          field.type === 'numeric'
            ? <FormField key={field.name} label={field.name} value={formData[field.name] || ''}
              onChange={(v) => setFormData({ ...formData, [field.name]: v })}
              placeholder={`${field.min} – ${field.max}`} min={field.min} max={field.max} />
            : <SelectField key={field.name} label={field.name} value={formData[field.name] || field.options[0]}
              onChange={(v) => setFormData({ ...formData, [field.name]: v })} options={field.options} />
        ))}
      </div>
      <button onClick={handlePredict} disabled={isLoading}
        className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
        {isLoading ? "Analyzing..." : "Predict Churn"}
      </button>
      <button onClick={reset} className="mt-2 w-full text-slate-500 hover:text-slate-300 text-sm transition-colors">
        ← Upload a different CSV
      </button>
      <PredictionResult prediction={prediction} />
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="relative w-full max-w-lg">

        <div className="text-center mb-10">
          <div className="flex justify-center gap-2 mb-3">
            <Zap className="text-purple-400 w-7 h-7" />
            <h1 className="text-4xl font-bold text-white">ChurnSense AI</h1>
          </div>
          <p className="text-slate-400 text-base">Predict customer churn instantly</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Built for <span className="text-purple-400 font-medium">telecom companies</span> — or upload your own dataset to predict churn for any industry.
          </p>
        </div>

        {!mode && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => setMode('telecom')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-700 bg-slate-900/80 hover:border-purple-500 hover:bg-slate-800 transition-all">
              <Database className="text-purple-400 w-8 h-8" />
              <div className="text-center">
                <p className="text-white font-semibold">Telecom Dataset</p>
                <p className="text-slate-500 text-xs mt-1">Use our pre-trained model</p>
              </div>
            </button>
            <button onClick={() => setMode('custom')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-slate-700 bg-slate-900/80 hover:border-purple-500 hover:bg-slate-800 transition-all">
              <Upload className="text-purple-400 w-8 h-8" />
              <div className="text-center">
                <p className="text-white font-semibold">Upload Your CSV</p>
                <p className="text-slate-500 text-xs mt-1">Train on your own data</p>
              </div>
            </button>
          </div>
        )}

        {mode && (
          <button onClick={() => setMode(null)} className="mb-4 text-slate-500 hover:text-slate-300 text-sm transition-colors">
            ← Back
          </button>
        )}

        {mode && (
          <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800">
            {mode === 'telecom' && <TelecomForm />}
            {mode === 'custom' && <CustomForm />}
          </div>
        )}

      </div>
    </div>
  );
}