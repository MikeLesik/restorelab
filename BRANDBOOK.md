# RestoreLab — Brand Book v1

> Живой документ. Все токены зафиксированы в `tailwind.config.mjs` и `src/styles/global.css`.
> При изменении дизайна — обновляй оба файла и этот документ одновременно.

---

## 1. Позиционирование

| | |
|---|---|
| **Бренд** | RestoreLab |
| **Tagline** | Restore. Don't Replace. |
| **Ниша** | Premium mobile surface restoration |
| **Гео** | Lisbon, Cascais, Sintra, Oeiras, Almada (Portugal) |
| **Аудитория** | Владельцы авто, яхт, катеров; B2C premium сегмент |
| **Тон** | Уверенный, экспертный, без лишних слов. Не агрессивный. |
| **Primary CTA** | WhatsApp — быстро, без формальностей |
| **Secondary CTA** | Lead form |

---

## 2. Цвета

### Палитра токенов

| Токен | Hex | RGB | Применение |
|-------|-----|-----|------------|
| `brand-dark` | `#0A0A0A` | 10 10 10 | Фон страницы, базовый фон |
| `brand-navy` | `#0D1B2A` | 13 27 42 | Секции, карточки, альтернативный фон |
| `brand-blue` | `#1B3A5C` | 27 58 92 | Акценты бордеров, градиент hero |
| `brand-accent` | `#2A7FFF` | 42 127 255 | Primary кнопка (`.btn-primary`), ссылки, индикаторы активности, focus ring |
| `brand-gold` | `#D4A537` | 212 165 55 | Premium теги, звёздочки рейтинга, иконки "exclusive" |
| `brand-light` | `#F5F5F5` | 245 245 245 | Основной текст body |
| `brand-white` | `#FFFFFF` | 255 255 255 | Заголовки, акцентный текст |
| `brand-whatsapp` | `#25D366` | 37 211 102 | WhatsApp кнопки — и только они |

### Правила использования цвета

- **Никогда** не использовать `brand-accent` (синий) для WhatsApp-действий — только `brand-whatsapp`.
- **Никогда** не использовать `brand-gold` как фоновый цвет — только для текста и тонких деталей.
- `brand-navy` и `brand-blue` — для глубины и слоёв, не для текста.
- Белый текст на тёмном фоне: `text-white` для заголовков, `text-white/60` для body, `text-white/40` для caption.
- Hex в шаблонах **запрещён** — только `brand-*` токены.

### Прозрачность (opacity scale)

| Использование | Класс |
|---|---|
| Заголовки, CTA | `text-white` / `text-brand-white` |
| Основной текст | `text-white/80` |
| Подзаголовки, body | `text-white/60` |
| Вспомогательный текст | `text-white/40` |
| Placeholder, microcopy | `text-white/35` |
| Разделители, бордеры | `border-white/10`, `border-white/5` |
| Hover-фон | `bg-white/5`, `bg-white/10` |

### Градиенты

| Токен | Значение | Применение |
|---|---|---|
| `bg-gradient-hero` | `linear-gradient(135deg, #0A0A0A → #0D1B2A → #1B3A5C)` | Hero section background |
| H1 gradient text | `from-brand-accent to-blue-300` | Вторая часть H1 заголовка |

---

## 3. Типографика

### Шрифты

| Роль | Шрифт | Класс | Применение |
|------|-------|-------|------------|
| **Display** | Space Grotesk Variable | `font-display` | H1, H2, H3, логотип, числа-статы |
| **Body** | DM Sans Variable | `font-sans` | Всё остальное: body, nav, кнопки, формы |

Оба шрифта — variable (подгружаются через `@fontsource-variable`).

### Шкала размеров — заголовки

| Уровень | Класс | Размер | Применение |
|---------|-------|--------|------------|
| Hero H1 | — | `text-5xl` → `lg:text-8xl` | Один на страницу |
| Section title | `.section-title` | `text-3xl` / `md:text-4xl` | Заголовок каждой секции |
| Card title | — | `text-xl` / `text-2xl` | Заголовки карточек |
| Label | `.label` | `text-[10px]` uppercase | Мета-метки, категории |

### Шкала размеров — текст

| Класс | Размер / вес | Применение |
|-------|-------------|------------|
| `.lead` | `text-xl`, `font-normal`, `leading-relaxed` | Первый абзац под H1/section-title |
| `.section-subtitle` | `text-lg`, `text-white/60` | Подзаголовок секции (под `.section-title`) |
| body | `text-base` | Обычный текст |
| `.caption` | `text-sm`, `text-white/40` | Дата, метаинфо, microcopy |
| `.label` | `text-[10px]`, `uppercase`, `tracking-[0.12em]` | Теги, категории, бейджи |

---

## 4. Компоненты

### Кнопки

#### `.btn-whatsapp` — Primary action
```
bg-brand-whatsapp · text-white · font-semibold · rounded-lg
hover:brightness-110
focus-visible:ring-2 focus-visible:ring-brand-whatsapp
```
Использовать: везде где действие = WhatsApp (Get Estimate, Get Quote).
Всегда с иконкой WhatsApp (`w-4 h-4` или `w-5 h-5`).

#### `.btn-primary` — Blue primary (редко)
```
bg-brand-accent · text-white · font-semibold · rounded-lg
hover:bg-blue-500
focus-visible:ring-2 focus-visible:ring-brand-accent
```
Использовать: навигационные CTA (Header "Get Estimate" → если не WA), non-WA формы.
**Не смешивать с `.btn-whatsapp` в одном визуальном ряду.**

#### `.btn-secondary` — Ghost
```
border border-white/20 · text-white · font-semibold · rounded-lg
hover:bg-white/10
```
Использовать: secondary action в паре с primary (See Before & After, Learn More).

### Карточка `.card`
```
bg-white/5 · border border-white/10 · rounded-2xl · p-6 · backdrop-blur-sm
```
Базовый контейнер для любого контентного блока.

### Тег `.tag`
```
text-xs · font-semibold · px-3 py-1 · rounded-full
```
Цвет задаётся отдельно. Примеры:
- Premium: `bg-brand-gold/10 text-brand-gold border border-brand-gold/20`
- Popular: `bg-brand-accent/10 text-brand-accent border border-brand-accent/20`

### Language switcher
Дропдаун (desktop) / inline-row (mobile menu).
Активный язык: `text-brand-accent bg-brand-accent/10`.
Неактивный: `text-white/60 hover:text-white`.

---

## 5. Layout & Grid

| | |
|---|---|
| **Max width** | `max-w-7xl` (1280px) |
| **Padding** | `px-4 sm:px-6 lg:px-8` |
| **Header height** | `h-16` (64px), fixed, `backdrop-blur-md` |
| **Section padding** | `py-24` базово |
| **Card gap** | `gap-6` / `gap-8` |

### Breakpoints (Tailwind default)

| Prefix | Min-width |
|--------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |

---

## 6. Фоновые паттерны

### Grid overlay
```css
bg-[linear-gradient(theme(colors.brand.accent/0.3)_1px,transparent_1px),
    linear-gradient(90deg,theme(colors.brand.accent/0.3)_1px,transparent_1px)]
bg-[size:60px_60px]
opacity-10
```
Используется как texture layer поверх hero gradient.

### Glow blobs
```
w-[600-800px] h-[400-600px]
bg-brand-accent/10 (синий) / bg-brand-gold/5 (золотой)
rounded-full blur-3xl pointer-events-none
```
1-2 blob'а на секцию hero. В других секциях — не использовать.

### Glassmorphism
```
bg-white/5 backdrop-blur-sm border border-white/10
```
Только для карточек поверх тёмного фона.

---

## 7. Иконки

- Библиотека: **inline SVG** (нет зависимости от иконочного шрифта)
- Стиль: `fill="none" stroke="currentColor"`, `stroke-width="2"` / `2.5`
- Размеры: `w-4 h-4` (inline), `w-5 h-5` (кнопки), `w-6 h-6` (UI), `w-8 h-8` (featured)
- WhatsApp иконка: `fill="currentColor"` (filled), всегда с `flex-shrink-0`

---

## 8. Доступность (Accessibility)

- **Focus ring**: `focus:outline-none focus-visible:ring-2 focus-visible:ring-{color} focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark` — на всех интерактивных элементах.
- `aria-expanded`, `aria-haspopup`, `aria-controls` — на dropdown и mobile menu.
- `aria-label` — на icon-only кнопках (бургер).
- `role="menu"` / `role="menuitem"` — на language dropdown.
- Все изображения: `alt` атрибут обязателен.

---

## 9. Анимации

| Класс / keyframe | Эффект | Применение |
|---|---|---|
| `transition-colors duration-200` | Смена цвета | Все hover-состояния |
| `transition-all duration-200` | Все свойства | WhatsApp кнопки |
| `hover:brightness-110` | Подсветка | `.btn-whatsapp` |
| `backdrop-blur-md` | Блюр | Header |
| `animate-pulse` | Пульс | Scroll indicator |
| `faq-open` (keyframe) | Slide-in `translateY(-6px → 0)` | FAQ раскрытие |
| `connector-flow` (keyframe) | Движущийся gradient | HowItWorks connector |

---

## 10. Копирайт & Тон голоса

### Принципы
- **Коротко**: максимум 2 предложения на subheadline
- **Конкретно**: цифры лучше прилагательных ("save 70%" vs "significant savings")
- **Выгода → Действие**: сначала что получает клиент, потом призыв
- **Без корпоративщины**: "we come to you" не "our mobile team will arrive at your location"

### Структура текста на экране
```
H1 — 4-6 слов
Subheadline — 1-2 предложения, ≤ 20 слов
Primary CTA — глагол + объект (Get Free Estimate, See Results)
Trust line — факты через · без заглавных
Microcopy — серый, маленький, под CTA
```

### Числа и факты (зафиксированные)
- Рейтинг: **5.0 Google**
- Отзывы: **47+**
- Работ выполнено: **500+**
- Экономия vs замена: **до 70%**
- Время ответа: **~30 минут**

---

## 11. i18n

| Код | Язык | Файл |
|-----|------|------|
| `en` | English (default) | `src/content/en.json` |
| `es` | Español | `src/content/es.json` |
| `pt` | Português | `src/content/pt.json` |

**Правило**: любой новый текст — добавляется во все 3 файла одновременно.

---

## 12. Что запрещено

| ❌ Нельзя | ✅ Нужно |
|---|---|
| Хардкодить hex в шаблонах | Использовать `brand-*` токены |
| `innerHTML` в JS | `createElement` + `textContent` |
| Хардкодить номер WhatsApp | `WHATSAPP_NUMBER` из `constants.ts` |
| Относительные импорты `../../` | Алиас `@/` |
| Синяя кнопка для WA-действий | `btn-whatsapp` / `brand-whatsapp` |
| Треккинг без согласия | CookieConsent → then GTM/Pixel/Clarity |
| Маршруты без `[lang]` | `/en/...`, `/es/...`, `/pt/...` |
