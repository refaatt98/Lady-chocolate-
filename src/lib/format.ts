export const CURRENCY = '₪'

export const formatPrice = (value: number) => `${value.toLocaleString('en-US')} ${CURRENCY}`

/** رابط واتساب جاهز برسالة */
export const whatsappLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
