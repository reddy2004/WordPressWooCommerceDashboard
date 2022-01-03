//angular
var myApp = angular.module('myInventoryApp', []);


myApp.controller('myInventory', ['$scope', function ($scope) {

    $scope.searchKey = "";
    $scope.cached_product_list = [];

    $scope.meta = {};
    $scope.meta.lastTimeString = "";
    $scope.meta.updateTime = Math.floor((new Date()).getTime() / 1000);
    $scope.inProgressTasks = {};

    $scope.disableSyncButton = false;

    $scope.knownOrders = [{orderid: 1111, name: "One"},{orderid: 2222, name: "Two"}];

    $scope.init = function() {
        $.get("getAllProductList", function (datat) {
            $scope.cached_product_list = datat.productList;
            $scope.meta.updateTime = datat.updateTime;
            //alert(datat.productList.length);
        });
    }
    
    //history log of a single product
    $scope.productLogs = [];

    $scope.onSearchText = function() {
        $scope.searchKey = $("#searchInput").val();
    }

    $scope.printProductList = function() {
        printJS('productsListing', 'html');
    }

    $scope.transactionLog = function(productid) {
        alert("transactionLog for " + productid);
    }

    $scope.getTimeAgo = function() {

        if (typeof $scope.inProgressTasks == 'undefined' ||
                typeof $scope.inProgressTasks.syncQuantityInfo == 'undefined') {
            return "-";
        }
        var lastTime = $scope.inProgressTasks.syncQuantityInfo.lastupdatetime;
        var currTime = Math.floor((new Date()).getTime() / 1000);
        var seconds = currTime - lastTime;
        var min = Math.floor(seconds/60);
        var hours = Math.floor(min/60);

        if (hours > 3) {
            return hours + "h ago";
        } else if (min > 2) {
            return min + "m ago";
        } else {
            return seconds + "s ago";
        }
    }

    $scope.showProductInfo = function(productid, name) {
        //alert("Not yet impliment: " + productid);
        $scope.ModalTitleText = "Edit inventory for " + name;
        $scope.currentlyViewingProduct = productid;

        $("#exampleModalLongSync").modal();

        var today = new Date().toISOString().slice(0, 10);
        $scope.inventoryUpdateComment = "Manual Edit: " + today;

        $scope.pathOfProductImage = "productImages/p" + productid + ".png";
        $scope.getSingleProductInfo(productid, function(d2) {
            //alert(JSON.stringify(d2));
            $("#exampleModalLongSync").modal('hide');
            $scope.WebsiteOldCount = d2.quantity;
            $scope.RoomChange = 0;
            $scope.WebsiteChange = 0;
            $scope.WebsiteNewCount = d2.quantity;
            $scope.expiry = d2.expiry;

            $scope.regularPrice = d2.regularPrice;
            $scope.salePrice = d2.salePrice;
            $scope.buyPrice = 0;

            for (var k=0;k<$scope.cached_product_list.length;k++) {
                if ($scope.cached_product_list[k].id == productid ) {
                    $scope.RoomOldCount = $scope.cached_product_list[k].inventory;
                    $scope.RoomNewCount = $scope.cached_product_list[k].inventory;
                }
            }

            $("#invUpdateModal").modal();
        });
    }

    $scope.getSingleProductInfo = function(productid, callback) {
        var postdata = {};
        postdata.productid = productid;
        $.post("getSingleProductInfo", JSON.stringify(postdata))
            .done(function( data ) {
            console.log(data);
            callback(data);
        });
    }

    $scope.SaveChangesToProductInventory = function(productid) {

        var postdata = {};
        postdata.productid = productid;
        postdata.RoomNewCount =  $scope.RoomNewCount;
        postdata.WebsiteNewCount = $scope.WebsiteNewCount;
        postdata.product_comment = $("#product_comment").val();
        postdata.expiry = $("#product_expiry_date").val();
        postdata.product_regular_price = $("#product_regular_price").val();
        postdata.product_sale_price = $("#product_sale_price").val();
        postdata.product_buy_price = $("#product_buy_price").val();

        $.post("updateInventoryCounts", JSON.stringify(postdata))
            .done(function( data ) {
        });

        for (var k=0;k<$scope.cached_product_list.length;k++) {
            if ($scope.cached_product_list[k] == productid) {
                $scope.cached_product_list[k].expiry = $("#product_expiry_date").val();
                $scope.cached_product_list[k].inventory = $scope.RoomNewCount;
                $scope.cached_product_list[k].website = $scope.WebsiteNewCount;
            }
        }

        $("#invUpdateModal").modal('hide');
    }

    $scope.decrementProductInRoom = function(productid) {
        $scope.RoomChange -= 1;
        $scope.RoomNewCount -=1;
    }

    $scope.incrementProductInRoom = function(productid) {
        $scope.RoomChange += 1;
        $scope.RoomNewCount +=1;
    }

    $scope.decrementProductInWebsite = function(productid) {
        $scope.WebsiteChange -= 1;
        $scope.WebsiteNewCount -=1;
    }

    $scope.incrementProductInWebsite = function(productid) {
        $scope.WebsiteChange += 1;
        $scope.WebsiteNewCount +=1;
    }

    $scope.syncWebsiteStockCount = function() {
        $.get("updateProductQuantityData", function (datat) {
            $scope.inProgressTasks = datat;
            $scope.inProgressTasks.syncQuantityInfo.percent = Math.ceil($scope.inProgressTasks.syncQuantityInfo.percent);
        });
    }

    $scope.clearSearch = function() {
        $("#searchInput").val("");
        $scope.searchKey = "";
    }
    
    $scope.showOrdersInList = function() {
        $.get("getProcessingOrdersLite", function (datat) {
            
            //$("#exampleModalLongSync").modal('hide');        
            var data = datat.orders;
            $scope.meta = datat.meta;
            
            $scope.processingOrdersData = [];
            for (var i=0;i<data.length;i++) {
                if (typeof data[i].inventoryUpdateIsDone == 'undefined') {
                    data[i].inventoryUpdateIsDone = false;
                    data[i].orderGoodToDelete = false;
                }
                $scope.processingOrdersData.push(data[i]);
            }
            $("#exampleModalAddOrders").modal();
        });
    }

    //Remove order from our list and update it as good to delete.
    $scope.dropOrder = function(orderid) {
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                $scope.processingOrdersData[i].orderGoodToDelete = true;
                $scope.processingOrdersData[i].isDirty = false;
                $scope.isDirtyMessage = "";
                $scope.isDirty = false;
                var orderStr = angular.toJson($scope.processingOrdersData[i]);
                $.post("saveOrder", orderStr)
                    .done(function( data ) {
                    console.log(data);
                });
                alert("Inventory has not been changed for this order. You can remove this order now in /orderflowadmin");
                break;
            }
        }
    }

    $scope.confirmOrderToDB = function() {

    }


    //First update the inventory and then mark that the order is good to delelte.
    $scope.updateInventoryForOrder = function (orderid) {
        var orderPosition = -1;
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                $scope.processingOrdersData[i].orderGoodToDelete = true;
                orderPosition = i;
                break;
            }
        }

        var orderStr = angular.toJson($scope.processingOrdersData[orderPosition]);
        alert(orderPosition + " : " + orderStr);
        alert("This will subtract invoice items from local DB and additional items from both localDB and website " + $scope.changeStatusOfOrder);
        $.post("confirmOrderToDB", orderStr)
            .done(function( data ) {
            console.log(data);
        });
    }
    
}]);