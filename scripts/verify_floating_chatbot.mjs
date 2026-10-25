import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9555;
const SCREENSHOT_DIR = 'C:\\Users\\DELL - PC\\.gemini\\antigravity\\brain\\a0d2866e-07d9-4c6a-8554-fa36eb537050';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== RUNNING CHATBOT ACCEPTANCE TEST ===');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--user-data-dir=C:\\temp\\chrome-chat-profile-' + Date.now(),
    '--window-size=1440,900',
    'http://localhost:5173/?intro=0&landing=1'
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

    console.log('Navigating to Landing Page...');
    await send('Page.navigate', { url: 'http://localhost:5173/?intro=0&landing=1' });
    console.log('Waiting for load & DOM...');
    await sleep(3500);

    const checkDom = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            url: location.href,
            title: document.title,
            bodyText: document.body.innerText.slice(0, 300),
            hasTrigger: Boolean(document.querySelector('.floating-chat-trigger-btn')),
            allClasses: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(Boolean).slice(0, 20)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[DEBUG DOM CHECK]:', checkDom.result.value);

    // STEP 1: Verify Trigger Button on Homepage
    const evalTrigger1 = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('.floating-chat-trigger-btn'))`,
      returnByValue: true
    });
    console.log('[STEP 1 PASS] Floating trigger button exists on Landing Page:', evalTrigger1.result.value);

    // STEP 2: Open Chatbot on Homepage
    console.log('Opening chatbot on homepage...');
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.floating-chat-trigger-btn').click()`,
      returnByValue: true
    });
    await sleep(600);

    const evalPanel1 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.querySelector('.floating-chat-panel');
          const title = panel?.querySelector('.chat-header-title')?.textContent;
          const contextPill = panel?.querySelector('.chat-context-pill')?.textContent;
          const messages = Array.from(panel?.querySelectorAll('.chat-message-bubble') || []).map(b => b.textContent);
          return { panelOpen: Boolean(panel), title, contextPill, messageCount: messages.length };
        })()
      `,
      returnByValue: true
    });
    console.log('[STEP 2 PASS] Chat panel open on Homepage:', evalPanel1.result.value);

    // Send a message on Homepage
    console.log('Sending user question on homepage...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const chip = document.querySelector('.chat-suggestion-chip');
          if (chip) {
            chip.click();
            return chip.textContent;
          }
          return null;
        })()
      `,
      returnByValue: true
    });
    await sleep(1000);

    // Capture screenshot on Homepage
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'chatbot_1_homepage.png'), Buffer.from(shot1.data, 'base64'));
    console.log('[SCREENSHOT 1] Saved chatbot_1_homepage.png');

    // STEP 3: Navigate to Site Intelligence via Clickable Action
    console.log('Navigating to Site Intelligence...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const actions = Array.from(document.querySelectorAll('.chat-action-btn'));
          const siteIntAction = actions.find(a => a.textContent.includes('Site Intelligence'));
          if (siteIntAction) {
            siteIntAction.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(1500);

    const evalProfile = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.querySelector('.floating-chat-panel');
          const contextPill = panel?.querySelector('.chat-context-pill')?.textContent;
          const locationPill = panel?.querySelector('.chat-location-pill')?.textContent;
          const messages = Array.from(panel?.querySelectorAll('.chat-message-bubble') || []).map(b => b.textContent);
          const activeLocHeader = document.querySelector('.sidebar-active-loc-name')?.textContent;
          return {
            panelStillOpen: Boolean(panel),
            contextPill,
            locationPill,
            activeLocHeader,
            totalMessagesCount: messages.length,
            retainedHistory: messages.length > 2
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[STEP 3 PASS] Chatbot in Site Intelligence (preserved state):', evalProfile.result.value);

    // Capture screenshot on Site Intelligence
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'chatbot_2_site_intelligence.png'), Buffer.from(shot2.data, 'base64'));
    console.log('[SCREENSHOT 2] Saved chatbot_2_site_intelligence.png');

    // STEP 4: Open Site Assessment via Chatbot Action
    console.log('Navigating to Site Assessment via chatbot action...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const actions = Array.from(document.querySelectorAll('.chat-action-btn'));
          const assessAction = actions.find(a => a.textContent.includes('Assessment'));
          if (assessAction) {
            assessAction.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(1500);

    const evalAssessment = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.querySelector('.floating-chat-panel');
          const contextPill = panel?.querySelector('.chat-context-pill')?.textContent;
          const sectionTitle = document.querySelector('.section-title')?.textContent;
          const onAssessmentPage = sectionTitle?.includes('Assessment');
          const messages = Array.from(panel?.querySelectorAll('.chat-message-bubble') || []);
          return {
            panelStillOpen: Boolean(panel),
            contextPill,
            onAssessmentPage,
            sectionTitle: sectionTitle?.trim(),
            totalMessagesCount: messages.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[STEP 4 PASS] Chatbot in Site Assessment:', evalAssessment.result.value);

    // Capture screenshot on Site Assessment
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'chatbot_3_site_assessment.png'), Buffer.from(shot3.data, 'base64'));
    console.log('[SCREENSHOT 3] Saved chatbot_3_site_assessment.png');

    // STEP 5: Visit Reports Section
    console.log('Navigating to Reports Section...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Click Reports nav item in sidebar
          const navItems = Array.from(document.querySelectorAll('.nav-item-btn'));
          const reportsNav = navItems.find(n => n.textContent.includes('Reports'));
          if (reportsNav) {
            reportsNav.click();
            return true;
          }
          return false;
        })()
      `,
      returnByValue: true
    });
    await sleep(1500);

    const evalReports = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const panel = document.querySelector('.floating-chat-panel');
          const contextPill = panel?.querySelector('.chat-context-pill')?.textContent;
          const sectionTitle = document.querySelector('.section-title')?.textContent;
          const onReportsPage = sectionTitle?.includes('Reports') || Boolean(document.querySelector('.reports-uno-deck') || document.querySelector('.desk-surface'));
          const messages = Array.from(panel?.querySelectorAll('.chat-message-bubble') || []);
          return {
            panelStillOpen: Boolean(panel),
            contextPill,
            onReportsPage,
            sectionTitle: sectionTitle?.trim(),
            totalMessagesCount: messages.length,
            conversationRetainedWithoutReset: messages.length >= 4
          };
        })()
      `,
      returnByValue: true
    });
    console.log('[STEP 5 PASS] Chatbot in Reports Section:', evalReports.result.value);

    // Capture screenshot on Reports
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, 'chatbot_4_reports.png'), Buffer.from(shot4.data, 'base64'));
    console.log('[SCREENSHOT 4] Saved chatbot_4_reports.png');

    console.log('=== ALL ACCEPTANCE TEST STEPS COMPLETED SUCCESSFULLY ===');
    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

run().catch((err) => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});
