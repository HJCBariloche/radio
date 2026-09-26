/* ============================================================
   RADIO S.C. BARILOCHE - GLOBAL RADIO EXPLORER (Engine)
   ============================================================ */

(() => {
  "use strict";

  const API_SERVERS = [
    "https://de1.api.radio-browser.info",
    "https://all.api.radio-browser.info"
  ];

  const BARILOCHE = {
    lat: -41.1335,
    lng: -71.3103,
    label: "Bariloche"
  };

  const INITIAL_LIMIT = 8000;
  const SEARCH_LIMIT = 100;

  let stations = [];
  let currentStation = null;
  let selectedGenre = "all";
  let userOrigin = { ...BARILOCHE };

  let searchTimer = null;
  let flyTimer = null;
  let lastPointClickTime = 0; // Control de coincidencia para clics en puntos

  let audio = new Audio();
  let favorites = loadFavorites();

  // Emisoras especiales garantizadas
  const CUSTOM_STATIONS = [
    {
      name: "La Radio de los Lentos",
      country: "Argentina",
      state: "Buenos Aires",
      tags: "lentos baladas romantic love 80s 90s pop",
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

  function loadFavorites() {
    try {
      const raw = localStorage.getItem("myRadioFavorites");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(Boolean).map(normalizeStation).filter(station => station && station.url);
    } catch (error) {
      console.warn("No se pudieron cargar los favoritos:", error);
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem("myRadioFavorites", JSON.stringify(favorites));
    } catch (error) {
      console.warn("No se pudieron guardar los favoritos:", error);
    }
  }

  function $(id) { return document.getElementById(id); }
  function cleanText(value) { return String(value ?? "").trim(); }

  function hasCoordinates(station) {
    return station && Number.isFinite(station.lat) && Number.isFinite(station.lng) &&
           Math.abs(station.lat) <= 90 && Math.abs(station.lng) <= 180 &&
           !(Math.abs(station.lat) < 0.1 && Math.abs(station.lng) < 0.1);
  }

  function normalizeStation(raw) {
    if (!raw) return null;
    const lat = Number.parseFloat(raw.geo_lat ?? raw.lat);
    const lng = Number.parseFloat(raw.geo_long ?? raw.lng);
    const primaryUrl = cleanText(raw.url_resolved || raw.url);

    return {
      stationuuid: cleanText(raw.stationuuid ?? raw.uuid),
      name: cleanText(raw.name) || "Radio sin nombre",
      country: cleanText(raw.country),
      state: cleanText(raw.state),
      tags: cleanText(raw.tags).toLowerCase(),
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      url: primaryUrl,
      urlResolved: primaryUrl,
      sources: Array.isArray(raw.sources) && raw.sources.length ? raw.sources : [primaryUrl]
    };
  }

  function stationKey(station) {
    if (!station) return "";
    return station.stationuuid ? `uuid:${station.stationuuid}` : `url:${station.urlResolved || station.url}`;
  }

  function mergeStations(existing, incoming) {
    const map = new Map();
    for (const s of existing || []) { if (s && stationKey(s)) map.set(stationKey(s), s); }
    for (const s of incoming || []) { if (s && stationKey(s)) map.set(stationKey(s), s); }
    return Array.from(map.values());
  }

  function getKilometers(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
  }

  function isMatchGenre(station) {
    if (selectedGenre === "all") return true;
    const tags = station.tags || "";
    const name = (station.name || "").toLowerCase();
    return tags.includes(selectedGenre) || name.includes(selectedGenre);
  }

  const world = Globe()(document.getElementById("globe"))
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg")
    .pointColor(station => isMatchGenre(station) ? "#ffaa00" : "rgba(255,170,0,0.12)")
    .pointAltitude(station => isMatchGenre(station) ? 0.003 : 0.001)
    .pointRadius(station => isMatchGenre(station) ? 0.07 : 0.02)
    .pointResolution(6)
    .polygonCapColor(() => "rgba(0,0,0,0)")
    .polygonSideColor(() => "rgba(0,0,0,0)")
    .polygonStrokeColor(() => "rgba(255,170,0,0.25)")
    .arcColor(() => ["#ffaa00", "rgba(255,170,0,0.1)"])
    .arcAltitude(0.28)
    .arcDashLength(0.4)
    .arcDashGap(0.2)
    .arcDashAnimateTime(1200)
    .arcStroke(1.2)
    .onPointClick(station => {
      lastPointClickTime = Date.now(); // Marca tiempo de clic directo en punto
      flyAndTune(station);
    });

  world.pointOfView({ lat: BARILOCHE.lat, lng: BARILOCHE.lng, altitude: 0.9 }, 0);

  fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
    .then(res => res.json())
    .then(data => { if (data && Array.isArray(data.features)) world.polygonsData(data.features); })
    .catch(() => {});

  async function apiFetch(path) {
    for (const server of API_SERVERS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(server + path, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) return await res.json();
      } catch (e) {}
    }
    return [];
  }

  async function searchStations(query) {
    const q = cleanText(query);
    if (!q) return [];
    const encoded = encodeURIComponent(q);
    const raw = await apiFetch(`/json/stations/byname/${encoded}?hidebroken=true&limit=${SEARCH_LIMIT}`);
    return raw.map(normalizeStation).filter(s => s && s.url);
  }

  function addStations(newStations) {
    stations = mergeStations(stations, newStations);
    world.pointsData(stations.filter(hasCoordinates));
    updatePointStyles();
  }

  function updatePointStyles() {
    world.pointColor(s => isMatchGenre(s) ? "#ffaa00" : "rgba(255,170,0,0.12)")
         .pointAltitude(s => isMatchGenre(s) ? 0.003 : 0.001)
         .pointRadius(s => isMatchGenre(s) ? 0.07 : 0.02);
  }

  function clearSearchDropdown() {
    const dropdown = $("searchResults");
    if (dropdown) { dropdown.innerHTML = ""; dropdown.style.display = "none"; }
  }

  function showSearchDropdown(results) {
    const dropdown = $("searchResults");
    if (!dropdown) return;
    dropdown.innerHTML = "";
    const visible = results.slice(0, 8);
    if (!visible.length) { dropdown.style.display = "none"; return; }

    for (const station of visible) {
      const item = document.createElement("div");
      item.className = "results-item";
      item.textContent = `📻 ${station.name}${station.country ? ` — ${station.country}` : ""}`;
      item.addEventListener("click", () => {
        clearSearchDropdown();
        if ($("searchInput")) $("searchInput").value = station.name;
        flyAndTune(station);
      });
      dropdown.appendChild(item);
    }
    dropdown.style.display = "block";
  }

  window.handleSearchKey = function(event) {
    const q = cleanText(event.target.value);
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(searchTimer);
      searchStations(q).then(results => {
        addStations(results);
        const match = results.find(hasCoordinates) || results[0];
        if (match) flyAndTune(match);
      });
      clearSearchDropdown();
      return;
    }
    clearTimeout(searchTimer);
    if (q.length >= 3) {
      searchTimer = setTimeout(async () => {
        const results = await searchStations(q);
        addStations(results);
        showSearchDropdown(results);
      }, 300);
    } else {
      clearSearchDropdown();
    }
  };

  function tuneStation(station) {
    if (!station) return;
    const normalized = normalizeStation(station);
    if (!normalized || !normalized.url) return;
    currentStation = normalized;

    updateStationCard();

    if (hasCoordinates(normalized)) {
      world.arcsData([{ startLat: userOrigin.lat, startLng: userOrigin.lng, endLat: normalized.lat, endLng: normalized.lng }]);
    } else {
      world.arcsData([]);
    }

    if ($("statusText")) $("statusText").textContent = "● CONECTANDO...";

    const sources = normalized.sources && normalized.sources.length ? normalized.sources : [normalized.url];
    let sourceIdx = 0;

    const trySource = () => {
      if (sourceIdx >= sources.length) {
        setPlayingState(false);
        if ($("statusText")) $("statusText").textContent = "⚠️ ERROR DE EMISIÓN";
        return;
      }
      try { audio.pause(); } catch(e){}
      audio.src = sources[sourceIdx];
      
      audio.play().then(() => {
        setPlayingState(true);
        if ($("statusText")) $("statusText").textContent = "● SINTONIZANDO";
      }).catch(() => {
        sourceIdx++;
        trySource();
      });
    };

    trySource();
    updateFavoritesUI();
  }

  function updateStationCard() {
    if (!currentStation) return;
    if ($("name")) $("name").textContent = currentStation.name;
    if ($("country")) $("country").textContent = `📍 ${currentStation.country || "Ubicación desconocida"}`;
    if ($("distance")) {
      if (hasCoordinates(currentStation)) {
        const dist = getKilometers(userOrigin.lat, userOrigin.lng, currentStation.lat, currentStation.lng);
        $("distance").textContent = `📐 A ${dist.toLocaleString("es-AR")} km de ${userOrigin.label}`;
      } else {
        $("distance").textContent = "📍 Ubicación no disponible";
      }
    }
  }

  function flyAndTune(station) {
    if (!station) return;
    if (flyTimer) clearTimeout(flyTimer);
    if (!hasCoordinates(station)) { tuneStation(station); return; }

    world.pointOfView({ lat: station.lat, lng: station.lng, altitude: 0.8 }, 1200);
    flyTimer = setTimeout(() => tuneStation(station), 1250);
  }

  window.playRandomStation = function() {
    const active = stations.filter(s => s.url && isMatchGenre(s));
    if (active.length) flyAndTune(active[Math.floor(Math.random() * active.length)]);
  };

  window.filterByGenre = function(genre) {
    selectedGenre = cleanText(genre) || "all";
    updatePointStyles();
  };

  function setPlayingState(isPlaying) {
    if ($("playBtn")) $("playBtn").textContent = isPlaying ? "⏸ Pausa" : "▶ Reprod.";
    if ($("eqBars")) $("eqBars").style.display = isPlaying ? "flex" : "none";
  }

  window.toggleAudio = function() {
    if (!currentStation) return;
    if (audio.paused) {
      audio.play().then(() => setPlayingState(true)).catch(() => setPlayingState(false));
    } else {
      audio.pause();
      setPlayingState(false);
    }
  };

  window.toggleFavorite = function() {
    if (!currentStation) return;
    const key = stationKey(currentStation);
    const idx = favorites.findIndex(f => stationKey(f) === key);
    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.push(currentStation);
    saveFavorites();
    updateFavoritesUI();
  };

  function updateFavoritesUI() {
    const favBtn = $("favBtn");
    const favList = $("favList");
    if (!favBtn || !favList) return;

    if (currentStation) {
      const isFav = favorites.some(f => stationKey(f) === stationKey(currentStation));
      favBtn.classList.toggle("active", isFav);
      favBtn.textContent = isFav ? "♥ Guardado" : "♡ Guardar";
    }

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
      name.addEventListener("click", () => flyAndTune(fav));

      const remove = document.createElement("button");
      remove.textContent = "×";
      remove.style.cssText = "background:transparent; border:0; color:#888; cursor:pointer; font-size:16px;";
      remove.addEventListener("click", (e) => {
        e.stopPropagation();
        favorites = favorites.filter(f => stationKey(f) !== stationKey(fav));
        saveFavorites();
        updateFavoritesUI();
      });

      div.appendChild(name);
      div.appendChild(remove);
      favList.appendChild(div);
    });
  }

  function tuneNearestToCenter() {
    const active = stations.filter(s => hasCoordinates(s) && isMatchGenre(s));
    if (!active.length) return;
    const pov = world.pointOfView();
    let nearest = null, minD = Infinity;

    for (const s of active) {
      const d = getKilometers(pov.lat, pov.lng, s.lat, s.lng);
      if (d < minD) { minD = d; nearest = s; }
    }
    if (nearest) tuneStation(nearest);
  }

  window.locateOrigin = function() {
    world.pointOfView({ lat: userOrigin.lat, lng: userOrigin.lng, altitude: 0.9 }, 1200);
    setTimeout(tuneNearestToCenter, 1300);
  };

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      userOrigin = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "tu ubicación" };
      if (currentStation) updateStationCard();
    });
  }

  // Doble clic global en el mapa (ignora si fue sobre un punto específico)
  const globeElement = $("globe");
  if (globeElement) {
    globeElement.addEventListener("dblclick", () => {
      if (Date.now() - lastPointClickTime < 600) return; // Evita conflicto con el clic del punto
      setTimeout(tuneNearestToCenter, 50);
    });
  }

  async function loadInitialStations() {
    const popular = await apiFetch(`/json/stations/search?has_geo_info=true&order=votes&reverse=true&limit=${INITIAL_LIMIT}&hidebroken=true`);
    const normalized = popular.map(normalizeStation).filter(s => s && s.url && hasCoordinates(s));
    addStations([...CUSTOM_STATIONS.map(normalizeStation), ...normalized]);
    
    const bariloche = await searchStations("bariloche");
    addStations(bariloche);

    const local = bariloche.find(hasCoordinates);
    if (local) flyAndTune(local);
    else tuneNearestToCenter();

    updateFavoritesUI();
  }

  document.addEventListener("click", e => {
    const container = document.querySelector(".search-container");
    if (container && !container.contains(e.target)) clearSearchDropdown();
  });

  loadInitialStations();
})();
