import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

// HU-001, criterio de aceptación 3.
describe('SearchBar', () => {
  it('notifica cada cambio del texto de búsqueda', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Buscar por nombre o SKU'), 'A');

    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('muestra el valor actual', () => {
    render(<SearchBar value="ALT-02" onChange={() => {}} />);

    expect(screen.getByLabelText('Buscar por nombre o SKU')).toHaveValue('ALT-02');
  });
});
