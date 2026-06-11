import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [movieTitle, setMovieTitle] = useState("");
  const [movieCategory, setMovieCategory] = useState("Movie");
  const [movieDescription, setMovieDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  function unlockAdmin(event) {
    event.preventDefault();

    if (!password.trim()) {
      alert("Please enter your admin password.");
      return;
    }

    setIsUnlocked(true);
  }

  async function getR2UploadUrl(file) {
    const response = await fetch("/api/r2-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get upload URL");
    }

    return data;
  }

  function uploadFileWithProgress(uploadUrl, file) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error("Upload to Cloudflare R2 failed"));
        }
      };

      xhr.onerror = () => {
        reject(
          new Error("Upload failed. Please check your connection or CORS policy.")
        );
      };

      xhr.send(file);
    });
  }

  async function saveMovieToSupabase(videoKey) {
    const { error } = await supabase.from("movies").insert({
      title: movieTitle.trim(),
      category: movieCategory.trim() || "Movie",
      description: movieDescription.trim(),
      thumbnail_url: thumbnailUrl.trim() || "/blackbox-logo.png",
      video_key: videoKey,
      video_url: "",
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async function handleVideoUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file only.");
      return;
    }

    if (!movieTitle.trim()) {
      alert("Please enter the movie title first.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadMessage("Preparing upload...");

      const data = await getR2UploadUrl(file);

      setUploadMessage("Uploading video to Cloudflare R2...");
      await uploadFileWithProgress(data.uploadUrl, file);

      setUploadMessage("Saving movie details to Supabase...");
      await saveMovieToSupabase(data.key);

      setUploadMessage(`Upload successful! Saved movie: ${movieTitle}`);
      alert("Upload successful! Your movie is now saved.");

      setMovieTitle("");
      setMovieCategory("Movie");
      setMovieDescription("");
      setThumbnailUrl("");
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed: " + error.message);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="adminPage">
      <div className="adminCard">
        <div className="brandLogo adminLogo">
          <img src="/blackbox-logo.png" alt="BlackBox Logo" />
        </div>

        <h1>BlackBox Admin</h1>
        <p className="adminSubtext">Private upload page for the owner only.</p>

        {!isUnlocked ? (
          <form onSubmit={unlockAdmin} className="adminForm">
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="submit">Unlock Admin Upload</button>
          </form>
        ) : (
          <div className="adminUploadBox">
            <h2>Upload Movie</h2>

            <p>
              Add movie details first, then choose the video file. It will upload
              to Cloudflare R2 and save to Supabase.
            </p>

            <div className="movieForm">
              <input
                type="text"
                placeholder="Movie title"
                value={movieTitle}
                onChange={(event) => setMovieTitle(event.target.value)}
              />

              <input
                type="text"
                placeholder="Category"
                value={movieCategory}
                onChange={(event) => setMovieCategory(event.target.value)}
              />

              <textarea
                placeholder="Description"
                value={movieDescription}
                onChange={(event) => setMovieDescription(event.target.value)}
              />

              <input
                type="text"
                placeholder="Thumbnail image URL, example: /tangerine.jpg"
                value={thumbnailUrl}
                onChange={(event) => setThumbnailUrl(event.target.value)}
              />
            </div>

            <label className="uploadBox">
              {uploading ? "Uploading..." : "Choose Video File"}
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
            </label>

            {uploading && (
              <div className="progressWrap">
                <div className="progressInfo">
                  <span>Upload Progress</span>
                  <strong>{uploadProgress}%</strong>
                </div>

                <div className="progressBar">
                  <div
                    className="progressFill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {uploadMessage && <p className="uploadMessage">{uploadMessage}</p>}

            <a className="backHome" href="/">
              Back to website
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <a href="/" className="brandLogo">
          <img src="/blackbox-logo.png" alt="BlackBox Logo" />
        </a>

        <nav>
          <a href="/">Movies</a>
          <a href="/my-list">My List</a>
        </nav>
      </aside>

      <main className="pageMain">{children}</main>
    </div>
  );
}

function MoviePosterCard({ movie, onAddToList, isSaved }) {
  function openMovie() {
    window.location.href = `/movie/${movie.id}`;
  }

  function addMovie(event) {
    event.stopPropagation();
    onAddToList(movie);
  }

  return (
    <div className="posterCard" onClick={openMovie}>
      <button
        type="button"
        className={`addListBtn ${isSaved ? "saved" : ""}`}
        onClick={addMovie}
        title={isSaved ? "Already in My List" : "Add to My List"}
      >
        {isSaved ? "✓" : "+"}
      </button>

      <div className="posterImageWrap">
        <img src={movie.thumbnail} alt={movie.title} />
      </div>

      <div className="posterInfo">
        <h3>{movie.title}</h3>
        <p>{movie.category}</p>
      </div>
    </div>
  );
}

function LandingPage({ movies, loading, onAddToList, isInMyList }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = [
    "All",
    ...new Set(movies.map((movie) => movie.category).filter(Boolean)),
  ];

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movie.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || movie.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <section className="landingHero">
        <div>
          <span className="tag">BlackBox Streaming</span>
          <h1>Watch your movies anytime.</h1>
        </div>
      </section>

      <section id="movies" className="movieLibrary">
        <div className="sectionHeader">
          <div>
            <h2>Movies</h2>
            <p>
              {loading
                ? "Loading movies..."
                : `${filteredMovies.length} movie${
                    filteredMovies.length === 1 ? "" : "s"
                  } available`}
            </p>
          </div>

          <input
            className="searchInput"
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="categoryFilters">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={activeCategory === category ? "activeCategory" : ""}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="emptyText">Loading your movies...</p>
        ) : filteredMovies.length === 0 ? (
          <p className="emptyText">No movies found.</p>
        ) : (
          <div className="posterGrid">
            {filteredMovies.map((movie) => (
              <MoviePosterCard
                key={movie.id}
                movie={movie}
                onAddToList={onAddToList}
                isSaved={isInMyList(movie.id)}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function MyListPage({ watchList, onRemoveFromList }) {
  return (
    <Layout>
      <section className="movieLibrary">
        <div className="sectionHeader">
          <div>
            <h2>My List</h2>
            <p>
              {watchList.length === 0
                ? "No movies added yet."
                : `${watchList.length} saved movie${
                    watchList.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          <a className="watchBtn linkButton" href="/">
            Browse Movies
          </a>
        </div>

        {watchList.length === 0 ? (
          <p className="emptyText">
            Go to Movies and click the + icon to add a movie here.
          </p>
        ) : (
          <div className="posterGrid">
            {watchList.map((movie) => (
              <div className="posterCard" key={movie.id}>
                <button
                  type="button"
                  className="addListBtn removeSaved"
                  onClick={() => onRemoveFromList(movie.id)}
                  title="Remove from My List"
                >
                  ×
                </button>

                <div
                  className="posterImageWrap"
                  onClick={() => {
                    window.location.href = `/movie/${movie.id}`;
                  }}
                >
                  <img src={movie.thumbnail} alt={movie.title} />
                </div>

                <div className="posterInfo">
                  <h3>{movie.title}</h3>
                  <p>{movie.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

function MovieDetailsPage({ movie, onAddToList, isSaved }) {
  if (!movie) {
    return (
      <Layout>
        <section className="contentSection">
          <h2>Movie not found</h2>
          <p className="emptyText">Go back to the Movies page.</p>
          <a className="watchBtn linkButton" href="/">
            Back to Movies
          </a>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="movieDetailsPage">
        <div className="detailsPoster">
          <img src={movie.thumbnail} alt={movie.title} />
        </div>

        <div className="detailsInfo">
          <span className="tag">{movie.category}</span>
          <h1>{movie.title}</h1>
          <p>{movie.description}</p>

          <div className="heroButtons">
            <a className="watchBtn linkButton" href={`/watch/${movie.id}`}>
              Play Movie
            </a>

            <button
              type="button"
              className="listBtn"
              onClick={() => onAddToList(movie)}
            >
              {isSaved ? "✓ Added to My List" : "+ My List"}
            </button>

            <a className="listBtn linkButton" href="/">
              Back to Movies
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function PlayerPage({ movie }) {
  const [freshWatchUrl, setFreshWatchUrl] = useState("");
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState("");

  useEffect(() => {
    async function loadFreshWatchUrl() {
      if (!movie) return;

      try {
        setLoadingPlayer(true);
        setPlayerError("");

        if (!movie.videoKey) {
          setFreshWatchUrl(movie.videoUrl);
          return;
        }

        const response = await fetch("/api/r2-watch-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoKey: movie.videoKey }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load video.");
        }

        setFreshWatchUrl(data.watchUrl);
      } catch (error) {
        console.error(error);
        setPlayerError(error.message);
      } finally {
        setLoadingPlayer(false);
      }
    }

    loadFreshWatchUrl();
  }, [movie]);

  function openFullscreen() {
    const player = document.getElementById("blackbox-player");

    if (player?.requestFullscreen) {
      player.requestFullscreen();
    } else if (player?.webkitRequestFullscreen) {
      player.webkitRequestFullscreen();
    } else if (player?.msRequestFullscreen) {
      player.msRequestFullscreen();
    } else {
      alert("Fullscreen is not supported on this browser.");
    }
  }

  if (!movie) {
    return (
      <Layout>
        <section className="contentSection">
          <h2>Movie not found</h2>
          <p className="emptyText">Go back to the Movies page.</p>
          <a className="watchBtn linkButton" href="/">
            Back to Movies
          </a>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="watchPage">
        <div className="watchHeader">
          <div>
            <a href={`/movie/${movie.id}`} className="backHome">
              ← Back to movie
            </a>
            <h1>{movie.title}</h1>
            <p>{movie.category}</p>
          </div>
        </div>

        {loadingPlayer ? (
          <p className="emptyText">Loading video...</p>
        ) : playerError ? (
          <p className="emptyText">Player error: {playerError}</p>
        ) : (
          <div className="playerWrapper">
            <video
              id="blackbox-player"
              key={freshWatchUrl}
              src={freshWatchUrl}
              controls
              playsInline
              preload="metadata"
              className="fullPlayer"
            />

            <button
              type="button"
              className="fullscreenBtn"
              onClick={openFullscreen}
            >
              Fullscreen
            </button>
          </div>
        )}
      </section>
    </Layout>
  );
}

function App() {
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [watchList, setWatchList] = useState(() => {
    const saved = localStorage.getItem("blackbox-my-list");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("blackbox-my-list", JSON.stringify(watchList));
  }, [watchList]);

  function isInMyList(movieId) {
    return watchList.some((movie) => String(movie.id) === String(movieId));
  }

  function addToMyList(movie) {
    if (isInMyList(movie.id)) {
      alert("This movie is already in My List.");
      return;
    }

    setWatchList((prev) => [...prev, movie]);
    alert(`${movie.title} added to My List.`);
  }

  function removeFromMyList(movieId) {
    setWatchList((prev) =>
      prev.filter((movie) => String(movie.id) !== String(movieId))
    );
  }

  async function getSignedWatchUrl(videoKey) {
    const response = await fetch("/api/r2-watch-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ videoKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get watch URL");
    }

    return data.watchUrl;
  }

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoadingMovies(true);

        const { data, error } = await supabase
          .from("movies")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const preparedMovies = await Promise.all(
          (data || []).map(async (movie) => {
            let watchUrl = movie.video_url;

            if (movie.video_key) {
              watchUrl = await getSignedWatchUrl(movie.video_key);
            }

            return {
              id: movie.id,
              title: movie.title,
              category: movie.category || "Movie",
              description: movie.description || "",
              thumbnail: movie.thumbnail_url || "/blackbox-logo.png",
              videoKey: movie.video_key,
              videoUrl: watchUrl,
            };
          })
        );

        setMovies(preparedMovies);
      } catch (error) {
        console.error("Failed to load movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    }

    loadMovies();
  }, []);

  const path = window.location.pathname;

  if (path === "/admin") {
    return <AdminPage />;
  }

  if (path === "/my-list") {
    return (
      <MyListPage
        watchList={watchList}
        onRemoveFromList={removeFromMyList}
      />
    );
  }

  if (path.startsWith("/movie/")) {
    const movieId = decodeURIComponent(path.replace("/movie/", ""));
    const movie = movies.find((item) => String(item.id) === movieId);

    if (loadingMovies) {
      return (
        <Layout>
          <section className="contentSection">
            <h2>Loading movie...</h2>
          </section>
        </Layout>
      );
    }

    return (
      <MovieDetailsPage
        movie={movie}
        onAddToList={addToMyList}
        isSaved={movie ? isInMyList(movie.id) : false}
      />
    );
  }

  if (path.startsWith("/watch/")) {
    const movieId = decodeURIComponent(path.replace("/watch/", ""));
    const movie = movies.find((item) => String(item.id) === movieId);

    if (loadingMovies) {
      return (
        <Layout>
          <section className="contentSection">
            <h2>Loading player...</h2>
          </section>
        </Layout>
      );
    }

    return <PlayerPage movie={movie} />;
  }

  return (
    <LandingPage
      movies={movies}
      loading={loadingMovies}
      onAddToList={addToMyList}
      isInMyList={isInMyList}
    />
  );
}

export default App;