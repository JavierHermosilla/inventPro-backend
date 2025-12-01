import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette, type Palette } from '@/hooks/use-palette';
import type { ManualAdjustmentPayload, ProductInventoryItem } from '@/lib/manualInventoryTasks';

type AdjustmentSheetProps = {
  product: ProductInventoryItem | null;
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ManualAdjustmentPayload) => Promise<void> | void;
};

export const AdjustmentSheet = ({ product, visible, onClose, onSubmit }: AdjustmentSheetProps) => {
  const palette = usePalette();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
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
    const normalizedQuantity = Math.trunc(parsed);
    const trimmedReason = reason.trim();
    if (type === 'decrease' && trimmedReason.length === 0) {
      setError('Debes indicar un motivo para una salida de stock.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        productId: product.id,
        type,
        quantity: normalizedQuantity,
        reason: trimmedReason.length > 0 ? trimmedReason : null,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar el ajuste.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = submitting || (type === 'decrease' && reason.trim().length === 0);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.bottom + 24}
        style={styles.wrapper}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Ajustar stock</Text>
            {product ? (
              <Text style={styles.subtitle}>
                {product.name} - Stock actual: {product.stock}
              </Text>
            ) : null}

            <View style={styles.segment}>
              <Pressable
                accessibilityRole="button"
                style={[styles.segmentButton, type === 'increase' ? styles.segmentActive : null]}
                onPress={() => {
                  setType('increase');
                  if (error) setError(null);
                }}
                testID="segment-increase"
              >
                <Text style={[styles.segmentLabel, type === 'increase' ? styles.segmentLabelActive : null]}>
                  Ingreso
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.segmentButton, type === 'decrease' ? styles.segmentActive : null]}
                onPress={() => {
                  setType('decrease');
                  if (error) setError(null);
                }}
                testID="segment-decrease"
              >
                <Text style={[styles.segmentLabel, type === 'decrease' ? styles.segmentLabelActive : null]}>
                  Salida
                </Text>
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
                returnKeyType="done"
                testID="quantity-input"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Motivo {type === 'decrease' ? '(requerido para salidas)' : '(opcional)'}
              </Text>
              <TextInput
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={(value) => {
                  setReason(value);
                  if (error) setError(null);
                }}
                style={[styles.input, styles.textarea]}
                placeholder="Describe el ajuste"
                placeholderTextColor={palette.muted}
                testID="reason-input"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={onClose} disabled={submitting}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.submit, submitDisabled ? styles.submitDisabled : null]}
                onPress={submit}
                disabled={submitDisabled}
                testID="submit-button"
              >
                <Text style={styles.submitText}>{submitting ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </ScrollView>
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
      paddingHorizontal: 20,
      paddingTop: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
    },
    sheetContent: {
      gap: 16,
      paddingBottom: 8,
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
