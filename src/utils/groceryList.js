// Standing items that appear on every weekly list
export const ALWAYS_BUYING = [
  { name: 'Dr Pepper Zero', detail: '~12–16 cans' },
  { name: 'Zero sugar root beer', detail: '~8–12 cans' },
  { name: "Ryan's Greek yogurt", detail: 'large tub, vanilla' },
  { name: "Emily's coconut yogurt", detail: null },
  { name: 'Granola bars', detail: null },
];

// Snack rotation — appears in "might need" as a single reminder item
export const SNACK_ROTATION_ITEM = {
  name: 'Snack rotation',
  detail: 'Cheez-Its, baked Cheetos, granola, frozen steam buns, or cookie dough',
};

/**
 * Aggregates ingredients from all loaded recipes into deduplicated
 * definitelyNeed and mightNeed lists.
 *
 * @param {object} recipes - keyed by meal name, each with shoppingIngredients
 * @returns {{ definitelyNeed: string[], mightNeed: string[] }}
 */
export function aggregateIngredients(recipes) {
  const definitelySet = new Set();
  const mightSet = new Set();

  Object.values(recipes).forEach((recipe) => {
    if (!recipe?.shoppingIngredients) return;

    recipe.shoppingIngredients.definitelyNeed?.forEach((item) => {
      definitelySet.add(normalizeItem(item));
    });

    recipe.shoppingIngredients.mightNeed?.forEach((item) => {
      mightSet.add(normalizeItem(item));
    });
  });

  // Items that are definitely needed should not also appear in might need
  mightSet.forEach((item) => {
    if (definitelySet.has(item)) mightSet.delete(item);
  });

  return {
    definitelyNeed: Array.from(definitelySet).sort(),
    mightNeed: Array.from(mightSet).sort(),
  };
}

// Lowercase and trim for deduplication comparison
function normalizeItem(item) {
  return item.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Builds the finalized grocery list from confirmed state.
 * mightNeedChecked is a Set of item names Emily has confirmed she needs.
 */
export function buildFinalList(definitelyNeed, mightNeed, mightNeedChecked) {
  return {
    alwaysBuying: ALWAYS_BUYING,
    needThis: definitelyNeed,
    mightNeedConfirmed: mightNeed.filter((item) => mightNeedChecked.has(item)),
  };
}
