import type { Category } from '../types'

// ⚠️ أقسام مبدئية — عدّلها حسب أنواع الشوكولا عندك
export const categories: Category[] = [
  {
    id: 'cat-trays',
    slug: 'trays',
    name: 'صواني المناسبات',
    latinName: 'Occasion Trays',
    description: 'صواني مرتبة يدويًا، بتنكتب عليها الأسامي والتاريخ.',
    tone: 'olive',
  },
  {
    id: 'cat-milk',
    slug: 'milk',
    name: 'بالحليب',
    latinName: 'Milk',
    description: 'شوكولا بلجيكية بالحليب، ناعمة وكريمية.',
    tone: 'milk',
  },
  {
    id: 'cat-dark',
    slug: 'dark',
    name: 'داكنة',
    latinName: 'Dark',
    description: 'كاكاو عالي وطعم عميق لعشّاق المرارة الحلوة.',
    tone: 'dark',
  },
  {
    id: 'cat-white',
    slug: 'white',
    name: 'بيضاء',
    latinName: 'White',
    description: 'زبدة كاكاو وفانيلا، طعم هادي وناعم.',
    tone: 'white',
  },
  {
    id: 'cat-filled',
    slug: 'filled',
    name: 'محشية',
    latinName: 'Pralines',
    description: 'برالين بحشوات بندق، فستق وكراميل.',
    tone: 'caramel',
  },
]
