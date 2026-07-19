# Exhaustive QA: viloknet.ru

- Дата: 2026-07-19
- Проверено: production desktop 1440×1000, mobile 390×844, публичные страницы, корзина, checkout без отправки заказа, профиль, loyalty/admin surfaces, frontend/backend tests, API headers/CORS/auth, npm audit.
- Исходный health score: **86/100**
- Итоговый health score после исправлений и production-регрессии: **100/100**
- Итог: **9 найдено / 9 исправлено / 9 проверено на production**

## ISSUE-009 — После оптимизации фото исчезли из обычных карточек каталога

- Severity: High
- Category: Functional / Visual regression
- Repro: backend отдаёт абсолютные Saby preview URL, а frontend дописывает перед ними `SBIS_API`; итоговый адрес имеет вид `backend.vercel.apphttps://online.sbis.ru/...`. Визуально живым остаётся только ограниченный 3D-блок.
- Fix status: verified in production
- Fix: добавлен единый `menuImageUrl`, который принимает готовые HTTPS preview URL и отдельно разрешает относительные `/api/img` нашего proxy. Резолвер применён к обычным карточкам, категориям, корзине, модификаторам, 3D-ленте и QR-блоку.
- Commit: `5572a69`, regression `tests/catalog-image-url.regression-1.test.mjs`.
- After: `screenshots/catalog-cards-live-after.png`; production содержит 118 карточек в 16 категориях, 113 реальных фото, 113/113 корректных preview URL и 0 адресов `vercel.apphttps`. Пять позиций без фото в источнике СБИС используют штатную заглушку.

## ISSUE-001 — На телефоне корзину нельзя закрыть обычным способом

- Severity: High
- Category: Functional / UX
- Repro: открыть корзину на ширине 390 px. Заголовок и кнопка закрытия drawer находятся под fixed-header; повторное нажатие на иконку корзины только вызывает `openCart()`.
- Evidence: `screenshots/mobile-cart.png`, `screenshots/mobile-cart-item.png`
- Fix status: verified in production
- Fix: mobile drawer начинается под fixed-header, имеет высоту `100dvh - 60px`, а кнопка корзины повторным нажатием закрывает drawer.
- Commits: `769c99b`, regression `b8f1de7`.
- After: `screenshots/issue-001-002-after.png`; live geometry: drawer top `60`, close top `80`, после закрытия body overflow восстановлен.

## ISSUE-002 — Пустая корзина предлагает оформить заказ

- Severity: Medium
- Category: Functional / UX
- Repro: открыть корзину без товаров. Кнопка «Оформить заказ» выглядит активной.
- Evidence: `screenshots/mobile-cart.png`
- Fix status: verified in production
- Fix: checkout имеет собственный `id`, disabled-state и включается только при непустой корзине.
- Commits: `7f9ae76`, regression `9803bc7`.
- After: live mobile check returned `checkoutDisabled=true` for an empty cart.

## ISSUE-003 — После ошибки расчёта доставки итог остаётся «Рассчитываем…»

- Severity: Medium
- Category: Functional / UX
- Repro: добавить товар на сумму меньше минимума, ввести реальный адрес. Сервер отвечает 422 с понятным минимумом, но строка доставки в summary остаётся в loading-state.
- Evidence: `screenshots/issue-delivery-quote-before.png`
- Fix status: verified in production
- Fix: введено отдельное состояние ошибки quote; summary показывает «(не рассчитано)» и «—», пока адрес или сумма не исправлены.
- Commits: `a2fbec4`, regression `bf8643f`.
- After: `screenshots/issue-003-live-after.png`; production returned «Минимальная сумма заказа для этого адреса — 500 ₽», summary no longer remained in loading-state.

## ISSUE-004 — Фото каталога слишком тяжёлые

- Severity: High
- Category: Performance
- Repro: первая загрузка каталога тянет оригиналы СБИС по 0.4–2.7 МБ, отдельные ответы занимают до 5 секунд. Доступный previewer отдаёт ту же фотографию 600×450 примерно в 4–10 раз компактнее.
- Evidence: production network trace in this QA run.
- Fix status: verified in production
- Fix: каталог и изображения модификаторов используют безопасные Saby previews 600×450 вместо оригиналов; неизвестные URL по-прежнему идут через защищённый proxy fallback.
- Commits: backend `ca88099`, regression `699ef15`.
- After: production `/api/catalog` returns preview URLs; sample response is `192347` bytes versus original files up to `2.7` MB and responds `200 image/png`.

## ISSUE-005 — Иконки корзины и профиля теряют accessible name на mobile

- Severity: Medium
- Category: Accessibility
- Repro: mobile accessibility snapshot показывает две безымянные кнопки в header.
- Evidence: `screenshots/mobile-loaded.png`
- Fix status: verified in production
- Fix: добавлены явные `aria-label` для корзины, профиля, бонусов и modal close controls.
- Commits: `9fa4026`, regression `cd4ff6a`.
- After: production accessibility snapshot exposes «Открыть корзину», «Открыть профиль», «Открыть меню» и named close controls.

## ISSUE-006 — Политика ПДн имеет горизонтальный scroll на mobile

- Severity: Low
- Category: Visual / Accessibility
- Repro: `/privacy.html`, viewport 390 px; document `scrollWidth=432`, источник — широкая таблица.
- Evidence: `screenshots/issue-privacy-overflow-before.png`
- Fix status: verified in production
- Fix: таблица получила локальный horizontal scroll и больше не увеличивает ширину всего документа.
- Commit: `0508523`.
- After: `screenshots/issue-006-live-after.png`; production viewport/document width `390/390`, table scroll is contained internally.

## ISSUE-007 — У главной нет базовой SEO-карточки, robots.txt и sitemap.xml

- Severity: Low
- Category: Content / SEO
- Repro: в `<head>` нет description/canonical/Open Graph; `/robots.txt` и `/sitemap.xml` возвращают 404.
- Fix status: verified in production
- Fix: добавлены description, canonical, robots, Open Graph/Twitter metadata, `robots.txt` и `sitemap.xml`; admin pages закрыты от crawler.
- Commits: `5bfe98f`, regression `b2b416f`.
- After: production `/robots.txt` returns `200`, `last-modified: 2026-07-19`, and points to the sitemap.

## ISSUE-008 — Auth API не нормализует malformed JSON в 400

- Severity: Low
- Category: Security / Robustness
- Repro: `auth-start` и `auth-verify` вызывают `JSON.parse` без обработки синтаксической ошибки, что превращает ошибочный клиентский запрос в server error.
- Fix status: verified in production
- Fix: malformed JSON перехватывается до бизнес-логики и нормализуется в клиентский ответ 400.
- Commits: backend `69feea4`, regression `cdc2d79`.
- After: live `POST /api/account?action=auth-start` with malformed JSON returns `400 {"error":"Некорректные данные запроса"}` with strict CORS.

## Проверки без дефектов

- Все опубликованные страницы отвечают 200, неизвестная страница — 404.
- Console application-level чист на главной, vitrina, legal и admin-страницах; зафиксированный 422 — ожидаемая бизнес-валидация минимальной суммы. Независимый Chrome render приложен как `screenshots/final-mobile-chrome.png`.
- Онлайн-оплата скрыта и недоступна; доступны только наличные/карта при получении.
- Заказы ограничены актуальными часами: доставка 10:00–21:30, самовывоз 10:00–22:00.
- Admin loyalty/analytics без ключа отвечают 401.
- Frontend: **43/43** tests passed. Backend: **46/46** tests passed. `npm audit --omit=dev`: **0 vulnerabilities**.

## Production deployment

- Frontend: GitHub `main`, application head `5572a69`; GitHub Pages published the updated catalog application.
- Backend: GitHub `main`, head `cdc2d79`; Vercel deployment `dpl_AYhDSYkapnZhiYQ84VFyHLjgcNP3`, state `READY`, production alias `https://viloknet-sbis-backend.vercel.app`.
- Live health: `200 {"ok":true}`; catalog: `121` products, `90` available.
- Orders were not submitted during QA. YooKassa remains intentionally disabled; only payment on receipt is offered.

## External follow-up (not a software defect)

- Before re-enabling YooKassa, rotate the previously exposed secret and complete the production webhook configuration in the YooKassa account.
- Legal wording about analytics, processors and data location should be approved against the actual hosting stack by the responsible legal/privacy specialist.
