import { useState } from "react";
import "./App.css";

const sampleVideos = [
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
];

function App() {
  const [selectedVideo, setSelectedVideo] = useState(sampleVideos[0]);
  const [watchList, setWatchList] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  async function uploadVideoToR2(file) {
    const response = await fetch("/api/r2-upload-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    const uploadResponse = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Upload to Cloudflare R2 failed");
    }

    return data.key;
  }

  async function handleVideoUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file only.");
      return;
    }

    try {
      setUploading(true);
      setUploadMessage("Uploading video to Cloudflare R2...");

      const uploadedKey = await uploadVideoToR2(file);

      const localPreviewUrl = URL.createObjectURL(file);

      const newVideo = {
        id: Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: "Uploaded",
        description: "Uploaded to Cloudflare R2.",
        thumbnail:
          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80",
        videoUrl: localPreviewUrl,
        r2Key: uploadedKey,
      };

      setUploadedVideos((prev) => [newVideo, ...prev]);
      setSelectedVideo(newVideo);

      setUploadMessage(`Upload successful! R2 file key: ${uploadedKey}`);
      alert("Upload successful! Check your Cloudflare R2 bucket.");
    } catch (error) {
      console.error(error);
      setUploadMessage("Upload failed: " + error.message);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function addToWatchList(video) {
    const exists = watchList.some((item) => item.id === video.id);

    if (exists) {
      alert("This video is already in My List.");
      return;
    }

    setWatchList((prev) => [...prev, video]);
  }

  const allVideos = [...uploadedVideos, ...sampleVideos];

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>BlackBox</h1>
        <p>Streaming App</p>

        <nav>
          <button>Home</button>
          <button>Movies</button>
          <button>Series</button>
          <button>My List</button>
          <button>Uploads</button>
        </nav>
      </aside>

      <main className="main">
        <section className="hero">
          <div className="heroText">
            <span className="tag">Now Streaming</span>
            <h2>{selectedVideo.title}</h2>
            <p>{selectedVideo.description}</p>

            {selectedVideo.r2Key && (
              <p className="r2Key">
                R2 Key: <strong>{selectedVideo.r2Key}</strong>
              </p>
            )}

            <div className="heroButtons">
              <a href="#player">
                <button className="watchBtn">Watch Now</button>
              </a>

              <button
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

          <video
            src={selectedVideo.videoUrl}
            controls
            className="videoPlayer"
          />

          <p className="videoTitle">{selectedVideo.title}</p>
        </section>

        <section className="uploadSection">
          <h3>Upload Your Video</h3>
          <p>
            Select a video from your computer. It will upload to Cloudflare R2.
          </p>

          <label className="uploadBox">
            {uploading ? "Uploading..." : "Choose Video File"}
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploading}
            />
          </label>

          {uploadMessage && <p className="uploadMessage">{uploadMessage}</p>}
        </section>

        <section className="contentSection">
          <h3>Browse Streams</h3>

          <div className="videoGrid">
            {allVideos.map((video) => (
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
        </section>

        <section className="contentSection">
          <h3>My List</h3>

          {watchList.length === 0 ? (
            <p className="emptyText">No videos added yet.</p>
          ) : (
            <div className="videoGrid">
              {watchList.map((video) => (
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
      </main>
    </div>
  );
}

export default App;