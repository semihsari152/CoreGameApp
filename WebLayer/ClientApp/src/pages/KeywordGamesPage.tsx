import React from 'react';
import FilteredGamesPage from './FilteredGamesPage';

const KeywordGamesPage: React.FC = () => {
  return <FilteredGamesPage filterType="keywords" />;
};

export default KeywordGamesPage;