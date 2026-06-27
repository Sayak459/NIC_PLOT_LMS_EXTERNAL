import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { MapService } from 'src/app/services/map.service';
import { Router } from '@angular/router';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  selectedFloor: 'ALL' | 'GROUND' | 'FIRST' = 'ALL';

  // store layers by floor
  private floorLayers: {
    ALL: L.Layer[];
    GROUND: L.Layer[];
    FIRST: L.Layer[];
  } = {
    ALL: [],
    GROUND: [],
    FIRST: [],
  };

  private currentBaseLayer!: L.TileLayer;

  streetLayer!: L.TileLayer;
  satelliteLayer!: L.TileLayer;
  terrainLayer!: L.TileLayer;

  selectedMapType = 'street';

  private map!: L.Map;
  private allLayers: L.FeatureGroup = L.featureGroup();
  private totalFiles = 71;
  private filesLoaded = 0;

  private userLocationMarker: L.CircleMarker | null = null;

  // 🔍 SEARCH FEATURE — ADDED
  // Search indexes
  private blockLayerIndex: any = {};
  private shedLayerIndex: any = {};
  private polygonLayerIndex: any = {};
  private blockDataSearchIndex: any[] = [];
  private shedDataSearchIndex: any[] = [];

  // Store block layers for quick search
  totalSheds: any | undefined;
  totalBlocks: number | undefined;
  occupiedBlocks: number | undefined;
  holdBlocks: number | undefined;
  vacantBlocks: number | undefined;

  // 🔍 AUTOCOMPLETE SUGGESTIONS
  searchText = '';
  suggestions: string[] = [];
  showSuggestions = false;

  constructor(
    private http: HttpClient,
    private mapService: MapService,
    private router: Router,
  ) {}

  onFloorChange(floor: 'ALL' | 'GROUND' | 'FIRST') {
    this.selectedFloor = floor;

    // remove all layers first
    this.allLayers.clearLayers();

    // add only selected floor layers
    this.floorLayers[floor].forEach((layer) => {
      this.allLayers.addLayer(layer);
    });

    this.allLayers.addTo(this.map);
  }

  get isDashboardView() {
    return this.router.url.includes('/dashboard');
  }

  ngOnInit(): void {
    history.pushState(null, '', location.href);
    window.onpopstate = () => history.pushState(null, '', location.href);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  changeMapLayer(type: string) {
    this.selectedMapType = type;

    if (this.currentBaseLayer) {
      this.map.removeLayer(this.currentBaseLayer);
    }

    if (type === 'street') {
      this.currentBaseLayer = this.streetLayer;
    } else if (type === 'satellite') {
      this.currentBaseLayer = this.satelliteLayer;
    } else {
      this.currentBaseLayer = this.terrainLayer;
    }

    this.currentBaseLayer.addTo(this.map);
  }

  downloadMap(): void {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // 🔴 REMOVE ALL TILE LAYERS
    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        this.map.removeLayer(layer);
      }
    });

    // 🟢 ADD OSM TILE (CORS SAFE)
    const osm = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { crossOrigin: 'anonymous' },
    ).addTo(this.map);

    // 🧼 HIDE CONTROLS
    const hideEls = document.querySelectorAll(
      '.leaflet-control, .map-search-box, .map-download-btn',
    );
    hideEls.forEach((el) => ((el as HTMLElement).style.display = 'none'));

    // 🔥 DISABLE GPU TRANSFORMS (MOST IMPORTANT)
    const tiles = document.querySelectorAll('.leaflet-tile');
    tiles.forEach((t: any) => (t.style.transform = 'none'));

    // 🧠 FORCE MAP REPAINT
    this.map.invalidateSize(true);

    setTimeout(() => {
      html2canvas(mapElement, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
        removeContainer: true,
      }).then((canvas) => {
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `plot-map-${Date.now()}.png`;
        link.click();

        // 🔁 RESTORE UI
        hideEls.forEach((el) => ((el as HTMLElement).style.display = ''));
      });
    });
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // fallback

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }

  /** -------------------------------------------------------
   * INIT MAP
   * --------------------------------------------------------*/
  private initMap(): void {
    this.map = L.map('map', {
      center: [22.5362, 88.3118],
      zoom: 15,
    });

    /* =========================================
   BASE MAP LAYERS
========================================= */

    this.streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      },
    );

    this.satelliteLayer = L.tileLayer(
      'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        attribution: '&copy; Google Satellite',
      },
    );

    this.terrainLayer = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution: '© OpenTopoMap',
      },
    );

    /* DEFAULT LAYER */
    this.currentBaseLayer = this.streetLayer;
    this.currentBaseLayer.addTo(this.map);

    /** -----------------------------------------
     * BASE MAP LAYERS
     * -----------------------------------------*/

    // const osm = L.tileLayer(
    //   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    //   {
    //     maxZoom: 19,
    //     attribution: '&copy; OpenStreetMap contributors',
    //   },
    // );

    // const satellite = L.tileLayer(
    //   'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    //   {
    //     maxZoom: 20,
    //     attribution: '&copy; Google Satellite',
    //   },
    // );

    // const terrain = L.tileLayer(
    //   'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    //   {
    //     maxZoom: 17,
    //     attribution: '© OpenTopoMap',
    //   },
    // );

    // osm.addTo(this.map);

    // /** -----------------------------------------
    //  * LAYER SWITCHER CONTROL
    //  * -----------------------------------------*/
    // L.control
    //   .layers(
    //     {
    //       '<span class="layer-icon">🗺️</span> Street Map': osm,
    //       '<span class="layer-icon">🛰️</span> Satellite View': satellite,
    //       '<span class="layer-icon">🏔️</span> Terrain': terrain,
    //     },
    //     {},
    //     { collapsed: false },
    //   )
    //   .addTo(this.map);

    /** DISCLAIMER + LEGEND */
    // this.addDisclaimer();
    // this.addLegend();

    /** -----------------------------------------
     * FETCH OCCUPANCY + SHED DATA
     * -----------------------------------------*/
    this.mapService.getOccupancyDetails().subscribe((response) => {
      const shedDetails = response?.data?.shedDetails || [];

      // --------------------- Compute shed/block stats ---------------------
      let totalBlocks = 0;
      let occupiedBlocks = 0;
      let holdBlocks = 0;
      let vacantBlocks = 0;

      shedDetails.forEach((shed: any) => {
        if (shed.blocks) {
          totalBlocks += shed.blocks.length;

          shed.blocks.forEach((block: any) => {
            if (block.occupiedFlag === 'Y') occupiedBlocks++;
            else if (block.occupiedFlag === 'H') holdBlocks++;
            else if (block.occupiedFlag === 'N') vacantBlocks++;
          });
        }
      });

      const totalSheds = shedDetails.length;

      // --------------------- Store / display in component -----------------
      this.totalSheds = totalSheds;
      this.totalBlocks = totalBlocks;
      this.occupiedBlocks = occupiedBlocks;
      this.holdBlocks = holdBlocks;
      this.vacantBlocks = vacantBlocks;

      console.log('Total Sheds:', totalSheds);
      console.log('Total Blocks:', totalBlocks);
      console.log('Occupied Blocks:', occupiedBlocks);
      console.log('Hold Blocks:', holdBlocks);
      console.log('Vacant Blocks:', vacantBlocks);
      // --------------------- Prepare map data -----------------------------
      const shedMap: any = {};
      shedDetails.forEach((shed: any) => (shedMap[shed.shedCd] = shed));
      this.shedDataSearchIndex = shedDetails;

      const blocks: any[] = [];
      shedDetails.forEach((shed: any) => {
        if (shed.blocks) shed.blocks.forEach((b: any) => blocks.push(b));
      });

      this.blockDataSearchIndex = blocks;

      const occupancyData = this.prepareOccupancyMap(blocks);
      this.loadGeoJsonFiles(occupancyData, shedMap);
    });

    //lat long of plot
    /** -----------------------------------------
     * LIVE LAT / LNG DISPLAY (BOTTOM LEFT)
     * -----------------------------------------*/
    const coordControl = (L.control as any)({ position: 'bottomleft' });

    coordControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'live-coordinates');
      div.innerHTML = `⏫: -- , ⏩: --`;
      return div;
    };

    coordControl.addTo(this.map);

    this.map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);

      const el = document.querySelector('.live-coordinates');
      if (el) el.innerHTML = `⏫: ${lat} , ⏩: ${lng}`;
    });

    //live loc
    /** -----------------------------------------
     * CURRENT LOCATION BUTTON
     * -----------------------------------------*/
    // const locateControl = (L.control as any)({ position: 'topleft' });

    // locateControl.onAdd = () => {
    //   const btn = L.DomUtil.create('button', 'locate-btn');
    //   btn.innerHTML = '📍 My Location';

    //   btn.onclick = () => {
    //     this.map.locate({
    //       setView: true,
    //       maxZoom: 18,

    //       enableHighAccuracy: true, // ⭐ forces GPS
    //       timeout: 15000, // ⭐ wait longer for real fix
    //       maximumAge: 0, // ⭐ NO cached position
    //       watch: false, // ⭐ single accurate read
    //     });
    //   };

    //   return btn;
    // };

    // locateControl.addTo(this.map);

    /** When location found */
    // this.map.on('locationfound', (e: any) => {
    //   console.log('Accuracy (meters):', e.accuracy);

    //   if (this.userLocationMarker) {
    //     this.userLocationMarker.setLatLng(e.latlng);
    //   } else {
    //     this.userLocationMarker = L.circleMarker(e.latlng, {
    //       radius: 8,
    //       color: 'blue',
    //       fillColor: 'blue',
    //       fillOpacity: 0.7,
    //     }).addTo(this.map);

    //     this.userLocationMarker.bindPopup('You are here');
    //   }

    //   // ⭐ Google-maps style accuracy ring
    //   L.circle(e.latlng, {
    //     radius: e.accuracy,
    //     color: 'blue',
    //     weight: 1,
    //     fillOpacity: 0.1,
    //   }).addTo(this.map);
    // });

    // /** When location fails */
    // this.map.on('locationerror', () => {
    //   alert('Unable to retrieve your location');
    // });
  }

  /** -------------------------------------------------------
   * CREATE BLOCK ↦ DATA MAP
   * --------------------------------------------------------*/
  private prepareOccupancyMap(dataArray: any[]): { [key: string]: any } {
    const map: any = {};
    dataArray.forEach((entry) => {
      const key = String(entry.blockCd).trim();
      map[key] = entry;
    });
    return map;
  }

  /** -------------------------------------------------------
   * LOAD GEOJSON FILES
   * --------------------------------------------------------*/
  private loadGeoJsonFiles(occupancyData: any, shedMap: any): void {
    const safe = (val: any) =>
      val === null || val === undefined || val === 'null' || val === ''
        ? 'N/A'
        : val;

    const occupText = (flag: string) => {
      if (flag === 'Y') return 'Occupied';
      if (flag === 'N') return 'Vacant';
      if (flag === 'H') return 'Hold';
      return safe(flag);
    };

    for (let i = 1; i <= this.totalFiles; i++) {
      const url = `assets/geojson/POLYGON_${i}.geojson`;

      this.http.get(url).subscribe((geojson: any) => {
        const layer = L.geoJSON(geojson, {
          /** STYLE BLOCKS */

          style: (feature) => {
            const id = String(feature?.properties?.ID).trim();
            const block = occupancyData[id];

            let fillColor = 'transparent';

            if (block) {
              if (block.occupiedFlag === 'Y')
                fillColor = 'rgb(253, 152, 0)'; // soft gerua
              else if (block.occupiedFlag === 'N')
                fillColor = 'rgba(0, 128, 0, 0.9)'; // soft green
              else if (block.occupiedFlag === 'H')
                fillColor = 'rgba(135, 207, 235, 0.9)'; // soft skyblue
            }

            return {
              color: 'blue',
              weight: 2,
              fill: !!block,
              fillColor,
              fillOpacity: 0.4, // transparent
            };
          },

          /** POPUP + TOOLTIP */

          /** POPUP + TOOLTIP */
          onEachFeature: (feature, layer: any) => {
            const id = String(feature?.properties?.ID).trim();
            const block = occupancyData[id];
            const shed = block ? shedMap[block.shedCd] : null;
            const polygonId = feature?.properties?.ID?.toString().trim();
            this.polygonLayerIndex[polygonId] = layer;

            this.blockLayerIndex[id] = layer; // ⭐ STORE LAYER FOR SEARCH

            /** ------------------- ADD LABEL INSIDE POLYGON ------------------- */
            if (block && feature.geometry.type === 'Polygon') {
              const coords = (feature.geometry as GeoJSON.Polygon)
                .coordinates[0]; // outer ring
              const latlngs = coords.map((coord) =>
                L.latLng(coord[1], coord[0]),
              );

              let sumLat = 0,
                sumLng = 0;
              latlngs.forEach((pt) => {
                sumLat += pt.lat;
                sumLng += pt.lng;
              });

              const centroid = L.latLng(
                sumLat / latlngs.length,
                sumLng / latlngs.length,
              );

              // L.marker(centroid, {
              //   icon: L.divIcon({
              //     className: 'block-label',
              //     html: block.blockCd, // Your block code in one line
              //     iconSize: undefined, // keeps div size automatic
              //   }),
              //   interactive: false, // does not block clicks
              // }).addTo(this.map);

              const labelMarker = L.marker(centroid, {
                icon: L.divIcon({
                  className: 'block-label',
                  html: block.blockCd,
                  iconSize: undefined,
                }),
                interactive: false,
              });

              /* 🔥 ADD LABEL TO SAME FLOOR BUCKET */
              const floorRaw = feature?.properties?.floor || '';
              const floor = String(floorRaw).toUpperCase();

              // always in ALL
              this.floorLayers.ALL.push(labelMarker);

              if (floor === 'GROUND') {
                this.floorLayers.GROUND.push(labelMarker);
              } else {
                this.floorLayers.FIRST.push(labelMarker);
              }
              this.allLayers.addLayer(labelMarker);
            }

            /** ------------------- POPUP ------------------- */
            //         const popup = block
            //           ? `
            //   <b>Block Details</b><br>
            //   <b>Location:</b> ${safe(block.lms_loc)}<br>
            //   <b>Shed Code:</b> ${safe(shed?.shedCd)}<br>
            //   <b>Block Code:</b> ${safe(block.blockCd)}<br>
            //   <b>Block Area:</b> ${safe(block.blockArea)}<br>
            //   <b>Status:</b> ${occupText(block.occupiedFlag)}<br>
            //   <br>
            //   <b>Application No:</b> ${safe(block.appNo)}<br>
            //   <b>SAN No:</b> ${safe(block.san)}<br>
            //   <b>From Date:</b> ${this.formatDate(block.fromDt)}<br>
            //   <b>Upto Date:</b> ${this.formatDate(block.toDt)}<br>
            //   <b>Occupied By:</b> ${safe(block.partyName)}<br>

            // `
            //           : `<b>ID:</b> ${safe(id)}<br><i>No data found</i>`;

            /** ------------------- POPUP ------------------- */
            const occupancyDetails =
              block && block.occupiedFlag === 'Y'
                ? `
      <hr style="
        border: 0;
        border-top: 2px solid #000000;
        margin: 10px 0;
      ">

      <b>Application No:</b> ${safe(block.appNo)}<br>
      <b>SAN No:</b> ${safe(block.san)}<br>
      <b>From Date:</b> ${this.formatDate(block.fromDt)}<br>
      <b>Upto Date:</b> ${this.formatDate(block.toDt)}<br>
      <b>Occupied By:</b> ${safe(block.partyName)}<br>
    `
                : '';

            const popup = block
              ? `
      <b>Block Details</b><br>
      <b>Location:</b> ${safe(block.lms_loc)}<br>
      <b>Shed Code:</b> ${safe(shed?.shedCd)}<br>
      <b>Block Code:</b> ${safe(block.blockCd)}<br>
      <b>Block Area:</b> ${safe(block.blockArea)} SqM <br>
      <b>Status:</b> ${occupText(block.occupiedFlag)}<br>

      ${occupancyDetails}
    `
              : `<b>ID:</b> ${safe(id)}<br><i>No data found</i>`;

            // popup class based on status
            let popupClass = 'popup-default';

            if (block) {
              if (block.occupiedFlag === 'Y') {
                popupClass = 'popup-occupied';
              } else if (block.occupiedFlag === 'N') {
                popupClass = 'popup-vacant';
              } else if (block.occupiedFlag === 'H') {
                popupClass = 'popup-hold';
              }
            }

            layer.bindPopup(popup, {
              className: popupClass,
            });

            /** ------------------- TOOLTIP ------------------- */
            const tooltip = block
              ? `
      <b>Shed Details</b><br>
      <b>Shed Code:</b> ${safe(shed?.shedCd)}<br>
      <b>Shed Name:</b> ${safe(shed?.shedYardName)}<br>
      <b>Total Area:</b> ${safe(shed?.totalArea)} SqM <br>
      <b>Actual Area:</b> ${safe(shed?.actualArea)} SqM <br>
      <b>Occupied Area:</b> ${safe(shed?.occupiedArea)}  SqM <br>
      <b>Vacant Area:</b> ${safe(shed?.vacantArea)} SqM <br>
      <b>Hold Area:</b> ${safe(shed?.holdArea)}<br>
    `
              : `<b>${safe(id)}</b><br><i>No data</i>`;

            layer.on('mouseover', () =>
              layer
                .bindTooltip(tooltip, {
                  direction: 'top',
                  sticky: true,
                  offset: [0, -10],
                  opacity: 0.9,
                })
                .openTooltip(),
            );

            layer.on('mouseout', () => layer.closeTooltip());
            layer.on('click', () => {
              const group = L.featureGroup([layer]);
              this.map.fitBounds(group.getBounds(), { maxZoom: 18 });
            });
          },
        });

        // 🔥 FLOOR HANDLING (ADDED)
        layer.eachLayer((l: any) => {
          const floorRaw = l.feature?.properties?.floor || '';

          const floor = String(floorRaw).toUpperCase();

          // store in ALL
          this.floorLayers.ALL.push(l);

          if (floor === 'GROUND') {
            this.floorLayers.GROUND.push(l);
          } else {
            this.floorLayers.FIRST.push(l); // everything else as FIRST
          }
        });

        this.allLayers.addLayer(layer);
        this.allLayers.addTo(this.map);

        /** AUTO-FIT WHEN ALL FILES LOADED */
        this.filesLoaded++;
        if (this.filesLoaded === this.totalFiles) {
          const bounds = this.allLayers.getBounds();
          if (bounds.isValid()) this.map.fitBounds(bounds);
        }
      });
    }
  }

  /** -------------------------------------------------------
   * DISCLAIMER
   * --------------------------------------------------------*/
  // private addDisclaimer(): void {
  //   const disclaimer = (L.control as any)({ position: 'bottomleft' });

  //   disclaimer.onAdd = () => {
  //     const div = L.DomUtil.create('div');
  //     div.innerHTML = `
  //       <div class="gis-disclaimer">
  //         <span class="gis-disclaimer-title">⚠️ Disclaimer:</span>
  //         <span class="gis-disclaimer-text">
  //           Spatial & occupancy data are indicative only.<br>
  //           Not valid for legal or survey use.
  //         </span>
  //       </div>
  //     `;
  //     return div;
  //   };

  //   disclaimer.addTo(this.map);
  // }

  // /** -------------------------------------------------------
  //  * LEGEND
  //  * --------------------------------------------------------*/
  // private addLegend(): void {
  //   const legend = (L.control as any)({ position: 'bottomright' });

  //   legend.onAdd = () => {
  //     const div = L.DomUtil.create('div', 'info legend');
  //     div.innerHTML = `
  //       <div class="legend-item"><span class="legend-box legend-occupied"></span> Occupied</div>
  //       <div class="legend-item"><span class="legend-box legend-vacant"></span> Vacant</div>
  //       <div class="legend-item"><span class="legend-box legend-hold"></span> Hold</div>
  //     `;
  //     return div;
  //   };

  //   legend.addTo(this.map);
  // }

  private highlightLayer: any = null;

  searchBlock(query: string) {
    query = query.trim().toUpperCase();

    /** CLEAR HIGHLIGHT IF EMPTY */
    if (!query) {
      if (this.highlightLayer) {
        this.map.removeLayer(this.highlightLayer);
        this.highlightLayer = null;
      }
      return;
    }

    /** CLEAR OLD HIGHLIGHT */
    if (this.highlightLayer) {
      this.map.removeLayer(this.highlightLayer);
      this.highlightLayer = null;
    }

    const matchedLayers: any[] = [];

    // 1) PARTIAL MATCH BLOCK CODE → layer
    Object.keys(this.blockLayerIndex).forEach((id) => {
      if (id.includes(query)) {
        matchedLayers.push(this.blockLayerIndex[id]);
      }
    });

    // 2) PARTIAL SEARCH IN BLOCK DATA
    this.blockDataSearchIndex.forEach((block) => {
      const hit = Object.values(block).some((v) =>
        String(v).toUpperCase().includes(query),
      );

      if (hit && this.blockLayerIndex[block.blockCd]) {
        matchedLayers.push(this.blockLayerIndex[block.blockCd]);
      }
    });

    // 3) PARTIAL SEARCH IN SHED DATA
    this.shedDataSearchIndex.forEach((shed) => {
      const hit = Object.values(shed).some((v) =>
        String(v).toUpperCase().includes(query),
      );

      if (hit && shed.blocks) {
        shed.blocks.forEach((b: any) => {
          if (this.blockLayerIndex[b.blockCd])
            matchedLayers.push(this.blockLayerIndex[b.blockCd]);
        });
      }
    });

    /** DEDUPLICATE LAYERS */
    const uniqueLayers = Array.from(new Set(matchedLayers));

    // NOTHING FOUND
    if (uniqueLayers.length === 0) {
      console.log('No match found');
      return;
    }

    // SINGLE MATCH
    if (uniqueLayers.length === 1) {
      this.highlightFeature(uniqueLayers[0]);
      return;
    }

    // MULTIPLE MATCH → highlight all
    this.highlightMultiple(uniqueLayers);
  }

  updateSuggestions(value: string) {
    this.searchText = value;
    const query = value.trim().toUpperCase();

    if (!query) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    const result = new Set<string>();

    /** BLOCK DATA */
    this.blockDataSearchIndex.forEach((block) => {
      if (String(block.blockCd).toUpperCase().includes(query))
        result.add(block.blockCd);

      if (String(block.appNo).toUpperCase().includes(query))
        result.add(block.appNo);
    });

    /** SHED DATA */
    this.shedDataSearchIndex.forEach((shed) => {
      if (String(shed.shedCd).toUpperCase().includes(query))
        result.add(shed.shedCd);

      if (String(shed.shedYardName).toUpperCase().includes(query))
        result.add(shed.shedYardName);
    });

    this.suggestions = Array.from(result).slice(0, 8); // limit
    this.showSuggestions = this.suggestions.length > 0;
  }

  selectSuggestion(value: string) {
    this.searchText = value;
    this.showSuggestions = false;
    this.searchBlock(value); // 🔥 uses your existing logic
  }

  private highlightFeature(layer: any) {
    const bounds = layer.getBounds();
    this.map.fitBounds(bounds, { maxZoom: 18 });

    this.highlightLayer = L.geoJSON(layer.toGeoJSON(), {
      style: {
        className: 'highlight-glow',
        color: 'yellow',
        weight: 4,
        fillColor: 'yellow',
        fillOpacity: 0.1,
      },
    }).addTo(this.map);

    layer.openPopup();
  }

  private highlightMultiple(layers: any[]) {
    const group = L.featureGroup(layers);

    this.map.fitBounds(group.getBounds());

    this.highlightLayer = L.featureGroup(); // new highlight group

    layers.forEach((layer) => {
      const sub = L.geoJSON(layer.toGeoJSON(), {
        interactive: false,
        style: {
          color: 'yellow',
          weight: 4,
          fillColor: 'yellow',
          fillOpacity: 0.05,
          className: 'highlight-glow',
        },
      });

      sub.addTo(this.highlightLayer);
    });

    this.highlightLayer.addTo(this.map);
  }
}
