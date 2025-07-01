import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MovieCard from "../components/MovieCard";
import { motion } from "framer-motion";
import { Loader2, Filter, Clock, TrendingUp } from "lucide-react";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
];

const TIME_WINDOWS = {
  day: "Today",
  week: "This Week",
};

const PLATFORMS = {
  trending: {
    name: "Trending",
    endpoint: "trending",
    needsTimeWindow: true,
  },
  netflix: {
    name: "Netflix",
    providerId: 8,
    endpoint: "discover",
  },
  prime: {
    name: "Amazon Prime",
    providerId: 9,
    endpoint: "discover",
  },
  disney: {
    name: "Disney+",
    providerId: 337,
    endpoint: "discover",
  },
  apple: {
    name: "Apple TV+",
    providerId: 350,
    endpoint: "discover",
  },
  hulu: {
    name: "Hulu",
    providerId: 15,
    endpoint: "discover",
  },
  // Try multiple HBO Max/Max provider IDs
  hbomax: {
    name: "Max",
    providerId: 384, // Primary HBO Max ID
    alternativeIds: [1899, 387], // Alternative IDs to try
    endpoint: "discover",
  },
  paramount: {
    name: "Paramount+",
    providerId: 531,
    endpoint: "discover",
  },
  peacock: {
    name: "Peacock",
    providerId: 386,
    endpoint: "discover",
  },
};

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("trending");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [timeWindow, setTimeWindow] = useState("day");
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isTimeWindowDropdownOpen, setIsTimeWindowDropdownOpen] =
    useState(false);
  const navigate = useNavigate();

  // Function to try fetching with alternative provider IDs
  const fetchWithAlternativeProviders = async (platform, baseUrl, apiKey) => {
    const providerIds = [platform.providerId, ...(platform.alternativeIds || [])];
    
    for (const providerId of providerIds) {
      try {
        let url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_watch_providers=${providerId}`;
        
        // Try different regions
        const regions = ['US', 'CA', 'GB'];
        
        for (const region of regions) {
          const regionalUrl = `${url}&watch_region=${region}`;
          
          if (selectedGenre) {
            regionalUrl += `&with_genres=${selectedGenre}`;
          }
          
          const finalUrl = regionalUrl + "&sort_by=popularity.desc&include_adult=false&page=1";
          
          console.log(`Trying HBO Max with provider ID ${providerId} in region ${region}:`, finalUrl);
          
          const response = await fetch(finalUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              console.log(`Success! Found ${data.results.length} movies with provider ID ${providerId} in ${region}`);
              return data.results;
            }
          }
        }
      } catch (error) {
        console.log(`Failed with provider ID ${providerId}:`, error);
        continue;
      }
    }
    
    // If all provider IDs fail, try a different approach - search for HBO/Max content
    try {
      console.log("Trying fallback search for HBO content...");
      const fallbackUrl = `${baseUrl}/discover/movie?api_key=${apiKey}&with_companies=174,128064,3268&sort_by=popularity.desc&page=1`;
      const response = await fetch(fallbackUrl);
      if (response.ok) {
        const data = await response.json();
        console.log(`Fallback search found ${data.results?.length || 0} movies`);
        return data.results || [];
      }
    } catch (error) {
      console.log("Fallback search also failed:", error);
    }
    
    return [];
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const query = searchParams.get("search");
        setSearchQuery(query);

        let url;
        const apiKey = import.meta.env.VITE_TMDB_API_KEY;
        const baseUrl = import.meta.env.VITE_API_BASE_URL;

        if (query) {
          url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
            query
          )}`;
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Failed to fetch movies");
          }
          const data = await response.json();
          setMovies(data.results);
        } else {
          const platform = PLATFORMS[activeSection];

          if (platform.endpoint === "trending") {
            url = `${baseUrl}/trending/movie/${timeWindow}?api_key=${apiKey}`;
            
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error("Failed to fetch movies");
            }
            const data = await response.json();
            setMovies(data.results);
          } else if (platform.endpoint === "discover") {
            // Special handling for HBO Max/Max
            if (activeSection === "hbomax") {
              const results = await fetchWithAlternativeProviders(platform, baseUrl, apiKey);
              setMovies(results);
            } else {
              // Regular platform handling
              url = `${baseUrl}/discover/movie?api_key=${apiKey}&with_watch_providers=${platform.providerId}&watch_region=US`;

              if (selectedGenre) {
                url += `&with_genres=${selectedGenre}`;
              }

              url += "&sort_by=popularity.desc&include_adult=false&page=1";

              const response = await fetch(url);
              if (!response.ok) {
                throw new Error("Failed to fetch movies");
              }
              const data = await response.json();
              setMovies(data.results);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchParams, activeSection, selectedGenre, timeWindow]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section === "trending") {
      setSelectedGenre("");
    }
    setSearchParams({});
  };

  const handleGenreChange = (genreId) => {
    setSelectedGenre(genreId);
    setIsGenreDropdownOpen(false);
  };

  const handleTimeWindowChange = (window) => {
    setTimeWindow(window);
    setIsTimeWindowDropdownOpen(false);
  };

  const handleMovieSelect = (id) => {
    navigate(`/movie/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 md:py-6 bg-gradient-to-br from-purple-900 via-gray-900 to-indigo-900 min-h-screen">
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="w-full md:w-auto flex flex-wrap gap-2">
            {Object.entries(PLATFORMS).map(([key, platform]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                onClick={() => handleSectionChange(key)}
                className={`px-4 py-2 text-sm rounded-xl transition-all ${
                  activeSection === key
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                    : "bg-gray-800/50 text-gray-100 hover:bg-gray-700/50"
                } flex-1 sm:flex-none`}
              >
                {platform.name}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {PLATFORMS[activeSection].needsTimeWindow && (
              <div className="relative w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() =>
                    setIsTimeWindowDropdownOpen(!isTimeWindowDropdownOpen)
                  }
                  className="w-full px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="text-gray-100 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-purple-400" />
                    {TIME_WINDOWS[timeWindow]}
                  </span>
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </motion.button>

                {isTimeWindowDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-2 w-full bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700"
                  >
                    {Object.entries(TIME_WINDOWS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => handleTimeWindowChange(key)}
                        className="w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-700/50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {!PLATFORMS[activeSection].needsTimeWindow && (
              <div className="relative w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                  className="w-full px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 flex items-center justify-between transition-all"
                >
                  <span className="text-gray-100">
                    {selectedGenre
                      ? GENRES.find((g) => g.id.toString() === selectedGenre)
                          ?.name
                      : "Select Genre"}
                  </span>
                  <Filter className="w-4 h-4 text-purple-400" />
                </motion.button>

                {isGenreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-10 mt-2 w-full bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-700"
                  >
                    <button
                      onClick={() => handleGenreChange("")}
                      className="w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-700/50 transition-colors rounded-t-xl"
                    >
                      All Genres
                    </button>
                    {GENRES.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => handleGenreChange(genre.id.toString())}
                        className="w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-700/50 transition-colors last:rounded-b-xl"
                      >
                        {genre.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-gray-100 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        {searchQuery
          ? `Search Results for "${searchQuery}"`
          : `${PLATFORMS[activeSection].name}${
              activeSection === "trending"
                ? ` ${TIME_WINDOWS[timeWindow]}`
                : selectedGenre
                ? ` - ${
                    GENRES.find((g) => g.id.toString() === selectedGenre)?.name
                  }`
                : ""
            }`}
      </h1>

      {movies.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6"
        >
          {movies.map((movie) => (
            <motion.div
              key={movie.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center "
            >
              <MovieCard
                movie={movie}
                onSelect={() => handleMovieSelect(movie.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center text-gray-400 mt-8">
          {activeSection === "hbomax" ? (
            <div>
              <p>No Max content found with the current filters.</p>
              <p className="text-sm mt-2">
                This might be due to regional restrictions or API changes.
                Check the browser console for debugging information.
              </p>
            </div>
          ) : (
            "No movies found. Try adjusting your filters or search term."
          )}
        </div>
      )}
    </div>
  );
};

export default Movies;