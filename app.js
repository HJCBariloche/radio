/* ========================================================================
   RADIO S.C. BARILOCHE - GLOBAL EXPLORER
   Fix: Nombre de archivo static-noise.ogg + Puntos Ultra-Finos (0.015)
   ======================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     1. CONFIGURACIÓN Y CONSTANTES GLOBAL
     ====================================================================== */
  const CONFIG = {
    SERVERS: [
      "https://de1.api.radio-browser.info",
      "https://all.api.radio-browser.info"
    ],
    BARILOCHE: {
      lat: -41.1335,
      lng: -71.3103,
      label: "Bariloche"
    },
    INITIAL_LIMIT: 8000,
    SEARCH_LIMIT: 100,
    ANIMATION_SPEED_MS: 600,
    STATIC_DURATION_MS: 350,
    STATIC_FILE_PATH: "static-noise.ogg", // Nombre corregido según GitHub
    STORAGE_KEY: "myRadioFavorites"
  };

  const CUSTOM_STATIONS = [
    {
      stationuuid: "custom-radio-lentos",
      name: "La Radio de los Lentos",
      country: "Argentina",
      state: "Buenos Aires",
      tags: "lentos baladas romantic love 80s 90s pop",
      bitrate: 320,
      codec: "MP3",
      lat: -34.6037,
      lng: -58.3816,
      url: "https://stream.zeno.fm/f3wvbb7534zuv",
      urlResolved: "https://stream.zeno.fm/f3wvbb7534zuv",
      sources: [
        "https://stream.zeno.fm/f3wvbb7534zuv",
        "https://stream.zeno.fm/as9bvc7t7hhvv",
        "https://stream.zeno.fm/fh68vgu6echvv",
        "https://27603.live.streamtheworld.com/LENTOS.mp3"
      ]
    }
  ];

  /* ======================================================================
     2. GESTOR DE ESTADO Y UTILIDADES
     ====================================================================== */
  const state = {
    stations: [],
    currentStation: null,
    selectedGenre: "all",
    onlyHD: false,
    userOrigin: { ...CONFIG.BARILOCHE },
    favorites: [],
    flyTimer: null,
    searchTimer: null
  };

  const Utils = {
    $: (id) => document.getElementById(id),
    cleanText: (val) => String(val ?? "").trim(),

    getKilometers(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
      return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
    },

    hasCoordinates(station) {
      return station &&
             Number.isFinite(station.lat) && Number.isFinite(station.lng) &&
             Math.abs(station.lat) <= 90 && Math.abs(station.lng) <= 180 &&
             !(Math.abs(station.lat) < 0.1 && Math.abs(station.lng) < 0.1);
    },

    normalizeStation(raw) {
      if (!raw) return null;
      const lat = Number.parseFloat(raw.geo_lat ?? raw.lat);
      const lng = Number.parseFloat(raw.geo_long ?? raw.lng);
      const primaryUrl = Utils.cleanText(raw.url_resolved || raw.url);

      return {
        stationuuid: Utils.cleanText(raw.stationuuid ?? raw.uuid),
        name: Utils.cleanText(raw.name) || "Radio sin nombre",
        country: Utils.cleanText(raw.country),
        state: Utils.cleanText(raw.state),
        tags: Utils.cleanText(raw.tags).toLowerCase(),
        bitrate: Number(raw.bitrate) || 0,
        codec: Utils.cleanText(raw.codec),
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        url: primaryUrl,
        urlResolved: primaryUrl,
        sources: Array.isArray(raw.sources) && raw.sources.length ? raw.sources : [primaryUrl]
      };
    },

    stationKey(station) {
      if (!station) return "";
      return station.stationuuid ? `uuid:${station.stationuuid}` : `url:${station.urlResolved || station.url}`;
    }
  };

  /* ======================================================================
     3. MOTOR DE AUDIO
     ====================================================================== */
  const AudioEngine = {
    player: new Audio(),
    staticPlayer: new Audio(CONFIG.STATIC_FILE_PATH),
    audioCtx: null,

    initContext() {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
    },

    playStaticNoise() {
      try {
        this.staticPlayer.currentTime = 0;
        this.staticPlayer.volume = 0.4;
        const playPromise = this.staticPlayer.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setTimeout(() => {
                this.staticPlayer.pause();
              }, CONFIG.STATIC_DURATION_MS);
            })
            .catch(() => {
              this.playSyntheticStatic();
            });
        }
      } catch (e) {
        this.playSyntheticStatic();
      }
    },

    playSyntheticStatic(duration = 0.35) {
      try {
        this.initContext();
        if (!this.audioCtx) return;

        const ctx = this.audioCtx;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.12;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        whiteNoise.connect(gain);
        gain.connect(ctx.destination);

        whiteNoise.start();
      } catch (e) {}
    },

    playStream(sources, onStatusChange, onError) {
      this.stopStream();
      let sourceIdx = 0;

      const trySource = () => {
        if (sourceIdx >= sources.length) {
          if (onError) onError();
          return;
        }

        this.player.src = sources[sourceIdx];
        this.player.play()
          .then(() => {
            if (onStatusChange) onStatusChange(true);
          })
          .catch(() => {
            sourceIdx++;
            trySource();
          });
      };

      trySource();
    },

    stopStream() {
      try {
        this.player.pause();
        this.player.currentTime = 0;
      } catch (e) {}
    },

    togglePlay() {
      this.initContext();
      if (this.player.paused) {
        return this.player.play();
      } else {
        this.player.pause();
        return Promise.reject();
      }
    }
  };

  ["click", "pointerdown", "keydown"].forEach(evt => {
    window.addEventListener(evt, () => AudioEngine.initContext(), { once: true });
  });

  /* ======================================================================
     4. PERSISTENCIA Y API
     ====================================================================== */
  const StorageManager = {
    loadFavorites() {
      try {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(Utils.normalizeStation).filter(s => s && s.url);
      } catch (e) {
        return [];
      }
    },

    saveFavorites(favorites) {
      try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {}
    }
  };

  const RadioAPI = {
    async fetchServer(path) {
      for (const server of CONFIG.SERVERS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(server + path, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) return await res.json();
        } catch (e) {}
      }
      return [];
    },

    async fetchPopular() {
      const raw = await this.fetchServer(`/json/stations/search?has_geo_info=true&order=votes&reverse=true&limit=${CONFIG.INITIAL_LIMIT}&hidebroken=true`);
      return raw.map(Utils.normalizeStation).filter(s => s && s.url && Utils.hasCoordinates(s));
    },

    async searchByName(query) {
      const q = Utils.cleanText(query);
      if (!q) return [];
      const encoded = encodeURIComponent(q);
      const raw = await this.fetchServer(`/json/stations/byname/${encoded}?hidebroken=true&limit=${CONFIG.SEARCH_LIMIT}`);
      return raw.map(Utils.normalizeStation).filter(s => s && s.url);
    }
  };

  /* ======================================================================
     5. GESTOR DEL GLOBO (Puntos reducidos a 0.015 para máxima definición)
     ====================================================================== */
  const GlobeManager = {
    instance: null,

    init(containerId) {
      this.instance = Globe()(document.getElementById(containerId))
        .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
        .pointColor(s => App.isMatchFilters(s) ? "#ffaa00" : "rgba(255,170,0,0.05)")
        .pointAltitude(s => App.isMatchFilters(s) ? 0.008 : 0.001)
        .pointRadius(s => App.isMatchFilters(s) ? 0.015 : 0.003) // Tamaño micro-fino
        .pointResolution(6)
        .polygonCapColor(() => "rgba(0,0,0,0)")
        .polygonSideColor(() => "rgba(0,0,0,0)")
        .polygonStrokeColor(() => "rgba(255,170,0,0.2)")
        .arcColor(() => ["#ffaa00", "rgba(255,170,0,0.1)"])
        .arcAltitude(0.2)
        .arcDashLength(0.4)
        .arcDashGap(0.2)
        .arcDashAnimateTime(1200)
        .arcStroke(0.3)
        .onPointClick(station => App.flyAndTune(station));

      this.instance.pointOfView({ lat: CONFIG.BARILOCHE.lat, lng: CONFIG.BARILOCHE.lng, altitude: 0.9 }, 0);
      this.loadCountryBorders();
    },

    loadCountryBorders() {
      fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.features)) {
            this.instance.polygonsData(data.features);
          }
        })
        .catch(() => {});
    },

    updatePoints(stations) {
      this.instance.pointsData(stations.filter(Utils.hasCoordinates));
    },

    refreshPointStyles() {
      this.instance
        .pointColor(s => App.isMatchFilters(s) ? "#ffaa00" : "rgba(255,170,0,0.05)")
        .pointAltitude(s => App.isMatchFilters(s) ? 0.008 : 0.001)
        .pointRadius(s => App.isMatchFilters(s) ? 0.015 : 0.003);
    },

    drawArc(origin, destination) {
      if (Utils.hasCoordinates(destination)) {
        this.instance.arcsData([{
          startLat: origin.lat,
          startLng: origin.lng,
          endLat: destination.lat,
          endLng: destination.lng
        }]);
      } else {
        this.instance.arcsData([]);
      }
    },

    flyTo(lat, lng, altitude = 0.8, duration = CONFIG.ANIMATION_SPEED_MS) {
      this.instance.pointOfView({ lat, lng, altitude }, duration);
    },

    getCenterCoordinates() {
      return this.instance.pointOfView();
    }
  };

  /* ======================================================================
     6. CONTROLADOR DE INTERFAZ Y APLICACIÓN
     ====================================================================== */
  const UI = {
    updateCard(station, userOrigin) {
      if (!station) return;

      const nameEl = Utils.$("name");
      const countryEl = Utils.$("country");
      const distanceEl = Utils.$("distance");
      const badgeEl = Utils.$("bitrateBadge");

      if (nameEl) nameEl.textContent = station.name;
      if (countryEl) countryEl.textContent = `📍 ${station.country || "Ubicación desconocida"}`;

      if (distanceEl) {
        if (Utils.hasCoordinates(station)) {
          const dist = Utils.getKilometers(userOrigin.lat, userOrigin.lng, station.lat, station.lng);
          distanceEl.textContent = `📐 A ${dist.toLocaleString("es-AR")} km de ${userOrigin.label}`;
        } else {
          distanceEl.textContent = "📍 Ubicación no disponible";
        }
      }

      if (badgeEl) {
        const bitrate = station.bitrate;
        const codec = station.codec ? station.codec.toUpperCase() : "";
        if (bitrate > 0 || codec) {
          const isHQ = bitrate >= 192 || codec === "FLAC";
          badgeEl.textContent = `${isHQ ? "⚡ HQ " : ""}${bitrate ? bitrate + " kbps" : ""} ${codec ? "(" + codec + ")" : ""}`;
          badgeEl.style.display = "inline-block";
        } else {
          badgeEl.style.display = "none";
        }
      }
    },

    setStatus(text) {
      const statusEl = Utils.$("statusText");
      if (statusEl) statusEl.textContent = text;
    },

    setPlayingState(isPlaying) {
      const playBtn = Utils.$("playBtn");
      const eqBars = Utils.$("eqBars");
      if (playBtn) playBtn.textContent = isPlaying ? "⏸ Pausa" : "▶ Reprod.";
      if (eqBars) eqBars.style.display = isPlaying ? "flex" : "none";
    },

    renderFavoritesList(favorites, onSelect, onRemove) {
      const favList = Utils.$("favList");
      if (!favList) return;

      favList.innerHTML = "";
      if (!favorites.length) {
        favList.innerHTML = '<p style="font-size:11px; color:#666; margin:0;">Sin favoritos</p>';
        return;
      }

      favorites.forEach(fav => {
        const div = document.createElement("div");
        div.className = "fav-item";

        const name = document.createElement("span");
        name.textContent = `📻 ${fav.name}`;
        name.style.cursor = "pointer";
        name.addEventListener("click", () => onSelect(fav));

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.style.cssText = "background:transparent; border:0; color:#888; cursor:pointer; font-size:16px;";
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          onRemove(fav);
        });

        div.appendChild(name);
        div.appendChild(removeBtn);
        favList.appendChild(div);
      });
    },

    updateFavoriteButton(isFavorite) {
      const favBtn = Utils.$("favBtn");
      if (!favBtn) return;
      favBtn.classList.toggle("active", isFavorite);
      favBtn.textContent = isFavorite ? "♥ Guardado" : "♡ Guardar";
    },

    renderSearchResults(results, onSelect) {
      const dropdown = Utils.$("searchResults");
      if (!dropdown) return;

      dropdown.innerHTML = "";
      const visible = results.slice(0, 8);
      if (!visible.length) {
        dropdown.style.display = "none";
        return;
      }

      visible.forEach(station => {
        const item = document.createElement("div");
        item.className = "results-item";
        item.textContent = `📻 ${station.name}${station.country ? ` — ${station.country}` : ""}`;
        item.addEventListener("click", () => {
          this.clearSearchResults();
          if (Utils.$("searchInput")) Utils.$("searchInput").value = station.name;
          onSelect(station);
        });
        dropdown.appendChild(item);
      });

      dropdown.style.display = "block";
    },

    clearSearchResults() {
      const dropdown = Utils.$("searchResults");
      if (dropdown) {
        dropdown.innerHTML = "";
        dropdown.style.display = "none";
      }
    }
  };

  const App = {
    init() {
      state.favorites = StorageManager.loadFavorites();
      GlobeManager.init("globe");
      this.bindEvents();
      this.loadInitialData();
      this.detectGeolocation();
    },

    bindEvents() {
      window.toggleHD = () => this.toggleHD();
      window.filterByGenre = (genre) => this.filterByGenre(genre);
      window.playRandomStation = () => this.playRandomStation();
      window.toggleAudio = () => this.toggleAudio();
      window.toggleFavorite = () => this.toggleFavorite();
      window.locateOrigin = () => this.locateOrigin();
      window.handleSearchKey = (e) => this.handleSearchKey(e);

      document.addEventListener("click", (e) => {
        const container = document.querySelector(".search-container");
        if (container && !container.contains(e.target)) {
          UI.clearSearchResults();
        }
      });
    },

    async loadInitialData() {
      const popular = await RadioAPI.fetchPopular();
      this.mergeStations([...CUSTOM_STATIONS.map(Utils.normalizeStation), ...popular]);

      const localStations = await RadioAPI.searchByName("bariloche");
      this.mergeStations(localStations);

      const barilocheMatch = localStations.find(Utils.hasCoordinates);
      if (barilocheMatch) {
        this.flyAndTune(barilocheMatch);
      } else {
        this.tuneNearestToCenter();
      }

      this.updateFavoritesUI();
    },

    detectGeolocation() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(pos => {
          state.userOrigin = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: "tu ubicación"
          };
          if (state.currentStation) {
            UI.updateCard(state.currentStation, state.userOrigin);
          }
        });
      }
    },

    mergeStations(newStations) {
      const map = new Map();
      for (const s of state.stations) {
        if (s && Utils.stationKey(s)) map.set(Utils.stationKey(s), s);
      }
      for (const s of newStations) {
        if (s && Utils.stationKey(s)) map.set(Utils.stationKey(s), s);
      }
      state.stations = Array.from(map.values());
      GlobeManager.updatePoints(state.stations);
    },

    isMatchFilters(station) {
      let matchGenre = true;
      if (state.selectedGenre !== "all") {
        const tags = station.tags || "";
        const name = (station.name || "").toLowerCase();
        matchGenre = tags.includes(state.selectedGenre) || name.includes(state.selectedGenre);
      }

      let matchHD = true;
      if (state.onlyHD) {
        const bitrate = station.bitrate || 0;
        const codec = (station.codec || "").toLowerCase();
        matchHD = bitrate >= 192 || codec === "flac";
      }

      return matchGenre && matchHD;
    },

    flyAndTune(station) {
      if (!station) return;

      if (state.flyTimer) clearTimeout(state.flyTimer);
      AudioEngine.stopStream();

      AudioEngine.playStaticNoise();

      const normalized = Utils.normalizeStation(station);
      if (!normalized) return;

      state.currentStation = normalized;
      UI.updateCard(normalized, state.userOrigin);
      UI.setStatus("● BUSCANDO SEÑAL...");

      if (!Utils.hasCoordinates(normalized)) {
        this.tuneStation(normalized);
        return;
      }

      GlobeManager.flyTo(normalized.lat, normalized.lng, 0.8, CONFIG.ANIMATION_SPEED_MS);

      state.flyTimer = setTimeout(() => {
        this.tuneStation(normalized);
      }, CONFIG.ANIMATION_SPEED_MS + 50);
    },

    tuneStation(station) {
      if (!station || !station.url) return;

      GlobeManager.drawArc(state.userOrigin, station);
      UI.setStatus("● CONECTANDO...");

      const sources = station.sources && station.sources.length ? station.sources : [station.url];

      AudioEngine.playStream(
        sources,
        (isPlaying) => {
          UI.setPlayingState(isPlaying);
          UI.setStatus(isPlaying ? "● SINTONIZANDO" : "⏸ EN PAUSA");
        },
        () => {
          UI.setPlayingState(false);
          UI.setStatus("⚠️ ERROR DE EMISIÓN");
        }
      );

      this.updateFavoritesUI();
    },

    toggleAudio() {
      if (!state.currentStation) return;
      AudioEngine.togglePlay()
        .then(() => UI.setPlayingState(true))
        .catch(() => UI.setPlayingState(false));
    },

    toggleHD() {
      state.onlyHD = !state.onlyHD;
      const hdBtn = Utils.$("hdBtn");
      if (hdBtn) hdBtn.classList.toggle("active", state.onlyHD);
      GlobeManager.refreshPointStyles();
    },

    filterByGenre(genre) {
      state.selectedGenre = Utils.cleanText(genre) || "all";
      GlobeManager.refreshPointStyles();
    },

    playRandomStation() {
      const activeStations = state.stations.filter(s => s.url && this.isMatchFilters(s));
      if (activeStations.length) {
        const randomChoice = activeStations[Math.floor(Math.random() * activeStations.length)];
        this.flyAndTune(randomChoice);
      }
    },

    toggleFavorite() {
      if (!state.currentStation) return;
      const key = Utils.stationKey(state.currentStation);
      const idx = state.favorites.findIndex(f => Utils.stationKey(f) === key);

      if (idx >= 0) {
        state.favorites.splice(idx, 1);
      } else {
        state.favorites.push(state.currentStation);
      }

      StorageManager.saveFavorites(state.favorites);
      this.updateFavoritesUI();
    },

    updateFavoritesUI() {
      const isFav = state.currentStation ?
        state.favorites.some(f => Utils.stationKey(f) === Utils.stationKey(state.currentStation)) :
        false;

      UI.updateFavoriteButton(isFav);
      UI.renderFavoritesList(
        state.favorites,
        (favStation) => this.flyAndTune(favStation),
        (favStation) => {
          state.favorites = state.favorites.filter(f => Utils.stationKey(f) !== Utils.stationKey(favStation));
          StorageManager.saveFavorites(state.favorites);
          this.updateFavoritesUI();
        }
      );
    },

    tuneNearestToCenter() {
      const active = state.stations.filter(s => Utils.hasCoordinates(s) && this.isMatchFilters(s));
      if (!active.length) return;

      const pov = GlobeManager.getCenterCoordinates();
      let nearest = null;
      let minDistance = Infinity;

      for (const s of active) {
        const d = Utils.getKilometers(pov.lat, pov.lng, s.lat, s.lng);
        if (d < minDistance) {
          minDistance = d;
          nearest = s;
        }
      }

      if (nearest) this.tuneStation(nearest);
    },

    locateOrigin() {
      GlobeManager.flyTo(state.userOrigin.lat, state.userOrigin.lng, 0.9, 800);
      setTimeout(() => this.tuneNearestToCenter(), 850);
    },

    handleSearchKey(event) {
      const q = Utils.cleanText(event.target.value);

      if (event.key === "Enter") {
        event.preventDefault();
        clearTimeout(state.searchTimer);
        RadioAPI.searchByName(q).then(results => {
          this.mergeStations(results);
          const match = results.find(Utils.hasCoordinates) || results[0];
          if (match) this.flyAndTune(match);
        });
        UI.clearSearchResults();
        return;
      }

      clearTimeout(state.searchTimer);
      if (q.length >= 3) {
        state.searchTimer = setTimeout(async () => {
          const results = await RadioAPI.searchByName(q);
          this.mergeStations(results);
          UI.renderSearchResults(results, (selected) => this.flyAndTune(selected));
        }, 300);
      } else {
        UI.clearSearchResults();
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }
})();
