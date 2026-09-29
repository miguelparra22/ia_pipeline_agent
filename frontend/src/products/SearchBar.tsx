interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/** Campo de búsqueda por nombre o SKU (HU-001). */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <label htmlFor="product-search">Buscar por nombre o SKU</label>
      <input
        id="product-search"
        type="search"
        placeholder="Ej.: Bujía o ALT-02"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
