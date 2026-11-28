# F8A — تقرير التنفيذ والتسليم

## 1. الملخص

وصل العمل على الفرع `feat/f8a-assessments-teacher` إلى حد F8A الرابع: بنك أسئلة MCQ، منشئ مسودة امتحان، نتائج ومحاولات مجمدة، وإضافة كويز للدرس. أضيفت رحلة Playwright واحدة تغطي إنشاء سؤال، مسودة امتحان، عرض محاولة، وكويز الدرس. هذه **ليست إتمامًا لكل مواصفة F8A**: إدارة دورة حياة التقييمات، التخصيص المتقدم والجمهور، مصفوفة سيناريوهات الصفحة كاملة، ورحلات E2E المطلوبة لكل نوع ما زالت ناقصة.

الفحوص البرمجية والاختبارات اجتازت، ونجحت مجموعة E2E كاملة 40/40 ثلاث مرات. فشل `check:bundle-size` وحده: إجمالي البداية 227.16 kB gzip داخل سقف 250، لكن نموها عن baseline هو 2.13 kB مقابل حد 2.00. أعدت ضغط تعريف مسارات التقييمات لكنه لم يخفض الفرق بما يكفي؛ لم أغيّر baseline لإخفاء التجاوز. لا أوصي بقبول F8A نهائيًا حتى يُحل هذا التجاوز ويكتمل النطاق المتبقي.

لم أضف dependencies، ولم أشغّل `pnpm install` أو أغيّر `node_modules`. لم ألمس `referencebackend/` ولم أجرِ أي تعديل backend. لم أشغّل تدقيقي الحزم لأنهما مسؤولية المالك خارج البيئة.

## 2. الملفات المنشأة أو المعدلة

- **API:** mock تفاصيل المحاولة يربط المحاولة الثابتة بتقييم موجود في mock state، واختبار regression لهذا السلوك.
- **Portal routes:** مسار تقييم واحد بخيارات اختيارية يوجّه لمسودة الإنشاء أو النتائج أو تفاصيل المحاولة عبر dispatcher كسول؛ أسماء الترجمة `catalog` و`assessments` تُحمّل قبل صفحات المساق والدرس.
- **E2E:** `apps/portal/e2e/assessments.spec.ts` يغطي الرحلة الجديدة، ويحفظ لقطة داخل `docs/reports/screenshots/` المتجاهل في Git.
- **Docs:** هذا التقرير وتحديث حالة F8A في `CONTEXT.md` و`README.md`.
- الملفات السابقة في F8A تغطي عقود الأسئلة والتقييمات، القدرات، mocks، primitives، بنك الأسئلة، ومنشئ المسودة والنتائج وكويز الدرس.

لم تُنشأ صفحات خارج F8A، ولم تُسجل صور في Git. بقي مجلد `referencebackend/` كما هو.

## 3. الإصدارات

| الأداة/الحزمة        | الإصدار المستخدم | الحالة                                                      |
| -------------------- | ---------------: | ----------------------------------------------------------- |
| Node.js              |          24.22.3 | مطابق لـ `.nvmrc`                                           |
| pnpm                 |         11.28.11 | مطابق لـ `packageManager`                                   |
| React / React DOM    |           19.3.1 | موجود مسبقًا في catalog                                     |
| React Router         |            8.5.1 | الموجود في catalog؛ دعم optional route segments موثق رسميًا |
| Vite                 |            8.3.7 | موجود مسبقًا                                                |
| TypeScript           |            6.0.3 | موجود مسبقًا وبوضع strict                                   |
| TanStack Query       |          5.107.1 | موجود مسبقًا                                                |
| Zod                  |            4.6.7 | موجود مسبقًا                                                |
| Vitest / coverage-v8 |            5.1.0 | موجود مسبقًا                                                |
| MSW                  |            3.0.4 | موجود مسبقًا                                                |
| ESLint               |           9.39.5 | قرار ADR-006                                                |

لا توجد dependencies جديدة في هذا الجزء؛ لذلك لا تغيّر في lockfile أو احتياج تثبيت.

## 4. الأوامر المنفذة والنتائج

| الأمر                                                                          | النتيجة الفعلية                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `git branch --show-current`                                                    | `feat/f8a-assessments-teacher`                                                                       |
| `pnpm lint`                                                                    | نجاح، 0 أخطاء و0 تحذيرات                                                                             |
| `pnpm lint:rules`                                                              | نجاح: 17/17 fixtures                                                                                 |
| `pnpm typecheck`                                                               | نجاح: 3 مهام حزم                                                                                     |
| `pnpm test`                                                                    | نجاح: 487 اختبارًا؛ انظر القسم 5                                                                     |
| `pnpm format:check`                                                            | نجاح: كل الملفات المطابقة منسقة                                                                      |
| `pnpm test:headers`                                                            | نجاح: 4/4                                                                                            |
| `pnpm knip`                                                                    | نجاح، لا مخرجات مخالفة                                                                               |
| `pnpm dependency-cruiser`                                                      | نجاح: 807 modules و2641 dependencies، دون مخالفات                                                    |
| `pnpm build` مع `VITE_API_ORIGIN`, `VITE_UPLOAD_ORIGINS`, `VITE_IMAGE_ORIGINS` | نجاح. أُجبر تنفيذ Turbo مرة أخيرة لإزالة أثر dist الخاص ببناء E2E والتحقق من بناء إنتاجي جديد        |
| `pnpm check:no-dev-routes` بعد البناء الإنتاجي المجبور                         | نجاح: لا توجد علامة معرض التطوير                                                                     |
| `pnpm check:bundle-size`                                                       | **فشل**: النمو 2.13 kB gzip؛ الحد 2.00. الإجمالي 227.16 kB ضمن حد 250، وأكبر route 7.10 kB ضمن حد 80 |
| `pnpm test:e2e` — تشغيل 1                                                      | نجاح: 40/40، 1.8 دقيقة                                                                               |
| `pnpm test:e2e` — تشغيل 2                                                      | نجاح: 40/40، 1.8 دقيقة                                                                               |
| `pnpm test:e2e` — تشغيل 3                                                      | نجاح: 40/40، 1.8 دقيقة                                                                               |
| E2E موجه لرحلة التقييم بعد تحديث mock                                          | نجاح: 1/1                                                                                            |
| إثبات runner مؤقت: assertion يفشل                                              | فشل متوقع: exit code 1؛ أزيل الملف المؤقت                                                            |
| إثبات strict allowlist مؤقت: 404 غير معلن                                      | فشل متوقع: exit code 1؛ أزيل الملف المؤقت                                                            |
| `pnpm audit:prod`, `pnpm audit:full`                                           | لم يُشغّلا؛ يجريهما المالك خارج البيئة                                                               |
| `pnpm install`                                                                 | لم يُشغّل                                                                                            |

## 5. الاختبارات والتغطية

| الحزمة       | ملفات الاختبار | الاختبارات | Statements | Branches | Functions |  Lines | الحد الحالي                   |
| ------------ | -------------: | ---------: | ---------: | -------: | --------: | -----: | ----------------------------- |
| Portal       |             51 |        187 |     87.11% |   68.77% |    75.58% | 89.42% | 85.52 / 67.64 / 73.96 / 87.84 |
| API          |             39 |        216 |     94.04% |   83.98% |    98.99% | 96.22% | 93 / 83 / 98 / 95             |
| UI           |             21 |         84 |       100% |     100% |      100% |   100% | 100 / 100 / 100 / 100         |
| **الإجمالي** |        **111** |    **487** |          — |        — |         — |      — | اجتازت كل الحدود              |

لم تُخفض الحدود. بيانات الاختبارات لا تسجل تحذيرات `console.warn` أو `console.error`؛ إعداد Vitest يفشل الاختبار عند ظهور أي منها.

### قائمة اختبارات Playwright

الاختبارات الموجودة قبل رحلة F8 بقيت؛ العدد ارتفع من 39 إلى 40 بإضافة اختبار واحد. التشغيلات الكاملة الثلاثة جميعها 40/40.

- `admin.spec.ts`: `admin opens academic and teacher administration at mobile and desktop widths`; `admin rejects a teacher application and the same teacher resubmits`.
- `assessments.spec.ts`: `teacher creates a question and exam, reviews results, and publishes a lesson quiz`.
- `auth-request-errors.spec.ts`: `rate limits login and disables retry`; `network failures show the generic request message`.
- `auth-scenarios.spec.ts`: `auth page handles wrong password`; `auth page handles pending teacher`; `auth page handles rejected teacher`; `auth page handles suspended account`; `auth page handles device not registered`; `auth page handles 429 response`; `auth page handles network failure`; `student registration handles email already taken`; `student registration handles phone already taken`; `student registration handles validation details`; `email verification handles invalid code`; `email verification handles expired code`; `email verification handles rate limited code`.
- `auth.spec.ts`: `student signup, email verification, and login`; `teacher registration adds offerings and reaches pending review`; `student, teacher, and admin login redirects by role`; `wrong password remains generic, forgot and reset password never put a code in the URL`; `guard preserves returnTo, logout clears session, and device-change request shows status`; `suspended account login routes to the suspended state`; `expired session redirects to login after a failed refresh`.
- `catalog.spec.ts`: `approved teacher can publish a video lesson and create a bundle`; `teacher course views render in Arabic RTL at mobile width`.
- `learning.spec.ts`: `student opens My lessons and starts the server-authorized file player`; `lesson availability filters follow the URL and switch the shell direction`; `a replacement session announces the device change and can continue here`.
- `orders.spec.ts`: `student submits an order, sees its receipt, and finds it in purchases`; `admin creates a manual cash order and approves a pending payment`; `student cancels a pending order after confirming`; `admin rejects a pending payment with a reason`.
- `portal.spec.ts`: `portal loads and anonymous student routes redirect to login`; `language switch updates document language and direction`; `mobile topbar keeps the language action in the account menu with touch-sized controls`; `development gallery renders both directions`; `development gallery covers Arabic and English at mobile and desktop widths`.
- `student-browse.spec.ts`: `student browses teacher list, details, checkout, and keeps URL filters`.

## 6. إثبات قواعد lint والأمان

- `pnpm lint:rules`: 17/17 مخالفة متوقعة اكتُشفت.
- ESLint مرّ دون أخطاء أو تحذيرات، وtype-check strict مرّ.
- إعداد الاختبارات يجعل console warning/error إخفاقًا، واجتازت الحزم مجموعتها دون تحذيرات.
- runner فشل عند assertion مؤقت؛ وfixture فشل عند استجابة 404 غير معلنة. أزيلت ملفات الإثبات بعد التشغيل.
- لا توجد تبعيات import من `referencebackend/` ولم يظهر سر في diff الملتزم.

## 7. أحجام الحزمة

| القياس                               | الحالي gzip |     الحد | النتيجة                 |
| ------------------------------------ | ----------: | -------: | ----------------------- |
| Portal entry                         |     1.61 kB | للمعلومة | —                       |
| Main app chunk                       |    72.05 kB | للمعلومة | —                       |
| إجمالي JavaScript للتحميل الأولي     |   227.16 kB |   250 kB | يمر حد الحجم المطلق     |
| النمو عن baseline `225.03 kB`        |     2.13 kB |  2.00 kB | **يفشل بمقدار 0.13 kB** |
| أكبر lazy route (`LessonEditorPage`) |     7.10 kB |    80 kB | يمر                     |

الـ `/login` لا يحمّل chunks التسجيل أو نموذج تسجيل المعلم أو بنك الأسئلة. جرى تجميع تعريفات مسارات التقييم في مسار اختياري واحد، لكن النمو بقي أعلى من guard بـ 130 بايت. لم أعدّل baseline. يلزم تحسين إضافي يقيسه checker نفسه قبل قبول F8A.

## 8. الانحرافات عن المواصفة

- لم يكتمل F8A. النطاق المنفذ يقف عند الحد الرابع «lesson quiz and results» وفق خيار التوقف الآمن؛ بعض الأجزاء من هذا الحد موجودة وبعضها غير مكتمل.
- لا يوجد builder كامل للـ homework/quiz/exam rules، ولا تحرير/نشر/إغلاق/أرشفة/نسخ التقييمات مكتمل، ولا اختيار جمهور الطلاب أو random pool/shuffle، ولا صفحة نتائج مكتملة لكل السيناريوهات.
- رحلة E2E الجديدة تغطي draft exam ونتائج ومحاولة وكويز الدرس، لكنها لا تغطي رحلات homework، التخصيص، النشر، أو كل أحجام/لغات المواصفة.
- `check:bundle-size` لا يمر guard نمو +2 kB؛ لم يُخفّف الفشل بزيادة baseline.
- تدقيقا الحزم متروكان للمالك حسب السياسة. لم تُلتقط صور إضافية للمراجعة البصرية؛ E2E يحفظ الصورة الجديدة فقط في المسار المتجاهل.

## 9. الافتراضات

- عقد `docs/api-target-assessments.md` هو هدف الواجهة، مع إبقاء اختلافات الباك الحالي في `docs/contract-differences.md` وطبقة API.
- الدرجات وحالة التقييم ومحاولات الطالب وملكية الأسئلة تبقى قرارات server-side؛ تعرض الواجهة القيم المرسلة فقط.
- mock detail يستخدم المحاولة المجمدة الثابتة مع assessmentId موجود في mock state؛ لا يمثل بيانات درجات حقيقية.

## 10. الأسئلة

- هل يمكن إزالة الـ 130 بايت الزائدة من initial route عبر تصغير route metadata الإضافية، أم يلزم تعديل حد baseline بقرار معماري صريح؟ لم أغير baseline دون قرار.
- ما route/contract الذي سيعتمده مسؤول الباك لنتائج التقييم ومحاولة الطالب المجمدة؟ المسارات المستهدفة غير مثبتة في backend الحالي.
- ما endpoint أو العقد الذي سيزوّد builder بقائمة طلاب المساق لتفعيل `selected_students`؟

## 11. المخاطر والدين التقني

- **مانع قبول:** تجاوز guard نمو الحزمة بـ 0.13 kB gzip، رغم بقاء البداية 22.84 kB دون السقف المطلق.
- دعم backend المستهدف محدود؛ capabilities تبقى مغلقة في live mode حيث لا يوجد دعم موثق، وتفاصيل نتائج التقييم ليست مؤكدة من backend الحالي.
- مصفوفة اختبارات F8 الكاملة غير مكتملة؛ نجاح 487 اختبارًا لا يعني أن جميع حالات القبول المطلوبة مغطاة.
- لم يُجر تدقيق dependency/audit أو اختبار ضغط، ولا يمكن استنتاج جاهزية إنتاجية من هذه النتائج.

## 12. Commits

| Hash      | الرسالة                                              |
| --------- | ---------------------------------------------------- |
| `9ac0d87` | `chore(f8): ignore local log files`                  |
| `a2f5976` | `test(config): fail on console warnings and errors`  |
| `0e5cece` | `feat(api): add target assessment contracts`         |
| `3589c5e` | `docs(f8): record assessment target contract`        |
| `8ee466c` | `feat(api): add assessment capability flags`         |
| `972e1ce` | `fix(api): model MCQ question inputs explicitly`     |
| `08b09e4` | `feat(api): add question bank endpoints and mocks`   |
| `aff169b` | `feat(ui): add assessment question primitives`       |
| `6af1835` | `feat(portal): add teacher question bank`            |
| `dab4961` | `test(portal): ratchet coverage thresholds`          |
| `f033259` | `fix(test): resolve console guard knip findings`     |
| `cdaab2d` | `test(e2e): await device status failure`             |
| `b9f1bff` | `fix(test): honor no-color in e2e workers`           |
| `5d5360c` | `docs(f8): report assessment foundation handoff`     |
| `3a394a0` | `docs(f8): clarify final handoff commit`             |
| `bdc474e` | `docs(f8): align report with final build`            |
| `164f2e6` | `chore(f8): ignore generated e2e output`             |
| `27e9f60` | `feat(api): add assessment endpoints and mocks`      |
| `587e8d5` | `test(api): cover assessment validation failures`    |
| `acc0353` | `test(portal): await teacher list response`          |
| `0622de7` | `feat(portal): add teacher assessment draft builder` |
| `7d0d1b3` | `feat(api): add assessment result summary`           |
| `7f1bf7b` | `feat(portal): add teacher assessment results views` |
| `5e50043` | `feat(portal): add lesson quiz authoring`            |
| `2afd196` | `refactor(portal): defer assessment route dispatch`  |
| `2e54eef` | `fix(api): resolve mock assessment attempts`         |
| `67833b7` | `test(e2e): cover assessment authoring flow`         |

لم يُدفع أي شيء إلى `main` ولم يحدث merge. سيُضاف hash تقرير التسليم إلى سجل Git بعد التزام التوثيق.

## 13. ما ينبغي مراجعته أولًا

1. راجع تجاوز `check:bundle-size` ثم اعتمد تحسينًا إضافيًا قبل اعتبار F8A مقبولة.
2. راجع رحلة `assessments.spec.ts` ومسارات اختيار builder/results/attempt قبل اعتماد شكل المسار الاختياري.
3. راجع coverage thresholds والجدول أعلاه؛ المقاييس لم تُخفض.
4. راجع `docs/contract-differences.md` و`docs/api-target-assessments.md` قبل تمكين أي capability في live mode.
5. أجرِ تدقيقي الحزم خارج هذه البيئة، ثم أكمل الوظائف والاختبارات المتبقية قبل فتح الخطوة التالية.
