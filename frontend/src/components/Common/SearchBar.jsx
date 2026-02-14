import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

const SearchBar = ({ 
  placeholder, 
  onSearch, 
  delay = 300,
  filters = [],
  onFilterChange 
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (delay > 0) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        onSearch(value);
      }, delay);
    } else {
      onSearch(value);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedFilter(value);
    
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedFilter('');
    onSearch('');
    
    if (onFilterChange) {
      onFilterChange('');
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <div className="search-icon">🔍</div>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder || t('search')}
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button className="clear-search" onClick={handleClear}>
            ✕
          </button>
        )}
      </div>
      
      {filters.length > 0 && (
        <select
          className="search-filter"
          value={selectedFilter}
          onChange={handleFilterChange}
        >
          <option value="">{t('all')}</option>
          {filters.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SearchBar;
