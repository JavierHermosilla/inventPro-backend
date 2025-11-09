import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import type { ManualAdjustmentPayload, ProductInventoryItem } from '@/lib/manualInventoryTasks';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AdjustmentSheetProps = {
  product: ProductInventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ManualAdjustmentPayload) => void;
};

export const AdjustmentSheet = ({ product, visible, onClose, onSubmit }: AdjustmentSheetProps) => {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const [type, setType] = useState<ManualAdjustmentPayload['type']>('increase');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) {
      setType('increase');
      setQuantity('1');
      setReason('');
    }
  }, [visible, product]);

  const submit = () => {
    if (!product) return;
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    onSubmit({
      productId: product.id,
      type,
      quantity: Math.trunc(parsed),
      reason: reason.trim() || null,
    });
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: palette.card }]}>
          <Text style={styles.title}>Ajustar stock</Text>
          {product ? (
            <Text style={styles.subtitle}>
              {product.name} · Stock actual: {product.stock}
            </Text>
          ) : null}

          <View style={styles.segment}>
            <Pressable
              accessibilityRole="button"
              style={[styles.segmentButton, type === 'increase' ? styles.segmentActive : null]}
              onPress={() => setType('increase')}
            >
              <Text style={[styles.segmentLabel, type === 'increase' ? styles.segmentLabelActive : null]}>Ingreso</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.segmentButton, type === 'decrease' ? styles.segmentActive : null]}
              onPress={() => setType('decrease')}
            >
              <Text style={[styles.segmentLabel, type === 'decrease' ? styles.segmentLabelActive : null]}>Salida</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cantidad</Text>
            <TextInput
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              style={styles.input}
              placeholder="1"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Motivo (opcional)</Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={reason}
              onChangeText={setReason}
              style={[styles.input, styles.textarea]}
              placeholder="Describe el ajuste"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.submit} onPress={submit}>
              <Text style={styles.submitText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#475467',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#E0E7FF',
  },
  segmentLabel: {
    fontWeight: '500',
    color: '#475467',
  },
  segmentLabelActive: {
    color: '#1D4ED8',
  },
  field: {
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  submit: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
  },
  cancelText: {
    fontWeight: '600',
    color: '#475467',
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default AdjustmentSheet;
