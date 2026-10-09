import {
  DEFAULT_CATEGORY_KEYS,
  parseOrderedCategoriesFromString,
} from '@/category';

describe('set', () => {
  it('parses from string', () => {
    expect(parseOrderedCategoriesFromString())
      .toStrictEqual(DEFAULT_CATEGORY_KEYS);
    
    expect(parseOrderedCategoriesFromString(
      'cameras,recipes,films,focal-lengths,lenses',
    )).toStrictEqual([
      'cameras',
      'recipes',
      'films',
      'focal-lengths',
      'lenses',
    ]);
    
    expect(parseOrderedCategoriesFromString(
      'cameras, recipes, films',
    )).toStrictEqual([
      'cameras',
      'recipes',
      'films',
    ]);
    
    expect(parseOrderedCategoriesFromString(
      'cameras',
    )).toStrictEqual([
      'cameras',
    ]);
  });
});
