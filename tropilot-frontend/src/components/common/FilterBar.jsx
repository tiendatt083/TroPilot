import { useMemo, useState } from 'react';
import LineIcon from './LineIcon.jsx';

const DEFAULT_SUGGESTION_LIMIT = 8;

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFieldValue(item, field) {
  if (typeof field === 'function') {
    return field(item);
  }

  return String(field)
    .split('.')
    .reduce((value, key) => (value == null ? '' : value[key]), item);
}

function createSuggestions({ items, fields, value, limit }) {
  const query = normalize(value);

  if (!query || !Array.isArray(items) || items.length === 0 || fields.length === 0) {
    return [];
  }

  const seen = new Set();
  const suggestions = [];

  items.forEach((item) => {
    fields.forEach((field) => {
      const rawValue = getFieldValue(item, field);
      const label = String(rawValue || '').trim();

      if (!label) {
        return;
      }

      const normalizedLabel = normalize(label);
      if (!normalizedLabel.includes(query) || seen.has(normalizedLabel)) {
        return;
      }

      seen.add(normalizedLabel);
      suggestions.push(label);
    });
  });

  return suggestions.slice(0, limit);
}

export default function FilterBar({
  children,
  className = '',
  as: Component = 'form',
  searchValue,
  onSearchChange,
  searchPlaceholder = '',
  searchAriaLabel,
  suggestionItems = [],
  suggestionFields = [],
  suggestionLimit = DEFAULT_SUGGESTION_LIMIT,
  filters = [],
  onClear,
  clearLabel,
  actions = null,
  ...props
}) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestions = useMemo(
    () => createSuggestions({
      items: suggestionItems,
      fields: suggestionFields,
      value: searchValue,
      limit: suggestionLimit
    }),
    [searchValue, suggestionFields, suggestionItems, suggestionLimit]
  );
  const hasInstantControls = typeof onSearchChange === 'function' || filters.length > 0 || onClear || actions;
  const classes = [
    hasInstantControls && !children ? 'instant-filter-bar' : 'search-row filter-bar',
    className
  ].filter(Boolean).join(' ');

  if (!hasInstantControls || children) {
    return (
      <Component className={classes} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <Component className={classes} {...props}>
      {typeof onSearchChange === 'function' && (
        <div className="instant-search-control">
          <LineIcon name="search" className="instant-search-icon" />
          <input
            aria-label={searchAriaLabel}
            value={searchValue}
            onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)}
            onChange={(event) => {
              onSearchChange(event.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            placeholder={searchPlaceholder}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <div className="instant-search-suggestions" role="listbox">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSearchChange(suggestion);
                    setSuggestionsOpen(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filters.map((filter) => (
        <select
          key={filter.name}
          aria-label={filter.ariaLabel || filter.label}
          name={filter.name}
          value={filter.value}
          disabled={filter.disabled}
          onChange={(event) => filter.onChange(event.target.value)}
        >
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {actions}

      {onClear && (
        <button className="secondary-button inline-button instant-clear-button" type="button" onClick={onClear}>
          {clearLabel}
        </button>
      )}
    </Component>
  );
}
