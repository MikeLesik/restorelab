# RestoreLab v2

Сайт премиального мобильного сервиса по восстановлению поверхностей — коррекция лакокрасочного покрытия, полировка стекла, восстановление акрила и гелькоута яхт в Лиссабоне и Кашкайше.

**Стек:** Astro · TypeScript · TailwindCSS · статическая сборка (SSG)
**Языки:** EN / ES / PT
**Деплой:** Cloudflare Pages (рекомендуется) · Netlify · Vercel

---

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать файл переменных окружения и заполнить значения
cp .env.example .env

# 3. Запустить сервер разработки
npm run dev

# 4. Собрать для продакшена
npm run build

# 5. Локально просмотреть продакшен-сборку
npm run preview
```

Сервер разработки запускается на `http://localhost:4321`.
Корневой URL редиректит на `/en`. Другие языки: `/es`, `/pt`.

---

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни значения:

| Переменная | Описание | Пример |
|---|---|---|
| `PUBLIC_WHATSAPP_NUMBER` | Номер WhatsApp, только цифры с кодом страны | `351912345678` |
| `PUBLIC_SITE_URL` | URL продакшен-сайта | `https://restorelab.io` |

**Никогда не коммить `.env` в git.** Файл `.gitignore` уже исключает его.

---

## Структура проекта

```
restorelab/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── _headers          ← Заголовки безопасности и кэша для Cloudflare
│   └── _redirects        ← Редиректы для Cloudflare
├── src/
│   ├── content/
│   │   ├── en.json       ← Английский контент
│   │   ├── es.json       ← Испанский контент
│   │   └── pt.json       ← Португальский контент
│   ├── components/       ← Переиспользуемые Astro-компоненты
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro              ← Редирект на /en
│   │   └── [lang]/
│   │       ├── index.astro          ← Главная страница
│   │       ├── services/
│   │       │   ├── index.astro
│   │       │   ├── car-paint-correction.astro
│   │       │   ├── glass-polishing.astro
│   │       │   ├── acrylic-restoration.astro
│   │       │   └── yacht-gelcoat.astro
│   │       ├── pricing.astro
│   │       ├── cases.astro
│   │       ├── contact.astro
│   │       ├── privacy.astro
│   │       └── terms.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

---

## Как добавить реальный контент

### Номер WhatsApp
Отредактируй `.env`:
```
PUBLIC_WHATSAPP_NUMBER=351912345678
```

### Текст и переводы
Весь текст сайта хранится в `src/content/`:
- `en.json` — английский
- `es.json` — испанский
- `pt.json` — португальский

Отредактируй нужный файл — изменения применяются ко всем страницам на этом языке автоматически.

### Фото «До / После»
Положи изображения в `public/images/cases/` и обнови `src/components/CasesGallery.astro`.

### Фото для OpenGraph
Положи файл `public/images/og-home.jpg` (рекомендуемый размер 1200×630 пикселей).

---

## Деплой на Cloudflare Pages

### Шаг 1 — Загрузить проект на GitHub

Если репозиторий ещё не создан:

1. Зайди на [github.com](https://github.com) → **New repository**
2. Дай имя репозиторию (например `restorelab`), не добавляй README
3. В терминале, внутри папки проекта, выполни:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <ВСТАВЬ_ССЫЛКУ_НА_РЕПОЗИТОРИЙ>
git push -u origin main
```

> Ссылку на репозиторий скопируй со страницы GitHub (кнопка **Code → HTTPS**).

### Шаг 2 — Создать проект на Cloudflare Pages

1. Зайди на [dash.cloudflare.com](https://dash.cloudflare.com)
2. Нажми **Workers & Pages → Create application → Pages → Connect to Git**
3. Выбери свой репозиторий на GitHub
4. Настрой параметры сборки:

| Параметр | Значение |
|---|---|
| Framework preset | **Astro** |
| Build command | `npm run build` |
| Build output directory | `dist` |

### Шаг 3 — Добавить переменные окружения

В Cloudflare Pages → твой проект → **Settings → Environment Variables**, добавь:

```
PUBLIC_WHATSAPP_NUMBER = 351912345678
PUBLIC_SITE_URL        = https://restorelab.io
NODE_VERSION           = 20
```

### Шаг 4 — Задеплоить

Нажми **Save and Deploy**. Сайт будет доступен примерно через 2 минуты.

### Шаг 5 — Подключить домен (по желанию)

В **Pages → твой проект → Custom domains** добавь `restorelab.io` и следуй инструкции по настройке DNS.

---

## Деплой на Netlify

```bash
# Установить Netlify CLI
npm install -g netlify-cli

# Войти и задеплоить
netlify login
netlify deploy --build --prod
```

Или подключи GitHub-репозиторий на [app.netlify.com](https://app.netlify.com):
- Build command: `npm run build`
- Publish directory: `dist`

---

## Деплой на Vercel

```bash
npm install -g vercel
vercel --prod
```

---

## SEO-чеклист

- [x] Уникальные `<title>` и `<meta description>` на каждой странице
- [x] OpenGraph теги
- [x] Twitter Card теги
- [x] `hreflang` для EN / ES / PT + `x-default`
- [x] `robots.txt`
- [x] JSON-LD схема LocalBusiness
- [x] JSON-LD схема FAQPage
- [x] JSON-LD схема Service на каждой странице услуги
- [ ] `sitemap.xml` — добавить `@astrojs/sitemap` (см. ниже)
- [ ] Реальные фото в формате WebP/AVIF
- [ ] Верификация в Google Search Console

### Как добавить sitemap.xml

```bash
npm install @astrojs/sitemap
```

Затем в `astro.config.mjs`:
```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://restorelab.io',
  integrations: [tailwind(), sitemap()],
});
```

---

## Решение проблем

Если что-то пошло не так:
1. Убедись, что папка `node_modules/` существует — если нет, выполни `npm install`
2. Проверь, что файл `.env` создан и содержит правильные значения
3. Запусти `npm run build` и прочитай сообщения об ошибках

Требуется Node.js версии 18 или выше.
