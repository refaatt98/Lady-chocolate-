# الليدي شوكولات — Lady Chocolate

واجهة موقع متجر شوكولا بلجيكية. الطلب بيصير عن طريق واتساب.

## التشغيل

```bash
npm install
npm run dev
```

بعدها افتح الرابط اللي بيطلع بالترمينال (عادةً http://localhost:5173).

| الأمر | شو بيعمل |
| --- | --- |
| `npm run dev` | تشغيل للتطوير |
| `npm run build` | فحص الأنواع وبناء نسخة الإنتاج بـ `dist/` |
| `npm run preview` | تجربة نسخة الإنتاج محليًا |
| `npm run lint` | فحص الكود |

## الستاك

React + TypeScript · Vite · Tailwind CSS v4 · React Router · motion · lucide-react

## هيكل المشروع

```
src/
  pages/        صفحة لكل ملف
  components/   مكوّنات مشتركة
  data/         بيانات وهمية (منتجات، أقسام، معلومات المحل)
  lib/api.ts    كل جلب البيانات بيمر من هون
  types.ts      أنواع البيانات
  index.css     الألوان والخطوط (tokens)
public/images/  صور المنتجات
```

## تعديلات سريعة

- **الألوان والخطوط:** بـ `src/index.css` داخل `@theme`.
- **رقم الواتساب والعنوان:** بـ `src/data/site.ts`.
- **المنتجات:** بـ `src/data/products.ts`، والصور بـ `public/images/products/`.
- **الأقسام:** بـ `src/data/categories.ts`.

## الطلب

ما في دفع بالموقع. الزبون بيعبّي "طلبيتي" (محفوظة بالمتصفح)، وبعدين بيبعتها كلها برسالة واتساب وحدة.
رقم الواتساب بـ `src/data/site.ts`.

## الرفع على Netlify

ملف `netlify.toml` جاهز. من Netlify: **Add new site ← Import an existing project ← GitHub**،
اختار الريبو والفرع، والإعدادات بتنقرأ لحالها (build: `npm run build`، publish: `dist`).

## ربط Supabase لاحقًا

الصفحات ما بتقرأ من `src/data/` مباشرة. كلها بتستدعي دوال `src/lib/api.ts`.
لما نربط Supabase، بنغيّر جسم هالدوال بس، ومنخلي أسماءها وأنواع اللي بترجعه زي ما هي.
