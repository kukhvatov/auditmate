import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto px-6 py-20 text-center">
      <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
        Проверь свой стартап <br />перед визитом к <span className="text-blue-600">инвестору</span>
      </h1>
      <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
        Умный AI-ассистент поможет найти слабые места в вашей идее, рынке и экономике всего за 15 минут.
      </p>

      <button 
        onClick={() => navigate('/audit')}
        className="bg-blue-600 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all"
      >
        Начать аудит бесплатно
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
        {[
          { icon: <Target className="text-blue-500" size={32}/>, title: "Идея и Рынок", text: "Анализ УТП и конкурентов" },
          { icon: <TrendingUp className="text-emerald-500" size={32}/>, title: "Юнит-экономика", text: "Проверка бизнес-модели" },
          { icon: <ShieldCheck className="text-purple-500" size={32}/>, title: "Оценка рисков", text: "Готовность к фандрайзингу" },
        ].map((feat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-left">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              {feat.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{feat.title}</h3>
            <p className="text-slate-500">{feat.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
