# Гайд проверки Orders OS (Phase 4) — для владельца

> Порядок активации: bindings → Stripe → (позже) partner → (ворота) WA Cloud.
> Каждый этап проверяется отдельно; всё до его настройки — инертно.

## Этап 0 — без настройки (прод как есть)

1. `/es/pricing`: селектор размера → SUV = 419/599/719/999; подписи керамики
   «+180€/+280€»; матрица + печать; блок «Transparencia».
2. Эстиматор: керамика 2 года + SUV grande → 1149€ в карточке и в WhatsApp-тексте.
3. `/es/solicitud`: заполнить и отправить → ожидаемо карточка
   «El formulario no está disponible…» с кнопкой WhatsApp (деградация).
4. `/admin` c любым токеном → «API no configurada todavía».

## Этап 1 — Cloudflare bindings (docs/setup-cloudflare-bindings.md)

D1 `ORDERS_DB` + R2 `PHOTOS` + env `ADMIN_TOKEN` → redeploy →
`curl -X POST https://restorelab.io/api/admin/migrate -H "x-admin-token: …"`
→ `{"ok":true,"statements":8}`.

1. С телефона `/es/solicitud`: заявка с 2 фото (одно HEIC) → экран
   «¡Solicitud recibida!» с кодом RL-O-XXXX; в WhatsApp-кнопке `#pedido` и `#ref`.
2. `/admin` (токен запомнится): заявка в «Nuevo», фото и атрибуция на месте.
3. Композер: пакет+размер, выезд сам из зоны; **сумма = цифре на /pricing**;
   Guardar → «Presupuestado».
4. «+ Nuevo pedido» — ручной WhatsApp-заказ за 30 сек; у нового заказа
   только легальные кнопки переходов.
5. Métricas: заказы в цифрах; спенд 300 → CAC-бейдж красный, 50 → зелёный;
   CSV скачивается.

## Этап 2 — Stripe test-mode (docs/setup-stripe.md)

1. Заказ с квотой → Pagos → «Enlace 100%» → карта 4242 4242 4242 4242 →
   через секунды статус «Pagado», в истории `stripe_paid`.
2. Депозит: «Señal 30%» → оплата (сумма копится, статус не прыгает) →
   «Enlace resto» → оплата → «Pagado».
3. «Marcar pagado» (efectivo) — метод виден в истории.
4. Live: ключи + один чекаут на 1€ — **убедиться, что Bizum показан**.

### Очистка тестовых данных (после этапа 2)

Для каждого тестового заказа: → **Cancelado** (он сразу исчезает из всех
метрик и CAC) → в карточке появляется **«🗑 Eliminar (solo test)»** →
удалить (сотрёт заказ, историю и фото из R2). Кнопка существует ТОЛЬКО
у отменённых — реальную историю удалить нельзя. Проверка: Métricas после
очистки показывают нули/только реальные заказы.

## Этап 3 — партнёр (когда подписан)

1. «+ Partner» (телефон обязателен) → заказ booked → «Asignar» →
   «📤 Mensaje para partner» → WhatsApp с готовым текстом и `/p/…`-ссылкой.
2. Открыть ссылку с другого телефона: чек-лист; terminado без фото →
   «Faltan fotos (0/0)»; 2 до + 2 после → terminado.
3. В админке «Control calidad»: фото рядом; Aprobar → сразу оплата;
   Pedir rework → счётчик++ и заметка партнёру.
4. Вкладка Partners: леджер GMV × % = payout, CSV.
5. Старая `/p/`-ссылка закрытого заказа → «ya no es válido».

## Этап 4 — WhatsApp Cloud (ворота: ≥30 заказов/мес или активный партнёр)

Строго по docs/setup-whatsapp-cloud.md (второй номер; всё в Meta руками;
сначала sandbox). Проверка: заказ через assigned и оплату → оба шаблона
приходят сами; при сбое — баннер «envío manual necesario» в админке,
кнопки копирования работают всегда.

## Красные флаги (любой — стоп и разбор)

- 5xx от `/api/*`; форма падает вместо WhatsApp-фоллбэка.
- Цифра в композере ≠ /pricing.
- Возможен переход статуса, которого нет в кнопках.
- `/admin` или `/p/` в выдаче Google (`site:restorelab.io/admin`).
- «Eliminar» доступна у неотменённого заказа.
