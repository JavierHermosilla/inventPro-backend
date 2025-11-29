import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { AdjustmentSheet } from '@/components/inventory/AdjustmentSheet';
import type { ProductInventoryItem } from '@/lib/manualInventoryTasks';

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

describe('<AdjustmentSheet />', () => {
  it('envía los datos normalizados y cierra el modal', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <AdjustmentSheet product={product} visible onClose={onClose} onSubmit={onSubmit} />
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('1'), '4.9');
      fireEvent.changeText(getByPlaceholderText('Describe el ajuste'), '  stock real  ');
    });

    await act(async () => {
      fireEvent.press(getByText('Guardar'));
    });

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

  it('no permite enviar cantidades inválidas', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <AdjustmentSheet product={product} visible onClose={onClose} onSubmit={onSubmit} />
    );

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('1'), '0');
    });

    await act(async () => {
      fireEvent.press(getByText('Guardar'));
    });

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('permite cambiar a modo salida antes de enviar', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <AdjustmentSheet product={product} visible onClose={onClose} onSubmit={onSubmit} />
    );

    await act(async () => {
      fireEvent.press(getByText('Salida'));
      fireEvent.changeText(getByPlaceholderText('1'), '2');
    });

    await act(async () => {
      fireEvent.press(getByText('Guardar'));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        productId: product.id,
        type: 'decrease',
        quantity: 2,
        reason: null,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
