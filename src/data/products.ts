import type { Product } from '../types'

// ⚠️ الأسعار والأسماء مؤقتة — بدّلها بالحقيقية
export const products: Product[] = [
  {
    id: 'p-green-field',
    slug: 'green-field-tray',
    name: 'صينية الحقل الأخضر',
    categoryId: 'cat-trays',
    shortDescription: 'زهرة شوكولا بالحليب حوالين قرص مرسوم، وقطع بأخضر الهوية.',
    description:
      'صينية دائرية مرتبة باليد: بتلات شوكولا بلجيكية بالحليب على شكل زهرة، بنصّها قرص شوكولا بيضاء مطبوع عليه رسمة ريفية قديمة والاسم اللي بتختاره، ومحاطة بقطع ملفوفة بالأخضر مكتوب عليها الاسم. بتنفع للنجاح، المواليد والمناسبات الحلوة.',
    price: 280,
    images: ['/images/products/tray-green-field.jpg', '/images/products/tray-green-field-square.jpg'],
    sizes: [
      { id: 's', label: 'صغيرة', pieces: 60, price: 280 },
      { id: 'm', label: 'وسط', pieces: 90, price: 380 },
      { id: 'l', label: 'كبيرة', pieces: 130, price: 520 },
    ],
    ingredients: ['شوكولا بلجيكية بالحليب', 'شوكولا بيضاء', 'طباعة صالحة للأكل'],
    customization: [
      { id: 'name', label: 'الاسم', placeholder: 'مثلًا: توفيق', maxLength: 20 },
      { id: 'phrase', label: 'العبارة', placeholder: 'مثلًا: اللهم أنبته نباتًا حسنًا', maxLength: 40 },
    ],
    preview: {
      image: '/images/products/tray-green-field-square.jpg',
      disc: { cx: 47.8, cy: 50, w: 26.4, h: 22.8 },
      coverTo: 60,
      top: 'phrase',
      main: 'name',
    },
    featured: true,
    badge: 'بالاسم',
  },
  {
    id: 'p-white-names',
    slug: 'white-names-tray',
    name: 'صينية الأبيض الملكي',
    categoryId: 'cat-trays',
    shortDescription: 'بتلات شوكولا كثيفة، وحلقة قطع بيضاء عليها أسامي العرسان.',
    description:
      'صينية للخطبة والعرس: طبقات بتلات شوكولا بلجيكية بالحليب والداكنة بشكل زهرة كبيرة، بنصّها قرص أبيض مكتوب عليه أسماء العرسان والتاريخ بخط عربي ناعم، ومحاطة بحلقة قطع بيضاء مخصّصة بالأسامي.',
    price: 320,
    images: ['/images/products/tray-white-names.jpg', '/images/products/tray-white-names-square.jpg'],
    sizes: [
      { id: 's', label: 'صغيرة', pieces: 70, price: 320 },
      { id: 'm', label: 'وسط', pieces: 100, price: 430 },
      { id: 'l', label: 'كبيرة', pieces: 150, price: 590 },
    ],
    ingredients: ['شوكولا بلجيكية بالحليب', 'شوكولا داكنة', 'شوكولا بيضاء'],
    customization: [
      { id: 'names', label: 'الأسماء', placeholder: 'مثلًا: منى ومحمود', maxLength: 30 },
      { id: 'date', label: 'التاريخ', placeholder: 'مثلًا: 25.9.26', maxLength: 12 },
    ],
    preview: {
      image: '/images/products/tray-white-names-square.jpg',
      disc: { cx: 47.7, cy: 48.2, w: 26.4, h: 22.4 },
      main: 'names',
      bottom: 'date',
    },
    featured: true,
    badge: 'للأعراس',
  },
]
