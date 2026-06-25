const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`[Page Error] ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5173/#/tasks', { waitUntil: 'networkidle2' });
    
    console.log("Page loaded. Checking for initial errors...");
    if (errors.length > 0) {
      console.log(errors.join('\n'));
      errors.length = 0; // clear
    }

    // Wait for the "Nova Tarefa" button to appear
    console.log("Clicking 'Nova Tarefa'...");
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('Nova Tarefa'));
    });
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Nova Tarefa'));
      if (btn) btn.click();
    });

    // Wait for form
    await page.waitForSelector('input[placeholder="Título da tarefa..."]', { visible: true });
    
    // Type task title
    await page.type('input[placeholder="Título da tarefa..."]', 'Tarefa de Teste');
    
    // Click submit
    console.log("Submitting task...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Criar Tarefa'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second to see if it crashes

    console.log("Checking errors after saving task:");
    if (errors.length > 0) {
      console.log(errors.join('\n'));
    } else {
      console.log("No errors detected.");
    }

    // Check if the page is showing Error Boundary
    const isErrorBoundary = await page.evaluate(() => document.body.innerText.includes('Algo deu errado'));
    if (isErrorBoundary) {
      console.log("ERROR BOUNDARY TRIPPED!");
    } else {
      console.log("App seems stable.");
    }
    
  } catch (err) {
    console.error("Script failed:", err);
  } finally {
    await browser.close();
  }
})();
