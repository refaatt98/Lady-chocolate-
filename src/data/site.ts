import type { SiteInfo } from '../types'
import { defaultContent } from './content'

// ⚠️ بيانات مؤقتة — بدّل الرقم والعنوان بالحقيقيين
export const site: SiteInfo = {
  name: 'الليدي شوكولات',
  latinName: 'Lady Chocolate',
  tagline: 'شوكولا بلجيكية، بروح زمان',
  whatsapp: '972527231273',
  phoneDisplay: '052-723-1273',
  instagram: 'https://instagram.com/',
  address: 'فلسطين',
  hours: 'يوميًا من ١٠ الصبح لـ ١٠ المسا',
  deliveryNote: 'رسوم التوصيل بتختلف حسب المنطقة، ومنأكدها معك على الواتساب قبل التحضير.',
  deliveryCities: ['رام الله', 'البيرة', 'نابلس', 'الخليل', 'بيت لحم', 'جنين', 'طولكرم', 'قلقيلية', 'أريحا', 'القدس', 'سلفيت', 'طوباس'],
  minLeadDays: 2,
  content: defaultContent,
}
