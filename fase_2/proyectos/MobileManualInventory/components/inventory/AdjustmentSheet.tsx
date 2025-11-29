import { useEffect, useMemo, useState } from 'react';
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

import type { ManualAdjustmentPayload, ProductInventoryItem } from '@/lib/manualInventoryTasks';
import { usePalette, type Palette } from '@/hooks/use-palette';

type AdjustmentSheetProps = {
  product: ProductInventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ManualAdjustmentPayload) => Promise<void> | void;
};

export const AdjustmentSheet = ({ product, visible, onClose, onSubmit }: AdjustmentSheetProps) => {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [type, setType] = useState<ManualAdjustmentPayload['type']>('increase');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setType('increase');
      setQuantity('1');
      setReason('');
      setSubmitting(false);
      setError(null);
    }
  }, [visible, product]);

  const submit = async () => {
    if (!product || submitting) return;
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Ingresa una cantidad valida.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        productId: product.id,
        type,
        quantity: Math.trunc(parsed),
        reason: reason.trim() || null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar el ajuste.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
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
              onChangeText={(value) => {
                setQuantity(value);
                if (error) setError(null);
              }}
              style={styles.input}
              placeholder="1"
              placeholderTextColor={palette.muted}
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
              placeholderTextColor={palette.muted}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable style={[styles.submit, submitting ? styles.submitDisabled : null]} onPress={submit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Guardando...' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const withAlpha = (hex: string, alpha = '22') => `${hex}${alpha}`;

const createStyles = (palette: Palette) =>
  StyleSheet.create({
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
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.text,
    },
    subtitle: {
      color: palette.muted,
    },
    segment: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: palette.card,
    },
    segmentActive: {
      backgroundColor: withAlpha(palette.tint, '22'),
    },
    segmentLabel: {
      fontWeight: '500',
      color: palette.muted,
    },
    segmentLabelActive: {
      color: palette.tint,
    },
    field: {
      marginTop: 4,
    },
    label: {
      fontSize: 14,
      color: palette.muted,
      marginBottom: 6,
    },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 12,
      fontSize: 16,
      backgroundColor: palette.background,
      color: palette.text,
    },
    textarea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    error: {
      color: palette.danger,
      fontSize: 14,
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
      borderColor: palette.border,
      alignItems: 'center',
      backgroundColor: palette.card,
    },
    submit: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: palette.tint,
    },
    submitDisabled: {
      opacity: 0.6,
    },
    cancelText: {
      fontWeight: '600',
      color: palette.text,
    },
    submitText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });

export default AdjustmentSheet;
