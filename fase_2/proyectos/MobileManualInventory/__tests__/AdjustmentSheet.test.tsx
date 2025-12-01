import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AdjustmentSheet } from '@/components/inventory/AdjustmentSheet';
import type { ProductInventoryItem } from '@/lib/manualInventoryTasks';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Modal = ({ children, visible }: { children: React.ReactNode; visible?: boolean }) =>
    visible ? <View testID="mock-modal">{children}</View> : null;
  return {
    __esModule: true,
    default: Modal,
  };
});

const product: ProductInventoryItem = {
  id: 'p-10',
  name: 'Taladro',
  stock: 12,
  status: 'DISPONIBLE',
  categoryName: 'Herramientas',
  supplierName: 'ACME',
  description: null,
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const initialMetrics = {
  frame: { x: 0, y: 0, width: 320, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderSheet = (props: Partial<React.ComponentProps<typeof AdjustmentSheet>> = {}) =>
  render(
    <SafeAreaProvider initialMetrics={initialMetrics}>
      <AdjustmentSheet product={product} visible onClose={jest.fn()} onSubmit={jest.fn()} {...props} />
    </SafeAreaProvider>
  );

describe('<AdjustmentSheet />', () => {
  it('envia los datos normalizados y cierra el modal', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderSheet({ onClose, onSubmit });

    await act(async () => fireEvent.changeText(getByTestId('quantity-input'), '4.9'));
    await act(async () => fireEvent.changeText(getByTestId('reason-input'), '  stock real  '));
    await act(async () => fireEvent.press(getByText('Guardar')));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        productId: product.id,
        type: 'increase',
        quantity: 4,
        reason: 'stock real',
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('no permite enviar cantidades invalidas', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderSheet({ onClose, onSubmit });

    await act(async () => fireEvent.changeText(getByTestId('quantity-input'), '0'));
    await act(async () => fireEvent.press(getByText('Guardar')));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('exige motivo para una salida de stock', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderSheet({ onClose, onSubmit });

    await act(async () => fireEvent.press(getByText('Salida')));
    await act(async () => fireEvent.changeText(getByTestId('quantity-input'), '2'));
    await act(async () => fireEvent.press(getByText('Guardar')));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it('permite enviar una salida cuando incluye motivo', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByTestId } = renderSheet({ onClose, onSubmit });

    await act(async () => fireEvent.press(getByText('Salida')));
    await act(async () => fireEvent.changeText(getByTestId('quantity-input'), '2'));
    await act(async () => fireEvent.changeText(getByTestId('reason-input'), 'Auditoria'));
    await act(async () => fireEvent.press(getByText('Guardar')));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        productId: product.id,
        type: 'decrease',
        quantity: 2,
        reason: 'Auditoria',
      });
    });
    expect(onClose).toHaveBeenCalled();
  });
});
