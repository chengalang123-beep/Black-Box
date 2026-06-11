import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [movieTitle, setMovieTitle] = useState("");
  const [movieCategory, setMovieCategory] = useState("Uploaded");
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
      category: movieCategory.trim() || "Uploaded",
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
      setMovieCategory("Uploaded");
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
                placeholder="Thumbnail image URL optional"
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

function HomePage() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchList, setWatchList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);

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

        if (error) {
          throw error;
        }

        const preparedMovies = await Promise.all(
          (data || []).map(async (movie) => {
            let watchUrl = movie.video_url;

            if (movie.video_key) {
              watchUrl = await getSignedWatchUrl(movie.video_key);
            }

            return {
              id: movie.id,
              title: movie.title,
              category: movie.category || "Uploaded",
              description: movie.description || "",
              thumbnail: movie.thumbnail_url || "/blackbox-logo.png",
              videoUrl: watchUrl,
            };
          })
        );

        setUploadedVideos(preparedMovies);

        if (preparedMovies.length > 0) {
          setSelectedVideo(preparedMovies[0]);
        }
      } catch (error) {
        console.error("Failed to load movies:", error);
      } finally {
        setLoadingMovies(false);
      }
    }

    loadMovies();
  }, []);

  const allVideos = uploadedVideos;

  const categories = [
    "All",
    ...new Set(allVideos.map((video) => video.category).filter(Boolean)),
  ];

  const filteredVideos = allVideos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || video.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  function addToWatchList(video) {
    const exists = watchList.some((item) => item.id === video.id);

    if (exists) {
      alert("This video is already in My List.");
      return;
    }

    setWatchList((prev) => [...prev, video]);
  }

  function removeFromWatchList(videoId) {
    setWatchList((prev) => prev.filter((video) => video.id !== videoId));
  }

  if (loadingMovies) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="brandLogo">
            <img src="/blackbox-logo.png" alt="BlackBox Logo" />
          </div>
        </aside>

        <main className="main">
          <section className="contentSection">
            <h3>Loading movies...</h3>
            <p className="emptyText">Please wait while your uploaded movies load.</p>
          </section>
        </main>
      </div>
    );
  }

  if (!selectedVideo && uploadedVideos.length === 0) {
    return (
      <div className="app">
        <aside className="sidebar">
          <div className="brandLogo">
            <img src="/blackbox-logo.png" alt="BlackBox Logo" />
          </div>
        </aside>

        <main className="main">
          <section className="contentSection">
            <h3>No movies yet</h3>
            <p className="emptyText">
              Upload a movie from the admin page and it will appear here.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brandLogo">
          <img src="/blackbox-logo.png" alt="BlackBox Logo" />
        </div>

        <nav>
          <button type="button">Home</button>
          <button type="button">Movies</button>
          <button type="button">My List</button>
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <div className="heroText">
            <span className="tag">Now Streaming</span>

            <h2>{selectedVideo.title}</h2>

            <p>{selectedVideo.description}</p>

            <div className="heroButtons">
              <a href="#player">
                <button type="button" className="watchBtn">
                  Watch Now
                </button>
              </a>

              <button
                type="button"
                className="listBtn"
                onClick={() => addToWatchList(selectedVideo)}
              >
                + My List
              </button>
            </div>
          </div>

          <div className="heroCard">
            <img
              src={selectedVideo.thumbnail}
              alt={selectedVideo.title}
              className="posterContain"
            />
          </div>
        </section>

        <section id="player" className="playerSection">
          <h3>Video Player</h3>

          <video
            key={selectedVideo.videoUrl}
            src={selectedVideo.videoUrl}
            controls
            className="videoPlayer"
          />

          <p className="videoTitle">{selectedVideo.title}</p>
        </section>

        <section className="contentSection">
          <div className="sectionHeader">
            <div>
              <h3>Browse Streams</h3>
              <p>Choose a video to start watching.</p>
            </div>

            <input
              className="searchInput"
              type="text"
              placeholder="Search videos..."
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

          {filteredVideos.length === 0 ? (
            <p className="emptyText">No videos found.</p>
          ) : (
            <div className="videoGrid">
              {filteredVideos.map((video) => (
                <div
                  className="videoCard"
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="videoThumbWrap">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="videoThumbnailContain"
                    />
                  </div>

                  <div>
                    <h4>{video.title}</h4>
                    <p>{video.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="contentSection">
          <h3>My List</h3>

          {watchList.length === 0 ? (
            <p className="emptyText">No videos added yet.</p>
          ) : (
            <div className="videoGrid">
              {watchList.map((video) => (
                <div className="videoCard" key={video.id}>
                  <div className="videoThumbWrap">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="videoThumbnailContain"
                      onClick={() => setSelectedVideo(video)}
                    />
                  </div>

                  <div>
                    <h4>{video.title}</h4>
                    <p>{video.category}</p>

                    <button
                      type="button"
                      className="removeBtn"
                      onClick={() => removeFromWatchList(video.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function App() {
  const isAdminPage = window.location.pathname === "/admin";

  if (isAdminPage) {
    return <AdminPage />;
  }

  return <HomePage />;
}

export default App;