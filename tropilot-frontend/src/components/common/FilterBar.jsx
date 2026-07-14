import LineIcon from './LineIcon.jsx';

const DEFAULT_SUGGESTION_LIMIT = 8;

export default function FilterBar({
  children,
  className = '',
  as: Component = 'form',
  searchValue,
  onSearchChange,
  searchPlaceholder = '',
  searchAriaLabel,
  suggestionItems: _suggestionItems = [],
  suggestionFields: _suggestionFields = [],
  suggestionLimit: _suggestionLimit = DEFAULT_SUGGESTION_LIMIT,
  filters = [],
  onClear,
  clearLabel,
  actions = null,
  ...props
}) {
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
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
          />
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
