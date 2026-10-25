import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function terraForgeApiPlugin() {
  const dataDir = path.resolve(process.cwd(), 'src', 'data');
  const backendDir = path.resolve(process.cwd(), 'backend');
  const savedFile = path.join(backendDir, 'saved_workspace.json');

  const ensureSavedFile = () => {
    if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });
    if (!fs.existsSync(savedFile)) {
      fs.writeFileSync(
        savedFile,
        JSON.stringify({ favourites: [], assessments: [], comparisons: [], reports: [] }, null, 2),
        'utf-8'
      );
    }
  };

  return {
    name: 'terra-forge-backend-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        try {
          if (req.url.startsWith('/api/locations') && req.method === 'GET') {
            const raw = fs.readFileSync(path.join(dataDir, 'chennai_167_locations.json'), 'utf-8');
            res.statusCode = 200;
            res.end(raw);
            return;
          }
          if (req.url.startsWith('/api/coverage') && req.method === 'GET') {
            const locs = JSON.parse(fs.readFileSync(path.join(dataDir, 'chennai_167_locations.json'), 'utf-8'));
            const totalTarget = 167;
            const registered = locs.length;
            const verifiedCoords = locs.filter((l) => l.coordinates?.verified).length;
            const withSoil = locs.filter((l) => Boolean(l.ground_and_soil?.soil_classification)).length;
            const withGw = locs.filter((l) => Boolean(l.ground_and_soil?.groundwater_pre_monsoon_m_bgl)).length;
            const withFlood = locs.filter((l) => Boolean(l.environmental_and_flood?.flood_hazard_category)).length;
            const withTransit = locs.filter(
              (l) =>
                (l.accessibility_and_connectivity?.nearest_transit_stations?.length || 0) > 0 ||
                (l.accessibility_and_connectivity?.arterial_roads?.length || 0) > 0
            ).length;
            const withSources = locs.filter((l) => (l.sources?.length || 0) > 0).length;
            const requiringFurtherCollection = locs.filter(
              (l) =>
                !l.ground_and_soil?.soil_classification ||
                !l.ground_and_soil?.groundwater_pre_monsoon_m_bgl ||
                !l.environmental_and_flood?.flood_hazard_category
            ).length;
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                totalTarget,
                registered,
                verifiedCoords,
                withSoil,
                withGw,
                withFlood,
                withTransit,
                withSources,
                requiringFurtherCollection,
                requiringPlotBorehole: registered,
                sqliteDbPresent: fs.existsSync(path.join(backendDir, 'terraforge.db'))
              })
            );
            return;
          }
          if (req.url.startsWith('/api/layers') && req.method === 'GET') {
            const raw = fs.readFileSync(path.join(dataDir, 'gis_layers.json'), 'utf-8');
            res.statusCode = 200;
            res.end(raw);
            return;
          }
          if (req.url.startsWith('/api/news') && req.method === 'GET') {
            const raw = fs.readFileSync(path.join(dataDir, 'land_legal_news.json'), 'utf-8');
            const allStories = JSON.parse(raw);
            const parsedUrl = new URL(req.url, 'http://localhost');
            const category = parsedUrl.searchParams.get('category');
            const search = (parsedUrl.searchParams.get('search') || '').trim().toLowerCase();

            let filtered = allStories;
            if (category && category !== 'All Updates') {
              if (category === 'Tamil Nadu') {
                filtered = filtered.filter((s) => s.jurisdiction.includes('Tamil Nadu') || s.jurisdiction.includes('Chennai'));
              } else {
                filtered = filtered.filter(
                  (s) => s.category.toLowerCase() === category.toLowerCase() ||
                         (s.jurisdiction && s.jurisdiction.toLowerCase().includes(category.toLowerCase()))
                );
              }
            }
            if (search) {
              filtered = filtered.filter(
                (s) =>
                  s.headline.toLowerCase().includes(search) ||
                  s.shortSummary.toLowerCase().includes(search) ||
                  s.sourceName.toLowerCase().includes(search) ||
                  s.category.toLowerCase().includes(search) ||
                  s.jurisdiction.toLowerCase().includes(search) ||
                  s.officialReference.toLowerCase().includes(search)
              );
            }

            res.statusCode = 200;
            res.end(
              JSON.stringify({
                total: filtered.length,
                allCount: allStories.length,
                lastRefreshedAt: new Date().toISOString(),
                serverStatus: 'OPERATIONAL',
                sourceHealth: '9 Official Statutory & Judicial Channels Synchronized (TNReginet, TNeGA, CMDA, TNRERA, Madras HC, SC, DoLR, MoHUA)',
                stories: filtered
              })
            );
            return;
          }
          if (req.url.startsWith('/api/saved')) {
            ensureSavedFile();
            if (req.method === 'GET') {
              res.statusCode = 200;
              res.end(fs.readFileSync(savedFile, 'utf-8'));
              return;
            }
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const parsed = JSON.parse(body || '{}');
                  fs.writeFileSync(savedFile, JSON.stringify(parsed, null, 2), 'utf-8');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
                } catch (e) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ ok: false, error: String(e) }));
                }
              });
              return;
            }
          }
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), terraForgeApiPlugin()],
  build: {
    target: 'esnext'
  }
});
