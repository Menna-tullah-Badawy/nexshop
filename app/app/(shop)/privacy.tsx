import React from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Screen } from '../../src/components/ui/Screen'
import { useTheme } from '../../src/theme/ThemeContext'
import { useUiStore } from '../../src/store/ui'
import { t } from '../../src/i18n'

/**
 * Editable privacy policy template — replace the paragraphs per customer
 * (or move the text into admin-managed settings when needed).
 */
export default function Privacy() {
  const { colors, radius } = useTheme()
  const lang = useUiStore((s) => s.lang)
  const brand = useUiStore((s) => s.brand)

  const ar = [
    ['جمع البيانات', 'نجمع البيانات اللازمة لإتمام طلبك فقط: الاسم، رقم الهاتف، العنوان، والبريد الإلكتروني.'],
    ['استخدام البيانات', 'تُستخدم بياناتك لتنفيذ الطلبات والتواصل معك بشأنها وتحسين تجربتك في المتجر.'],
    ['الدفع', 'بيانات بطاقتك تُعالج عبر مزودي الدفع المعتمدين (مثل Stripe) ولا نخزن أرقام البطاقات على خوادمنا.'],
    ['مشاركة البيانات', 'لا نبيع بياناتك لأي طرف ثالث. قد نشاركها فقط مع شركات الشحن لتنفيذ طلبك.'],
    ['حقوقك', 'يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها في أي وقت عبر التواصل معنا.'],
  ]
  const en = [
    ['Data collection', 'We only collect what is needed to fulfil your order: name, phone, address and email.'],
    ['How we use data', 'Your data is used to process orders, contact you about them and improve your experience.'],
    ['Payments', 'Card details are handled by certified payment providers (e.g. Stripe); we never store card numbers.'],
    ['Data sharing', 'We never sell your data. It is shared only with couriers to deliver your order.'],
    ['Your rights', 'You may request to view, correct or delete your data at any time by contacting us.'],
  ]
  const rows = lang === 'ar' ? ar : en

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 40 }}>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{t('app.privacy')}</Text>
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
