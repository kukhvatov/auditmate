import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';
import { ShieldAlert, CheckCircle, Rocket, Loader2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const calculateScoresLocally = (answers) => {
    const ans1 = String(answers["1"] || "").trim();
    const ans2 = String(answers["2"] || "").trim();
    const ans3 = String(answers["3"] || "").trim();
    
    const len1 = ans1.length;
    const len2 = ans2.length;
    const len3 = ans3.length;
    
    const ans1L = ans1.toLowerCase();
    const ans2L = ans2.toLowerCase();
    const ans3L = ans3.toLowerCase();
    
    // 1. Идея
    let scoreIdea = 40;
    if (len1 > 10) {
      scoreIdea += Math.min(30, Math.floor(len1 / 8));
      const keywords = ["проблема", "решение", "боль", "клиент", "пользователь", "эффект", "потребность"];
      keywords.forEach(kw => {
        if (ans1L.includes(kw)) scoreIdea += 4;
      });
      scoreIdea = Math.min(95, scoreIdea);
    }
    
    // 2. Рынок
    let scoreMarket = 35;
    if (len2 > 10) {
      scoreMarket += Math.min(30, Math.floor(len2 / 8));
      const keywords = ["конкурент", "рынок", "отличие", "преимущество", "аналог", "сегмент", "уникал"];
      keywords.forEach(kw => {
        if (ans2L.includes(kw)) scoreMarket += 4;
      });
      scoreMarket = Math.min(95, scoreMarket);
    }
    
    // 3. Финансы
    let scoreFinance = 30;
    if (len3 > 10) {
      scoreFinance += Math.min(30, Math.floor(len3 / 8));
      const keywords = ["платить", "монетиз", "выручк", "расход", "подписк", "транзакц", "руб", "цена", "тариф", "продаж"];
      keywords.forEach(kw => {
        if (ans3L.includes(kw)) scoreFinance += 4;
      });
      scoreFinance = Math.min(95, scoreFinance);
    }
    
    // 4. Команда
    let scoreTeam = 45;
    const combined = ans1L + " " + ans2L + " " + ans3L;
    const keywordsTeam = ["команда", "мы", "опыт", "разработчик", "дизайнер", "партнер", "основатель", "компетенц"];
    keywordsTeam.forEach(kw => {
      if (combined.includes(kw)) scoreTeam += 5;
    });
    if (combined.length > 200) scoreTeam += 10;
    scoreTeam = Math.min(95, scoreTeam);
    
    // 5. Продукт
    let scoreProduct = 40;
    const keywordsProduct = ["приложение", "сервис", "сайт", "платформ", "продукт", "технолог", "it", "софт", "mvp", "разработ"];
    keywordsProduct.forEach(kw => {
      if (combined.includes(kw)) scoreProduct += 5;
    });
    scoreProduct += Math.min(15, Math.floor(combined.length / 30));
    scoreProduct = Math.min(95, scoreProduct);
    
    const overall = Math.floor((scoreIdea + scoreMarket + scoreFinance + scoreTeam + scoreProduct) / 5);
    
    // Recommendations
    const recommendations = [];
    if (scoreIdea < 65) {
      recommendations.push({
        type: "error",
        title: "Идея и Ценность (Недостаточная проработка)",
        text: "Описание боли клиента слишком поверхностно. Постарайтесь детальнее прописать профиль пользователя и оцифровать масштаб решаемой проблемы."
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Идея и Ценность (Сильная сторона)",
        text: "Отличная проработка гипотезы проблемы. Вы четко сфокусированы на потребностях клиентов."
      });
    }
    
    if (scoreMarket < 65) {
      recommendations.push({
        type: "error",
        title: "Рынок и Конкуренты (Зона риска)",
        text: "Не проработано ваше уникальное торговое отличие (УТП). Настоятельно рекомендуется составить карту конкурентов и четко выделить ваши барьеры защиты от копирования."
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Рынок и Конкуренты (Проработано)",
        text: "Хорошее понимание ландшафта рынка и сформированное конкурентное преимущество."
      });
    }
    
    if (scoreFinance < 60) {
      recommendations.push({
        type: "error",
        title: "Финансы и Монетизация (Критично)",
        text: "Модель генерации выручки не определена или не содержит цифр. Опишите плановый тариф или средний чек на транзакцию для расчета юнит-экономики."
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Финансы и Монетизация (Проработано)",
        text: "Определена коммерческая модель с понятным потоком входящих платежей от клиентов."
      });
    }
    
    if (scoreTeam < 60) {
      recommendations.push({
        type: "error",
        title: "Команда проекта (Зона роста)",
        text: "Компетенции создателей не описаны в тексте. Укажите, кто отвечает за разработку продукта, а кто — за продажи и маркетинг."
      });
    } else {
      recommendations.push({
        type: "success",
        title: "Команда проекта (Баланс)",
        text: "В ответах прослеживается подробное описание компетенций и понимание зон ответственности."
      });
    }
    
    return {
      overall_score: overall,
      categories: [
        { subject: "Идея", score: scoreIdea, fullMark: 100 },
        { subject: "Команда", score: scoreTeam, fullMark: 100 },
        { subject: "Рынок", score: scoreMarket, fullMark: 100 },
        { subject: "Финансы", score: scoreFinance, fullMark: 100 },
        { subject: "Продукт", score: scoreProduct, fullMark: 100 }
      ],
      recommendations
    };
  };

  useEffect(() => {
    const fetchReport = async () => {
      const answersStr = localStorage.getItem('audit_answers') || "{}";
      const parsedAnswers = JSON.parse(answersStr);
      
      try {
        const res = await axios.post('/api/ai/report', { answers: parsedAnswers });
        if (res.data && res.data.categories) {
          setReport(res.data);
        } else {
          throw new Error("Invalid backend structure");
        }
      } catch (e) {
        console.warn("API Report request failed, falling back to client scoring", e);
        const localReport = calculateScoresLocally(parsedAnswers);
        setReport(localReport);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="font-medium animate-pulse">Генерируем отчет и скоринг...</p>
      </div>
    );
  }

  if (!report) return <div className="text-center mt-20 text-red-500">Не удалось загрузить отчет</div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 print:py-4 print:px-0">
      <div className="flex items-center gap-6 mb-12 print:mb-6">
        <div className="h-24 w-24 print:h-16 print:w-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center rounded-[2rem] print:rounded-xl text-3xl print:text-2xl font-black shadow-xl shadow-blue-600/20">
          {report.overall_score}
        </div>
        <div>
          <h1 className="text-4xl print:text-2xl font-extrabold text-slate-900 mb-2 print:mb-1">Отчет готов</h1>
          <p className="text-lg print:text-sm text-slate-500">Ваш стартап прошел глубокий аудит инвестиционной привлекательности.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 print:items-start">
        <div className="bg-white p-8 print:p-4 rounded-3xl print:rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-xl print:text-base font-bold text-slate-800 w-full mb-6 print:mb-2">Радар компетенций</h3>
          <div className="w-full h-[320px] print:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={report.categories}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false}/>
                <Radar name="Score" dataKey="score" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4 print:space-y-2">
          <h3 className="text-xl print:text-base font-bold text-slate-800 print:mb-2">Рекомендации AI</h3>
          {report.recommendations.map((rec, idx) => (
            <div key={idx} className={`p-6 print:p-3 rounded-2xl print:rounded-xl border flex gap-4 ${rec.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="shrink-0 mt-1">
                {rec.type === 'success' ? <CheckCircle className="text-emerald-500" size={24}/> : <ShieldAlert className="text-rose-500" size={24}/>}
              </div>
              <div>
                <h4 className={`font-bold mb-1 ${rec.type === 'success' ? 'text-emerald-900' : 'text-rose-900'}`}>{rec.title}</h4>
                <p className={`text-sm ${rec.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>{rec.text}</p>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-4 mt-6 print:hidden w-full">
            <button 
              onClick={() => navigate('/audit')}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 px-6 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors font-bold shadow-sm"
            >
              <ArrowLeft size={18} /> Назад
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-[2] flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/10"
            >
              <Rocket size={18} /> Скачать PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
