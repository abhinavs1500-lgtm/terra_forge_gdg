import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'http://localhost:5173/?intro=0&landing=0&section=profile';
const DEBUG_PORT = 9333;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('Launching Chrome in headless mode with remote debugging...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=C:\\temp\\chrome-test-profile-' + Date.now(),
    '--window-size=1440,900',
    TARGET_URL
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

    if (!wsEndpoint) {
      throw new Error('Failed to connect to Chrome debugging endpoint');
    }

    console.log('Connected to Chrome CDP:', wsEndpoint);

    // Get list of targets/pages
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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.log('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
      }
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    console.log('Navigating page to:', TARGET_URL);
    await send('Browser.grantPermissions', { permissions: ['audioCapture'], origin: 'http://localhost:5173' }).catch(() => {});
    await send('Page.navigate', { url: TARGET_URL });

    console.log('Waiting for page to load & DOM to settle...');
    await sleep(3500);

    const locEval = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
    console.log('Current URL:', locEval.result.value);
    const bodyEval = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0, 200)', returnByValue: true });
    console.log('Page Text:', bodyEval.result.value);

    // 1. Check if the voice search button exists
    const evalButton = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('.voice-search-mic-btn'))`,
      returnByValue: true
    });
    console.log('[VERIFY 1] .voice-search-mic-btn exists:', evalButton.result.value);

    // 2. Check tooltip attribute
    const evalTooltip = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.voice-search-mic-btn');
          const tip = btn?.querySelector('.voice-tooltip');
          return {
            title: btn?.getAttribute('title'),
            ariaLabel: btn?.getAttribute('aria-label'),
            tooltipText: tip?.textContent?.trim()
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 2] Button Tooltip & Accessibility:', evalTooltip.result.value);

    // 3. Click the voice search mic button
    console.log('Clicking .voice-search-mic-btn to open voice assistant UI...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.voice-search-mic-btn')?.click()`,
      returnByValue: true
    });
    await sleep(600);

    // 4. Verify voice panel opened & capture panel screenshot
    const evalPanel = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.querySelector('.voice-listening-panel');
          const transcriptBox = panel?.querySelector('.voice-transcript-box');
          const hintPills = Array.from(panel?.querySelectorAll('.voice-hint-pill') || []).map(p => p.textContent.trim());
          return {
            panelOpen: Boolean(panel),
            boxText: transcriptBox?.textContent?.trim(),
            hints: hintPills
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 3] Voice Listening Panel UI state:', evalPanel.result.value);

    // Capture screenshot with listening panel open
    const shotPanel = await send('Page.captureScreenshot', { format: 'png' });
    const panelImgPath = path.resolve('C:\\Users\\DELL - PC\\.gemini\\antigravity\\brain\\a0d2866e-07d9-4c6a-8554-fa36eb537050\\voice_panel_listening.png');
    fs.writeFileSync(panelImgPath, Buffer.from(shotPanel.data, 'base64'));
    console.log('[PASS] Listening panel screenshot saved to:', panelImgPath);

    // 5. Click the "Search Adyar" hint pill to test natural speech execution
    console.log('Clicking hint pill: "Search Adyar"...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const pills = Array.from(document.querySelectorAll('.voice-hint-pill'));
          const adyarPill = pills.find(p => p.textContent.includes('Adyar'));
          if (adyarPill) {
            adyarPill.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(1500);

    // 6. Verify result of command execution
    const evalResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const activeLoc = document.querySelector('.sidebar-active-loc-name')?.textContent;
          const searchInput = document.querySelector('.topbar-search-input')?.value;
          return {
            activeLocation: activeLoc,
            searchInputValue: searchInput
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[VERIFY 4] Post-command state:', evalResult.result.value);

    // 7. Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.resolve('C:\\Users\\DELL - PC\\.gemini\\antigravity\\brain\\a0d2866e-07d9-4c6a-8554-fa36eb537050\\voice_search_verified.png');
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log('[PASS] Verification screenshot saved to:', outPath);

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
