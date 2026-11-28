# F8A — تقرير التنفيذ والتسليم

## 1. الملخص

اكتمل تنفيذ الخطوة **F8A** بالكامل على الفرع `feat/f8a-assessments-teacher` دون إضافة أي dependency جديدة ودون تشغيل `pnpm install` ودون المساس بـ `referencebackend/` أو تغيير `bundle-size-baseline.json`:

- **B0 الصيانة وسياسة الصفر تحذيرات:** `.gitignore` يتجاهل `*.log` و`dist-e2e/`، وحارس `console-guard.ts` مفعّل في Vitest لكل حزمة ليفشل الاختبار عند أي `console.warn` أو `console.error`، واجتازت الحزم الثلاث كامل اختباراتها (519 اختبارًا) بصفر تحذيرات.
- **B1 العقود والتوثيق:** توثيق العقد المستهدف في `docs/api-target-assessments.md` (بما في ذلك `GET /assessments/courses/:courseId/students` و`PATCH /assessments/:assessmentId/archive`)، وتحديث الفروق المؤكدة من `referencebackend/` في `docs/contract-differences.md`، مع قرارَي `ADR-019` و`ADR-020`.
- **B2 طبقة API:** عقود Zod لأسئلة MCQ فقط (2–5 خيارات متميزة، إجابة صحيحة واحدة) وللتقييمات بأنواعها الثلاثة (`exam`/`homework`/`quiz`) وقائمة طلاب الكورس، ومحولات target مقابل live، وجميع أعلام القدرات (`questionImages`, `questionArchive`, `questionMetadata`, `questionBankFilters`, `assessmentTargeting`, `assessmentRandomPool`, `assessmentShuffle`, `assessmentResultsApi`, `quizThresholdSetting`, `mcqOnly`)، وMSW handlers كاملة تشمل قاعدة القفل بعد أول محاولة (تمديد `windowEnd` فقط) و`TARGET_STUDENT_INVALID` و40 سؤالًا ثنائي اللغة.
- **B3 مكونات UI:** `SearchableMultiSelect` و`NumberField` و`OrderList` ودعم `mode="date"` في `DateTimeField` بتغطية 100% على المقاييس الأربعة.
- **B4 الشاشات:**
  - `/teacher/questions`: بنك أسئلة URL-backed كامل مع معاينة فورية كما يراها الطالب (نص خالص دون HTML)، إضافة/تعديل/أرشفة/استعادة، وعرض الأسئلة القديمة غير المدعومة (مثل `essay`) للقراءة فقط.
  - تبويبا **الاختبارات (Exams)** و**الواجبات (Homework)** مباشرةً داخل صفحة الكورس مع شارات الحالة والمواعيد بتوقيت القاهرة وإجراءات `تعديل`، `نشر`، `إغلاق` (بحوار تأكيد)، `أرشفة` (بحوار تأكيد)، `نسخ` (ينشئ مسودة وينتقل للتعديل)، و`النتائج`.
  - باني الامتحانات والواجبات الكامل (إنشاء وتعديل): نافذة توقيت القاهرة (`datetime-local` للامتحان، `date` يومي للواجب)، المدة وعدد المحاولات للامتحان، تبديل الخلط، السحب العشوائي مع تحذير فوري عند تجاوز العدد حجم المجموعة، وقت إظهار النتائج، حد مغادرة التبويب، استهداف كل طلاب الكورس أو طلاب محددين، تصفية بنك الأسئلة، ترتيب الأسئلة عبر `OrderList`، القفل بعد أول محاولة (تمديد وقت الإغلاق فقط)، وحماية مغادرة الصفحة عند وجود تعديلات غير محفوظة (`useBlocker` + `ConfirmDialog`).
  - اختبار الحصة داخل محرر الحصة: نسبة المشاهدة القابلة للتعديل (افتراضي 75%)، زر إنشاء سؤال جديد مباشر (`CreateQuestionDialog`) يُضاف ويُحدد تلقائيًا، حفظ كمسودة أو إنشاء ونشر، ونشر المسودة أو فتح النتائج للاختبار القائم.
  - صفحة نتائج التقييم وتفاصيل المحاولة المجمدة: ملخصات الخادم، بحث الطلاب، تصفية المشتبه فيها، ترقيم الصفحات، وحماية القدرات في وضع live (`assessmentResultsApi`).
- **الأداء وحجم الحزمة:** تم حل تجاوز حارس النمو بنقل أخطاء التقييمات ومساراتها إلى حزم كسولة دون تعديل `bundle-size-baseline.json`، ليعود التحميل الأولي إلى **`226.50 kB gzip`** بنمو **`+1.47 kB`** فقط (أقل من سقف `2.00 kB` وأقل من سقف `250 kB`).
- **التحقق الشامل:** اجتازت جميع البوابات الثابتة واختبارات الوحدة (519 اختبارًا) مع رفع عتبات التغطية، واجتازت حزمة E2E الكاملة (**41/41**) ثلاث مرات متتالية بمتوسط زمن ~2.08 دقيقة (أقل بكثير من 6 دقائق)، ونجح الإثباتان السلبيان (assertion فاشل وطلب 418 غير معلن) برمز خروج 1 ثم أُزيلا. تدقيقا الحزم (`pnpm audit:prod` و`pnpm audit:full`) يبقيان من مسؤولية المالك خارج هذه البيئة.

## 2. الملفات المنشأة أو المعدلة

- **API (`packages/api`):**
  - `src/contracts/assessments.ts` (إضافة عقود MCQ والتقييمات و`CourseStudentSchema` / `CourseStudentListSchema`)
  - `src/adapters/assessments.ts` و`src/endpoints/questions.ts` و`src/endpoints/assessments.ts` (`listCourseStudents` وحراسة القدرات)
  - `src/config/capabilities.ts` (أعلام قدرات F8A)
  - `src/mocks/fixtures/assessments.ts` (40 سؤالًا ثنائي اللغة + تقييمات بكل الحالات + `MOCK_COURSE_STUDENTS` + محاولات)
  - `src/mocks/handlers/assessments.ts` و`src/mocks/handlers/assessments-validation.ts` (مسار طلاب الكورس، قواعد القفل، `TARGET_STUDENT_INVALID`، بحث وترقيم المحاولات)
  - اختبارات الوحدة في وضعَي mock وlive (`assessments.test.ts`، `assessments.live.test.ts`، `questions.test.ts`، `questions.live.test.ts`، `adapters/assessments.test.ts`)
- **UI (`packages/ui`):**
  - `SearchableMultiSelect.tsx`، `NumberField.tsx`، `OrderList.tsx`، وتوسعة `DateTimeField.tsx` بخاصية `mode="date" | "datetime"` واختباراتها الكاملة (تغطية 100%).
- **Portal (`apps/portal`):**
  - `src/features/question-bank/`: صفحة بنك الأسئلة، المحرر، `QuestionLivePreview.tsx`، `CreateQuestionDialog.tsx`، واختبارات الصفحة الكاملة.
  - `src/features/assessments/`: `AssessmentListPanel.tsx`، `AssessmentRowActions.tsx`، `AssessmentBuilderPage.tsx`، `AssessmentBuilderWorkspace.tsx`، `AssessmentBuilderForm.tsx`، `AssessmentScheduleFields.tsx`، `AssessmentRulesFields.tsx`، `AssessmentAudienceFields.tsx`، `AssessmentQuestionsSection.tsx`، `LessonQuizSection.tsx`، `AssessmentResultsPage.tsx`، `AssessmentResultsContent.tsx`، `AssessmentAttemptDetailPage.tsx`، `utils/builder-validation.ts`، `hooks/useAssessmentBuilder.ts`، `hooks/useAssessmentErrorToast.ts`، `hooks/useAssessments.ts`، `hooks/useLessonQuiz.ts`، `hooks/useAssessmentResults.ts`، `routes.ts`، والاختبارات الكاملة (`builder-validation.test.ts`، `AssessmentListPanel.test.tsx`، `AssessmentBuilderPage.test.tsx`، `AssessmentBuilderPage.scenarios.test.tsx`، `LessonQuizSection.test.tsx`، `AssessmentResultsPage.test.tsx`).
  - `src/features/catalog-teacher/pages/TeacherCoursePage.tsx`: تبويبا **Exams** و**Homework** مباشرةً.
  - `src/app/router.tsx` و`src/app/AssessmentRouteDispatcher.tsx`: توجيه كسول لمسارات الإنشاء والتعديل والنتائج وتفاصيل المحاولة مع تحميل أسماء الترجمة الكسولة.
  - `src/shared/i18n/locales/{ar,en}/{assessments,questions}.json` وتخفيف `errors.json` و`routes.ts` لإبقاء الحزمة الأولية ضمن الميزانية.
  - `e2e/assessments.spec.ts`: رحلتا Playwright الكاملتان (1280px EN و375px AR RTL).
- **Docs:** `docs/api-target-assessments.md`، `docs/contract-differences.md`، `docs/decisions/ADR-019-mcq-only-question-bank.md`، `docs/decisions/ADR-020-server-assessment-rules.md`، `CONTEXT.md`، `README.md`، وهذا التقرير.

لم تُنشأ صفحات خارج نطاق F8A، ولم تُسجل أي صور في Git (جميع اللقطات في `docs/reports/screenshots/` المتجاهل)، وبقي `referencebackend/` للقراءة فقط دون تعديل.

## 3. الإصدارات

| الأداة/الحزمة        | الإصدار المستخدم | الحالة                    |
| -------------------- | ---------------: | ------------------------- |
| Node.js              |          24.22.3 | مطابق لـ `.nvmrc`         |
| pnpm                 |         11.28.11 | مطابق لـ `packageManager` |
| React / React DOM    |           19.3.1 | موجود مسبقًا في catalog   |
| React Router         |            8.5.1 | موجود مسبقًا في catalog   |
| Vite                 |            8.3.7 | موجود مسبقًا              |
| TypeScript           |            6.0.3 | موجود مسبقًا وبوضع strict |
| TanStack Query       |          5.107.1 | موجود مسبقًا              |
| Zod                  |            4.6.7 | موجود مسبقًا              |
| Vitest / coverage-v8 |            5.1.0 | موجود مسبقًا              |
| MSW                  |            3.0.4 | موجود مسبقًا              |
| ESLint               |           9.39.5 | قرار ADR-006              |

لا توجد dependencies جديدة ولم يتغير `pnpm-lock.yaml` ولم يُشغّل `pnpm install`.

## 4. الأوامر المنفذة والنتائج

| الأمر                                                                                                 | النتيجة الفعلية                                                                                           |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `git branch --show-current`                                                                           | `feat/f8a-assessments-teacher`                                                                            |
| `pnpm format:check`                                                                                   | نجاح: كل الملفات المطابقة منسقة وفق Prettier                                                              |
| `pnpm lint`                                                                                           | نجاح: 0 أخطاء و0 تحذيرات                                                                                  |
| `pnpm lint:rules`                                                                                     | نجاح: 17/17 fixtures                                                                                      |
| `pnpm typecheck`                                                                                      | نجاح: 3/3 حزم                                                                                             |
| `pnpm test`                                                                                           | نجاح: 114 ملف اختبار / 519 اختبارًا، صفر تحذيرات، واجتياز كل عتبات التغطية المرتفعة                       |
| `pnpm test:headers`                                                                                   | نجاح: 4/4 اختبارات                                                                                        |
| `pnpm knip`                                                                                           | نجاح: لا تصديرات أو ملفات غير مستخدمة                                                                     |
| `pnpm dependency-cruiser`                                                                             | نجاح: 817 وحدة و2696 اعتمادًا دون مخالفات                                                                 |
| `pnpm --filter @noldg/portal build` مع `VITE_API_ORIGIN`, `VITE_UPLOAD_ORIGINS`, `VITE_IMAGE_ORIGINS` | نجاح (بناء إنتاجي نظيف بعد E2E أيضًا)                                                                     |
| `pnpm check:bundle-size`                                                                              | **نجاح**: إجمالي أولي `226.50 kB gzip` (حد `250 kB`)، نمو `+1.47 kB` (حد `2.00 kB`)، أكبر route `7.09 kB` |
| `pnpm check:no-dev-routes`                                                                            | نجاح: لا توجد علامة معرض التطوير في البناء الإنتاجي                                                       |
| `pnpm test:e2e` — تشغيل 1                                                                             | نجاح: 41/41 — زمن فعلي `125.87s` (`2.0m` Playwright)                                                      |
| `pnpm test:e2e` — تشغيل 2                                                                             | نجاح: 41/41 — زمن فعلي `124.64s` (`1.9m` Playwright)                                                      |
| `pnpm test:e2e` — تشغيل 3                                                                             | نجاح: 41/41 — زمن فعلي `124.44s` (`1.9m` Playwright)                                                      |
| إثبات سلبي مؤقت 1 عبر `run-e2e.mjs`: assertion يفشل (`_neg-proof.spec.ts`)                            | فشل متوقع (`element(s) not found`): exit code `1`؛ أُزيل الملف المؤقت                                     |
| إثبات سلبي مؤقت 2 عبر `run-e2e.mjs`: استجابة `418` غير معلنة (`_neg-proof.spec.ts`)                   | فشل متوقع (`undeclaredRequests: [418]`): exit code `1`؛ أُزيل الملف المؤقت                                |
| `pnpm audit:prod`, `pnpm audit:full`                                                                  | لم يُشغّلا؛ مسؤولية المالك خارج هذه البيئة                                                                |
| `pnpm install`                                                                                        | لم يُشغّل                                                                                                 |

## 5. الاختبارات والتغطية

| الحزمة       | ملفات الاختبار | الاختبارات | Statements | Branches | Functions |  Lines | العتبة المفروضة (بعد الرفع)   |
| ------------ | -------------: | ---------: | ---------: | -------: | --------: | -----: | ----------------------------- |
| Portal       |             54 |        217 |     88.30% |   72.61% |    78.16% | 90.40% | 87.30 / 71.61 / 77.16 / 89.40 |
| API          |             39 |        217 |     94.15% |   84.25% |    99.00% | 96.14% | 93.15 / 83.25 / 98.00 / 95.14 |
| UI           |             21 |         85 |       100% |     100% |      100% |   100% | 100 / 100 / 100 / 100         |
| **الإجمالي** |        **114** |    **519** |          — |        — |         — |      — | اجتازت كل الحدود دون أي خفض   |

رُفعت عتبات Portal من `85.52 / 67.64 / 73.96 / 87.84` إلى `87.30 / 71.61 / 77.16 / 89.40`، وعتبات API من `93 / 83 / 98 / 95` إلى `93.15 / 83.25 / 98 / 95.14`، وبقيت UI عند `100%`. لم يصدر أي تحذير `console.warn` أو `console.error` في أي اختبار.

### زمن حزمة Playwright E2E وزمن كل ملف (عامل واحد)

- إجمالي زمن التشغيل الفعلي (شاملًا البناء والتشغيل والإغلاق): `125.87s` (تشغيل 1)، `124.64s` (تشغيل 2)، `124.44s` (تشغيل 3) — أي **~2.08 دقيقة**، وهو أقل بكثير من حد الـ 6 دقائق (لذلك لا حاجة لخطة sharding حاليًا).

| الملف                             | عدد الاختبارات | زمن التنفيذ (تشغيل 1) |
| --------------------------------- | -------------: | --------------------: |
| `e2e/learning.spec.ts`            |              3 |                26.20s |
| `e2e/auth.spec.ts`                |              7 |                17.50s |
| `e2e/admin.spec.ts`               |              2 |                16.70s |
| `e2e/auth-scenarios.spec.ts`      |             13 |                14.70s |
| `e2e/assessments.spec.ts`         |              2 |                10.60s |
| `e2e/portal.spec.ts`              |              5 |                 8.99s |
| `e2e/catalog.spec.ts`             |              2 |                 7.40s |
| `e2e/orders.spec.ts`              |              4 |                 5.80s |
| `e2e/student-browse.spec.ts`      |              1 |                 5.20s |
| `e2e/auth-request-errors.spec.ts` |              2 |                 1.59s |
| **الإجمالي**                      |         **41** | **114.68s** (تشغيل 1) |

### قائمة اختبارات Playwright (41/41 في 3 تشغيلات متتالية)

- `admin.spec.ts`: `admin opens academic and teacher administration at mobile and desktop widths`; `admin rejects a teacher application and the same teacher resubmits`.
- `assessments.spec.ts`: `teacher creates questions, targeted exam, duplicate, homework, lesson quiz, and reviews suspicious results`; `teacher navigates question bank and exam builder in Arabic RTL at 375px`.
- `auth-request-errors.spec.ts`: `rate limits login and disables retry`; `network failures show the generic request message`.
- `auth-scenarios.spec.ts`: 13 اختبار سيناريوهات تسجيل الدخول والتسجيل والتحقق من البريد.
- `auth.spec.ts`: 7 اختبارات لتسجيل الطالب والمعلم وتحويل الأدوار واستعادة كلمة المرور والجلسة وتغيير الجهاز.
- `catalog.spec.ts`: `approved teacher can publish a video lesson and create a bundle`; `teacher course views render in Arabic RTL at mobile width`.
- `learning.spec.ts`: `student opens My lessons and starts the server-authorized file player`; `lesson availability filters follow the URL and switch the shell direction`; `a replacement session announces the device change and can continue here`.
- `orders.spec.ts`: 4 اختبارات للطلبات اليدوية والإلغاء والقبول والرفض بسبب.
- `portal.spec.ts`: 5 اختبارات للحماية وتبديل اللغة والشريط العلوي للجوال ومعرض المكونات.
- `student-browse.spec.ts`: `student browses teacher list, details, checkout, and keeps URL filters`.

### المراجعة البصرية للقطات الشاشة (محفوظة في `docs/reports/screenshots/` المتجاهل فقط)

- `f8a-en-1280-builder.png`: تخطيط نظيف وواضح لباني الامتحان (العنوان، نافذة توقيت القاهرة، المدة والمحاولات، قواعد الخلط والسحب العشوائي وإظهار النتائج وحد مغادرة التبويب، استهداف طلاب الكورس، فلاتر بنك الأسئلة، و`OrderList`).
- `f8a-en-1280-results.png`: بطاقات الملخص الواردة من الخادم، بحث الطلاب، فلتر الاشتباه، الجدول بالتوقيت القاهري، وروابط عرض المحاولة.
- `f8a-en-1280-lesson-quiz.png`: قسم اختبار الحصة داخل محرر الحصة بشارة الحالة `Published` ورابط `Results`.
- `f8a-ar-375-assessments.png`: عرض عربي RTL سليم عند عرض 375px دون قص أو تجاوز أفقي.

## 6. إثبات قواعد lint والأمان

- `pnpm lint:rules`: 17/17 مخالفة متوقعة اكتُشفت.
- ESLint: 0 أخطاء و0 تحذيرات؛ TypeScript strict: 3/3 حزم.
- حارس `console-guard.ts` يفشل الاختبارات على أي `console.warn`/`console.error`، واجتازت 519 اختبارًا دون تحذيرات.
- جميع نصوص الأسئلة والخيارات والشرح تُعرض كنص خالص دون HTML.
- جميع التواريخ والمواعيد تمر حصريًا عبر `apps/portal/src/shared/time/time.ts`، والدرجات والاشتباه والأهلية قرارات server-side فقط.
- الإثباتان السلبيان عبر `run-e2e.mjs` فشلا برمز خروج `1` للسبب المقصود بالضبط (فشل assertion ثم رفض طلب `418` غير معلن)، وأُزيل الملف المؤقت بعد التحقق.
- لا توجد أي استيرادات من `referencebackend/` ولا أسرار في الكود أو diff.

## 7. أحجام الحزمة

| القياس                               | الحالي gzip |     الحد | النتيجة                 |
| ------------------------------------ | ----------: | -------: | ----------------------- |
| Portal entry                         |     1.61 kB | للمعلومة | —                       |
| Main app chunk                       |    72.02 kB | للمعلومة | —                       |
| إجمالي JavaScript للتحميل الأولي     |   226.50 kB |   250 kB | **يمر** (هامش 23.50 kB) |
| النمو عن baseline `225.03 kB`        |     1.47 kB |  2.00 kB | **يمر** (هامش 0.53 kB)  |
| أكبر lazy route (`LessonEditorPage`) |     7.09 kB |    80 kB | **يمر**                 |

بقي `bundle-size-baseline.json` دون أي تعديل (`225.03 kB`). تحقّق الخفض بنقل رسائل أخطاء التقييمات ومساراتها ومُوزّعها إلى حزم كسولة بعيدًا عن حزمة `/login`.

## 8. الانحرافات عن المواصفة

- **لا توجد انحرافات في نطاق F8A.**
- تدقيقا الحزم (`pnpm audit:prod` و`pnpm audit:full`) لم يُشغّلا داخل البيئة وفق القاعدة الصريحة بأنهما مسؤولية المالك.
- فلاتر/حقول ربط السؤال بـ `subjectId` و`lessonId` في بنك الأسئلة تقبل معرّفات نصية لأن العقد الحالي لا يوفر قائمة اختيار عامة مجمّعة لكل المواد/الحصص في هذه الشاشة.

## 9. الافتراضات

- العقد المستهدف في `docs/api-target-assessments.md` هو المرجع للواجهة، بينما تبقى فجوات الخادم الحالي موثقة ومقيّدة بأعلام القدرات في `docs/contract-differences.md` و`packages/api/src/config/capabilities.ts`.
- في وضع live تبقى ميزات الصور والأرشفة والفلاتر المتقدمة واستهداف الطلاب والسحب العشوائي والخلط وواجهة النتائج ونسبة المشاهدة المنصّية معطّلة تلقائيًا برسائل توضيحية آمنة حتى يعتمدها الباك إند.
- جميع قرارات القفل والأهلية والدرجات والاشتباه والمواعيد النهائية للمحاولات تبقى من اختصاص الخادم وحده.

## 10. الأسئلة للباك إند / المالك

1. تأكيد عقد `GET /assessments/courses/:courseId/students` (قائمة طلاب الكورس للاستهداف الفردي) ومسار `PATCH /assessments/:assessmentId/archive` قبل تفعيل قدرات الكتابة في live mode.
2. تأكيد مسارَي نتائج المعلم `GET /assessments/:assessmentId/attempts` و`GET /assessments/:assessmentId/attempts/:attemptId` وحقلَي `summary` و`suspicious` المحسوبين من الخادم.
3. تأكيد إعداد المنصة لنسبة مشاهدة كويز الحصة (الافتراضي `75%` مقابل `100%` في المخطط الحالي) وقاعدة القفل بعد أول محاولة (`ASSESSMENT_LOCKED`).
4. تذكير: الفرع المنفصل `fix/frontend-hardening` ما زال محفوظًا وسليمًا بانتظار قرارك بدمجه لاحقًا بعد مراجعة F8A.

## 11. المخاطر والدين التقني

- تبقى قدرات F8A المتقدمة معطّلة في `VITE_API_MODE=live` ضد الخادم المرجعي الحالي حتى تُنفّذ عقود `docs/api-target-assessments.md`.
- تدقيقا الأمان (`pnpm audit:prod` و`pnpm audit:full`) يجب أن يجريهما المالك قبل الدمج في `main`.

## 12. Commits (على `feat/f8a-assessments-teacher`)

| Hash      | الرسالة                                                                              |
| --------- | ------------------------------------------------------------------------------------ |
| `9ac0d87` | `chore(f8): ignore local log files`                                                  |
| `a2f5976` | `test(config): fail on console warnings and errors`                                  |
| `0e5cece` | `feat(api): add target assessment contracts`                                         |
| `3589c5e` | `docs(f8): record assessment target contract`                                        |
| `8ee466c` | `feat(api): add assessment capability flags`                                         |
| `972e1ce` | `fix(api): model MCQ question inputs explicitly`                                     |
| `08b09e4` | `feat(api): add question bank endpoints and mocks`                                   |
| `aff169b` | `feat(ui): add assessment question primitives`                                       |
| `6af1835` | `feat(portal): add teacher question bank`                                            |
| `dab4961` | `test(portal): ratchet coverage thresholds`                                          |
| `f033259` | `fix(test): resolve console guard knip findings`                                     |
| `cdaab2d` | `test(e2e): await device status failure`                                             |
| `b9f1bff` | `fix(test): honor no-color in e2e workers`                                           |
| `5d5360c` | `docs(f8): report assessment foundation handoff`                                     |
| `3a394a0` | `docs(f8): clarify final handoff commit`                                             |
| `bdc474e` | `docs(f8): align report with final build`                                            |
| `164f2e6` | `chore(f8): ignore generated e2e output`                                             |
| `27e9f60` | `feat(api): add assessment endpoints and mocks`                                      |
| `587e8d5` | `test(api): cover assessment validation failures`                                    |
| `acc0353` | `test(portal): await teacher list response`                                          |
| `0622de7` | `feat(portal): add teacher assessment draft builder`                                 |
| `7d0d1b3` | `feat(api): add assessment result summary`                                           |
| `7f1bf7b` | `feat(portal): add teacher assessment results views`                                 |
| `5e50043` | `feat(portal): add lesson quiz authoring`                                            |
| `2afd196` | `refactor(portal): defer assessment route dispatch`                                  |
| `2e54eef` | `fix(api): resolve mock assessment attempts`                                         |
| `67833b7` | `test(e2e): cover assessment authoring flow`                                         |
| `a47b4ad` | `docs(f8): report assessment implementation status`                                  |
| `b8b8c4d` | `feat(api,ui): add course student roster, locked mock rules, and date mode`          |
| `caefd66` | `perf(portal): move assessment errors and routes to lazy chunks`                     |
| `18d33a8` | `feat(portal): add live student preview to question editor`                          |
| `785091d` | `feat(portal): complete assessment tabs, list lifecycle, and full builder`           |
| `10253c7` | `feat(portal): complete lesson quiz authoring dialog and results capability guard`   |
| `d75053a` | `test(portal): cover assessment list, builder, quiz, and results scenarios`          |
| `159f5a3` | `test(e2e): cover full F8A authoring, targeting, duplicate, homework, quiz, and RTL` |

سيُضاف commit التوثيق النهائي لهذا التقرير مباشرة بعد هذه القائمة على `feat/f8a-assessments-teacher`. لم يُدفع أي شيء إلى `main` ولم يحدث merge.

## 13. ما ينبغي مراجعته أولًا

1. راجع `docs/api-target-assessments.md` و`docs/contract-differences.md` مع مطوّر الباك إند (خاصةً مسار طلاب الكورس والأرشفة ونتائج المحاولات).
2. شغّل `pnpm audit:prod` و`pnpm audit:full` خارج هذه البيئة قبل الدمج في `main`.
3. راجع لقطات الشاشة الأربع في `docs/reports/screenshots/` (`f8a-en-1280-builder.png`، `f8a-en-1280-results.png`، `f8a-en-1280-lesson-quiz.png`، `f8a-ar-375-assessments.png`).
4. راجع `check:bundle-size` (`226.50 kB gzip`، نمو `+1.47 kB` دون تغيير baseline) ورفع عتبات التغطية في `apps/portal/vitest.config.ts` و`packages/api/vitest.config.ts`.
