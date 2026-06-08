import httpx
from fastapi import APIRouter
from pydantic import BaseModel
import re

router = APIRouter()

class HintRequest(BaseModel):
    question: str
    answer: str

class ReportRequest(BaseModel):
    answers: dict

LM_STUDIO_URL = "http://localhost:1234/v1"

async def check_lm_studio():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{LM_STUDIO_URL}/models", timeout=1.5)
            if resp.status_code == 200:
                return True
    except Exception:
        pass
    return False

async def get_ai_response(prompt: str, question_text: str, answer_text: str) -> str:
    # 1. Пытаемся подключиться к локальной LM Studio, если она запущена
    is_local_running = await check_lm_studio()
    if is_local_running:
        try:
            async with httpx.AsyncClient() as client:
                data = {
                    "model": "local-model",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                }
                resp = await client.post(f"{LM_STUDIO_URL}/chat/completions", json=data, timeout=10.0)
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Ошибка обращения к локальной LLM: {e}")
            
    # 2. Умный локальный анализатор (Fallback), чтобы давать логичный и точный совет
    return analyze_answer_for_hint(question_text, answer_text)

def analyze_answer_for_hint(question: str, answer: str) -> str:
    ans_lower = answer.lower().strip()
    
    # Определение вопроса по ключевым словам
    if "проблем" in question.lower():
        if len(ans_lower) < 20:
            return "Вы описали проблему очень лаконично. Попробуйте раскрыть её подробнее: кто конкретно является конечным пользователем и в каких ситуациях возникает эта боль?"
        
        keywords = ["боль", "клиент", "пользователь", "теряет", "время", "деньги", "решение"]
        missing = [kw for kw in keywords if kw not in ans_lower]
        if missing:
            return f"Хорошее начало. Рекомендуется добавить в описание проблемы фокус на боли клиентов. Попробуйте использовать понятия: {', '.join(missing[:3])}."
        return "Отличное описание проблемы. Вы четко понимаете боли своей целевой аудитории. Попробуйте оцифровать её: сколько времени или денег теряет клиент в день?"
        
    elif "конкурент" in question.lower() or "рынок" in question.lower():
        if len(ans_lower) < 20:
            return "Недостаточно деталей. Укажите конкретные названия компаний-конкурентов (прямых и косвенных) и объясните, чем вы от них отличаетесь."
        
        keywords = ["отличие", "преимущество", "лучше", "быстрее", "дешевле", "уникаль"]
        has_diff = any(kw in ans_lower for kw in keywords)
        if not has_diff:
            return "Конкуренты указаны, но не описано ваше уникальное торговое преимущество (УТП). Ответьте на вопрос: почему клиент выберет именно вас, а не их?"
        return "Отличный анализ конкурентов. Ваше ключевое преимущество выглядит убедительно. Убедитесь, что его сложно скопировать крупным игрокам за 2-3 месяца."
        
    else: # Вопрос про монетизацию / финансы
        if len(ans_lower) < 20:
            return "Опишите модель монетизации более детально. Как именно вы планируете зарабатывать: подписка (SaaS), транзакции, реклама или прямые продажи?"
        
        keywords = ["подписк", "комисси", "транзакц", "руб", "тариф", "цена", "продаж", "монетиз"]
        has_mon = any(kw in ans_lower for kw in keywords)
        if not has_mon:
            return "Вы описали процесс взаимодействия, но не указали конкретную финансовую модель. Какая у вас схема доходов: регулярные платежи (подписка) или разовая оплата?"
        return "Финансовая схема понятна. Рекомендуется прописать ориентировочную стоимость для тестовой группы пользователей и оценить переменные затраты."

@router.post("/hint")
async def generate_hint(req: HintRequest):
    prompt = f"Ты умный AI-ассистент трекера стартапов. Задан вопрос: '{req.question}', ответ команды: '{req.answer}'. Дай одну точечную подсказку максимум в 2-3 предложениях, наводящую на более глубокую мысль."
    response = await get_ai_response(prompt, req.question, req.answer)
    return {"hint": response}

@router.post("/report")
async def generate_report(req: ReportRequest):
    answers = req.answers
    
    # Извлечение ответов
    ans1 = str(answers.get("1", answers.get(1, ""))).strip()
    ans2 = str(answers.get("2", answers.get(2, ""))).strip()
    ans3 = str(answers.get("3", answers.get(3, ""))).strip()
    
    len1 = len(ans1)
    len2 = len(ans2)
    len3 = len(ans3)
    
    ans1_lower = ans1.lower()
    ans2_lower = ans2.lower()
    ans3_lower = ans3.lower()
    
    # 1. Расчет оценки за Идею (качество ответа на 1-й вопрос)
    score_idea = 40
    if len1 > 10:
        score_idea += min(30, int(len1 / 8))
        # Ключевые слова
        keywords_idea = ["проблема", "решение", "боль", "клиент", "пользователь", "эффект", "потребность"]
        for kw in keywords_idea:
            if kw in ans1_lower:
                score_idea += 4
        score_idea = min(95, score_idea)
        
    # 2. Расчет оценки за Рынок (качество ответа на 2-й вопрос)
    score_market = 35
    if len2 > 10:
        score_market += min(30, int(len2 / 8))
        keywords_market = ["конкурент", "рынок", "отличие", "преимущество", "аналог", "сегмент", "уникал"]
        for kw in keywords_market:
            if kw in ans2_lower:
                score_market += 4
        score_market = min(95, score_market)
        
    # 3. Расчет оценки за Финансы (качество ответа на 3-й вопрос)
    score_finance = 30
    if len3 > 10:
        score_finance += min(30, int(len3 / 8))
        keywords_finance = ["платить", "монетиз", "выручк", "расход", "подписк", "транзакц", "руб", "цена", "тариф", "продаж"]
        for kw in keywords_finance:
            if kw in ans3_lower:
                score_finance += 4
        score_finance = min(95, score_finance)
        
    # 4. Расчет оценки за Команду (по упоминанию ролей и опыта во всех ответах)
    score_team = 45
    combined_answers = (ans1_lower + " " + ans2_lower + " " + ans3_lower)
    keywords_team = ["команда", "мы", "опыт", "разработчик", "дизайнер", "партнер", "основатель", "компетенц"]
    for kw in keywords_team:
        if kw in combined_answers:
            score_team += 5
    if len(combined_answers) > 200:
        score_team += 10
    score_team = min(95, score_team)
    
    # 5. Расчет оценки за Продукт (оценка технического описания во всех ответах)
    score_product = 40
    keywords_product = ["приложение", "сервис", "сайт", "платформ", "продукт", "технолог", "it", "софт", "mvp", "разработ"]
    for kw in keywords_product:
        if kw in combined_answers:
            score_product += 5
    score_product += min(15, int(len(combined_answers) / 30))
    score_product = min(95, score_product)
    
    overall = (score_idea + score_team + score_market + score_finance + score_product) // 5
    
    # Формирование рекомендаций
    recommendations = []
    
    # Идея
    if score_idea < 65:
        recommendations.append({
            "type": "error",
            "title": "Идея и Ценность (Недостаточная проработка)",
            "text": "Описание боли клиента слишком поверхностно. Постарайтесь детальнее прописать профиль пользователя и оцифровать масштаб решаемой проблемы."
        })
    else:
        recommendations.append({
            "type": "success",
            "title": "Идея и Ценность (Сильная сторона)",
            "text": "Отличная проработка гипотезы проблемы. Вы четко сфокусированы на потребностях клиентов."
        })
        
    # Рынок
    if score_market < 65:
        recommendations.append({
            "type": "error",
            "title": "Рынок и Конкуренты (Зона риска)",
            "text": "Не проработано ваше уникальное торговое отличие (УТП). Настоятельно рекомендуется составить карту конкурентов и четко выделить ваши барьеры защиты от копирования."
        })
    else:
        recommendations.append({
            "type": "success",
            "title": "Рынок и Конкуренты (Проработано)",
            "text": "Хорошее понимание ландшафта рынка и сформированное конкурентное преимущество."
        })
        
    # Финансы
    if score_finance < 60:
        recommendations.append({
            "type": "error",
            "title": "Финансы и Монетизация (Критично)",
            "text": "Модель генерации выручки не определена или не содержит цифр. Опишите плановый тариф или средний чек на транзакцию для расчета юнит-экономики."
        })
    else:
        recommendations.append({
            "type": "success",
            "title": "Финансы и Монетизация (Проработано)",
            "text": "Определена коммерческая модель с понятным потоком входящих платежей от клиентов."
        })
        
    # Команда / Продукт
    if score_team < 60:
        recommendations.append({
            "type": "error",
            "title": "Команда проекта (Зона роста)",
            "text": "Компетенции создателей не описаны в тексте. Укажите, кто отвечает за разработку продукта, а кто — за продажи и маркетинг."
        })
    else:
        recommendations.append({
            "type": "success",
            "title": "Команда проекта (Баланс)",
            "text": "В ответах прослеживается четкое распределение зон ответственности и необходимый опыт для реализации."
        })

    return {
        "overall_score": overall,
        "categories": [
            {"subject": "Идея", "score": score_idea, "fullMark": 100},
            {"subject": "Команда", "score": score_team, "fullMark": 100},
            {"subject": "Рынок", "score": score_market, "fullMark": 100},
            {"subject": "Финансы", "score": score_finance, "fullMark": 100},
            {"subject": "Продукт", "score": score_product, "fullMark": 100},
        ],
        "recommendations": recommendations
    }
