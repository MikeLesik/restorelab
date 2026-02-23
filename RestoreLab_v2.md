# RestoreLab v2 — Redesign + Lead Generation Website  
### (Based on restorelab.io — EN / ES / PT)  

Цель: создать улучшенную, оптимизированную версию текущего сайта restorelab.io  
Фокус: рост конверсии (лиды), четкая специализация, SEO под Lisbon / Cascais / Sintra и яхтенные марины.

---

# 1. Основная концепция

RestoreLab — Mobile Surface Restoration Specialist  

Не просто detailing.  
Специализация:
- Car Paint Correction
- Glass Scratch Removal
- Acrylic / Polycarbonate Restoration
- Yacht Gelcoat & Transparent Surfaces

Позиционирование:
Premium mobile restoration service for cars, yachts and glass surfaces.  
No repainting. No replacement. On-site service.

---

# 2. Технологии

- Astro + TypeScript + TailwindCSS
- Статическая сборка (SSG)
- Деплой: Cloudflare Pages / Netlify / Vercel
- i18n: EN / ES / PT через JSON-файлы
- hreflang для SEO

---

# 3. Структура сайта

## Маршруты

/
→ редирект на /en

/en  
/es  
/pt  

/{lang}/services  
/{lang}/pricing  
/{lang}/cases  
/{lang}/contact  
/{lang}/privacy  
/{lang}/terms  

---

# 4. Главная страница (структура)

## 1️⃣ Hero

Заголовок:
Restore. Don’t Replace.

Подзаголовок:
Mobile paint, glass and yacht surface restoration in Lisbon & Cascais.

Две основные кнопки:
- Car Restoration
- Yacht Restoration

Sticky CTA (мобильная версия):
Get Quote via WhatsApp

---

## 2️⃣ Social Proof

- 5-star rating
- 3–5 отзывов
- Areas served: Lisbon, Cascais, Sintra, Oeiras

---

## 3️⃣ Core Services (ключевой блок)

### 1. Car Paint Correction & Polishing
- Removal of swirl marks
- Scratch correction
- Deep gloss restoration
- Preparation for ceramic coating
- No repainting required
- On-site service

Отдельная страница:
/{lang}/services/car-paint-correction

---

### 2. Glass Polishing & Scratch Removal
- Car windshields
- Side windows
- Architectural glass
- Yacht glass panels
- Water spot removal
- Wiper scratches removal
- No glass replacement required

Отдельная страница:
/{lang}/services/glass-polishing

---

### 3. Acrylic / Polycarbonate Restoration
- Yacht windows
- Boat hatches
- Clear plastic panels
- UV oxidation removal
- Clarity restoration
- Cost-effective alternative to replacement

Отдельная страница:
/{lang}/services/acrylic-restoration

---

### 4. Yacht Gelcoat Polishing
- Oxidation removal
- Shine restoration
- Protection coating
- Marine-grade finishing

Отдельная страница:
/{lang}/services/yacht-gelcoat

---

# 5. How It Works

1. Send photos via WhatsApp
2. Receive estimate
3. We come to your location
4. Restore & protect surfaces

---

# 6. Pricing Structure

Страница /{lang}/pricing

Car Packages:
- Base — from 189€
- Ceramic Prep — from 339€
- Premium Ceramic — from 459€

Yacht:
- Gelcoat polishing — from 15€/ft

Glass & Acrylic:
- Based on surface size and damage severity

Каждый пакет содержит:
- what’s included
- estimated time
- recommended use case
- CTA

---

# 7. Lead Generation System

Форма (на каждой странице + отдельная страница contact):

Fields:
- Name (required)
- Phone / WhatsApp (required)
- Service (dropdown)
- Location
- Message
- Optional photo upload (UI placeholder)

После отправки:
Открывается ссылка:
https://wa.me/<NUMBER>?text=pre-filled-message

Текст сообщения формируется на выбранном языке.

Sticky WhatsApp button всегда доступна.

---

# 8. SEO Requirements

Meta:
- Unique title/description per page
- OpenGraph tags
- Twitter cards

Schema:
- LocalBusiness
- FAQPage
- Service
- AggregateRating (если применимо)

Technical:
- sitemap.xml
- robots.txt
- hreflang EN / ES / PT
- Optimized images (webp/avif)
- Lazy loading

Target keywords:
- Car paint correction Lisbon
- Glass scratch removal Lisbon
- Yacht gelcoat polishing Cascais
- Acrylic restoration Portugal

---

# 9. Компонентная архитектура

Components:

- Layout
- Header
- Footer
- LanguageSwitcher
- StickyCTA
- Hero
- ServicesGrid
- PricingCards
- Testimonials
- FAQ
- CasesGallery
- LeadForm
- AreaServedSection

Контент хранится в:
src/content/en.json  
src/content/es.json  
src/content/pt.json  

---

# 10. UX Улучшения по сравнению с текущей версией

- Чёткое разделение Car / Yacht
- Отдельные SEO-страницы под каждую услугу
- Более сильный оффер в Hero
- Sticky CTA
- Быстрая мобильная версия
- Упор на “No Replacement Needed”
- Повышенное ощущение экспертности

---

# 11. План реализации

1. Создать IA (информационную архитектуру)
2. Сгенерировать структуру Astro-проекта
3. Создать страницы и компоненты
4. Добавить EN контент
5. Добавить ES и PT переводы
6. Настроить SEO
7. Проверить Lighthouse performance
8. Подготовить деплой инструкции

---

# 12. Финальный результат

Рабочий репозиторий с:

- install
- dev
- build

Готов к деплою на:
- Cloudflare Pages
- Netlify
- Vercel

Цель:  
Быстрый, премиальный, SEO-оптимизированный сайт,  
который генерирует больше лидов, чем текущая версия на Tilda.

# 13) Deploy (обязательно): Astro + Cloudflare Pages + GitHub

## Выбранный стек деплоя
- Frontend: Astro (SSG)
- Hosting: Cloudflare Pages
- Repo: GitHub (публичный или приватный)

## Требования к проекту, чтобы деплой прошёл без боли
1) Команды должны работать:
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

2) Сборка Astro должна отдавать статические файлы в папку:
- `dist/`

3) В репозитории обязательно должны быть:
- `.gitignore` (игнорировать node_modules, dist, .env)
- `.env.example` (пример переменных окружения)
- `README.md` с пошаговой инструкцией деплоя на Cloudflare Pages
- Скрипт(ы) в package.json: `dev`, `build`, `preview`

## GitHub (я новичок, нужно максимально просто)
Проект должен быть готов к загрузке на GitHub:
- все файлы в одной папке проекта
- без секретов/ключей в коде
- переменные (например WHATSAPP_NUMBER) только через `.env` и Cloudflare Pages Environment Variables

README должен содержать инструкции:

### Как создать репозиторий и залить проект в GitHub
1) Создать новый репозиторий на GitHub (без README).
2) В терминале внутри папки проекта выполнить:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <PASTE_YOUR_GITHUB_REPO_URL_HERE>
git push -u origin main