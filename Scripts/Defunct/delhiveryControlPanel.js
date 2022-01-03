/*
 * Delivery website puppetter parser
 */
 const puppeteer = require('puppeteer');

(async () => {

	function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
	}

  const browser = await puppeteer.launch({args: ['--no-sandbox']});
  browser.on('targetchanged', target => console.log(target.url()));

  const page = await browser.newPage();
  await page.setViewport({width: 2000, height: 1000, deviceScaleFactor : 1, isMobile : false, hasTouch: false, isLandscape: false});
  await page.goto('https://cl.delhivery.com/#/home');
  //await page.waitForNavigation( { timeout: 10000 });
  await sleep(10000);

  await page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: './'});
  await page.setDefaultNavigationTimeout(0);

  console.log("Lets click the login button");
 

  await page.click('#btn-login');
  //await page.waitForNavigation({ waitUntil: 'networkidle0' });
   await sleep(10000);

   console.log("Lets enter the userid and password");
  await page.type("#mat-input-0","CUCULUEXPRESS");
  await page.type("#mat-input-1","Physics123@");
  await page.click("#mat-input-1");
  await sleep(2000);
  await page.screenshot({path: 'example75.png'});
  await page.click('#cdk-step-content-0-0 > div > form > button.dlv-btn.dlv-btn-primary.dlv-btn-lg.dlv-btn-block.mt-20');
  //await page.click('#cdk-step-content-0-0 > div > form > button.dlv-btn.dlv-btn-primary.dlv-btn-lg.dlv-btn-block.mt-20');
  console.log("Clicked on the signin button");
  //await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await sleep(10000);
  await page.screenshot({path: 'example76.png'});

  //await page.goto('https://cl.delhivery.com/app/#/domestic/orders');
  console.log((await page.goto('https://cl.delhivery.com/app/#/domestic/orders')).request().headers());
  //await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await sleep(10000);
  
  /*
  await page.type("#user_login","admin_SnackCart");
  await page.type("#user_pass","Emp^dGw0GCoZz00zgF");
  

  await page.click('#wp-submit');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  page.screenshot({path: 'example74.png'});
  */
  /*
  await Promise.all([
      //page.click('#wp-submit'),
      console.log("Cklick is done!"),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      console.log("Navigation is done!")
  ]).then(res => console.log('success', res))
  .catch(err => console.log('error', err));
  */

  /*
  console.log("Finish waiting for submit to return");
  await page.goto('https://snack-cart.in/wp-admin/export.php');
  console.log("Now we reached export page");
  page.screenshot({path: 'example75.png'});

   await page.evaluate(() => {
       $('input:radio[name="content"][value="product"]').attr('checked',true);
       //$("#submit").val("TXXXT");
    });

  await page.click('#submit');
  await page.waitFor(10000);;
  */
   console.log("Take screenshot");
   await page.screenshot({path: 'example77.png'});
   await browser.close();
   
})();
