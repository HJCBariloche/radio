/* ========================================================================
   RADIO S.C. BARILOCHE - GLOBAL EXPLORER
   Versión Estable: Control de Volumen Integrado + Responsive + Reloj HH:MM
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
    INITIAL_LIMIT: 6000,
    SEARCH_LIMIT: 100,
    ANIMATION_SPEED_MS: 600,
    STATIC_DURATION_MS: 350,
    STATIC_FILE_PATH: "static-noise.ogg",
    STORAGE_KEY: "myRadioFavorites",
    THEME_KEY: "globeTheme",
    VOLUME_KEY: "radioVolume"
  };

  const GLOBE_THEMES = {
    day: {
      url: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      icon: "🌙"
    },
    night: {
      url: "https://unpkg.com/three-globe/example/img/earth-night.jpg",
      icon: "☀️"
    }
  };

  const COUNTRY_TIMEZONES = {
    "AR": "America/Argentina/Buenos_Aires", "ARGENTINA": "America/Argentina/Buenos_Aires",
    "BR": "America/Sao_Paulo", "BRAZIL": "America/Sao_Paulo", "BRASIL": "America/Sao_Paulo",
    "CL": "America/Santiago", "CHILE": "America/Santiago",
    "UY": "America/Montevideo", "URUGUAY": "America/Montevideo",
    "CO": "America/Bogota", "COLOMBIA": "America/Bogota",
    "MX": "America/Mexico_City", "MEXICO": "America/Mexico_City", "MÉXICO": "America/Mexico_City",
    "PE": "America/Lima", "PERU": "America/Lima", "PERÚ": "America/Lima",
    "VE": "America/Caracas", "VENEZUELA": "America/Caracas",
    "EC": "America/Guayaquil", "ECUADOR": "America/Guayaquil",
    "BO": "America/La_Paz", "BOLIVIA": "America/La_Paz",
    "PY": "America/Asuncion", "PARAGUAY": "America/Asuncion",
    "US": "America/New_York", "UNITED STATES": "America/New_York", "ESTADOS UNIDOS": "America/New_York", "USA": "America/New_York",
    "CA": "America/Toronto", "CANADA": "America/Toronto", "CANADÁ": "America/Toronto",
    "ES": "Europe/Madrid", "SPAIN": "Europe/Madrid", "ESPAÑA": "Europe/Madrid",
    "DE": "Europe/Berlin", "GERMANY": "Europe/Berlin", "ALEMANIA": "Europe/Berlin",
    "FR": "Europe/Paris", "FRANCE": "Europe/Paris", "FRANCIA": "Europe/Paris",
    "IT": "Europe/Rome", "ITALY": "Europe/Rome", "ITALIA": "Europe/Rome",
    "GB": "Europe/London", "UNITED KINGDOM": "Europe/London", "REINO UNIDO": "Europe/London", "UK": "Europe/London",
    "PT": "Europe/Lisbon", "PORTUGAL": "Europe/Lisbon",
    "NL": "Europe/Amsterdam", "NETHERLANDS": "Europe/Amsterdam", "HOLANDA": "Europe/Amsterdam",
    "RU": "Europe/Moscow", "RUSSIA": "Europe/Moscow", "RUSIA": "Europe/Moscow",
    "JP": "Asia/Tokyo", "JAPAN": "Asia/Tokyo", "JAPÓN": "Asia/Tokyo", "JAPON": "Asia/Tokyo",
    "CN": "Asia/Shanghai", "CHINA": "Asia/Shanghai",
    "AU": "Australia/Sydney", "AUSTRALIA": "Australia/Sydney",
    "NZ": "Pacific/Auckland", "NEW ZEALAND": "Pacific/Auckland", "NUEVA ZELANDA": "Pacific/Auckland",
    "ZA": "Africa/Johannesburg", "SOUTH AFRICA": "Africa/Johannesburg", "SUDÁFRICA": "Africa/Johannesburg",
    "CU": "America/Havana", "CUBA": "America/Havana",
    "DO": "America/Santo_Domingo", "DOMINICAN REPUBLIC": "America/Santo_Domingo", "REPÚBLICA DOMINICANA": "America/Santo_Domingo",
    "PR": "America/Puerto_Rico", "PUERTO RICO": "America/Puerto_Rico",
    "CR": "America/Costa_Rica", "COSTA RICA": "America/Costa_Rica",
    "PA": "America/Panama", "PANAMA": "America/Panama", "PANAMÁ": "America/Panama",
    "GT": "America/Guatemala", "GUATEMALA": "America/Guatemala",
    "HN": "America/Tegucigalpa", "HONDURAS": "America/Tegucigalpa",
    "SV": "America/El_Salvador", "EL SALVADOR": "America/El_Salvador",
    "NI": "America/Managua", "NICARAGUA": "America/Managua",
    "IE": "Europe/Dublin", "IRELAND": "Europe/Dublin", "IRLANDA": "Europe/Dublin",
    "CH": "Europe/Zurich", "SWITZERLAND": "Europe/Zurich", "SUIZA": "Europe/Zurich",
    "AT": "Europe/Vienna", "AUSTRIA": "Europe/Vienna",
    "BE": "Europe/Brussels", "BELGIUM": "Europe/Brussels", "BÉLGICA": "Europe/Brussels",
    "SE": "Europe/Stockholm", "SWEDEN": "Europe/Stockholm", "SUECIA": "Europe/Stockholm",
    "NO": "Europe/Oslo", "NORWAY": "Europe/Oslo", "NORUEGA": "Europe/Oslo",
    "FI": "Europe/Helsinki", "FINLAND": "Europe/Helsinki", "FINLANDIA": "Europe/Helsinki",
    "PL": "Europe/Warsaw", "POLAND": "Europe/Warsaw", "POLONIA": "Europe/Warsaw",
    "GR": "Europe/Athens", "GREECE": "Europe/Athens", "GRECIA": "Europe/Athens",
    "TR": "Europe/Istanbul", "TURKEY": "Europe/Istanbul", "TURQUÍA": "Europe/Istanbul",
    "IN": "Asia/Kolkata", "INDIA": "Asia/Kolkata",
    "KR": "Asia/Seoul", "SOUTH KOREA": "Asia/Seoul", "COREA DEL SUR": "Asia/Seoul",
    "IL": "Asia/Jerusalem", "ISRAEL": "Asia/Jerusalem",
    "EG": "Africa/Cairo", "EGYPT": "Africa/Cairo", "EGIPTO": "Africa/Cairo"
  };

  const CUSTOM_STATIONS = [
    {
      stationuuid: "custom-radio-lentos",
      name: "La Radio de los Lentos",
      country: "Argentina",
      countrycode: "AR",
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
    searchTimer: null,
    userHasInteracted: false,
    volume: 1.0,
    previousVolume: 1.0
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
        countrycode: Utils.cleanText(raw.countrycode || raw.country_code).toUpperCase(),
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
     3. MOTOR DE AUDIO Y VOLUMEN
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

    setVolume(val) {
      const num = Math.max(0, Math.min(1, Number(val)));
      state.volume = num;
      this.player.volume = num;

      // Actualiza la interfaz del volumen
      const slider = Utils.$("volumeSlider");
      const label = Utils.$("volumeValue");
      const btn = Utils.$("muteBtn");

      if (slider) slider.value = num;
      if (label) label.textContent = `${Math.round(num * 100)}%`;

      if (btn) {
        if (num === 0) btn.textContent = "🔇";
        else if (num < 0.5) btn.textContent = "🔉";
        else btn.textContent = "🔊";
      }

      try {
        localStorage.setItem(CONFIG.VOLUME_KEY, num.toString());
      } catch (e) {}
    },

    toggleMute() {
      if (state.volume > 0) {
        state.previousVolume = state.volume;
        this.setVolume(0);
      } else {
        this.setVolume(state.previousVolume || 1.0);
      }
    },

    playStaticNoise() {
      if (!state.userHasInteracted) return;

      try {
        this.staticPlayer.currentTime = 0;
        this.staticPlayer.volume = Math.min(state.volume, 0.35);
        const playPromise = this.staticPlayer.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setTimeout(() => {
                try { this.staticPlayer.pause(); } catch(e){}
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
      if (!state.userHasInteracted) return;
      try {
        this.initContext();
        if (!this.audioCtx) return;

        const ctx = this.audioCtx;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08 * state.volume, ctx.currentTime);
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
        this.player.volume = state.volume;
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

  function getFormattedHHMM(dateObj, timeZoneName = null) {
    try {
      const opts = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      if (timeZoneName) {
        opts.timeZone = timeZoneName;
      }
      return new Intl.DateTimeFormat('en-GB', opts).format(dateObj);
    } catch (e) {
      const h = String(dateObj.getHours()).padStart(2, '0');
      const m = String(dateObj.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }

  const ClockModule = {
    timer: null,

    start() {
      this.updateClocks();
      if (this.timer) clearInterval(this.timer);
      this.timer = setInterval(() => this.updateClocks(), 1000);
    },

    updateClocks() {
      try {
        const now = new Date();

        const localTimeStr = getFormattedHHMM(now);
        const localEl = Utils.$("clockLocal");
        if (localEl) localEl.textContent = localTimeStr;

        const stationEl = Utils.$("clockStation");
        const labelEl = Utils.$("clockStationLabel");

        if (!state.currentStation) {
          if (stationEl) stationEl.textContent = localTimeStr;
          if (labelEl) labelEl.textContent = "HORA DE LA RADIO";
          return;
        }

        const countryName = (state.currentStation.country || "").toUpperCase().trim();
        const countryCode = (state.currentStation.countrycode || "").toUpperCase().trim();

        const timezone = COUNTRY_TIMEZONES[countryCode] || COUNTRY_TIMEZONES[countryName] || null;

        if (timezone) {
          const stationTimeStr = getFormattedHHMM(now, timezone);
          if (stationEl) stationEl.textContent = stationTimeStr;
          if (labelEl) labelEl.textContent = `HORA DE ${countryName || "EMISORA"}`;
        } else {
          if (stationEl) stationEl.textContent = localTimeStr;
          if (labelEl) labelEl.textContent = "HORA DE LA RADIO";
        }
      } catch (err) {}
    }
  };

  const markUserInteraction = () => {
    state.userHasInteracted = true;
    AudioEngine.initContext();
  };

  ["click", "pointerdown", "keydown", "touchstart"].forEach(evt => {
    window.addEventListener(evt, markUserInteraction, { once: true });
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
    },

    loadVolume() {
      try {
        const raw = localStorage.getItem(CONFIG.VOLUME_KEY);
        if (raw !== null) {
          const val = Number.parseFloat(raw);
          if (Number.isFinite(val)) return Math.max(0, Math.min(1, val));
        }
      } catch (e) {}
      return 1.0;
    }
  };

  const RadioAPI = {
    async fetchServer(path) {
      for (const server of CONFIG.SERVERS) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 10000);
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
     5. GESTOR DEL GLOBO TERRAQUEO
     ====================================================================== */
  const GlobeManager = {
    instance: null,

    init(containerId) {
      const elem = document.getElementById(containerId);
      if (!elem) return;

      const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || "night";
      const initialTexture = GLOBE_THEMES[savedTheme].url;

      if (typeof Globe === "function") {
        this.instance = Globe()(elem)
          .globeImageUrl(initialTexture)
          .pointColor(s => App.isMatchFilters(s) ? "#ffaa00" : "rgba(255,170,0,0.12)")
          .pointAltitude(s => App.isMatchFilters(s) ? 0.012 : 0.002)
          .pointRadius(s => App.isMatchFilters(s) ? 0.22 : 0.04)
          .pointResolution(6)
          .polygonCapColor(() => "rgba(0,0,0,0)")
          .polygonSideColor(() => "rgba(0,0,0,0)")
          .polygonStrokeColor(() => "rgba(255,170,0,0.25)")
          .arcColor(() => ["#ffaa00", "rgba(255,170,0,0.1)"])
          .arcAltitude(0.2)
          .arcDashLength(0.4)
          .arcDashGap(0.2)
          .arcDashAnimateTime(1200)
          .arcStroke(0.3)
          .onPointClick(station => {
            markUserInteraction();
            if (station) App.flyAndTune(station);
          })
          .onGlobeClick(({ lat, lng }) => {
            markUserInteraction();
            App.tuneNearestToLocation(lat, lng);
          });

        this.instance.pointOfView({ lat: CONFIG.BARILOCHE.lat, lng: CONFIG.BARILOCHE.lng, altitude: 0.9 }, 0);
        this.loadCountryBorders();
        this.updateThemeButton(savedTheme);
      }
    },

    setTheme(theme) {
      const active = GLOBE_THEMES[theme] || GLOBE_THEMES.night;
      if (this.instance) {
        this.instance.globeImageUrl(active.url);
      }
      this.updateThemeButton(theme);
    },

    updateThemeButton(theme) {
      const btn = Utils.$("themeBtn");
      if (btn) {
        btn.textContent = GLOBE_THEMES[theme].icon;
      }
    },

    loadCountryBorders() {
      fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.features) && this.instance) {
            this.instance.polygonsData(data.features);
          }
        })
        .catch(() => {});
    },

    updatePoints(stations) {
      if (this.instance) {
        this.instance.pointsData(stations.filter(Utils.hasCoordinates));
      }
    },

    refreshPointStyles() {
      if (this.instance) {
        this.instance
          .pointColor(s => App.isMatchFilters(s) ? "#ffaa00" : "rgba(255,170,0,0.12)")
          .pointAltitude(s => App.isMatchFilters(s) ? 0.012 : 0.002)
          .pointRadius(s => App.isMatchFilters(s) ? 0.22 : 0.04);
      }
    },

    drawArc(origin, destination) {
      if (!this.instance) return;
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
      if (this.instance) {
        this.instance.pointOfView({ lat, lng, altitude }, duration);
      }
    },

    getCenterCoordinates() {
      return this.instance ? this.instance.pointOfView() : { lat: 0, lng: 0 };
    }
  };

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
        favList.innerHTML = '<p style="font-size:12px; color:#666; margin:0;">Sin favoritos</p>';
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
      try { state.favorites = StorageManager.loadFavorites(); } catch(e){}
      try {
        const savedVol = StorageManager.loadVolume();
        AudioEngine.setVolume(savedVol);
      } catch(e){}
      try { ClockModule.start(); } catch(e){}
      try { GlobeManager.init("globe"); } catch(e){}
      try { this.bindEvents(); } catch(e){}
      try { this.loadInitialData(); } catch(e){}
      try { this.detectGeolocation(); } catch(e){}
    },

    bindEvents() {
      window.toggleHD = () => this.toggleHD();
      window.toggleTheme = () => this.toggleTheme();
      window.filterByGenre = (genre) => this.filterByGenre(genre);
      window.playRandomStation = () => this.playRandomStation();
      window.toggleAudio = () => this.toggleAudio();
      window.toggleFavorite = () => this.toggleFavorite();
      window.locateOrigin = () => this.locateOrigin();
      window.handleSearchKey = (e) => this.handleSearchKey(e);
      window.toggleFavPanelMobile = () => this.toggleFavPanelMobile();
      window.setVolume = (val) => AudioEngine.setVolume(val);
      window.toggleMute = () => AudioEngine.toggleMute();

      document.addEventListener("click", (e) => {
        const container = document.querySelector(".search-container");
        const favPanel = document.querySelector(".fav-panel");
        const favToggleBtn = document.getElementById("favToggleBtn");

        if (container && !container.contains(e.target)) {
          UI.clearSearchResults();
        }

        if (favPanel && favToggleBtn && !favPanel.contains(e.target) && !favToggleBtn.contains(e.target)) {
          favPanel.classList.remove("show");
        }
      });
    },

    toggleFavPanelMobile() {
      const favPanel = document.querySelector(".fav-panel");
      if (favPanel) {
        favPanel.classList.toggle("show");
      }
    },

    async loadInitialData() {
      try {
        const popular = await RadioAPI.fetchPopular();
        this.mergeStations([...CUSTOM_STATIONS.map(Utils.normalizeStation), ...popular]);

        const localStations = await RadioAPI.searchByName("bariloche");
        this.mergeStations(localStations);

        const barilocheMatch = localStations.find(Utils.hasCoordinates);
        if (barilocheMatch) {
          this.flyAndTune(barilocheMatch, true);
        } else {
          this.tuneNearestToCenter();
        }
      } catch (e) {
        UI.setStatus("⚠️ ERROR AL CARGAR ESTACIONES");
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
      if (!station) return false;
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

    flyAndTune(station, isInitial = false) {
      if (!station) return;

      if (state.flyTimer) clearTimeout(state.flyTimer);
      AudioEngine.stopStream();

      if (!isInitial) {
        AudioEngine.playStaticNoise();
      }

      const normalized = Utils.normalizeStation(station);
      if (!normalized) return;

      state.currentStation = normalized;
      UI.updateCard(normalized, state.userOrigin);
      UI.setStatus("● BUSCANDO SEÑAL...");
      ClockModule.updateClocks();

      if (!Utils.hasCoordinates(normalized)) {
        this.tuneStation(normalized);
        return;
      }

      GlobeManager.flyTo(normalized.lat, normalized.lng, 0.8, CONFIG.ANIMATION_SPEED_MS);

      state.flyTimer = setTimeout(() => {
        this.tuneStation(normalized);
      }, CONFIG.ANIMATION_SPEED_MS + 50);
    },

    tuneNearestToLocation(lat, lng) {
      let pool = state.stations.filter(s => Utils.hasCoordinates(s) && this.isMatchFilters(s));
      if (!pool.length) {
        pool = state.stations.filter(Utils.hasCoordinates);
      }
      if (!pool.length) return;

      let nearest = null;
      let minDistance = Infinity;

      for (const s of pool) {
        const d = Utils.getKilometers(lat, lng, s.lat, s.lng);
        if (d < minDistance) {
          minDistance = d;
          nearest = s;
        }
      }

      if (nearest) {
        this.flyAndTune(nearest);
      }
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

    toggleTheme() {
      const current = localStorage.getItem(CONFIG.THEME_KEY) || "night";
      const next = current === "day" ? "night" : "day";
      localStorage.setItem(CONFIG.THEME_KEY, next);
      GlobeManager.setTheme(next);
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
      const pov = GlobeManager.getCenterCoordinates();
      this.tuneNearestToLocation(pov.lat, pov.lng);
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
