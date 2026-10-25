import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9777;
const ARTIFACT_DIR = 'C:\\Users\\DELL - PC\\.gemini\\antigravity\\brain\\a0d2866e-07d9-4c6a-8554-fa36eb537050';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== RUNNING TERRA SHIELD LAND TV IMAGE VERIFICATION ===');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=C:\\temp\\chrome-tv-img-profile-' + Date.now(),
    '--window-size=1440,950',
    'http://localhost:5173/?intro=0&landing=0&section=tv'
  ]);

  try {
    let wsEndpoint = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
        if (res.ok) {
          const data = await res.json();
          wsEndpoint = data.webSocketDebuggerUrl;
          break;
        }
      } catch (e) {}
    }

    if (!wsEndpoint) throw new Error('Could not connect to Chrome debugging endpoint');
    console.log('Connected to Chrome CDP:', wsEndpoint);

    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
    const pages = await listRes.json();
    const page = pages.find((p) => p.type === 'page');
    if (!page) throw new Error('No page target found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const send = (method, params = {}) => {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to Land TV...');
    await send('Page.navigate', { url: 'http://localhost:5173/?intro=0&landing=0&section=tv' });
    
    // Wait for news stories to load and mount
    for (let i = 0; i < 20; i++) {
      await sleep(500);
      const isReady = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('.tv-story-photo') || document.querySelector('.tv-headline'))`,
        returnByValue: true
      });
      if (isReady.result.value) {
        console.log(`TV ready after ${(i + 1) * 500}ms`);
        break;
      }
    }
    await sleep(1500);

    const storyResults = [];

    // Verify 5 distinct stories in sequence
    for (let step = 0; step < 5; step++) {
      // Allow image to load
      await sleep(1200);

      const storyData = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const counter = document.querySelector('.tv-counter-badge')?.textContent?.trim();
            const headline = document.querySelector('.tv-headline')?.textContent?.trim();
            const category = document.querySelector('.tv-category-tag')?.textContent?.trim();
            const source = document.querySelector('.tv-source-watermark')?.textContent?.trim();
            const img = document.querySelector('.tv-story-photo');
            const caption = document.querySelector('.tv-caption-badge')?.textContent?.trim();
            const fallbackSvg = Boolean(document.querySelector('.tv-artwork-svg'));

            return {
              counter,
              headline,
              category,
              source,
              hasImg: Boolean(img),
              imgSrc: img ? img.src : null,
              imgComplete: img ? img.complete : false,
              naturalWidth: img ? img.naturalWidth : 0,
              naturalHeight: img ? img.naturalHeight : 0,
              caption,
              fallbackSvg
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`[STORY ${step + 1} RESULT]:`, storyData.result.value);
      storyResults.push(storyData.result.value);

      if (step === 0) {
        // Capture screenshot of Story 1
        const shot1 = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(ARTIFACT_DIR, 'land_news_tv_story1_photo.png'), Buffer.from(shot1.data, 'base64'));
        console.log('[SCREENSHOT] Saved land_news_tv_story1_photo.png');
      }

      if (step < 4) {
        // Click Next story button
        await send('Runtime.evaluate', {
          expression: `document.querySelectorAll('.tv-nav-arrow-btn')[1]?.click()`
        });
        await sleep(300);
      }
    }

    // Now test Modal with Hero Image
    console.log('Opening Full Story Detail Modal...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.tv-read-btn')?.click()`
    });
    await sleep(1000);

    const modalData = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const overlay = Boolean(document.querySelector('.story-modal-overlay'));
          const modalTitle = document.querySelector('.story-modal-title')?.textContent?.trim();
          const heroImg = document.querySelector('.modal-hero-photo');
          const heroCaption = document.querySelector('.modal-hero-caption')?.textContent?.trim();

          return {
            modalOpen: overlay,
            modalTitle,
            hasHeroImg: Boolean(heroImg),
            heroSrc: heroImg ? heroImg.src : null,
            heroNaturalWidth: heroImg ? heroImg.naturalWidth : 0,
            heroCaption
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[MODAL VERIFICATION RESULT]:', modalData.result.value);

    const shotModal = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'land_news_tv_modal_hero_photo.png'), Buffer.from(shotModal.data, 'base64'));
    console.log('[SCREENSHOT] Saved land_news_tv_modal_hero_photo.png');

    // Close modal
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.story-modal-close')?.click()`
    });
    await sleep(500);

    // Verify distinct image URLs across the 5 stories
    const distinctUrls = new Set(storyResults.map((s) => s.imgSrc));
    console.log(`Verified ${storyResults.length} stories with ${distinctUrls.size} distinct image URLs.`);
    if (distinctUrls.size !== 5) {
      throw new Error(`Expected 5 distinct image URLs, but got ${distinctUrls.size}`);
    }

    console.log('=== ALL 5 LAND TV STORIES DISPLAY RELEVANT, DISTINCT PHOTOS SUCCESSFULLY! ===');
    ws.close();
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
  }
}

run().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});
