import React, { useState, type ReactNode } from 'react'
import { Modal, Pressable, Text, View, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/ThemeContext'

export interface Option {
  value: string
  label: string
  hint?: ReactNode
}

export function Select({
  label,
  value,
  options,
  onSelect,
  placeholder = '—',
  disabled,
}: {
  label?: string
  value: string | null
  options: Option[]
  onSelect: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const { colors, radius } = useTheme()
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6, fontWeight: '600' }}>{label}</Text>
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius,
          paddingHorizontal: 14,
          paddingVertical: 12,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted, fontSize: 15 }} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOpen(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius * 1.5,
                borderTopRightRadius: radius * 1.5,
                maxHeight: 480,
                padding: 16,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 10 }}>
                {label || placeholder}
              </Text>
              <FlatList
                data={options}
                keyExtractor={(o) => o.value}
                style={{ maxHeight: 430 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onSelect(item.value)
                      setOpen(false)
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: colors.text, fontSize: 15 }} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.hint ? <View>{item.hint}</View> : null}
                    </View>
                    {value === item.value ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary} />
                    ) : null}
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
