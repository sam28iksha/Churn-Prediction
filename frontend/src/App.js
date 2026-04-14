import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function App() {
  const [formData, setFormData] = useState({
    tenure: '',
    MonthlyCharges: '',
    Contract: 'Month-to-month',
    InternetService: 'DSL',
    TechSupport: 'No',
    PaymentMethod: 'Electronic check'
  });

  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const set = (key) => (v) => setFormData({ ...formData, [key]: v });

  const generateReasons = (formData, churn) => {
    const tenure = Number(formData.tenure);
    const monthlyCharges = Number(formData.MonthlyCharges);
    const reasons = [];

    if (churn) {
      if (formData.Contract === 'Month-to-month')
        reasons.push("Month-to-month contracts have the highest churn rate.");
      if (tenure < 12)
        reasons.push("Short tenure — new customers are more likely to leave.");
      if (monthlyCharges > 70)
        reasons.push("High monthly charges increase churn likelihood.");
      if (formData.PaymentMethod === 'Electronic check')
        reasons.push("Electronic check users churn more than automatic payment users.");
      if (formData.InternetService === 'Fiber optic')
        reasons.push("Fiber optic customers churn more, often due to higher costs.");
      if (formData.TechSupport === 'No')
        reasons.push("Lack of tech support is associated with higher churn.");
    } else {
      if (formData.Contract !== 'Month-to-month')
        reasons.push(`${formData.Contract} contract indicates strong commitment.`);
      if (tenure >= 12)
        reasons.push("Long tenure suggests a loyal, satisfied customer.");
      if (monthlyCharges <= 70)
        reasons.push("Reasonable monthly charges reduce churn risk.");
      if (formData.PaymentMethod !== 'Electronic check')
        reasons.push("Automatic payment method indicates stable billing behavior.");
      if (formData.TechSupport === 'Yes')
        reasons.push("Having tech support increases customer satisfaction and retention.");
    }

    return reasons.slice(0, 3).length > 0
      ? reasons.slice(0, 3)
      : ["Prediction based on overall customer profile."];
  };

  const handlePredict = async () => {
    setIsLoading(true);
    setPrediction(null);

    const tenure = Number(formData.tenure);
    const monthlyCharges = Number(formData.MonthlyCharges);

    const data = {
      tenure,
      MonthlyCharges: monthlyCharges,
      TotalCharges: tenure * monthlyCharges,
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'No',
      Dependents: 'No',
      PhoneService: 'Yes',
      MultipleLines: 'No',
      InternetService: formData.InternetService,
      OnlineSecurity: 'No',
      OnlineBackup: 'No',
      DeviceProtection: 'No',
      TechSupport: formData.TechSupport,
      StreamingTV: 'No',
      StreamingMovies: 'No',
      Contract: formData.Contract,
      PaperlessBilling: 'Yes',
      PaymentMethod: formData.PaymentMethod
    };

    try {
      const res = await fetch("https://churn-prediction-1-cgd6.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error("Server error: " + res.status);

      const result = await res.json();
      console.log("API RESPONSE:", result);

      if (result.error) {
        setPrediction({ churn: false, confidence: 0, reasons: ["Backend error: " + result.error] });
      } else {
        const churn = result.churn === 1;
        setPrediction({
          churn,
          confidence: result.confidence ?? 0,
          reasons: generateReasons(formData, churn)
        });
      }

    } catch (error) {
      console.error("FETCH ERROR:", error);
      setPrediction({ churn: false, confidence: 0, reasons: ["Error fetching prediction. Try again."] });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="relative w-full max-w-lg">

        <div className="text-center mb-10">
          <div className="flex justify-center gap-2 mb-3">
            <Zap className="text-purple-400 w-7 h-7" />
            <h1 className="text-4xl font-bold text-white">ChurnSense AI</h1>
          </div>
          <p className="text-slate-400">Predict customer churn instantly</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800">
          <div className="grid grid-cols-2 gap-4">

            <FormField
              label="Tenure (months)"
              value={formData.tenure}
              onChange={set('tenure')}
              placeholder="e.g. 12"
            />

            <FormField
              label="Monthly Charges ($)"
              value={formData.MonthlyCharges}
              onChange={set('MonthlyCharges')}
              placeholder="e.g. 65"
            />

            <SelectField
              label="Contract Type"
              value={formData.Contract}
              onChange={set('Contract')}
              options={['Month-to-month', 'One year', 'Two year']}
            />

            <SelectField
              label="Internet Service"
              value={formData.InternetService}
              onChange={set('InternetService')}
              options={['DSL', 'Fiber optic', 'No']}
            />

            <SelectField
              label="Tech Support"
              value={formData.TechSupport}
              onChange={set('TechSupport')}
              options={['Yes', 'No']}
            />

            <SelectField
              label="Payment Method"
              value={formData.PaymentMethod}
              onChange={set('PaymentMethod')}
              options={[
                'Electronic check',
                'Mailed check',
                'Bank transfer (automatic)',
                'Credit card (automatic)'
              ]}
            />

          </div>

          <button
            onClick={handlePredict}
            disabled={isLoading || !formData.tenure || !formData.MonthlyCharges}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors"
          >
            {isLoading ? "Analyzing..." : "Predict Churn"}
          </button>
        </div>

        <AnimatePresence>
          {prediction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-6 rounded-xl bg-slate-800 border border-slate-700"
            >
              <h2 className={`text-xl font-bold mb-2 ${prediction.churn ? 'text-red-400' : 'text-green-400'}`}>
                {prediction.churn ? "⚠️ High Churn Risk" : "✅ Low Churn Risk"}
              </h2>

              <p className="text-slate-300 mb-3">
                Confidence: {Math.round((prediction.confidence || 0) * 100)}%
              </p>

              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  style={{ width: `${(prediction.confidence || 0) * 100}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${prediction.churn ? 'bg-red-500' : 'bg-green-500'}`}
                />
              </div>

              <div className="mt-4">
                <p className="text-slate-400 text-sm mb-2">Why this prediction?</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  {prediction.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-purple-500 placeholder-slate-600"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-slate-400 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:border-purple-500"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
