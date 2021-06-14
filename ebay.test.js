const { Builder } = require('selenium-webdriver');
const SearchPage = require('./search_page.js');

const SEARCH_QUERY = 'ps5';
const EXPECTED_TITLE = 'ps5 | eBay';
const DEFAULT_TIMEOUT = 1000;
const FILTER_MAX_PRICE = 1000;
const TEST_STRING = 'Sony';

const LISTING_SEARCH_PARAMS = {
  allListings: 'LH_All',
  acceptsOffers: 'LH_BO',
  auction: 'LH_Auction',
  buyItNow: 'LH_BIN',
};

jest.setTimeout(60 * DEFAULT_TIMEOUT);

describe('Ebay search tests', () => {
  let page;

  beforeAll(async () => {
    const driver = await new Builder().forBrowser('chrome').build();
    page = new SearchPage(driver);
    await page.search(SEARCH_QUERY);
    await page.setMaxPrice(FILTER_MAX_PRICE);
  });

  afterAll(() => page.destroy());

  test('Page title meets the expected value', async () => {
    const title = await page.getTitle();
    expect(title).toBe(EXPECTED_TITLE);
  });

  test('More than 50% titles include test string', async () => {
    const titles = await page.getProductTitles();
    const includeCount = titles.filter((title) => title.includes(TEST_STRING)).length;
    expect(includeCount).toBeGreaterThanOrEqual(titles.length / 2);
  });

  test('Prices are less than or equal to max price', async () => {
    const prices = await page.getProductPrices();
    const filteredPrices = prices.filter((price) => price <= FILTER_MAX_PRICE).length;
    expect(filteredPrices).toBeGreaterThanOrEqual(prices.length * 0.8);
  });

  test('"Accepts offers" tab sets correct search param', async () => {
    await page.clickNthTab(1);
    const url = await page.getURL();
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.acceptsOffers)).toBe('1');
  });

  test('"Auction" tab sets correct search param', async () => {
    await page.clickNthTab(2);
    const url = await page.getURL();
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.auction)).toBe('1');
  });

  test('"Buy It Now" tab sets correct search param', async () => {
    await page.clickNthTab(3);
    const url = await page.getURL();
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.buyItNow)).toBe('1');
  });

  test('"All Listings" tab sets correct search param', async () => {
    await page.clickNthTab(0);
    const url = await page.getURL();
    expect(url.searchParams.get(LISTING_SEARCH_PARAMS.allListings)).toBe('1');
  });
});
