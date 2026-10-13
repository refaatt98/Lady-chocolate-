import type { SiteContent } from '../types'

/**
 * النصوص الافتراضية للصفحة الرئيسية.
 * أي إشي بيتعدّل من لوحة التحكم ← محتوى الموقع بينحفظ بقاعدة البيانات وبيغلب على هون.
 */
export const defaultContent: SiteContent = {
  hero: {
    eyebrow: 'Belgian Chocolate',
    titleLine1: 'شوكولا بلجيكية،',
    titleLine2: 'بروح زمان',
    text: 'صواني وهدايا بتنرتب باليد بتلة بتلة، وبتنكتب عليها أساميكم وتواريخكم الحلوة.',
    chips: ['بلجيكية ١٠٠٪', 'شغل إيد', 'بأساميكم'],
    primaryCta: 'اكتشف التشكيلة',
    secondaryCta: 'اسألنا على واتساب',
  },
  ribbon: { words: ['عرس', 'خطوبة', 'مولود جديد', 'نجاح', 'عيد', 'تخرّج', 'شكرًا', 'رمضان', 'هدية حب'] },
  categories: {
    eyebrow: 'Our Chocolate',
    title: 'زهرة الأقسام',
    description: 'متل صوانينا: كل بتلة نوع. اختار البتلة اللي بتشبهك.',
    hint: 'مرّق على البتلات أو اكبسها لتكتشف كل نوع',
  },
  products: {
    eyebrow: 'Signature',
    title: 'هدايا ملفوفة إلك',
    description: 'كل صينية بتوصلك ملفوفة بورق الليدي — وهون كمان. استنى لحظة وبتنفتح.',
  },
  journey: {
    eyebrow: 'Our Story',
    title: 'من الحبة للصينية',
    image: '/images/products/tray-green-field.jpg',
    chapters: [
      { title: 'من حبة كاكاو', text: 'كل إشي بيبدأ من حبة. منختار شوكولا بلجيكية أصلية، معمولة من أنقى حبوب الكاكاو.' },
      { title: 'بتذوب على مهل', text: 'منذوّبها على حرارة هادية ومضبوطة، عشان تطلع لامعة وناعمة وبتطقطق تحت السن.' },
      { title: 'بتترتب باليد', text: 'بتلة ورا بتلة، بتنصفّ الشوكولا باليد على شكل زهرة. ولا صينية بتشبه الثانية.' },
      { title: 'وبتوصلك بأساميكم', text: 'وبالآخر بنكتب أساميكم وتاريخ فرحتكم، وبتطلع هدية بتضل بالذاكرة.' },
    ],
  },
  nameSection: {
    eyebrow: 'Make it yours',
    title: 'جرّب اسمك على الصينية',
    description: 'اكتب، وشوف كيف رح تطلع صينيتك قبل ما تطلبها.',
    occasions: ['عرس', 'خطوبة', 'مولود', 'نجاح', 'عيد ميلاد'],
    buttonText: 'ضيفها للطلبية بهالاسم',
    productSlug: 'white-names-tray',
  },
  howTo: {
    eyebrow: 'How to order',
    title: 'كيف تطلب؟',
    description: 'ثلاث خطوات وبس — بدون حسابات ولا تعقيد.',
    steps: [
      { title: 'اختار', text: 'اختار الصينية أو العلبة والحجم اللي بيناسبك.' },
      { title: 'خصّص', text: 'اكتب الاسم أو التاريخ أو العبارة اللي بدك ياها.' },
      { title: 'ابعت', text: 'بنفتحلك واتساب برسالة جاهزة، وإحنا بنكمل معك.' },
    ],
  },
}

/** بيدمج المحتوى المحفوظ مع الافتراضي — أي حقل ناقص أو فاضي بياخد الافتراضي */
export function mergeContent(saved: unknown): SiteContent {
  const src = saved && typeof saved === 'object' ? (saved as Record<string, Record<string, unknown>>) : {}
  const out = structuredClone(defaultContent) as unknown as Record<string, Record<string, unknown>>
  for (const [section, defaults] of Object.entries(out)) {
    const given = src[section]
    if (!given || typeof given !== 'object') continue
    for (const [key, def] of Object.entries(defaults)) {
      const value = given[key]
      if (Array.isArray(def)) {
        if (Array.isArray(value) && value.length) {
          // مصفوفة نصوص أو عناصر {title,text}
          out[section][key] =
            typeof def[0] === 'string'
              ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
              : def.map((d, i) => ({ ...(d as object), ...(value[i] && typeof value[i] === 'object' ? value[i] : {}) }))
        }
      } else if (typeof value === 'string' && value.trim() !== '') {
        out[section][key] = value
      }
    }
  }
  return out as unknown as SiteContent
}

/** "الحفظ والتقديم" الافتراضي لأي منتج — الأدمن بيعدّله لكل منتج */
export const DEFAULT_STORAGE_NOTE =
  'احفظها بمكان بارد وناشف، بعيد عن الشمس والريحة القوية. الأفضل ما تنحط بالثلاجة، ولو اضطريت، طلّعها قبل التقديم بشوي.'
