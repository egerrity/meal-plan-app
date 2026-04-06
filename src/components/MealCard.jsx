import { useState } from 'react';
import './MealCard.css';

const SLOT_LABELS = {
  ambitious: 'Sunday',
  leftover: 'Mid-week',
  fast: 'Weeknight',
};

const EFFORT_LABELS = {
  ambitious: 'Ambitious',
  leftover: 'Leftovers',
  fast: 'Fast',
};

export default function MealCard({ meal, isSwapping, onSwap }) {
  const [expanded, setExpanded] = useState(false);

  const isLeftover = meal.slot === 'leftover';

  return (
    <div className={`meal-card meal-card--${meal.slot}`}>
      <div className="meal-card__header">
        <div className="meal-card__meta">
          <span className="meal-card__slot-label">{SLOT_LABELS[meal.slot]}</span>
          <span className={`meal-card__effort meal-card__effort--${meal.slot}`}>
            {EFFORT_LABELS[meal.effortTier]}
          </span>
        </div>
        {!isLeftover && (
          <button
            className="meal-card__swap-btn"
            onClick={onSwap}
            disabled={isSwapping}
          >
            {isSwapping ? 'Swapping...' : 'Swap'}
          </button>
        )}
      </div>

      <h3 className="meal-card__name">{meal.name}</h3>

      <div className="meal-card__details">
        <span className="meal-card__detail">
          <span className="meal-card__detail-label">Time</span>
          {meal.cookTime}
        </span>
        <span className="meal-card__detail">
          <span className="meal-card__detail-label">Protein</span>
          {meal.protein}
        </span>
        <span className="meal-card__detail">
          <span className="meal-card__detail-label">Veg</span>
          {meal.vegetableComponent}
        </span>
      </div>

      {meal.notes && (
        <p className="meal-card__notes">{meal.notes}</p>
      )}

      {isLeftover && meal.leftoverIdeas && (
        <div className="meal-card__leftover">
          <button
            className="meal-card__expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide ideas' : `Show ${meal.leftoverIdeas.length} leftover ideas`}
          </button>
          {expanded && (
            <ul className="meal-card__leftover-ideas">
              {meal.leftoverIdeas.map((idea, i) => (
                <li key={i} className="meal-card__leftover-idea">
                  <strong>{idea.title}</strong>
                  <p>{idea.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {meal.produceLeftovers && (
        <p className="meal-card__produces">
          <span className="meal-card__detail-label">Produces: </span>
          {meal.produceLeftovers}
        </p>
      )}
    </div>
  );
}
