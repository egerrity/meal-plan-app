import { useState, useEffect } from 'react';
import {
  aggregateIngredients,
  buildFinalList,
  ALWAYS_BUYING,
  SNACK_ROTATION_ITEM,
} from '../utils/groceryList';
import './GroceryView.css';

export default function GroceryView({ meals, recipes, reuseSuggestions, onConfirm, onBack }) {
  const { definitelyNeed, mightNeed } = aggregateIngredients(recipes);

  // All "might need" items start checked — Emily unchecks what she already has
  const [mightNeedChecked, setMightNeedChecked] = useState(() => new Set(mightNeed));
  // Snack reminder starts checked too
  const [snackChecked, setSnackChecked] = useState(true);

  // If recipes change (e.g. a swap happened), reset checked state
  useEffect(() => {
    setMightNeedChecked(new Set(mightNeed));
  }, [recipes]);

  function toggleMightNeed(item) {
    setMightNeedChecked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function handleConfirm() {
    const finalList = buildFinalList(definitelyNeed, mightNeed, mightNeedChecked);
    if (snackChecked) {
      finalList.snackReminder = SNACK_ROTATION_ITEM;
    }
    onConfirm(finalList);
  }

  const checkedCount = mightNeedChecked.size + (snackChecked ? 1 : 0);
  const totalMight = mightNeed.length + 1; // +1 for snack

  return (
    <div className="grocery-view">
      <div className="grocery-view__header">
        <button className="grocery-view__back-btn" onClick={onBack}>
          ← Back to plan
        </button>
        <h2>Grocery list</h2>
        <p className="grocery-view__subtitle">
          Uncheck anything you already have. Everything else goes on the list.
        </p>
      </div>

      {/* Section 1: Always buying */}
      <section className="grocery-section">
        <h3 className="grocery-section__title">Always buying</h3>
        <p className="grocery-section__desc">On every list — no need to check.</p>
        <ul className="grocery-list grocery-list--always">
          {ALWAYS_BUYING.map((item) => (
            <li key={item.name} className="grocery-item grocery-item--always">
              <span className="grocery-item__name">{item.name}</span>
              {item.detail && (
                <span className="grocery-item__detail">{item.detail}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Section 2: You need this */}
      <section className="grocery-section">
        <h3 className="grocery-section__title">You need this</h3>
        <p className="grocery-section__desc">
          Fresh produce and proteins for this week's recipes. Always on the list.
        </p>
        {definitelyNeed.length === 0 ? (
          <p className="grocery-section__empty">
            Open a recipe first to load ingredients.
          </p>
        ) : (
          <ul className="grocery-list grocery-list--need">
            {definitelyNeed.map((item) => (
              <li key={item} className="grocery-item grocery-item--need">
                <span className="grocery-item__name">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Section 3: You might need this */}
      <section className="grocery-section">
        <h3 className="grocery-section__title">
          You might need this
          <span className="grocery-section__count">
            {checkedCount} of {totalMight} selected
          </span>
        </h3>
        <p className="grocery-section__desc">
          Pantry items, sauces, and staples. Uncheck what you already have.
        </p>
        {mightNeed.length === 0 && (
          <p className="grocery-section__empty">
            Open a recipe first to load pantry items.
          </p>
        )}
        <ul className="grocery-list grocery-list--might">
          {/* Snack rotation reminder — always first */}
          <li className="grocery-item grocery-item--might">
            <label className="grocery-item__label">
              <input
                type="checkbox"
                checked={snackChecked}
                onChange={() => setSnackChecked((v) => !v)}
                className="grocery-item__checkbox"
              />
              <span className="grocery-item__name">{SNACK_ROTATION_ITEM.name}</span>
              <span className="grocery-item__detail">{SNACK_ROTATION_ITEM.detail}</span>
            </label>
          </li>

          {mightNeed.map((item) => (
            <li key={item} className="grocery-item grocery-item--might">
              <label className="grocery-item__label">
                <input
                  type="checkbox"
                  checked={mightNeedChecked.has(item)}
                  onChange={() => toggleMightNeed(item)}
                  className="grocery-item__checkbox"
                />
                <span className={`grocery-item__name ${!mightNeedChecked.has(item) ? 'grocery-item__name--unchecked' : ''}`}>
                  {item}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="grocery-view__actions">
        <button className="grocery-view__confirm-btn" onClick={handleConfirm}>
          Confirm list and get shareable link →
        </button>
      </div>
    </div>
  );
}
