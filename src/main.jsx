import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Plus, Check, Search, Tv, Radio, Clock3, Upload, Star, Volume2, Maximize2, X, Flame, Clapperboard } from 'lucide-react';
import './styles.css';

const demoStreams = [
  {
    id: 1,
    title: 'Aurora Nights',
    type: 'Movie',
    category: 'Trending',
    year: '2026',
    rating: 'PG-13',
    duration: '1h 42m',
    progress: 68,
    score: 9.2,
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    poster: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    description: 'A cinematic escape through color, light, and quiet moments made for late-night streaming.'
  },
  {
    id: 2,
    title: 'Big Buck Adventure',
    type: 'Family',
    category: 'Family',
    year: '2025',
    rating: 'G',
    duration: '12m',
    progress: 25,
    score: 8.7,
    video: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    description: 'A bright animated sample stream with playful energy and quick-watch pacing.'
  },
  {
    id: 3,
    title: 'Sintel: The Journey',
    type: 'Series',
    category: 'Originals',
    year: '2024',
    rating: 'TV-14',
    duration: '14m',
    progress: 44,
    score: 8.9,
    video: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?q=80&w=1200&auto=format&fit=crop',
    description: 'Fantasy-inspired streaming content for a premium app showcase.'
  },
  {
    id: 4,
    title: 'City Pulse Live',
    type: 'Live',
    category: 'Live TV',
    year: 'Live',
    rating: 'LIVE',
    duration: '24/7',
    progress: 100,
    score: 9.5,
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    poster: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=1200&auto=format&fit=crop',
    description: 'A live-channel style tile for your streaming platform interface.'
  },
  {
    id: 5,
    title: 'Ocean Drift',
    type: 'Documentary',
    category: 'Documentaries',
    year: '2023',
    rating: 'PG',
    duration: '48m',
    progress: 12,
    score: 8.4,
    video: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    poster: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop',
    description: 'A calm documentary-style stream tile with a clean premium design.'
  },
  {
    id: 6,
    title: 'Midnight Signal',
    type: 'Thriller',
    category: 'Trending',
    year: '2022',
    rating: 'TV-MA',
    duration: '2h 04m',
    progress: 0,
    score: 8.8,
    video: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop',
    description: 'Dark, bold, and dramatic — perfect for a streaming app hero carousel.'
  }
];

const categories = ['All', 'Trending', 'Originals', 'Family', 'Documentaries', 'Live TV'];

function App() {
  const [active, setActive] = useState(demoStreams[0]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('streambox-watchlist') || '[]'));
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('streambox-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const filteredStreams = useMemo(() => {
    return demoStreams.filter(item => {
      const searchText = `${item.title} ${item.category} ${item.type}`.toLowerCase();
      const matchesSearch = searchText.includes(query.toLowerCase());
      const matchesCategory = category === 'All' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [query, category]);

  const continueWatching = demoStreams.filter(item => item.progress > 0 && item.progress < 100);
  const inWatchlist = watchlist.includes(active.id);

  const toggleWatchlist = (id) => {
    setWatchlist(current => current.includes(id) ? current.filter(savedId => savedId !== id) : [...current, id]);
  };

  const openStream = (item) => {
    setActive(item);
    setUploadedVideo(null);
    setShowPlayer(true);
    setTimeout(() => videoRef.current?.play?.(), 100);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedVideo({ title: file.name.replace(/\.[^/.]+$/, ''), video: url });
    setShowPlayer(true);
  };

  const playerSource = uploadedVideo?.video || active.video;
  const playerTitle = uploadedVideo?.title || active.title;

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="logo"><span>▶</span> StreamBox</div>
        <a href="#home"><Tv size={18} /> Home</a>
        <a href="#browse"><Clapperboard size={18} /> Browse</a>
        <a href="#live"><Radio size={18} /> Live TV</a>
        <a href="#continue"><Clock3 size={18} /> Continue</a>
        <label className="uploadNav">
          <Upload size={18} /> Upload Video
          <input type="file" accept="video/*" onChange={handleUpload} />
        </label>
      </aside>

      <section className="content" id="home">
        <header className="topbar">
          <div className="searchBox">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search shows, live channels, movies..." />
          </div>
          <button className="profileButton">CG</button>
        </header>

        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,8,14,.98), rgba(7,8,14,.72), rgba(7,8,14,.35)), url(${active.poster})` }}>
          <div className="heroCopy">
            <span className="eyebrow"><Flame size={16} /> Now Streaming</span>
            <h1>{active.title}</h1>
            <p>{active.description}</p>
            <div className="metaRow">
              <span>{active.year}</span>
              <span>{active.rating}</span>
              <span>{active.duration}</span>
              <span><Star size={15} fill="currentColor" /> {active.score}</span>
            </div>
            <div className="heroActions">
              <button className="playButton" onClick={() => openStream(active)}><Play size={19} fill="currentColor" /> Watch Now</button>
              <button className="ghostButton" onClick={() => toggleWatchlist(active.id)}>{inWatchlist ? <Check size={18} /> : <Plus size={18} />} {inWatchlist ? 'Saved' : 'My List'}</button>
            </div>
          </div>
        </section>

        <section className="sectionBlock" id="continue">
          <div className="sectionHeader">
            <h2>Continue Watching</h2>
            <span>{continueWatching.length} in progress</span>
          </div>
          <div className="continueGrid">
            {continueWatching.map(item => (
              <button className="continueCard" key={item.id} onClick={() => openStream(item)}>
                <img src={item.poster} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.duration}</span>
                  <div className="progress"><i style={{ width: `${item.progress}%` }} /></div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="sectionBlock" id="browse">
          <div className="sectionHeader">
            <h2>Browse Streams</h2>
            <span>{filteredStreams.length} titles</span>
          </div>
          <div className="chips">
            {categories.map(item => <button key={item} className={category === item ? 'activeChip' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="streamGrid">
            {filteredStreams.map(item => (
              <article className="streamCard" key={item.id} onClick={() => setActive(item)}>
                <div className="posterWrap">
                  <img src={item.poster} alt={item.title} />
                  <button onClick={(event) => { event.stopPropagation(); openStream(item); }}><Play size={18} fill="currentColor" /></button>
                </div>
                <div className="cardBody">
                  <span>{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.type} • {item.rating} • {item.duration}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sectionBlock" id="live">
          <div className="sectionHeader">
            <h2>Live Channels</h2>
            <span>Demo channels</span>
          </div>
          <div className="liveStrip">
            {['StreamBox News', 'Cinema 24/7', 'Family Room', 'Documentary Hub'].map((channel, index) => (
              <button key={channel} onClick={() => openStream(demoStreams[index % demoStreams.length])}>
                <span className="liveDot">LIVE</span>
                <strong>{channel}</strong>
                <small>Playing now</small>
              </button>
            ))}
          </div>
        </section>
      </section>

      {showPlayer && (
        <div className="playerOverlay">
          <div className="playerPanel">
            <div className="playerTop">
              <div>
                <span>Now Playing</span>
                <h2>{playerTitle}</h2>
              </div>
              <button onClick={() => setShowPlayer(false)}><X size={22} /></button>
            </div>
            <video ref={videoRef} src={playerSource} controls playsInline poster={uploadedVideo ? undefined : active.poster} />
            <div className="playerTools">
              <span><Volume2 size={17} /> HTML5 video player</span>
              <span><Maximize2 size={17} /> Works on Vercel static hosting</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
