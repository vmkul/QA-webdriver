const { By, Key } = require('selenium-webdriver');
const { URL } = require('url');

const PAGE_URL = 'https://www.ebay.com/';
const SEARCH_BAR_CLASS = 'gh-tb';
const MAX_PRICE_INPUT_ID = 's0-14-11-0-1-2-6-0-6[3]-0-textrange-9-textbox';
const LISTING_TABS_CLASS = 'srp-format-tabs-h2';
const PRODUCT_TITLE_CLASS = 's-item__title';
const PRODUCT_PRICE_CLASS = 's-item__price';
const PAGE_NUMBER_PARAM = '_pgn';
const PAGE_SCAN_COUNT = 5;

const parsePrice = (price) => parseInt(price.slice(1).replace(',', ''));

module.exports = class SearchPage {
  constructor(driver) {
    this.driver = driver;

    this.searchBarLocator = By.className(SEARCH_BAR_CLASS);
    this.maxPriceInputLocator = By.id(MAX_PRICE_INPUT_ID);
    this.listingTabsLocator = By.className(LISTING_TABS_CLASS);
    this.productTitleLocator = By.className(PRODUCT_TITLE_CLASS);
    this.productPriceLocator = By.className(PRODUCT_PRICE_CLASS);

    this.productTitles = [];
    this.productPrices = [];
  }

  async search(query) {
    await this.driver.get(PAGE_URL);
    await this.driver.findElement(this.searchBarLocator).sendKeys(query, Key.RETURN);
  }

  async setMaxPrice(price) {
    await this.driver.findElement(this.maxPriceInputLocator).sendKeys(price.toString(), Key.RETURN);
  }

  async clickNthTab(tabNumber) {
    const tabs = await this.driver.findElements(this.listingTabsLocator);
    await tabs[tabNumber].click();
  }

  async getTitle() {
    return this.driver.getTitle();
  }

  async getURL() {
    const href = await this.driver.getCurrentUrl();
    return new URL(href);
  }

  async getProductTitles() {
    if (this.productTitles.length === 0) {
      await this._acquireProductInfo(PAGE_SCAN_COUNT);
    }

    return this.productTitles;
  }

  async getProductPrices() {
    if (this.productPrices.length === 0) {
      await this._acquireProductInfo(PAGE_SCAN_COUNT);
    }

    return this.productPrices;
  }

  async destroy() {
    return this.driver.quit();
  }

  async _getElementsTextByLocator(locator) {
    const elements = await this.driver.findElements(locator);
    const res = [];

    for (const element of elements) {
      const text = await element.getText();
      res.push(text);
    }

    return res;
  }

  async _acquireProductInfo(pageCount) {
    const url = await this.getURL();

    let allTitles = [];
    let allPrices = [];

    for (let i = 0; i < pageCount; i++) {
      url.searchParams.set(PAGE_NUMBER_PARAM, (i + 1).toString());
      await this.driver.get(url.href);

      const titles = await this._getElementsTextByLocator(this.productTitleLocator);
      const prices = await this._getElementsTextByLocator(this.productPriceLocator);

      allTitles = allTitles.concat(titles);
      allPrices = allPrices.concat(prices);
    }

    this.productTitles = allTitles;
    this.productPrices = allPrices.map(parsePrice);
  }
};
