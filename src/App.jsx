
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Manga from './pages/Manga';
import AnimeDetails from './components/AnimeDetail';
import TvShows from './pages/TvShows'
import Movies from './pages/Movies'
import Anime from './pages/Anime';
import MovieDetail from './components/MovieDetail';
import ScrollingMessage from './ScrollingMessage';
import TVShowDetail from './components/TVShowDetail';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
      <ScrollingMessage />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime" element={<Anime />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/manga" element={<Manga />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tvshows" element={<TvShows />} />
          <Route path="/tv-show/:id/:season?/:episode?" element={<TVShowDetail />} />
        </Routes>
        <Footer />
        <SpeedInsights /> 
        <Analytics />
      </div>
    </Router>
  );
};

export default App