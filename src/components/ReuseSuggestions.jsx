import { useState } from 'react';
import './ReuseSuggestions.css';

export default function ReuseSuggestions({ suggestions, isLoading }) {
  const [dismissed, setDismissed] = useState(new Set());

  if (isLoading) {
    return (
      <div className="reuse-suggestions reuse-suggestions--loading">
        <p>Finding ways to stretch this week's ingredients...</p>
      </div>
    );
  }

  if (!suggestions) return null;

  const visible = suggestions.filter((s, i) => !dismissed.has(i));

  if (visible.length === 0) return null;

  return (
    <div className="reuse-suggestions">
      <h3 className="reuse-suggestions__title">
        💡 Ways to stretch this week's ingredients
      </h3>
      <ul className="reuse-suggestions__list">
        {suggestions.map((suggestion, i) => {
          if (dismissed.has(i)) return null;
          return (
            <li key={i} className="reuse-suggestion">
              <p className="reuse-suggestion__text">{suggestion.suggestionText}</p>
              <button
                className="reuse-suggestion__dismiss"
                onClick={() => setDismissed((prev) => new Set([...prev, i]))}
                aria-label="Dismiss suggestion"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
