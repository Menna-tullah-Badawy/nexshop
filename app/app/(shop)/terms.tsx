import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Screen } from '../../src/components/ui/Screen'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { t } from '../../src/i18n'

/** Editable terms & conditions template — customize per customer. */
export default function Terms() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)

  const ar = [
    ['الطلبات', 'يُعتبر الطلب مؤكدًا بعد التواصل معك للتأكيد. نحتفظ بحق إلغاء الطلب في حالة عدم توفر المنتج.'],
    ['الأسعار', 'جميع الأسعار تشمل الضريبة ما لم يُذكر غير ذلك. قد تتغير الأسعار دون إخطار مسبق.'],
    ['الشحن والتوصيل', 'تختلف مدة التوصيل حسب المحافظة. يتم إخطارك عند خروج الطلب للتوصيل.'],
    ['الاستبدال والاسترجاع', 'يمكنك الاستبدال أو الاسترجاع خلال 14 يومًا من الاستلام بشرط أن يكون المنتج بحالته الأصلية.'],
    ['الدفع عند الاستلام', 'في حالة طلب الدفع عند الاستلام وعدم الاستلام، قد نضطر لإلغاء الطلب.'],
  ]
  const en = [
    ['Orders', 'An order is confirmed after we contact you. We reserve the right to cancel if an item is unavailable.'],
    ['Prices', 'Prices include taxes unless stated otherwise and may change without notice.'],
    ['Shipping', 'Delivery time varies by governorate. You will be notified once the order is out for delivery.'],
    ['Returns', 'You may exchange or return within 14 days of delivery if the item is in original condition.'],
    ['Cash on delivery', 'Repeatedly refusing COD orders may lead to order cancellation.'],
  ]
  const rows = lang === 'ar' ? ar : en

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{t('app.terms')}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {brand?.store_name} · {new Date().getFullYear()}
        </Text>
        {rows.map(([title, body]) => (
          <View key={title} style={{ backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, marginBottom: 6 }}>{title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 21 }}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  )
}
