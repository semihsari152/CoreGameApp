import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, Gamepad2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService as api } from '../../services/api';
import { Game } from '../../types';

interface GameSearchDropdownProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const GameSearchDropdown: React.FC<GameSearchDropdownProps> = ({
  searchQuery,
  setSearchQuery,
  onSearch
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch games when debounced query changes
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['game-search', debouncedQuery],
    queryFn: () => api.games.search(debouncedQuery, 1, 8), // Get top 8 results
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show/hide dropdown based on search query and results
  useEffect(() => {
    if (searchQuery.length >= 2 && (searchResults?.data?.length || isLoading)) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchQuery, searchResults, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleGameSelect = () => {
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <form onSubmit={onSearch} className="relative w-full">
        <input
          type="text"
          placeholder="Oyun ara..."
          value={searchQuery}
          onChange={handleInputChange}
          className="input pl-10 pr-4 w-full"
          autoComplete="off"
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      </form>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Aranıyor...</p>
            </div>
          ) : searchResults?.data?.length ? (
            <>
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Oyunlar ({searchResults.totalCount} sonuç)
                </p>
              </div>
              {searchResults.data.map((game: Game) => (
                <Link
                  key={game.id}
                  to={game.slug ? `/games/${game.slug}` : `/games/${game.id}`}
                  onClick={handleGameSelect}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-700 border-b border-gray-100 dark:border-dark-600 last:border-b-0"
                >
                  {game.coverImageUrl ? (
                    <img
                      src={game.coverImageUrl}
                      alt={game.name}
                      className="w-12 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-gray-200 dark:bg-dark-600 rounded flex items-center justify-center">
                      <Gamepad2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {game.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {game.releaseDate && new Date(game.releaseDate).getFullYear()}
                    </p>
                  </div>
                </Link>
              ))}
              {searchResults.totalCount > 8 && (
                <Link
                  to={`/games?search=${encodeURIComponent(searchQuery)}`}
                  onClick={handleGameSelect}
                  className="block p-3 text-center text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-dark-700 border-t border-gray-200 dark:border-dark-600"
                >
                  Tüm sonuçları görüntüle ({searchResults.totalCount})
                </Link>
              )}
            </>
          ) : searchQuery.length >= 2 && (
            <div className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                "{searchQuery}" için sonuç bulunamadı
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameSearchDropdown;