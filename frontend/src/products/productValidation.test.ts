import { describe, expect, it } from 'vitest';
import { MESSAGES, validateProduct, type ProductFormValues } from './productValidation';

const valid: ProductFormValues = { sku: 'ALT-10', name: 'Tapa Radiador', quantity: '1', price: '10' };

// HU-002: mismas reglas y mensajes que CreateProductRequestTest del backend.
describe('validateProduct', () => {
  it('exige los cuatro campos', () => {
    expect(validateProduct({ sku: '', name: '', quantity: '', price: '' })).toEqual({
      ok: false,
      errors: {
        sku: MESSAGES.skuRequired,
        name: MESSAGES.nameRequired,
        quantity: MESSAGES.quantityRequired,
        price: MESSAGES.priceRequired,
      },
    });
  });

  it('trata como vacíos los campos con solo espacios', () => {
    expect(validateProduct({ ...valid, sku: '   ', name: ' \t ' })).toEqual({
      ok: false,
      errors: { sku: MESSAGES.skuRequired, name: MESSAGES.nameRequired },
    });
  });

  it.each(['-1', '2.5', '2,5', 'abc', '1e3'])('rechaza la cantidad "%s"', (quantity) => {
    expect(validateProduct({ ...valid, quantity })).toEqual({
      ok: false,
      errors: { quantity: MESSAGES.quantityInvalid },
    });
  });

  it.each(['-100', '12.345', '12,345', 'abc', '1.000,50'])('rechaza el precio "%s"', (price) => {
    expect(validateProduct({ ...valid, price })).toEqual({
      ok: false,
      errors: { price: MESSAGES.priceInvalid },
    });
  });

  it('acepta los valores límite 0 y 0', () => {
    expect(validateProduct({ ...valid, quantity: '0', price: '0' })).toEqual({
      ok: true,
      value: { ...valid, quantity: '0', price: '0' },
    });
  });

  it('normaliza espacios y coma decimal', () => {
    expect(
      validateProduct({ sku: ' ALT-06 ', name: ' Radiador ', quantity: ' 8 ', price: '350000,50' }),
    ).toEqual({
      ok: true,
      value: { sku: 'ALT-06', name: 'Radiador', quantity: '8', price: '350000.50' },
    });
  });
});
