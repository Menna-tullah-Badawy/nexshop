// API types (mirror the backend)

export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  role: 'customer' | 'admin'
  currency: string | null
  created_at: string
  addresses: Address[]
}

export interface Address {
  id?: number
  label?: string
  full_name: string
  phone: string
  city?: string
  street?: string
  notes?: string
  is_default?: boolean
}

export interface TokenOut {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Category {
  id: number
  slug: string
  name: string
  name_ar: string
  name_en: string
  image_url: string | null
  is_active: boolean
}

export interface Variant {
  label: string
  values: string[]
}

export interface Product {
  id: number
  category_id: number | null
  slug: string
  name_ar: string
  name_en: string
  desc_ar: string | null
  desc_en: string | null
  brand: string | null
  price: number // base currency
  cost?: number
  stock: number
  images: string[]
  variants: Variant[] | null
  is_active: boolean
  is_featured: boolean
  rating_avg: number
  review_count: number
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface Currency {
  code: string
  rate: number
  name_ar: string
  name_en: string
  symbol: string
}

export interface Zone {
  id: number
  name_ar: string
  name_en: string
  fee: number
}

export interface Brand {
  store_name: string
  store_name_ar?: string
  tagline: { ar: string; en: string }
  logo_url: string | null
  primary_color: string
  theme_preset: string
  dark_default: boolean
  announcement: { ar: string; en: string }
  base_currency: string
  currencies: Currency[]
  delivery: { enabled: boolean; zones: Zone[] }
  payments: { cod: boolean; stripe: boolean; demo: boolean }
  contact: { phone: string | null; email: string | null; address: string | null }
  social: Record<string, string>
}

export interface OrderItem {
  id: number
  product_id: number | null
  name_ar: string
  name_en: string
  image: string | null
  variant: string | null
  price: number
  qty: number
  line_total: number
}

export interface Order {
  id: number
  order_no: string
  status: 'pending' | 'confirmed' | 'packing' | 'out_for_delivery' | 'delivered' | 'cancelled'
  payment_method: 'cod' | 'stripe'
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  currency: string
  rate: number
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  base_subtotal: number
  base_delivery: number
  base_discount: number
  base_total: number
  promo_code: string | null
  customer_name: string
  customer_phone: string
  address: Address | null
  governorate: string | null
  notes: string | null
  courier_name: string | null
  courier_phone: string | null
  created_at: string
  delivered_at: string | null
  items: OrderItem[]
}

export interface Review {
  id: number
  rating: number
  text: string | null
  created_at: string
  user_name: string
}

export interface CartLine {
  product: Product
  qty: number
  variant: string | null
}
