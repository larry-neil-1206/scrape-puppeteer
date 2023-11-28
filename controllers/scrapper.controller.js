import puppeteer from "puppeteer";
import fs from "fs";
import util from "util";

const getProductDetails = async (element, page) => {
  let bHasVariants = false;
  const titleElement = await element.$(".woocommerce-loop-product__title");
  const title = titleElement
    ? await page.evaluate((el) => el.textContent.trim(), titleElement)
    : "";
  let product = [];
  const productElem = await element.$(
    ".woocommerce-LoopProduct-link.woocommerce-loop-product__link"
  );
  await productElem.click(); // Click on the product element to navigate to the detail page

  try {
    const variantForm = await page.waitForSelector(".variations_form"); // Get the product_variants
    const productVariationsJSON = variantForm
      ? await page.evaluate(
          (element) => element.getAttribute("data-product_variations"),
          variantForm
        )
      : "";
    bHasVariants = true;
    const productVariations = JSON.parse(productVariationsJSON);
    product = productVariations.map((variant) => ({
      timeStamp: Date.now(),
      title,
      variation_id: variant.variation_id,
      max_qty: variant.max_qty,
      sku: variant.sku,
    }));
    // product.variantion = productVariations;
  } catch (error) {
    console.log(
      "Product(" +
        title +
        ") hasn't an element with classname variations_form"
    );
  }
  if (!bHasVariants) {
    try {
      const productIdElem = await page.waitForSelector(
        ".summary.entry-summary .yotpo.bottomLine"
      ); // Get the product_variants
      const productId = productIdElem
        ? await page.evaluate(
            (element) => element.getAttribute("data-product-id"),
            productIdElem
          )
        : "";
      const productStock = await page.waitForSelector(".stock.in-stock");
      const stock = productStock
      ? await page.evaluate((el) => el.textContent.trim(), productStock)
      : "";
      product = [{
        timeStamp: Date.now(),
        title,
        variation_id: productId,
        max_qty: stock,
      }];
      bHasVariants = true;
    } catch (error) {
      console.log(
        "Product(" +
          title +
          ") hasn't an element that contains product id"
      );
    }
  }

  return product;
};

const getProducts = async () => {
  try {
    const browser = await puppeteer.launch({
      devtools: process.env.NODE_ENV === "development" ? true : false,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.goto("https://delta8resellers.com/brand/elyxr");

    // const products = await page.evaluate(async () => {
    const button = await page.waitForSelector("#ac-ag-type-button");
    if (button) {
      await button.click(); // Click on the button
    }

    let productElements = await page.$$("ul.products li");
    const productsCnt = productElements.length;
    const products = [];

    for (let idx = 0; idx < productsCnt; idx++) {
      console.log("===> steps", (idx + 1) + "/" + productsCnt);
      const element = productElements[idx];
      const product = await getProductDetails(element, page);

      await page.goBack(); // Navigate back to the previous page
      products.push(...product.map(productItem => JSON.stringify(productItem)));
      productElements = await page.$$("ul.products li");
    }

    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const year = currentDate.getFullYear();
    const formattedDate = `${month}-${day}-${year}`;

    // const formattedProducts = util.inspect(products, { depth: null });
    fs.writeFile(
      "reports/" + formattedDate + ".txt",
      JSON.stringify(products),
      (err) => {
        if (err) throw err;
        console.log("File created and content written successfully!");
      }
    );
    await browser.close();
    console.log("===> results", products);
    return products;
  } catch (error) {
    console.log("[Puppeteer exception occur]: ", error);
  }
  return [];
};

export default {
  getProducts,
};
