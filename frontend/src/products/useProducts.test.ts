import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProducts } from './useProducts';

// HU-002: refrescar el inventario sin cambiar la búsqueda.
describe('useProducts', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() => Promise.resolve(new Response('[]', { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('vuelve a consultar cuando cambia refreshKey aunque la búsqueda sea la misma', async () => {
    const { result, rerender } = renderHook(({ refreshKey }) => useProducts('', refreshKey), {
      initialProps: { refreshKey: 0 },
    });
    await waitFor(() => expect(result.current.products).toEqual([]));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ refreshKey: 1 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith('/api/products', expect.anything());
  });
});
