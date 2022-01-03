const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  browser.on('targetchanged', target => console.log(target.url()));

  const page = await browser.newPage();
  await page.setViewport({width: 2000, height: 1000, deviceScaleFactor : 1, isMobile : false, hasTouch: false, isLandscape: false});
  await page.goto('https://www.snack-cart.in/wp-admin/post.php?post=15957&action=edit');
  await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: '../WPXML/'});
  await page.setDefaultNavigationTimeout(0);

  console.log("Lets enter the userid and password");

  await page.type("#user_login","admin_SnackCart");
  await page.type("#user_pass","Emp^dGw0GCoZz00zgF");
  

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
  await page.goto('https://www.snack-cart.in/wp-admin/post.php?post=15957&action=edit');
  console.log("Now we reached orders page");
  page.screenshot({path: 'example75.png'});

  // await page.evaluate(() => {
  //     $('input:radio[name="content"][value="product"]').attr('checked',true);
  //     //$("#submit").val("TXXXT");
  //  });

  const yourHref = await page.$eval('.button.exists', anchor => anchor.getAttribute('href'));
  console.log("yourHref= " + yourHref);

  page.on('response', intercept=>{
      if(intercept.url().endsWith('.pdf')){
          console.log(intercept.url());
          console.log('HTTP status code: %d', intercept.status());
          console.log(intercept.headers());
      }
  });


  //await Promise.all([
      await page.goto(yourHref, {
          waitUntil: 'domcontentloaded',
      });
  //]).then(res => console.log('success', res))
  //.catch(err => console.log('error', err));
  

  //await page.click('.button.exists');
  //await page.waitFor(10000);;

   console.log("Take screenshot");
   await page.screenshot({path: 'example76.png'});

  var output = await page.evaluate(() => {
      return;
    });


   //await browser.close();
})();
