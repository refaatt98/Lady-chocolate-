export const CURRENCY = '₪'

export const formatPrice = (value: number) => `${value.toLocaleString('en-US')} ${CURRENCY}`

/**
 * رابط واتساب جاهز برسالة.
 * منستعمل api.whatsapp.com مباشرة مش wa.me — لأنه wa.me لما يحوّل بيخرّب الإيموجي (🍫 بتصير �).
 */
export const whatsappLink = (phone: string, message: string) =>
  `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
