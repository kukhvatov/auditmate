import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import axios from 'axios';

const QUESTIONS = [
  { id: 1, text: "В чем заключается основная проблема, которую решает ваш продукт?", desc: "Опишите боль клиента своими словами (минимально 10 символов)." },
  { id: 2, text: "Кто ваши прямые и косвенные конкуренты?", desc: "Назовите несколько компаний и объясните вашу отстройку (минимально 10 символов)." },
  { id: 3, text: "За что именно клиент будет вам платить?", desc: "Опишите модель монетизации на первый год работы (минимально 10 символов)." }
];

export default function AuditFlow() {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [aiFeedback, setAiFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const question = QUESTIONS[currentIdx];
  const currentAnswer = answers[question.id] || "";
  const isValid = currentAnswer.trim().length >= 10;

  const generateClientSideHint = (questionId, answer) => {
    const ansLower = answer.toLowerCase().trim();
    if (questionId === 1) {
      if (ansLower.length < 20) {
        return "Вы описали проблему очень лаконично. Попробуйте раскрыть её подробнее: кто конкретно является конечным пользователем и в каких ситуациях возникает эта боль?";
      }
      const keywords = ["боль", "клиент", "пользователь", "время", "деньги", "решение"];
      const missing = keywords.filter(kw => !ansLower.includes(kw));
      if (missing.length > 0) {
        return `Хорошее начало. Рекомендуется добавить в описание проблемы фокус на боли клиентов. Попробуйте раскрыть понятия: ${missing.slice(0, 3).join(', ')}.`;
      }
      return "Отличное описание проблемы. Вы хорошо понимаете боли своей целевой аудитории. Попробуйте оцифровать её: сколько времени или денег теряет клиент в день?";
    } else if (questionId === 2) {
      if (ansLower.length < 20) {
        return "Недостаточно деталей. Укажите конкретные названия компаний-конкурентов (прямых и косвенных) и объясните, чем вы от них отличаетесь.";
      }
      const keywords = ["отличие", "преимущество", "лучше", "быстрее", "дешевле", "уникаль"];
      const hasDiff = keywords.some(kw => ansLower.includes(kw));
      if (!hasDiff) {
        return "Конкуренты указаны, но не описано ваше уникальное торговое преимущество (УТП). Ответьте на вопрос: почему клиент выберет именно вас, а не их?";
      }
      return "Отличный анализ конкурентов. Ваше ключевое преимущество выглядит убедительно. Убедитесь, что его сложно скопировать крупным игрокам за 2-3 месяца.";
    } else {
      if (ansLower.length < 20) {
        return "Опишите модель монетизации более детально. Как именно вы планируете зарабатывать: подписка (SaaS), транзакции, реклама или прямые продажи?";
      }
      const keywords = ["подписк", "комисси", "транзакц", "руб", "тариф", "цена", "продаж", "монетиз"];
      const hasMon = keywords.some(kw => ansLower.includes(kw));
      if (!hasMon) {
        return "Вы описали процесс взаимодействия, но не указали конкретную финансовую модель. Какая у вас схема доходов: регулярные платежи (подписка) или разовая оплата?";
      }
      return "Финансовая схема понятна. Рекомендуется прописать ориентировочную стоимость для тестовой группы пользователей и оценить переменные затраты.";
    }
  };

  const handleAIAnalyze = async () => {
    if (!currentAnswer.trim()) return;
    setIsAnalyzing(true);
    setAiFeedback(null);
    try {
      const res = await axios.post('/api/ai/hint', {
        question: question.text,
        answer: currentAnswer
      });
      if (res.data && res.data.hint) {
        setAiFeedback(res.data.hint);
      } else {
        throw new Error("Empty response");
      }
    } catch (e) {
      console.warn("API AI request failed, falling back to client analysis", e);
      // Fallback на интеллектуальный клиентский анализ
      const hint = generateClientSideHint(question.id, currentAnswer);
      setAiFeedback(hint);
    }
    setIsAnalyzing(false);
  };

  const handleNext = () => {
    if (!isValid) return;
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAiFeedback(null);
    } else {
      localStorage.setItem('audit_answers', JSON.stringify(answers));
      navigate('/results');
    }
  };

  const updateAnswer = (val) => {
    setAnswers({ ...answers, [question.id]: val });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8 text-sm font-medium text-slate-500">
        <button 
          onClick={() => currentIdx > 0 ? setCurrentIdx(currentIdx-1) : navigate('/')} 
          className="hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18}/>
        </button>
        <span>Шаг {currentIdx + 1} из {QUESTIONS.length}</span>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{question.text}</h2>
        <p className="text-slate-500 mb-8">{question.desc}</p>

        <div className="relative">
          <textarea
            className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all min-h-[200px] resize-none text-slate-700"
            placeholder="Напишите ответ здесь..."
            value={currentAnswer}
            onChange={(e) => updateAnswer(e.target.value)}
          />
          
          <button 
            onClick={handleAIAnalyze}
            disabled={!currentAnswer.trim() || isAnalyzing}
            className="absolute bottom-5 right-5 flex items-center gap-2 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 px-5 py-2.5 rounded-xl transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={18} />
            {isAnalyzing ? "Думаю..." : "Спросить AI"}
          </button>
        </div>

        {currentAnswer.trim().length > 0 && !isValid && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm font-medium">
            <AlertCircle size={16} />
            <span>Минимальная длина ответа — 10 символов (введено: {currentAnswer.trim().length}).</span>
          </div>
        )}

        {aiFeedback && (
          <div className="mt-6 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 flex gap-4 text-purple-900 leading-relaxed shadow-inner">
            <Sparkles className="shrink-0 mt-1 text-purple-500" size={24} />
            <p className="text-[15px] font-medium">{aiFeedback}</p>
          </div>
        )}

        <div className="mt-10 flex justify-end">
          <button 
            onClick={handleNext}
            disabled={!isValid}
            className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl hover:bg-slate-800 transition-colors font-bold shadow-lg shadow-slate-900/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentIdx === QUESTIONS.length - 1 ? "Завершить аудит" : "Следующий вопрос"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
