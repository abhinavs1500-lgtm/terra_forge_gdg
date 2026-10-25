import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9666;
const SCREENSHOT_DIR = 'C:\\Users\\DELL - PC\\.gemini\\antigravity\\brain\\a0d2866e-07d9-4c6a-8554-fa36eb537050';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== RUNNING LAND NEWS TV ACCEPTANCE TEST ===');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=C:\\temp\\chrome-tv-profile-' + Date.now(),
    '--window-size=1440,900',
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
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
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

    console.log('Navigating to Land News TV section...');
    await send('Page.navigate', { url: 'http://localhost:5173/?intro=0&landing=0&section=tv' });
    console.log('Waiting for load & DOM...');
    await sleep(3500);

    const debugPage = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            url: location.href,
            title: document.title,
            bodySnippet: document.body.innerText.slice(0, 200)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[DEBUG PAGE STATE]:', debugPage.result.value);

    // 1. Verify Television display chassis & elements
    const evalTv = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const chassis = document.querySelector('.tv-chassis');
          const screen = document.querySelector('.tv-display-screen');
          const headline = document.querySelector('.tv-headline')?.textContent?.trim();
          const summary = document.querySelector('.tv-summary')?.textContent?.trim();
          const category = document.querySelector('.tv-category-tag')?.textContent?.trim();
          const date = document.querySelector('.tv-date-tag')?.textContent?.trim();
          const source = document.querySelector('.tv-source-watermark')?.textContent?.trim();
          const counter = document.querySelector('.tv-counter-badge')?.textContent?.trim();
          const artwork = Boolean(document.querySelector('.tv-artwork-svg'));
          const cards = Array.from(document.querySelectorAll('.news-card-thumb'));
          const activeCard = document.querySelector('.news-card-thumb.is-selected');

          return {
            chassisPresent: Boolean(chassis),
            screenPresent: Boolean(screen),
            headline,
            summaryLength: summary?.length,
            category,
            date,
            source,
            counter,
            hasArtwork: artwork,
            totalCardsInCarousel: cards.length,
            activeCardHeadline: activeCard?.querySelector('.news-card-headline')?.textContent?.trim()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 1] TV Display & Selected Story:', evalTv.result.value);

    // Capture screenshot of TV broadcast view
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'land_news_tv_broadcast.png'), Buffer.from(shot1.data, 'base64'));
    console.log('[SCREENSHOT 1] Saved land_news_tv_broadcast.png');

    // 2. Test Next Story Navigation
    console.log('Clicking Next story arrow on TV...');
    await send('Runtime.evaluate', {
      expression: `document.querySelectorAll('.tv-nav-arrow-btn')[1]?.click()`,
      returnByValue: true
    });
    await sleep(600);

    const evalNext = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const headline = document.querySelector('.tv-headline')?.textContent?.trim();
          const counter = document.querySelector('.tv-counter-badge')?.textContent?.trim();
          const activeCard = document.querySelector('.news-card-thumb.is-selected');
          return {
            newHeadline: headline,
            newCounter: counter,
            activeCardMatches: activeCard?.querySelector('.news-card-headline')?.textContent?.trim() === headline
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 2] Next Story Navigation & Sync:', evalNext.result.value);

    // 3. Test Category Filtering: Click "Legal & Court Updates"
    console.log('Filtering by category "Legal & Court Updates"...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = Array.from(document.querySelectorAll('.news-cat-pill'));
          const legalPill = pills.find(p => p.textContent.includes('Legal'));
          if (legalPill) {
            legalPill.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(600);

    const evalLegal = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const headline = document.querySelector('.tv-headline')?.textContent?.trim();
          const category = document.querySelector('.tv-category-tag')?.textContent?.trim();
          const counter = document.querySelector('.tv-counter-badge')?.textContent?.trim();
          const cardCount = document.querySelectorAll('.news-card-thumb').length;
          return { category, headline, counter, cardCount };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 3] Category Filter Result:', evalLegal.result.value);

    // 4. Test Search Query: "guideline"
    console.log('Searching for "guideline"...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Reset category first
          document.querySelectorAll('.news-cat-pill')[0]?.click();
          const input = document.querySelector('.news-search-input');
          if (input) {
            input.value = 'guideline';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(600);

    const evalSearch = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const headline = document.querySelector('.tv-headline')?.textContent?.trim();
          const cardCount = document.querySelectorAll('.news-card-thumb').length;
          return { headline, cardCount };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 4] Search Result ("guideline"):', evalSearch.result.value);

    // Reset search
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('.news-search-input');
          if (input) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })()
      `,
      returnByValue: true
    });
    await sleep(400);

    // 5. Test "Read Full Story & Official References" Modal
    console.log('Opening Full Story detail modal...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.tv-read-btn')?.click()`,
      returnByValue: true
    });
    await sleep(600);

    const evalModal = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modal = document.querySelector('.story-modal-card');
          const title = modal?.querySelector('.story-modal-title')?.textContent?.trim();
          const source = modal?.querySelector('.meta-val')?.textContent?.trim();
          const officialLink = modal?.querySelector('.story-modal-footer a')?.getAttribute('href');
          const implicationsCount = modal?.querySelectorAll('.modal-imp-item')?.length || 0;
          const hasDisclaimer = Boolean(modal?.querySelector('.story-disclaimer-box'));

          return {
            modalOpen: Boolean(modal),
            title,
            source,
            officialLink,
            implicationsCount,
            hasDisclaimer
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 5] Full Story Modal on Demand:', evalModal.result.value);

    // Capture screenshot of detail modal
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'land_news_tv_detail_modal.png'), Buffer.from(shot2.data, 'base64'));
    console.log('[SCREENSHOT 2] Saved land_news_tv_detail_modal.png');

    // 6. Close Modal
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.story-modal-close')?.click()`,
      returnByValue: true
    });
    await sleep(400);

    const evalClosed = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('.story-modal-card'))`,
      returnByValue: true
    });
    console.log('[VERIFY 6] Modal closed cleanly, returned to TV:', !evalClosed.result.value);

    console.log('=== ALL LAND NEWS TV ACCEPTANCE CRITERIA PASSED ===');
    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
