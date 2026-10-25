# TERRA FORGE — Land Intelligence Platform for Chennai

**Tagline:** *Intelligence before construction. Build smarter. Build stronger.*

Terra Forge is an interactive, full-stack geospatial and preliminary land-intelligence platform focused on **167 verified locations in Chennai, Tamil Nadu**. It unifies OpenStreetMap vector geography, Copernicus DEM / NASA SRTM 90m terrain elevation, Central Ground Water Board (CGWB) & Geological Survey of India (GSI) regional hydrogeology, NCCR CFLOWS-Chennai & Greater Chennai Corporation (GCC) flood basin context, and Bureau of Indian Standards (BIS) civil engineering rules (`IS 456:2000`, `IS 1893:2016`, `IS 1904:1986`, `TNCDBR 2019`).

---

## Independent Data Sourcing & Non-CSV Guarantee

- **Zero Supplied CSV Files Used:** The entire 167-location registry (`src/data/chennai_167_locations.json` and `backend/terraforge.db`) was independently researched and built via `scripts/data_pipeline.py` using live queries to the **OpenStreetMap Overpass API**, the **Open-Meteo Elevation API (Copernicus DEM GLO-90 / NASA SRTM)**, and published government technical reports (CGWB, GSI, GCC, NCCR).
- **TNGIS & CUMTA Investigation:** Probed `https://tngis.tn.gov.in/apps.html`, `https://tngis.tn.gov.in/tngismaps/wms`, and `https://tngis.tn.gov.in/apps/cumta/`. Because state firewall policies restrict external `GetCapabilities` and session-gated POST queries, Terra Forge implements an honest fallback with verified OpenStreetMap vector layers, official portal links, and a custom **GeoJSON Layer Import** workflow on the interactive map.

---

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Re-run the Python data validation & SQLite generation pipeline
python scripts/data_pipeline.py

# 3. Run the automated acceptance & calculation test suite
npm test

# 4. Launch the full-stack development server (Frontend + /api/* middleware)
npm run dev

# 5. Build production bundle
npm run build
```
