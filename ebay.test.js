const {
  Builder, By, Key, until,
} = require('selenium-webdriver');
const { URL } = require('url');

const PAGE_URL = 'https://www.ebay.com/';
const SEARCH_BAR_CLASS = 'gh-tb';
const SEARCH_QUERY = 'ps5';
const EXPECTED_TITLE = 'ps5 | eBay';
const PRODUCT_TITLE_CLASS = 's-item__title';
const PRODUCT_PRICE_CLASS = 's-item__price';
const PAGE_NUMBER_PARAM = '_pgn';
const MAX_PRICE_INPUT_ID = 's0-14-11-0-1-2-6-0-6[3]-0-textrange-9-textbox';
const LISTING_TABS_CLASS = 'srp-format-tabs-h2';
const DEFAULT_TIMEOUT = 1000;
const FILTER_MAX_PRICE = 1000;
const TEST_STRING = 'Sony';
const PAGE_SCAN_COUNT = 5;

const LISTING_SEARCH_PARAMS = {
  allListings: 'LH_All',
  acceptsOffers: 'LH_BO',
  auction: 'LH_Auction',
  buyItNow: 'LH_BIN',
};

jest.setTimeout(60 * DEFAULT_TIMEOUT);

const parsePrice = (price) => parseInt(price.slice(1).replace(',', ''));

const getElementsTextByClass = async (driver, className) => {
  const elements = await driver.findElements(By.className(className));
  const res = [];

  for (const element of elements) {
    const text = await element.getText();
    res.push(text);
  }

  return res;
};

const acquireProductInfo = async (driver, url, pageCount) => {
  url = new URL(url);

  let allTitles = [];
  let allPrices = [];

  for (let i = 0; i < pageCount; i++) {
    url.searchParams.set(PAGE_NUMBER_PARAM, (i + 1).toString());
    await driver.get(url.href);

    const titles = await getElementsTextByClass(driver, PRODUCT_TITLE_CLASS);
    const prices = await getElementsTextByClass(driver, PRODUCT_PRICE_CLASS);

    allTitles = allTitles.concat(titles);
    allPrices = allPrices.concat(prices);
  }

  return { titles: allTitles, prices: allPrices.map(parsePrice) };
};

describe('Ebay search tests', () => {
  let driver;
  let productInfo;

  beforeAll(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get(PAGE_URL);
    await driver.findElement(By.className(SEARCH_BAR_CLASS)).sendKeys(SEARCH_QUERY, Key.RETURN);
    await driver.findElement(By.id(MAX_PRICE_INPUT_ID)).sendKeys(FILTER_MAX_PRICE, Key.RETURN);

    const url = await driver.getCurrentUrl();
    productInfo = await acquireProductInfo(driver, url, PAGE_SCAN_COUNT);
  });

  afterAll(() => driver.quit());

  test('Page title meets the expected value', async () => {
    await driver.wait(until.titleIs(EXPECTED_TITLE), DEFAULT_TIMEOUT);
  });

  test('More than 50% titles include test string', () => {
    const { titles } = productInfo;
    const includeCount = titles.filter((title) => title.includes(TEST_STRING)).length;
    expect(includeCount).toBeGreaterThanOrEqual(productInfo.titles.length / 2);
  });

  test('Prices are less than or equal to max price', () => {
    const { prices } = productInfo;
    const filteredPrices = prices.filter((price) => price <= FILTER_MAX_PRICE).length;
    expect(filteredPrices).toBeGreaterThanOrEqual(prices.length * 0.8);
  });

  const clickNthTab = async (tabNumber) => {
    const tabs = await driver.findElements(By.className(LISTING_TABS_CLASS));
    await tabs[tabNumber].click();
  };

  test('"Accepts offers" tab sets correct search param', async () => {
    await clickNthTab(1);
    const url = new URL(await driver.getCurrentUrl());
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.acceptsOffers)).toBe('1');
  });

  test('"Auction" tab sets correct search param', async () => {
    await clickNthTab(2);
    const url = new URL(await driver.getCurrentUrl());
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.auction)).toBe('1');
  });

  test('"Buy It Now" tab sets correct search param', async () => {
    await clickNthTab(3);
    const url = new URL(await driver.getCurrentUrl());
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.buyItNow)).toBe('1');
  });

  test('"All Listings" tab sets correct search param', async () => {
    await clickNthTab(0);
    const url = new URL(await driver.getCurrentUrl());
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.allListings)).toBe('1');
  });
});
