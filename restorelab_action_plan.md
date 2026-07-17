# План исправлений restorelab.io
**Цель:** максимизировать конверсию сайта (visitor → WhatsApp/lead → booking → paid job)
**Период:** 12 недель
**Подход:** 3 фазы по приоритету и time-to-value
**Дата:** Апрель 2026

---

## Контекст

Премиум mobile detailing в Sant Cugat / Barcelona / Terrassa. 6 услуг, 3 языка, чек 79–1049 €. Воронка преимущественно WhatsApp (+34 680 265 190).

## Условные обозначения

- **Effort:** S = до 1 ч · M = 2–8 ч · L = > 1 дня
- **Impact:** 🔴 критический · 🟠 высокий · 🟡 средний · 🟢 стратегический
- **Owner:** Dev = разработчик · Owner = вы · Copy = копирайтер/носитель языка · Video = видеограф

---

## 📊 Базовые метрики (зафиксировать ДО изменений)

Поставьте GA4 + Meta Pixel + WhatsApp Business analytics, прежде чем что-то менять. Иначе uplift нечем замерить.

Замерить за 7 дней до старта:
- Уникальные сессии (overall + per-language)
- Bounce rate главной
- Scroll-depth на главной (25/50/75/100%)
- Клики по каждому WA-CTA (нужен event на каждой кнопке)
- Calculator: started / completed
- Отправок формы «Send via WhatsApp»
- Средний reply-time в WA (сейчас декларируется ~30 мин — проверьте реальность)
- Conversion: WA-сообщение → подтверждённая запись → выполненная работа

Без этого baseline весь дальнейший план — это вера. С ним — управление.

---

# ФАЗА 0 — Критические фиксы (3–5 дней)

Эти 5 пунктов чинятся за пару рабочих смен. Они блокируют доверие и явно ломают воронку. Запускать всё до того, как начнёте платный трафик.

## F-01 · Убрать placeholder NIF из футера
**Effort:** S · **Impact:** 🔴 · **Owner:** Owner + Dev

*Проблема:* В футере публично виден `NIF: B-XXXXXXXX (Provisional — pending registration)`. Для испанского клиента и любого B2B это red flag — особенно при чеке от 500 €.

*Действие:*
- Если NIF уже получен — вставить настоящий.
- Если ещё нет — убрать строку полностью до получения. Заменить на: `restoreLab S.L. · Sant Cugat del Vallès, 08172 Barcelona · Seguro de responsabilidad profesional 500 000 €`
- Параллельно проверить: NIF не должен светиться нигде ещё (в ToS, Privacy Policy, фактурах-шаблонах).

*Готово когда:* в HTML нет строки «B-XXXXXXXX» нигде на сайте.

---

## F-02 · Локализовать WhatsApp prefill-сообщения
**Effort:** S · **Impact:** 🔴 · **Owner:** Dev + Copy

*Проблема:* В ES-версии все WhatsApp-ссылки открывают чат с английским текстом: `Hello restoreLab! I'd like a quote for: Corrección de Pintura Auto`. Это режет конверсию и сигналит «шаблон сделан небрежно».

*Действие:* для каждой языковой версии — свой префиллер. Шаблоны:

**EN:**
- Hero: `Hello restoreLab! I'd like to get a free estimate. [From homepage]`
- Service card: `Hello restoreLab! I'd like a quote for: {Service Name}. [From homepage]`
- Pricing card: `Hello restoreLab! I'm interested in the "{Plan}" package. Could you send me a quote? [From pricing]`
- Footer: `Hello restoreLab! I have a question. [From footer]`

**ES:**
- Hero: `¡Hola restoreLab! Me gustaría un presupuesto gratuito. [Desde la home]`
- Service card: `¡Hola restoreLab! Quería un presupuesto para: {Nombre del servicio}. [Desde la home]`
- Pricing card: `¡Hola restoreLab! Me interesa el paquete "{Plan}". ¿Podríais enviarme un presupuesto? [Desde precios]`
- Footer: `¡Hola restoreLab! Tengo una pregunta. [Desde el pie]`

**CA:**
- Hero: `Hola restoreLab! M'agradaria un pressupost gratuït. [Des de la home]`
- Service card: `Hola restoreLab! Voldria un pressupost per a: {Nom del servei}. [Des de la home]`
- Pricing card: `Hola restoreLab! M'interessa el paquet "{Plan}". Em podríeu enviar un pressupost? [Des de preus]`
- Footer: `Hola restoreLab! Tinc una pregunta. [Des del peu]`

*Готово когда:* проверка из всех 3 языковых версий на 5 разных кнопках открывает WhatsApp с правильным языком.

---

## F-03 · Calculator должен показывать результат на странице (не в WhatsApp)
**Effort:** M · **Impact:** 🔴 · **Owner:** Dev

*Проблема:* «Get Your Instant Estimate» обещает «price range in seconds», но после 4-х шагов отправляет в WhatsApp с пустым «Suggested add-ons». Каждый, кто прошёл 4 шага — это лид с максимальным интентом, и сейчас на нём теряется ~30–50%.

*Действие:* реализовать матрицу подбора пакета и показать результат прямо в блоке.

Логика (упрощённая):
```
Inputs: vehicle_size {S/M/L}, paint_condition {light/medium/heavy},
        paint_color {standard/metallic/black/white}, goals[]

Base price (sedan):
  light → Express Refresh 149€
  medium → Single-Stage 289€
  heavy → Two-Stage 549€
  + ceramic in goals → upgrade to Ceramic 2Y 649€ or Premium 5Y 1049€
  + glass scratch in goals → +89€ add-on
  + pre-sale in goals → switch to Pre-Sale Pack 249€

Multiplier:
  S = ×0.9
  M = ×1.0
  L = ×1.2

Color penalty:
  black = +15% (показ дополнительных дефектов)
  white pearl = +10%
  metallic = +5%
  standard = +0%

Output: "Your estimate: 720–890 € · Recommended package: Ceramic 2Y"
```

UX блока результата:
- Крупный диапазон цены (от–до, ±10%)
- Рекомендованный пакет с одной кнопкой «See package details»
- Add-ons как чекбоксы с импактом цены в реальном времени
- Две кнопки: **«Send to WhatsApp with these details»** (prefill: всё, что выбрано) + **«Book free on-site assessment»**
- Маленький disclaimer: «Final price after photo review or on-site inspection»

*Готово когда:* пользователь видит конкретную цену на странице, без необходимости открывать WhatsApp.

---

## F-04 · Booking-страница: либо живой календарь, либо снять кнопку
**Effort:** M (Cal.com) или S (скрыть) · **Impact:** 🔴 · **Owner:** Dev + Owner

*Проблема:* `/booking` рендерит вкладки «Free Estimate / Detail Booking» — но самой формы/календаря не видно. Кнопка «Book Online» есть в шапке. Это либо JS-only без fallback, либо дыра.

*Действие — выбрать один вариант:*

**Вариант A (рекомендуемый):** интегрировать Cal.com или Calendly:
- 2 типа встреч: «Free Estimate Visit» (30 мин, бесплатно) и «Detail Booking» (зависит от пакета)
- Доступность: ваше реальное расписание, синк с Google Calendar
- Подтверждение: автоматически + WhatsApp-message с адресом
- Цена Cal.com Pro: ~12 €/мес. Calendly: free до базовых нужд.

**Вариант B (если не готовы):** убрать «Book Online» из меню и хедера; оставить только WA-CTA. Лучше явно нет, чем сломанная кнопка.

*Готово когда:* клик «Book Online» либо открывает работающий календарь, либо такой кнопки нет в меню.

---

## F-05 · Сертификации с будущей датой — пометить или убрать
**Effort:** S · **Impact:** 🟠 · **Owner:** Owner

*Проблема:* «IDA Member Q3 2026» и «Ceramic Pro Q4 2026» поданы как актуальные бейджи, хотя ещё не получены.

*Действие:*
- Если получили — убрать дату, оставить просто «IDA Member» / «Ceramic Pro Certified»
- Если не получили — либо убрать совсем до получения, либо явно подписать: «In progress — Q3 2026»

*Готово когда:* ни одна сертификация не подаётся как имеющаяся, если её нет.

---

# ФАЗА 1 — Высокий ROI (2–4 недели)

Это блок, где зашита основная uplift-конверсия. Ожидаемый кумулятивный эффект при честной реализации: **+25–40% к conversion rate** на холодном трафике, +50–70% на платном.

## F-06 · Заменить «🏳️» (белый флаг) для каталанского
**Effort:** S · **Impact:** 🟡 · **Owner:** Dev

*Проблема:* белый флаг рядом с CA в Каталонии считывается ноль-нейтрально или негативно.

*Действие:* три варианта на выбор:
1. Убрать флаги совсем: `EN | ES | CA`
2. Использовать Senyera (флаг Каталонии): `🇬🇧 EN | 🇪🇸 ES | 🟨 CA` (через эмодзи) — но не у всех систем хорошо рендерится
3. Кастомные иконки SVG (рекомендуется): EN — Union Jack, ES — flag of Spain, CA — Senyera (4 красные полосы на жёлтом)

*Готово когда:* белого флага нет; визуально понятно три выбора без двусмысленности.

---

## F-07 · Каталанская версия — полное ревью носителем
**Effort:** M · **Impact:** 🟠 · **Owner:** Owner + native CA copywriter

*Проблема:* Sant Cugat — каталано-говорящий рынок. Если CA-версия = автоперевод EN или ES, теряется доверие именно на самом плотном локальном сегменте.

*Действие:*
- Найти носителя (Fiverr / Upwork / локальный фрилансер) на 3–5 часов работы (~150–250 €)
- Прогнать все страницы: home, services (×6), pricing, cases, FAQ, booking, contact
- Особое внимание: WhatsApp-префиллы, формулы вежливости, естественные обороты
- Проверить SEO-семантику в CA: «correcció de pintura cotxe Barcelona», «poliment de vidre Sant Cugat» и т.д. — основные локальные запросы в Google.cat

*Готово когда:* каталано-говорящий клиент проходит по сайту и не запинается ни на одной фразе.

---

## F-08 · Добавить email + callback альтернативы рядом с WhatsApp
**Effort:** M · **Impact:** 🟠 · **Owner:** Dev + Owner

*Проблема:* воронка моноканальна — всё в WA. Это режет минимум 3 сегмента: B2B-флоты (хотят email + PDF), старшая аудитория (хотят звонок), не-WA пользователи (есть и такие, особенно среди экспатов с iMessage).

*Действие:* рядом с каждым основным CTA-блоком (hero, конец секции цен, footer) — три кнопки в одну строку:
1. **WhatsApp** (primary, как сейчас)
2. **Call now** (`tel:+34680265190`) — отдельная кнопка
3. **Email quote** (открывает простую форму: имя, email, услуга, фото-загрузка)

Email-форма должна:
- Принимать до 5 фото (JPEG/PNG/HEIC, до 10 MB каждое)
- Уходить на ваш email + дублироваться в CRM/Google Sheets
- Автоответом (instant): «Got it — we'll reply within 30 min» + ссылка на FAQ

*Готово когда:* посетитель может получить котировку 3 разными способами с любой ключевой страницы.

---

## F-09 · Расширить Hero H1 — покрыть все услуги
**Effort:** S · **Impact:** 🟠 · **Owner:** Owner + Copy

*Проблема:* «Premium paint correction & ceramic coating» — отсекает половину аудитории (царапины на лобовом, жёлтые фары, акрил, кожаный салон). Эти услуги в портфолио есть.

*Действие:* варианты на A/B-тест (выбрать 2–3 для запуска):

**Вариант А (умеренное расширение):**
> H1: Factory finish. At your doorstep.
> Sub-H1: Paint correction, glass polishing, headlight & leather restoration — premium mobile service in Sant Cugat & Barcelona. We come to your garage.

**Вариант B (фокус на боли + диапазон):**
> H1: Don't replace — restore.
> Sub-H1: Scratched paint, foggy headlights, hazy windscreens, yellowed acrylic — fixed on-site. From €79. Sant Cugat · Barcelona.

**Вариант C (премиум-якорь):**
> H1: Save your car's value. Without a workshop.
> Sub-H1: Mobile paint correction, ceramic coating, glass & headlight restoration. €500K insured · Gyeon & Gtechniq certified.

*Готово когда:* H1 покрывает минимум 4 из 6 ваших услуг и/или прямо называет боль клиента.

---

## F-10 · Разнести trust-стек по всей странице, а не только в hero
**Effort:** S · **Impact:** 🟠 · **Owner:** Dev

*Проблема:* «★ 5.0 · 47+ Reviews · 500+ Jobs · €500K Insurance» висит в hero и больше не появляется. Каждый CTA должен сидеть рядом с микро-доказательством.

*Действие:* добавить мини-trust-блок (1 строка, без графики) под/над каждым ключевым CTA:

- Над hero CTA: уже есть, оставить.
- Под кнопкой каждого service card: `★ 5.0 · 500+ jobs · Mobile`
- Над кнопкой каждого pricing card: `Insured · Certified detailers · Satisfaction guarantee`
- В calculator-результате: `47+ verified Google reviews · €500K liability insurance`
- В footer-CTA: `Avg reply 28 min · We come to you`

Психологический принцип: каждое решающее действие должно стоять *рядом* с доказательством — не в 5 экранах вверху.

*Готово когда:* на скриншоте каждой странице любой CTA имеет видимое доказательство в радиусе 100 px.

---

## F-11 · Видео-отзывы клиентов (3–5 шт)
**Effort:** L · **Impact:** 🔴 · **Owner:** Owner + Video + 3-5 клиентов

*Проблема:* текстовые отзывы с инициалами (David M., Sofia R.) для премиум-чека 500–1000 € недостаточны. Видео конвертит в 2–3 раза сильнее текста.

*Действие:*
1. Выбрать 3–5 самых довольных клиентов (просмотрите вашу историю WA-чатов).
2. Договориться на 5-минутный визит для съёмки (можно совместить с follow-up визитом).
3. Снять на телефон в горизонтали 4K, c lavalier-микрофоном (~30 € одноразово). Сценарий:
   - Имя + город (5 сек)
   - Какая была проблема + что попробовали раньше (15 сек)
   - Что сделали restoreLab (15 сек)
   - Результат + рекомендация (10 сек)
4. Смонтировать минимально — обрезать, добавить before/after-врезки, ваш логотип в углу. Каждое видео 30–45 сек.
5. На сайте: `<video poster="...thumbnail" controls preload="metadata">` чтобы не грузилось до клика. На главной — 1–2 видео в секцию «Client Results» вместо одного из текстовых отзывов; на cases-page — 3–5.

*Готово когда:* минимум 3 видео-отзыва опубликованы и работают на мобильном без autoplay.

---

## F-12 · Пересчитать пропорцию reviews/jobs или переформулировать
**Effort:** M (если делать догон отзывов) или S (если переформулировать) · **Impact:** 🟠 · **Owner:** Owner

*Проблема:* «47+ reviews» против «500+ jobs» = 9.4%. Это нормально для отрасли, но создаёт неявный вопрос «а 90% — недовольны?».

*Действие — два пути:*

**Путь A (рекомендуемый, если есть ресурс):** догнать reviews до 100+ через автоматический WA-follow-up на T+48h:
> «Hola {имя}, ¿qué te ha parecido el resultado? Si estás satisfecho, ¿podrías dejarnos una reseña? Tarda 1 minuto y nos ayuda muchísimo: {ссылка прямо на форму отзыва Google}»

При conversion 25–30% от 500+ клиентов вы получаете 125+ отзывов за 2–3 месяца.

**Путь B (быстро):** переформулировать на сайте:
- Убрать «500+ Jobs» как отдельную метрику
- Оставить: «★ 5.0 on Google · 47 verified reviews · 4 years of mobile detailing»
- Или: «Trusted by 500+ customers across Sant Cugat & Barcelona» (без явной арифметики)

*Готово когда:* либо ratio выправлен (reviews ≥ 20% от jobs), либо метрики переписаны без диссонанса.

---

## F-13 · Интерактивный before/after slider
**Effort:** M · **Impact:** 🟠 · **Owner:** Dev

*Проблема:* кейсы рендерятся как пары картинок «before / after» — статически. Slider (тащимый разделитель) повышает engagement в 3–5×.

*Действие:* любая лёгкая JS-библиотека (Cocoen, Img-Comparison-Slider) или 30 строк ванильного JS. Каждый кейс:
- Слайдер до/после
- Подпись с авто/услугой/«saved €X»
- Маленький бейдж «Verified Google reviewer» если клиент оставил отзыв
- (опционально) Линк на конкретный отзыв в Google

Бонус: добавить EXIF-дату в caption для самых сильных кейсов — как лёгкое доказательство.

*Готово когда:* пользователь может перетащить разделитель на каждом кейсе; работает на mobile (touch).

---

## F-14 · Показать size multipliers на странице цен
**Effort:** S · **Impact:** 🟡 · **Owner:** Dev + Owner

*Проблема:* «Sedan prices shown — see size multipliers below» — а multipliers нигде не показаны на странице. Клиент с SUV приходит с ожиданием 649 €, а вы ему называете 779 €. Разрыв шаблона на самом дорогом этапе.

*Действие:* небольшая таблица под прайсом:

| Vehicle size | Multiplier | Example: Ceramic 2Y |
|--------------|------------|--------------------|
| Compact / Hatchback | −10% | 584 € |
| Sedan / Estate | base | 649 € |
| Coupé / Small SUV | +10% | 714 € |
| Large SUV / Van | +20% | 779 € |
| Truck / Pickup | +30% | 844 € |

*Готово когда:* на странице цен видна точная цена для каждого размера машины без необходимости спрашивать.

---

## F-15 · UTM-разметка + GTM + GA4 + Meta Pixel
**Effort:** M · **Impact:** 🟢 · **Owner:** Dev

*Проблема:* WA-префиллы трекают источник в чате (умно), но GA/Meta/Google Search Console не подключены. Это слепота при любом масштабировании рекламы.

*Действие:*
1. Установить GTM (Google Tag Manager) на все страницы
2. Через GTM поднять GA4 и Meta Pixel
3. Поставить event-трекинг на:
   - Все WA-кнопки (`event: whatsapp_click`, params: `location, language, service`)
   - Calculator: `calc_started`, `calc_step_completed`, `calc_finished`, `calc_to_wa`
   - Email-форму: `email_form_submitted`
   - Phone-кнопки: `phone_click`
   - Scroll: 25/50/75/100%
4. UTM на всех внешних ссылках в Google Business / Insta / реклама:
   - `?utm_source=google_business&utm_medium=organic&utm_campaign=gmb_main`
   - `?utm_source=instagram&utm_medium=social&utm_campaign=ig_bio`
5. Связать GA4 с Search Console и Google Ads

*Готово когда:* в GA4 за неделю видны полные сессии с разбивкой по каналам и event-трекингом всех CTA.

---

## F-16 · Проверить и зафиксировать Google reviews link
**Effort:** S · **Impact:** 🟡 · **Owner:** Owner

*Проблема:* `g.page/restorelab-santcugat` — shortlink, такие иногда отваливаются после re-verification профиля.

*Действие:*
- Зайти в свой Google Business Profile → раздел «Customers» → «Reviews» → копировать прямую ссылку «Get more reviews» (формат `g.page/r/...`)
- Или сгенерировать через `https://search.google.com/local/writereview?placeid={place_id}` — самая стабильная
- Заменить во всех местах: hero, footer, follow-up WA-сообщения

*Готово когда:* клик ведёт прямо на форму написания отзыва (не на промежуточную страницу).

---

## F-17 · Подкрепить «€500K Insurance» логотипом или PDF-полисом
**Effort:** S · **Impact:** 🟡 · **Owner:** Owner

*Проблема:* «Professional liability insurance — €500,000 coverage» — текст без визуального якоря. Для машин 60K€+ это решающий аргумент в сравнении с конкурентами.

*Действие:*
- Логотип страховщика (Mapfre / AXA / Allianz и т.д., с разрешения) рядом с упоминанием
- Альтернатива: маленький бейдж-иконка щита + ссылка на PDF-сертификат полиса (с замазанными личными данными)
- Раздел «About» / «Why us» — фото вашей team с подписью «Insured · Certified · 4 years on the road»

*Готово когда:* «€500K» подкреплён хотя бы одним визуальным/документальным доказательством.

---

# ФАЗА 2 — Стратегические рычаги (1–3 месяца)

Эти пункты не для быстрого uplift главной — они открывают новые сегменты, повышают LTV и строят защитный SEO-ров.

## F-18 · Отдельный landing для EV (Tesla, BMW i, Polestar)
**Effort:** L · **Impact:** 🟢 · **Owner:** Owner + Copy + Dev

В Sant Cugat и Sarrià-Sant Gervasi плотный кластер EV-владельцев. Tesla Model Y и Model 3 — массовые. Премиум-сегмент с понятной болью: тонкая клир-кот, чувствительная к swirl marks; PPF/ceramic — востребованы.

Что сделать:
- URL: `/en/ev-protection`, `/es/proteccion-vehiculos-electricos`, `/ca/proteccio-vehicles-electrics`
- H1 фокус на брендах: Tesla, BMW i, Polestar, Lucid, Mercedes EQ
- Кейсы только с EV
- Специфика: PPF на капот/пороги, ceramic совместимый с charging port, быстрая мойка без кругового абразива
- CTA: WA с pre-fill «I'd like a quote for my Tesla Model 3 ceramic coating»

## F-19 · Отдельный landing для B2B / Fleet
**Effort:** L · **Impact:** 🟢 · **Owner:** Owner + Copy + Dev

URL: `/en/business-fleet`. Аудитория: car dealers (pre-sale prep), rental companies, corporate fleets, classic car collectors.

Особенности:
- Цены на объём (10+ машин со скидкой 15–25%)
- Recurring care plans (monthly fleet maintenance)
- PDF-presupuesto + email-quote форма (не WA)
- Кейсы B2B: логотипы клиентов (с разрешения)
- CTA: «Request a fleet quote» → Calendly call 30 min, не WA

## F-20 · Landing для коммерческого стекла
**Effort:** L · **Impact:** 🟢 · **Owner:** Owner + Copy + Dev

URL: `/en/commercial-glass`. Аудитория: рестораны, бутики, отели, офисные здания со scratched shopfronts. Это В2В-ниша с очень слабой конкуренцией в Барселоне и средним чеком 500–2000 € за объект.

- H1: «Don't replace shopfront glass. Restore it.»
- Кейсы коммерческих фасадов
- ROI-калькулятор: «Glass replacement: 2000 € · Glass restoration: 600 € · Saved: 1400 €»
- B2B-форма + email + Calendly

## F-21 · Landing для Care Plans (повторяющийся доход)
**Effort:** L · **Impact:** 🟢 · **Owner:** Owner + Dev

URL: `/en/care-plans`. Subscription-формат:
- **Monthly Refresh:** 99 €/мес — поддерживающая мойка + spray sealant + проверка ceramic
- **Quarterly Renewal:** 169 €/3 мес — глубокая декон + полировка lights + interior touch-up
- **Annual Premium:** 549 €/год — полный refresh + продление гарантии ceramic

Для бизнеса это recurring revenue + lower CAC (один раз привлёк — несколько лет монетизируешь).

## F-22 · Видимая ёмкость booking-календаря (urgency)
**Effort:** S (если F-04 сделан) · **Impact:** 🟠 · **Owner:** Dev

Когда живой календарь работает (F-04), показывайте на главной/booking бейдж типа:
- «3 slots remaining this week»
- «Next available: Tuesday, May 5»
- «Currently booking 2 weeks ahead»

Это и честно, и одновременно создаёт мягкий urgency. Работает только если за этим стоит реальная capacity — не выдумывайте.

## F-23 · Academy → лид-магниты + встроенный calc
**Effort:** L · **Impact:** 🟢 · **Owner:** Copy + Dev

Каждая статья в `/academy/` сейчас — это SEO-контент без прямой воронки. Переделать:
- Внутри каждой статьи — встроенный мини-калькулятор для этой услуги
- Lead-magnet: «Free guide: How to recognize swirl marks vs deep scratches» (PDF за email)
- Внутренние линки: «Got this problem? See our [Service]» с anchor-текстом, релевантным запросу
- Track UTM: `?utm_source=academy&utm_campaign={article_slug}` на всех CTA

## F-24 · Auto follow-up на T+48h после работы — для отзывов и upsell
**Effort:** M · **Impact:** 🟠 · **Owner:** Owner + automation tool

Через WhatsApp Business API или простой Zapier-flow:
- T+24h: «Cómo va el resultado? Cualquier duda — escríbenos».
- T+48h: «Si estás contento, ¿podrías dejarnos una reseña en Google? {ссылка}»
- T+30d: «Han pasado 30 días. Aquí tienes una pequeña guía de mantenimiento + 10% de descuento en tu próximo Care Plan» (upsell)

Эффект двойной: догон reviews (см. F-12) + LTV-extension через care plan / повторные работы.

## F-25 · Видео-страницы по каждой услуге
**Effort:** L · **Impact:** 🟡 · **Owner:** Video + Copy

Каждая `/services/{name}` страница — короткое видео процесса 30–60 сек. Снять одно за съёмку, 6 услуг = 6 видео. Это поднимает time-on-page, conversion, и даёт ассеты для Instagram/TikTok.

---

# 🧪 A/B тесты (запускать после F-15 — без аналитики не работает)

## T-01 · Calculator: on-page vs WA-only
- A: текущая логика (отправка в WA)
- B: показать price range на странице + кнопка WA с заполненными деталями
- Метрика: % сессий, в которых произошёл `calc_to_wa` или `calc_to_email`
- Гипотеза: +25–40% completion калькулятора в B
- Длительность: 2 недели или 500 calc-стартов

## T-02 · Hero CTA copy
- A: «Get a Free Estimate» (текущий)
- B: «See My Price in 30 sec» → ведёт прямо в calculator (не в WA)
- Метрика: clicks на primary CTA + downstream conversion
- Гипотеза: +15–20% engagement в B

## T-03 · Видео-отзыв в hero
- A: текущий hero без видео
- B: видео-отзыв 30 сек как фоновый элемент или auto-loop в правом блоке
- Метрика: scroll-depth + leads
- Гипотеза: +10–15% scroll past hero

## T-04 · Urgency-bar
- A: без urgency
- B: тонкая полоска под hero «3 slots remaining this week — Sant Cugat & Barcelona»
- Метрика: leads + bounce rate (не должен расти)
- Гипотеза: +5–10% leads, риск — выглядит маркетингово, поэтому только если capacity реальна

## T-05 · B2B блок на главной
- A: B2B только в footer
- B: отдельный блок «For dealers, fleets and businesses» в нижней трети главной
- Метрика: B2B email-form submissions, traffic to /business
- Гипотеза: открывает отдельный lead-flow с LTV в 3–5× выше

---

# 📅 Roadmap по неделям

| Неделя | Фокус | Задачи |
|--------|-------|--------|
| **1** | Phase 0 | F-01, F-02, F-05 + установить GA4/GTM (часть F-15) |
| **2** | Phase 0 + start Phase 1 | F-03 (calc), F-04 (booking), F-15 (доделать аналитику) |
| **3–4** | Phase 1 — UX | F-06, F-09, F-10, F-13, F-14, F-16, F-17 |
| **5–6** | Phase 1 — контент | F-07 (CA review), F-08 (email/call), F-11 (видео-отзывы) |
| **7** | Замер baseline → подготовка тестов | T-01, T-02 — настроить через GTM/Optimize |
| **8–9** | Запуск A/B тестов | T-01, T-02 параллельно |
| **10–12** | Phase 2 — стратегические | F-18, F-19 в первую очередь (highest LTV); F-22, F-24 |
| **13+** | Continuous | F-12 (auto-reviews), F-20, F-21, F-23, F-25, T-03, T-04, T-05 |

---

# 📈 KPI и валидация

После каждой фазы перепроверяйте:

**После Phase 0 (неделя 2):**
- Bounce rate главной — не должен вырасти
- WA-сообщения — должны увеличиться от localised prefills (+10–15% ожидаемо)
- Calculator completion rate — должен заметно вырасти от F-03 (+20–40%)

**После Phase 1 (неделя 6):**
- Lead-to-qualified ratio — улучшение от лучшего trust-стека
- Time-on-page главной — рост от видео-отзывов и slider'а
- Conversion rate — целевой uplift +25–40% относительно baseline

**После Phase 2 (неделя 12):**
- Доля B2B / EV / Commercial — должна появиться (сейчас ноль)
- LTV — должна расти за счёт care plans
- SEO traffic на academy — рост, и conversion внутри academy не нулевой

Главные метрики, на которых зашита бизнес-цель:
1. **Site → WA conversion** (или email/call) — целевая
2. **WA → confirmed booking** — операционная (не только сайт)
3. **Booking → completed job** — операционная
4. **Avg ticket size** — должен расти от лучшей коммуникации пакетов
5. **Reviews/job ratio** — целевой 20%+ через F-12 + F-24

---

# 💰 Бюджетная оценка (внешние затраты)

| Статья | Стоимость | Тип |
|--------|-----------|-----|
| Cal.com Pro / Calendly | 12 €/мес | Recurring |
| CA-носитель для перевода | 150–250 € | One-time |
| Видео-отзывы (3–5 шт, монтаж) | 0–400 € (если сами) | One-time |
| Lavalier-микрофон | 30 € | One-time |
| GTM/GA4 | 0 € | — |
| Meta Pixel | 0 € | — |
| WhatsApp Business API (если автоматизация) | 0–50 €/мес | Recurring |
| Zapier для T+48h follow-up | 20 €/мес | Recurring |
| Видео для services-pages (6 шт) | 0–600 € | One-time |
| Дизайн EV/B2B/Commercial landings | 0 € (сами) или 600–1500 € | One-time |
| **Итого one-time** | **~830–2780 €** | |
| **Итого recurring** | **~32–82 €/мес** | |

---

# ✅ Чеклист валидации после каждого релиза

После любых изменений из плана — пройдите этот чек:

- [ ] Открывается на mobile (iOS Safari + Android Chrome) — не сломано
- [ ] Lighthouse score > 85 на mobile (Performance + SEO)
- [ ] Все 3 языковых версии работают идентично
- [ ] Все WA-кнопки открывают чат с правильным языком и правильным префиллером
- [ ] Email-форма приходит на ваш email (тест)
- [ ] Phone-кнопка реально звонит
- [ ] Calculator выдаёт корректную цену для крайних случаев (S/light/standard и L/heavy/black)
- [ ] Google Business — линк ведёт на форму отзыва, не на промежуточную страницу
- [ ] GA4 показывает события для всех CTA в течение 24 ч
- [ ] Никаких placeholder'ов в HTML (B-XXXXXXXX, lorem, TODO)
- [ ] Privacy / Terms страницы соответствуют GDPR (если ещё не)

---

**Конец документа.**

Этот план — рабочий документ. Версия 1.0 от апреля 2026. После выполнения Phase 0 пересмотрите приоритеты Phase 1 на основе baseline-метрик.
