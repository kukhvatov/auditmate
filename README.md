# AuditMate

Веб-платформа для экспресс-аудита стартапов. Собирает ответы команды по ключевым осям проекта, генерирует AI-подсказки в реальном времени и выдаёт итоговый отчёт с радарной диаграммой.

## Стек

| Часть | Технологии |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, Recharts, Axios |
| Backend | Python 3.12, FastAPI, Uvicorn, HTTPX |
| Инфраструктура | Docker, Nginx |

## Быстрый старт (Docker)

```bash
docker compose up -d --build
```

- Фронт: http://localhost:80
- Бек: http://localhost:8000

## Локальная разработка

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API доступно на http://localhost:8000  
Документация (Swagger): http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Приложение доступно на http://localhost:5173  
Запросы `/api/*` автоматически проксируются на бекенд через Vite.

## API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| `POST` | `/api/ai/hint` | Подсказка трекера по одному ответу |
| `POST` | `/api/ai/report` | Итоговый отчёт с баллами по всем осям |

### POST /api/ai/hint

```json
{
  "question": "Какую проблему вы решаете?",
  "answer": "Стартапы не знают своих слабых мест"
}
```

### POST /api/ai/report

```json
{
  "answers": {
    "1": "Ответ на вопрос про проблему",
    "2": "Ответ на вопрос про конкурентов",
    "3": "Ответ на вопрос про монетизацию"
  }
}
```

## AI-интеграция

Бекенд пытается подключиться к локальному **LM Studio** (`http://localhost:1234`).  
Если LM Studio недоступен — автоматически переключается на встроенный анализатор ответов (fallback).

## Структура проекта

```
AuditMate/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   └── routers/
│       └── ai.py
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    ├── package.json
    └── src/
```
