# Подключение Google Search Console — restorelab.io

Займёт ~10 минут. Нужны: аккаунт Google (тот же, что для GA4/GTM — lesikom@gmail.com)
и доступ к Cloudflare (там DNS домена).

## Шаг 1. Добавить ресурс

1. Открой https://search.google.com/search-console и войди в Google-аккаунт.
2. Нажми **«Добавить ресурс»** (Add property).
3. Выбери левый вариант — **«Доменный ресурс»** (Domain), введи `restorelab.io`.
   Он покрывает сразу http/https и все поддомены — правильный выбор.
4. Google покажет TXT-запись вида `google-site-verification=XXXXXXXX…` — **скопируй её**.

## Шаг 2. Подтвердить через DNS в Cloudflare

1. Открой https://dash.cloudflare.com → домен `restorelab.io` → раздел **DNS**.
2. **Add record**:
   - Type: `TXT`
   - Name: `@`
   - Content: вставь скопированную строку `google-site-verification=…` целиком
   - TTL: Auto → **Save**
3. Вернись в Search Console и нажми **«Подтвердить»** (Verify).
   Обычно срабатывает за 1–5 минут; если нет — подожди час и нажми ещё раз
   (DNS-запись не удаляй никогда, она нужна постоянно).

## Шаг 3. Отправить sitemap

1. В левом меню GSC: **Файлы Sitemap** (Sitemaps).
2. В поле введи `sitemap-index.xml` → **Отправить**.
   Статус «Успешно» появится в течение суток.

## Шаг 4. Запросить переиндексацию изменённых страниц

В верхней строке GSC (инспекция URL) вставляй по одному URL → жми
**«Запросить индексирование»** (Request Indexing). Приоритетный список
(изменены 18.07.2026, лимит ~10 запросов в день — хватит с запасом):

```
https://restorelab.io/es
https://restorelab.io/es/areas/barcelona/tratamiento-ceramico   ← новая страница
https://restorelab.io/es/areas/sant-cugat/headlight-restoration
https://restorelab.io/es/services/car-paint-correction
https://restorelab.io/es/services/headlight-restoration
https://restorelab.io/es/academy/paint-correction-cost-barcelona
https://restorelab.io/es/academy/headlight-restoration-guide-barcelona
https://restorelab.io/es/services
```

Заодно проверь давнюю проблему: если по брендовому запросу всплывают
устаревшие лиссабонские сниппеты (сайт раньше работал на Португалию) —
в «Инспекции URL» видно, какая версия в индексе.

## Шаг 5. Что смотреть через 1–2 недели

- **Эффективность** (Performance): фильтр «Страна = Испания» → реальные запросы,
  позиции и CTR — это замена моих US-прокси замеров.
- **Индексирование → Страницы**: сколько из 169 URL в индексе, какие выпали и почему.
- Экспортируй отчёт Performance (кнопка Export) и пришли мне в чат — разберу
  и скорректирую SEO-план по реальным данным.

## Бонус (5 минут): Bing Webmaster Tools

https://www.bing.com/webmasters → **Import from Google Search Console** —
импортирует сайт и sitemap одним кликом. Bing питает поиск DuckDuckGo и
частично ответы AI-ассистентов, бесплатный охват лишним не будет.
