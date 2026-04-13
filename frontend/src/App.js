import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function App() {
  const [formData, setFormData] = useState({
    tenure: '',
    monthlyCharges: '',
    totalCharges: '',
    contract: 'Month-to-month',
    internetService: 'DSL',
    paymentMethod: 'Electronic check'
  });

  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePredict = async () => {
    setIsLoading(true);
    setPrediction(null);

    const data = {
      tenure: Number(formData.tenure),
      MonthlyCharges: Number(formData.monthlyCharges),
      TotalCharges: Number(formData.totalCharges),
      Contract: formData.contract,
      InternetService: formData.internetService,
      PaymentMethod: formData.paymentMethod
    };

    try {
      const res = await fetch("http://127.0.0.1:8001/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log(result); // debug

      setPrediction({
  churn: result.churn,
  confidence: result.confidence ?? 0,
  reasons: result.reasons || []
});

      setIsLoading(false);

    } catch (error) {
      setIsLoading(false);
      setPrediction({
        churn: false,
        confidence: 0,
        reasons: ["Error fetching prediction"]
        });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      
      <div className="relative w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center gap-2 mb-3">
            <Zap className="text-purple-400 w-7 h-7" />
            <h1 className="text-4xl font-bold text-white">ChurnSense AI</h1>
          </div>
          <p className="text-slate-400">Predict customer churn instantly</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 rounded-2xl p-8 border border-slate-800">

          <div className="grid grid-cols-2 gap-4">

            <FormField label="Tenure" value={formData.tenure}
              onChange={(v)=>setFormData({...formData,tenure:v})} />

            <FormField label="Monthly Charges" value={formData.monthlyCharges}
              onChange={(v)=>setFormData({...formData,monthlyCharges:v})} />

            <FormField label="Total Charges" value={formData.totalCharges}
              onChange={(v)=>setFormData({...formData,totalCharges:v})} />

            <SelectField label="Contract" value={formData.contract}
              onChange={(v)=>setFormData({...formData,contract:v})}
              options={['Month-to-month','One year','Two year']} />

            <SelectField label="Internet Service" value={formData.internetService}
              onChange={(v)=>setFormData({...formData,internetService:v})}
              options={['DSL','Fiber optic','No']} />

            <SelectField label="Payment Method" value={formData.paymentMethod}
              onChange={(v)=>setFormData({...formData,paymentMethod:v})}
              options={['Electronic check','Mailed check','Bank transfer (automatic)','Credit card (automatic)']} />

          </div>

          <button
            onClick={handlePredict}
            disabled={isLoading}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl"
          >
            {isLoading ? "Analyzing..." : "Predict Churn"}
          </button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {prediction && (
            <div className="mt-6 p-6 rounded-xl bg-slate-800 border border-slate-700">
              
              <h2 className={`text-xl font-bold mb-2 ${prediction.churn ? 'text-red-400' : 'text-green-400'}`}>
                {prediction.churn ? "High Churn Risk" : "Low Churn Risk"}
              </h2>

              <p className="text-slate-300 mb-4">
                Confidence: {Math.round((prediction.confidence || 0) * 100)}%
              </p>
              <div className="mt-4">
                <p className="text-slate-400 text-sm mb-2">Why this prediction?</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  {prediction.reasons.map((reason, index) => (
                    <li key={index}>• {reason}</li>
                  ))}
                </ul>
              </div>

              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  style={{ width: `${(prediction.confidence || 0) * 100}%` }}
                  className={`h-full ${prediction.churn ? 'bg-red-500' : 'bg-green-500'}`}
                />
              </div>

            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function FormField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 text-white"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e)=>onChange(e.target.value)}
        className="w-full p-2 rounded bg-slate-800 text-white"
      >
        {options.map(opt => <option key={opt}>{opt}</option>)}
      </select>
    </div>
  );
}