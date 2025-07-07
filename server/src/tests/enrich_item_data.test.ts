
import { describe, expect, it } from 'bun:test';
import { enrichItemData } from '../handlers/enrich_item_data';

describe('enrichItemData', () => {
  it('should enrich item data for valid ASIN', async () => {
    const asin = 'B08N5WRWNW';
    const result = await enrichItemData(asin);

    // Verify all required fields are present
    expect(result.name).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.price).toBeDefined();
    expect(result.images).toBeDefined();

    // Verify correct types
    expect(typeof result.name).toBe('string');
    expect(typeof result.description).toBe('string');
    expect(typeof result.price).toBe('number');
    expect(Array.isArray(result.images)).toBe(true);

    // Verify non-empty content
    expect(result.name.length).toBeGreaterThan(0);
    expect(result.description.length).toBeGreaterThan(0);
    expect(result.price).toBeGreaterThanOrEqual(0);
  });

  it('should include ASIN in product name', async () => {
    const asin = 'B08N5WRWNW';
    const result = await enrichItemData(asin);

    expect(result.name).toContain(asin);
  });

  it('should return valid image URLs', async () => {
    const asin = 'B08N5WRWNW';
    const result = await enrichItemData(asin);

    expect(result.images).toBeInstanceOf(Array);
    result.images.forEach(imageUrl => {
      expect(typeof imageUrl).toBe('string');
      expect(imageUrl.length).toBeGreaterThan(0);
    });
  });

  it('should handle short ASIN gracefully', async () => {
    const shortAsin = 'B123';
    const result = await enrichItemData(shortAsin);

    // Should return fallback data
    expect(result.name).toContain(shortAsin);
    expect(result.description).toContain('could not be retrieved');
    expect(result.price).toBe(0);
    expect(result.images).toEqual([]);
  });

  it('should handle empty ASIN gracefully', async () => {
    const emptyAsin = '';
    const result = await enrichItemData(emptyAsin);

    // Should return fallback data
    expect(result.name).toBeDefined();
    expect(result.description).toContain('could not be retrieved');
    expect(result.price).toBe(0);
    expect(result.images).toEqual([]);
  });

  it('should return consistent data structure', async () => {
    const asin = 'B08N5WRWNW';
    const result1 = await enrichItemData(asin);
    const result2 = await enrichItemData(asin);

    // Structure should be consistent
    expect(Object.keys(result1)).toEqual(Object.keys(result2));
    expect(typeof result1.name).toBe(typeof result2.name);
    expect(typeof result1.description).toBe(typeof result2.description);
    expect(typeof result1.price).toBe(typeof result2.price);
    expect(Array.isArray(result1.images)).toBe(Array.isArray(result2.images));
  });
});
