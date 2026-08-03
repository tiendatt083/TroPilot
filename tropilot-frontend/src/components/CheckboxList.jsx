/** Danh sách checkbox dùng chung cho phép chọn nhiều mục trong một biểu mẫu. */
export default function CheckboxList({
  ariaLabel,
  items,
  selectedValues,
  onChange,
  getValue,
  getLabel,
  getDescription,
  emptyMessage
}) {
  const selectedSet = new Set(selectedValues.map(String));

  const toggleValue = (value) => {
    const normalizedValue = String(value);
    const nextValues = selectedSet.has(normalizedValue)
      ? selectedValues.filter((selectedValue) => String(selectedValue) !== normalizedValue)
      : [...selectedValues, normalizedValue];

    onChange(nextValues);
  };

  if (items.length === 0) {
    return <div className="checkbox-list-empty">{emptyMessage}</div>;
  }

  return (
    <div className="checkbox-list" role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const value = String(getValue(item));
        const description = getDescription?.(item);

        return (
          <label key={value} className="checkbox-list-item">
            <input
              type="checkbox"
              checked={selectedSet.has(value)}
              onChange={() => toggleValue(value)}
            />
            <span>
              <strong>{getLabel(item)}</strong>
              {description && <small>{description}</small>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
