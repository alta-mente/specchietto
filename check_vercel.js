import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('request', request => {
    if (request.url().includes('/api/restaurants')) {
      console.log('API REQUEST TO:', request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/restaurants')) {
      console.log('API RESPONSE STATUS:', response.status());
    }
  });

  await page.goto('https://specchietto.vercel.app/#/prenota?business=centro-estetico-bellezza', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
