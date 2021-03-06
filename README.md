# WordPressWooCommerceDashboard
A dashboard for managing orders and inventory for a wordpress e-commerce site which has woo commerce plugin installed. This program provides shipping tracking for Delhivery. 

I developed this Dashboard for managing a wordpress e-commerce site. www.snack-cart.in. We initially got the site developed on wordpress as the expected traffic would be quite less and wordpress is easy to get started with. Our delivery partner was www.delhivery.com.

However, working with wordpress was a pain for the following reasons.

(a) Wordpress backend is pathetic, slow, cluttered and difficult to update.

(b) Wordpress keeps messing up the inventory. Managing inventory via wordpress was a nightmare.

(c) Not mobile friendly.

(d) It does not have a dashboard to track the order until its delivered. Doing manually is cumbersome.

Hence, this tool was born.

Let's go over how to set it up. The tool is developed with javascript (nodejs) and hence you need a node runtime to configure this. Firstly, clone the project to your local workspace and the folder structure should look something like the screenshot below. You can do an npn init and install to download all the node packages required to run this.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/folders.png)

Next, go to the config.json file and add the user credentials. I'm not using a complex encrypted setup as it does not serve any purpose in my case. You can add it if you want your tool to be secure. Once install navigate to the page after starting "node aserver.js". Use https:// instead of http://. You will land on the main page. i.e https://ip:port/orderflowadmin.

You can then navigate to https://ip:port/manage to see the screen as shown below.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/manage_main.png)

Click on Bootstrap, this should download all the product list in your wordpress site. It download both active and dormant product list. You can see the progress on your console where you are running this tool. Meanwhile navigate to https://ip:port/orderflowadmin, where you can see that the list of orders is empty. Click on sync to download all the orders that are in "processing" state.

This is the page from where you manage your orders.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_main.png)

Click on "New" on the right most column to either approve or discard the order. The order state is updated in the tool and your wordpress site is *not* updated. This is important so that the tool does not break your exisitng workflows.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_approvals.png)

You can also click on the "Order ID" on the leftmost column and see the items in that order. You can add/subtract items or add new ones to the order. For ex. Adding free gifts. Updating this product list in order is important since this information will be used to update the inventory. In my case, we would sometimes send items in lieu of ordered items if some of the order items are not present, and sometimes free gifts. Updating the inventory on wordpress is a pain.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_items.png)

You can make sure that the list on this tool is the exact set of items that is shipping to the customer. Dont worry about what the wordpress has as the order. We can update that change later on with this tool.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_add_subtract_items.png)

In my case, The tool was used by other folks who would actually pack items in the warehouse. You can add comments here, if there is someone other than you who is using the tool.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_add_comments.png)

On the last column, there is a button below the order status. This button is in sync with www.delhivery.com and you can use that to track the status of the order until it is sucessfully delivered or returned back to the warehouse. www.delhivery.com is a shipping company in India, like Fed-ex, Blue-dart etc. You can integrate other partners and if you are familiar with JS, then it should be easy to do.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/orders_tracking.png)

The next, and the more important part of the tool is the inventory management. Using Wordpress, I had faced some issues with inventory.

(a) Wordpress inventory management is useless and does not work as expected.

(b) Sometimes, we ship free items, or items get expired or we send incorrect items by mistake. Updating such cases is difficult in wordpress.

(c) Ditto with combo packages and items sold outside the site. Ex. on instagram. We cannot maintain two sets of inventories and two warehouses for this right?

The below screenshots shows the list of all items in the site and the quantity in the stockroom vis-a-vis what is updated in wordpress. Please navigate to https://ip:port/inventoryadmin to see the inventory list.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/inventory_main.png)

You can also search for items. This is usefull as it is difficult to browse the list in a mobile phone and you dont get a search option on the browser as well.

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/inventory_search.png)

Clicking on the orders button on the top right shows the list of orders that are in "processing" state. This is a subset of orders that you see in https://ip:port/orderflowadmin. Here you can accept or drop the order. Drop does nothing. Accepts updates the inventory. The inventory is updated based on the changes that are tracked in the tool. If you have made changes to the order, your changes are accepted. Basically the items seen in https://ip:port/orderflowadmin for that order is decremented in the inventory. You can also manually add (ex. New stock in the warehouse) or subract (expired items, sold outside the site, lost etc).

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/inventory_order_accept_reject.png)

To make sure that the wordpress site has the correct information of what is present in the stockroom/warehouse, you must have a single source of truth. Here the inventory page shows you both the items in the stock room vis-a-vis the wordpress database. As long as you can make sure that the items shown in warehouse is correct in this tool, you can always 'fix' the wordpress's inventory by syncing this data. Again this is a manual effort. The grayed out rows means item is not present. 'White' means all okay. 'Yellow' means there is a mismatch and you need to fix it. Refer to the previous screenshots

Below you can see the popup that appears when you click on a product. This is the page where you can update both the stockroom quantity and wordpress quantity. 

![alt text](https://github.com/reddy2004/WordPressWooCommerceDashboard/blob/main/screenshots/inventory_product_update.png)
