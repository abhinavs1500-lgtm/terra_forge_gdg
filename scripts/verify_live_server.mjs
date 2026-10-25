import assert from 'node:assert/strict';

const BASE = 'http://localhost:5173';

async function verifyServer() {
  console.log('Testing live Terra Forge server at', BASE);

  const indexRes = await fetch(`${BASE}/`);
  assert.equal(indexRes.status, 200);
  const html = await indexRes.text();
  assert.ok(html.includes('TERRA FORGE'), 'Index HTML must include TERRA FORGE title');

  const covRes = await fetch(`${BASE}/api/coverage`);
  assert.equal(covRes.status, 200);
  const cov = await covRes.json();
  assert.equal(cov.totalTarget, 167);
  assert.equal(cov.registered, 167);
  assert.equal(cov.verifiedCoords, 167);
  assert.equal(cov.withSoil, 152);
  assert.equal(cov.withGw, 143);
  assert.equal(cov.withFlood, 147);
  assert.equal(cov.sqliteDbPresent, true);
  console.log('[PASS] /api/coverage verified:', JSON.stringify(cov));

  const locRes = await fetch(`${BASE}/api/locations`);
  assert.equal(locRes.status, 200);
  const locs = await locRes.json();
  assert.equal(locs.length, 167);
  console.log('[PASS] /api/locations verified: 167 records returned.');

  const lyrRes = await fetch(`${BASE}/api/layers`);
  assert.equal(lyrRes.status, 200);
  const lyrs = await lyrRes.json();
  assert.ok(lyrs.rail_and_metro_nodes.length > 50);
  console.log('[PASS] /api/layers verified.');

  const postSaved = await fetch(`${BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      favourites: ['TF-CHN-163', 'TF-CHN-002'],
      assessments: [
        {
          id: 'ASSESS-TEST-01',
          title: 'Velachery — Stilt + 4 Residential Assessment',
          savedAt: new Date().toISOString(),
          locationId: 'TF-CHN-163',
          locationName: 'Velachery',
          userInputs: {
            projectCategory: 'Residential Multi-Family (Stilt + 4 Floors)',
            plotAreaSqFt: 3600,
            fsiRatio: 2.0,
            proposedFloors: 4,
            includeBasement: false,
            budgetLakhs: 280
          }
        }
      ],
      comparisons: [
        {
          id: 'COMP-TEST-01',
          title: 'Velachery vs. Anna Nagar vs. Guindy',
          savedAt: new Date().toISOString(),
          locationIds: ['TF-CHN-163', 'TF-CHN-013', 'TF-CHN-035']
        }
      ]
    })
  });
  assert.equal(postSaved.status, 200);
  const getSaved = await fetch(`${BASE}/api/saved`);
  const savedData = await getSaved.json();
  assert.equal(savedData.assessments.length, 1);
  assert.equal(savedData.comparisons.length, 1);
  console.log('[PASS] /api/saved GET & POST persistence verified.');
}

verifyServer();
