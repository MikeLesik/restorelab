# RestoreLab — Глубокий аудит и точки роста
**Дата:** 2026-07-17 · **Метод:** 8 параллельных специализированных аудитов (технический SEO, контент/E-E-A-T, схемы, производительность, GEO/AI-поиск, локальный SEO, SXO/интент, контент-кластеры) + сверка кода с планом апреля 2026.

**Сводная оценка здоровья сайта: ~67/100**
(Технический 78 · Контент 58 · Локальный 43 · GEO/AI 63 · SXO home 81 / glass 45)

Прод = локальный код (все коммиты запушены), сборка 164 страницы / 0 ошибок.

---

## 🔴 КРИТИЧЕСКОЕ (чинить немедленно)

### C-1. Плейсхолдер «[Nombre del Fundador]» живёт на проде
На `/es/about`, `/en/about`, `/ca/about` вместо имени основателя рендерится буквально `[Nombre del Fundador]` / `[Founder Name]` / `[Nom del Fundador]`.
- Источник: `src/content/{es,en,ca}.json` → `about.founder_name` (+ `founder_photo_note` подтверждает, что задача не была закончена).
- Это худший E-E-A-T-сигнал на сайте: страница доверия показывает шаблонную скобку каждому посетителю и Google.
- **Фикс:** вписать реальное имя + фото, либо (если анонимность намеренна) заменить на «restoreLab Team». Одновременно перевести BlogPosting-автора Academy с Organization на реального `Person` (в `authorBio.ts` это уже запланировано комментарием «switch at 3-month milestone» — срок наступил).

### C-2. Ссылка на Google Business Profile ведёт в никуда
`https://g.page/restorelab-santcugat` НЕ резолвится в профиль — финальный URL: `google.com/search?q=restorelab-santcugat` (обычный поиск). Ссылка стоит в 4 местах: `BaseLayout.astro` (sameAs ×2), `Footer.astro`, `Testimonials.astro`.
- GBP — фактор №1 локального ранжирования. Сейчас либо профиль не создан/не верифицирован, либо slug выдуман.
- **Фикс (owner):** создать/заклеймить GBP (категория: mobile auto detailing), взять реальную ссылку `g.page/r/...` или `search.google.com/local/writereview?placeid=...`, заменить во всех 4 местах. Это же разблокирует программу набора отзывов (см. H-7).

### C-3. Все 162 URL сайта — «canonical на редирект»
`trailingSlash: 'never'` + дефолтный `build.format: 'directory'` → Cloudflare Pages 308-редиректит `/es/pricing` → `/es/pricing/`. При этом canonical, sitemap, hreflang, JSON-LD указывают на URL БЕЗ слэша.
- Каждый URL из sitemap для Google — редирект; каждая страница self-canonical'ится на редиректящий адрес. Потеря crawl-бюджета ×2, лишний hop ~180-200мс, шум «Page with redirect» в GSC. Часть AI-краулеров (Perplexity) ненадёжно ходят по редиректам.
- **Фикс:** в `astro.config.mjs` добавить `build: { format: 'file' }` (Astro выдаст `pricing.html`, CF Pages отдаст его на `/es/pricing` без редиректа). Пересобрать, проверить curl'ом ключевые маршруты. Одна строка.

### C-4. Устаревшая HowTo-схема на ~15 страницах
`ArticleSchema.astro:24-37` эмитит `HowTo`/`HowToStep` (флаг `howto:true` у 5 статей × 3 языка). Google убрал HowTo rich results в 09.2023 — мёртвый груз.
- **Фикс:** удалить генерацию `howToJson` из `ArticleSchema.astro` (контент-данные не трогать — они рендерят страницу).

### C-5. Дублирующийся AutomotiveBusiness на area-страницах
`/es/areas/{city}` эмитит ДВА конфликтующих узла AutomotiveBusiness (BaseLayout: 9 городов в areaServed; `[city].astro:63-85`: 5 городов, без description/sameAs). Двусмысленность для entity-графа Google.
- **Фикс:** удалить пейджевый дубль в `[city].astro`, либо мерджить в единственный узел с `@id`.

---

## 🟠 ВЫСОКИЙ ПРИОРИТЕТ (1-2 недели)

### H-1. Корневой редирект 302 → 301 + двойная цепочка
`/` → 302 → `/es` → 308 → `/es/`. Два hop'а на самом залинкованном URL сайта, 302 не передаёт вес как постоянный.
- **Фикс:** `public/_redirects`: `/  /es  301` (+ C-3 убирает второй hop). Проверить `functions/index.ts` — какой код отдаёт edge-функция.

### H-2. BlogPosting без `image` — статьи не проходят в rich results
`academy/[slug].astro:52-73`: нет `image` (обязательное для Article rich results/Discover), `publisher.logo` указывает на favicon.svg без размеров.
- **Фикс:** добавить `image` (OG-хиро статьи, fallback og-home.jpg) и `logo` → `icon-512.png` c width/height.

### H-3. Фрагментированная Service-схема + разнобой provider
На каждой сервисной странице ДВА неполных Service-блока (страничный без offers + PricingCards с offers без serviceType). `business.astro:920` использует `AutomotiveBusiness` как provider, остальные — `LocalBusiness`.
- **Фикс:** мерджить в один узел на страницу; provider везде `AutomotiveBusiness`.

### H-4. 6 статей Academy — сироты в clusterMap.ts (нулевая стоимость фикса!)
`motorcycle_detailing`, `leather_seats_mediterranean_restoration`, `water_stain_removal_car_windows`, `yellow_vs_cloudy_headlights_causes_lifespan`, `uv_damage_motorcycle_yacht_acrylic`, `detailing_used_car_sale_price_catalonia` не зарегистрированы → RelatedGuides/HubSpokeList их не видят, нет spoke↔hub ссылок.
- Регистрация мгновенно чинит 4 «тонких» хаба: glass-polishing, headlight-restoration, **interior-leather (сейчас 0 spokes)**, pre-sale-pack.
- **Фикс:** дописать в `src/lib/clusterMap.ts`.

### H-5. Thin content: 10 из 20 статей Academy — 168-365 слов (×3 языка = 30 тонких URL)
Тонкие: equipment_selection, masking_protocols, mechanical_correction, refining_stabilization, protection_preservation, motorcycle_detailing, remove_swirl_marks, windshield_scratch_repair, paint_correction_cost_barcelona, uv_damage_acrylic_restoration.
- **Фикс (вариант А, рекомендуемый):** 5 последовательных «процессных» статей (equipment → masking → mechanical → refining → protection) слить в один pillar-гайд «Процесс коррекции пировки от А до Я» (+301 со старых URL). Остальные — расширить до 1000+ слов с FAQ и локальным контекстом, либо noindex до расширения.

### H-6. Area-страницы: богатые данные лежат мёртвым грузом, FAQ одинаковый на 33 страницах
`areaProfiles.ts` содержит landmarks, travel fee, case counts, климат, марки машин — но `[city].astro` их НЕ рендерит (используются только в 12 canary-страницах). FAQ на всех 33 area-страницах — одинаковый общесайтовый блок. Риск doorway-паттерна для мелких городов (Matadepera, Bellaterra).
- **Фикс:** вывести данные areaProfiles на area-страницы + по 2-3 city-специфичных FAQ. ⚠ Перед этим закрыть `// VERIFY`-числа в areaProfiles.ts (caseCount в видимом trust-тексте обязан быть реальным).

### H-7. Отзывы: 47 против 526 у топ-конкурента — главный тормоз ранжирования
detailing-barcelona.com (#1 по «corrección de pintura barcelona»): 4.8★/526 отзывов при ~650 словах контента. Контентом это не перебить.
- **Фикс (owner, процесс):** после починки GBP (C-2) — автоматический WA follow-up T+48h с прямой ссылкой на форму отзыва (это F-12/F-24 из апрельского плана — до сих пор не сделаны). Цель: 150-200+ отзывов, каденция ≥1 отзыв/18 дней.

### H-8. llms.txt протух и смотрит не туда
Обновлялся 2026-05-07: не хватает 5 новых статей, все ссылки на `/en/` (рынок — ES!), нет ни одной из 11 area-страниц.
- **Фикс:** доработать `scripts/generate-llms-txt.mjs` (ES-приоритет ссылок, area-страницы) + `npm run gen:llms`; включить регенерацию в `new:post`-пайплайн.

### H-9. SXO-мисматчи по денежным запросам
- «pulir cristales coche rayados» — SERP 100% информационный (блоги+видео), коммерческая `/services/glass-polishing` структурно не может ранжироваться (SXO 45/100). **Фикс:** продвигать существующую статью `windshield_scratch_repair` под этот запрос + залинковать её с сервисной страницы.
- «tratamiento cerámico coche precio» — конкуренты ранжируются dedicated-URL'ами `/precio-tratamiento-ceramico-coche`. **Фикс:** отдельный лендинг/секция с точным H1-матчем.
- Словарь: рынок ищет «pulido de faros», сайт говорит «restauración de faros». **Фикс:** «pulido/pulir» как co-primary термин в title/H1/копи faros и стекла; город в H1 сервисных страниц.

---

## 🟡 СРЕДНИЙ ПРИОРИТЕТ (месяц)

### M-1. Производительность (TTFB хороший ~230мс, но)
1. Два render-blocking CSS (~90KB raw) на каждой странице, критический CSS не инлайнится → +150-300мс LCP. Фикс: поднять порог inlineStylesheets или выделить critical CSS.
2. Нет `<link rel="preload" as="font">` — FOUT и поздний swap (+100-200мс). Фикс: preload 2 латинских subset-файлов в BaseLayout.
3. LCP-картинки сервисных страниц — 99.6KB JPEG без WebP/AVIF и preload (галерея кейсов уже на `<picture>`+webp — распространить паттерн).
4. Главная: ~1129 DOM-элементов (8 пар before/after в разметке) — рендерить 2-3 слайда, остальное лениво.

### M-2. Безопасность/заголовки
- CSP: `'unsafe-inline'` в script-src обнуляет XSS-защиту → перейти на sha256-хэши инлайн-скриптов; добавить `frame-ancestors 'none'`.
- HTML не кэшируется на edge (`max-age=0`, cf DYNAMIC, нет ETag) → короткий max-age + stale-while-revalidate.
- Превью-домены `*.pages.dev`: проверить в дашборде CF, что не индексируются (X-Robots-Tag: noindex).

### M-3. Зависимости
- Astro 5.18.2: npm audit показывает high-советы (XSS в define:vars и др.), фиксы только в Astro 7.1.0 (breaking). Эксплуатируемость на статике с доверенным JSON-контентом низкая, но планировать миграцию 5→7 стоит. devalue — транзитивная, `npm audit fix`.
- vanilla-cookieconsent 3.0.1 → 3.1.0 (и обновить self-hosted копию в public/vendor/).

### M-4. Схемы — возможности
- `hasOfferCatalog` на корневом AutomotiveBusiness (генерить из `t.pricing.categories`).
- `Offer.url` + `Offer.availability` в PricingCards.
- `ImageObject`/CollectionPage для галереи кейсов (Google Images/Lens — визуальный бизнес!).
- `OpeningHoursSpecification` вместо строки; geo до 5 знаков.

### M-5. GEO/AI-цитируемость
- FAQ-ответы 46-80 слов → расширить до ~140-160 самодостаточных слов.
- Вопросные H2 в статьях («¿Por qué amarillean los faros?» вместо утверждений).
- FAQ-блок + FAQPage-схема в статьи Academy (сейчас нет).
- `dateModified` никогда не отличается от `datePublished` — начать реально обновлять контент (связано с отложенным plan_4_seo_refresh).
- Атрибуция статистики (источники для «2500 часов солнца», «5,5 микрон» и т.п.).

### M-6. Моноканальная воронка (F-08 из апрельского плана — НЕ сделано)
Ни одной `tel:` ссылки и email-опции на сайте. Отрезаны: B2B-флоты (хотят email+PDF), старшая аудитория (звонок), не-WA пользователи.
- **Фикс:** кнопка «Llámanos» (`tel:+34680265190`) + email-форма рядом с ключевыми WA-CTA (hero, pricing, footer, /contact).

### M-7. Мелочи
- Удалить fallback с выдуманными сертификациями «IDA Q3 2026 / Ceramic Pro Q4 2026» из `CertificationsRow.astro` (сейчас не рендерится, но это мина — fail closed).
- Ratio 47 отзывов / 500+ работ — добавить поясняющую строку или переформулировать.
- IndexNow не настроен (Bing/Yandex push) — опционально.

---

## 🟢 СТРАТЕГИЧЕСКИЙ РОСТ (1-3 месяца)

### S-1. Контент: топ-10 новых материалов (по ROI, данные из живых SERP)
1. **Guía de Precios PPF Barcelona 2026** (`ppf coche precio barcelona`) — у вас тир Flagship PPF €2290+ без единой страницы поддержки; рынок активный (599-4500€).
2. **Limpieza y Restauración de Tapicería de Cuero** — хаб interior-leather пуст, конкуренты активны.
3. **Ozono para Coche: Elimina Olores** — естественное расширение interior-leather.
4. **Faros Amarillos y la ITV** — высокий urgency-интент; статья почти есть (yellow_vs_cloudy...), нужна регистрация в кластере + ITV-акцент.
5. **Rayones de Aparcamiento: Repararlos Sin Repintar** — long-tail к car-paint-correction.
6. **Pulir Cristal vs Sustituir** — MOFU к glass-polishing.
7. **Vinilo vs PPF: Qué Elegir en 2026** — сравнительный, ведёт в PPF.
8. **PPF vs Cerámico: Diferencias, Duración y Precio** — конвертирует между двумя существующими тирами.
9. **Detailing para Flotas de Empresa** — первый spoke для /business (сейчас 0).
10. **Cuánto Cuesta un Detailing Completo en Barcelona 2026** — cross-hub pillar (⚠ разграничить с paint_correction_cost_barcelona).
Структурно: новый PPF-subCluster под car-paint-correction в clusterMap.ts.

### S-2. Видео и внешние сигналы (самый недоразвитый рычаг)
- В SERP по стеклу 4 из 10 результатов — YouTube/TikTok; корреляция YouTube-присутствия с AI-цитированием ~0.737 — у RestoreLab ноль видео и одна ссылка в sameAs.
- Минимум: 15-30-сек before/after ролики (faros, стекло) на сервисных страницах + YouTube-канал + sameAs. Это же закрывает F-11/F-25 апрельского плана.
- Instagram/соцпрофили → sameAs (сейчас пусто).

### S-3. Локальное расширение
- Citations: PáginasAmarillas.es, Cylex.es, автомобильные каталоги ES/Cataluña (сейчас ноль внешних цитирований).
- Canary area×service: СНАЧАЛА добавить реальную дифференциацию (Slot 2: кейсы/отзывы по районам, вариативность шаблонов — сейчас mail-merge), ПОТОМ расширять на CA (каталанский рынок Sant Cugat) и остальные города.
- Лёгкая карта зоны обслуживания на area-страницах (SAB-паттерн, без storefront-пина).

### S-4. Измеримость
- PSI/CrUX недоступны без ключа — подключить Google API (GSC + PSI key + GA4), получить полевые CWV и данные запросов. Без этого приоритизация контента полуслепая (отложенный plan_4_seo_refresh тоже ждёт данных GSC).

---

## ✅ Что уже хорошо (подтверждено аудитом)
- Сборка: 164 страницы, 0 ошибок; hreflang корректен (включая ES-only canary); 404 честный; HSTS+preload, Brotli, HTTP/2/3.
- NAP консистентен во всех местах; SAB-модель корректна; AutomotiveBusiness — правильный тип.
- Переводы CA — живой каталанский, не машинный; локальная семантика в 3 языках хорошая.
- Аналитика консент-гейтится правильно (GTM/Clarity/Pixel только после согласия).
- Из апрельского плана СДЕЛАНО: F-01 (NIF), F-02 (WA-префиллы), F-03 (эстиматор на странице), F-04 (Cal.com живой, оба типа встреч 200), F-05/F-06, F-13 (drag-слайдер), F-14 (мультипликаторы размеров), верткали F-18/19/20/21.
- Из апрельского плана НЕ сделано: F-08 (tel/email), F-11 (видео), F-12+F-24 (отзывы/follow-up), F-16 (GBP-ссылка — оказалась вообще нерабочей), F-23 (лид-магниты в Academy), F-15 частично (GA4/GSC-связка не проверяется без доступа).

## Порядок работ (рекомендация)
**Неделя 1 (код, ~1 день):** C-1 founder + C-3 build.format:'file' + C-4 HowTo + C-5 дубль схемы + H-1 301 + H-2 BlogPosting image + H-4 clusterMap-сироты + M-7 fallback сертификаций. Один день работы — закрывает всё критическое, что чинится кодом.
**Неделя 1 (owner, параллельно):** C-2 GBP создать/заклеймить → H-7 запустить сбор отзывов.
**Недели 2-3:** H-3 Service-схемы, H-5 pillar-мердж тонких статей, H-6 area-страницы + VERIFY, H-8 llms.txt, H-9 SXO-фиксы, M-6 tel/email.
**Месяц:** M-1 перф, M-2 CSP/кэш, M-4 схемы-возможности, M-5 GEO.
**Квартал:** S-1 контент-план (PPF в первую очередь), S-2 видео/YouTube, S-3 citations + canary-расширение, S-4 Google API.
