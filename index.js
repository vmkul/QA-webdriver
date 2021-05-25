import { Builder, By, Key, until } from 'selenium-webdriver';

const testRunner = promises => new Promise(resolve => {
  let succeeded = 0;
  let failed = 0;

  promises.forEach(p => {
    p
      .then(() => succeeded++)
      .catch(() => failed++)
      .finally(() => {
        if (succeeded + failed === promises.length) {
          resolve({ succeeded, failed });
        }
      });
  });
});

const PAGE_URL = 'https://www.ebay.com/';
const SEARCH_BAR_CLASS = 'gh-tb';
const SEARCH_QUERY = 'ps5';
const EXPECTED_TITLE = 'ps5 | eBay';
const PRODUCT_TITLE_CLASS = 's-item__title';
const TEST_STRING = 'Sony';
const DEFAULT_TIMEOUT = 1000;

(async () => {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    await driver.get(PAGE_URL);
    await driver.findElement(By.className(SEARCH_BAR_CLASS)).sendKeys(SEARCH_QUERY, Key.RETURN);
    await driver.wait(until.titleIs(EXPECTED_TITLE), DEFAULT_TIMEOUT);
    const titles = await driver.findElements(By.className(PRODUCT_TITLE_CLASS));

    const tests = [];

    for (const title of titles) {
      tests.push(driver.wait(until.elementTextContains(title, TEST_STRING), DEFAULT_TIMEOUT));
    }

    const testResults = await testRunner(tests);
    console.log(testResults);

    if (testResults.succeeded < Math.floor(tests.length / 2)) {
      throw new Error('Test failed!');
    } else {
      console.log('Test passed!');
    }
  } finally {
    await driver.quit();
  }
})();
