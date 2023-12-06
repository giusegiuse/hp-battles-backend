const puppeteer = require('puppeteer');

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({
    headless: false, //con false => browser con interface
  });
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
});

afterEach(async () => {
  await browser.close();
});

test('The body has the correct text', async () => {
  const text = await page.$eval('body', (el) => el.innerHTML);

  expect(text).toEqual('HP Battles');
});

// test('clicking login starts oauth flow', async () => {
//   await page.click('.right a');
//
//   const url = await page.url();
//
//   expect(url).toMatch(/accounts\.google\.com/);
// });
