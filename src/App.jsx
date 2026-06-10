import { useState } from "react";

const videos = [
  {
    id: 1,
    title: "Shadow City",
    category: "Action",
    description: "A dark action thriller set in a futuristic city.",
    thumbnail:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: 2,
    title: "Ocean Lights",
    category: "Drama",
    description: "A peaceful cinematic story by the sea.",
    thumbnail:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
  {
    id: 3,
    title: "Night Drive",
    category: "Thriller",
    description: "A suspenseful ride through the city at night.",
    thumbnail:
      "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    id: 4,
    title: "Skyline Live",
    category: "Live",
    description: "A live-style stream preview for your platform.",
    thumbnail:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80",
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },

  /*
    Add your Cloudflare R2 videos here later.

    Example:

    {
      id: 5,
      title: "My Uploaded Video",
      category: "Uploaded",
      description: "This video is hosted in Cloudflare R2.",
      thumbnail: "PASTE_THUMBNAIL_IMAGE_URL_HERE",
      videoUrl: "PASTE_R2_VIDEO_URL_HERE",
    },
  */
];

function App() {
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [watchList, setWatchList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...new Set(videos.map((video) => video.category))];

  const filteredVideos = videos.filter((video) => {
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

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brandLogo">
          <img src="/blackbox-logo.png" alt="BlackBox Logo" />
        </div>

        <nav>
          <button type="button">Home</button>
          <button type="button">Movies</button>
          <button type="button">Series</button>
          <button type="button">My List</button>
          <button type="button">Live</button>
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
            <img src={selectedVideo.thumbnail} alt={selectedVideo.title} />
          </div>
        </section>

        <section id="player" className="playerSection">
          <h3>Video Player</h3>

          <video src={selectedVideo.videoUrl} controls className="videoPlayer" />

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
                  <img src={video.thumbnail} alt={video.title} />

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
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    onClick={() => setSelectedVideo(video)}
                  />

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

export default App;