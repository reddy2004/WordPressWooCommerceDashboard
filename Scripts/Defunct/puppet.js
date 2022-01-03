const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  browser.on('targetchanged', target => console.log(target.url()));

  const page = await browser.newPage();
  await page.setViewport({width: 2000, height: 1000, deviceScaleFactor : 1, isMobile : false, hasTouch: false, isLandscape: false});
  await page.goto('https://www.snack-cart.in/wp-admin/export.php');
  await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './WPXML/'});
  await page.setDefaultNavigationTimeout(0);

  console.log("Lets enter the userid and password");
   await page.waitFor(5000);;
  await page.type("#user_login","rvikrama");
  await page.type("#user_pass","Physics123@");
  page.screenshot({path: 'example73.png'});

  await page.click('#wp-submit');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  page.screenshot({path: 'example74.png'});
  /*
  await Promise.all([
      //page.click('#wp-submit'),
      console.log("Cklick is done!"),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      console.log("Navigation is done!")
  ]).then(res => console.log('success', res))
  .catch(err => console.log('error', err));
  */
  console.log("Finish waiting for submit to return");
  await page.goto('https://www.snack-cart.in/wp-admin/export.php');
  console.log("Now we reached export page");
  page.screenshot({path: 'example75.png'});

   await page.evaluate(() => {
       $('input:radio[name="content"][value="product"]').attr('checked',true);
       $("#submit").val("TXXXT");
    });

  await page.click('#submit');
  await page.waitFor(20000);;

  await page.goto('https://www.snack-cart.in/wp-admin/export.php?download=true&cat=0&post_author=0&post_start_date=0&post_end_date=0&post_status=0&page_author=0&page_start_date=0&page_end_date=0&page_status=0&content=product&attachment_start_date=0&attachment_end_date=0&submit=Download+Export+File');
  await page.waitFor(40000);

  console.log("Take screenshot");
  await page.screenshot({path: 'example76.png'});
  await browser.close();
})();
