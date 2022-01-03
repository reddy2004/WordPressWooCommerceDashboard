//angular
var myApp = angular.module('myOrderFlowApp', []);

myApp.controller('myOrderFlow', ['$scope', function ($scope) {

    $scope.cached_product_list = []; //fetched only on first page load or refresh/sync
    $scope.processingOrdersData = [];
    $scope.changeStatusOfOrder = "00000";
    $scope.currentlyViewingOrderCustomOrderid = "";
    $scope.meta = {};
    $scope.currentlyViewingOrder = "0";
    $scope.isAdminDashboard = false;
    $scope.OFWindow = "OFF";
    $scope.OFButtonClass = "btn btn-secondary";

    $scope.toggleOFFlag = function() {
        if ($scope.OFWindow == "ON") {
            $scope.OFWindow = "OFF";
            $scope.OFButtonClass = "btn btn-secondary";
            $.get("disableOFWindow", function (datat) {

            });
        } else {
            $scope.OFWindow = "ON";
            $scope.OFButtonClass = "btn btn-primary";
            $.get("enableOFWindow", function (datat) {
                
            });
        }
    }

    $scope.toggleMode = function() {
        $scope.isAdminDashboard = !$scope.isAdminDashboard;
    }

    $scope.getTimeAgo = function() {
        if (typeof $scope.meta.updateTime == 'undefined') {
            return "";
        } else {
            var lastTime = $scope.meta.updateTime;
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
    }

    $scope.onSearchText = function() {
        $scope.searchKey = $("#searchInput").val();
    }

    $scope.SaveChangesToOrderComments = function(orderid) {
        var comments = $("#commentInputText").val();
        var orderPosition = -1;
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId ==orderid) {
                $scope.processingOrdersData[i].customData.comments = comments;
                $scope.processingOrdersData[i].customData.hasComment = true;
                orderPosition = i;
                break;
            }
        }
        $scope.currentlyViewingOrder = 0;
        $("#exampleModalComments").modal('hide');
        var orderStr = angular.toJson($scope.processingOrdersData[orderPosition]);
        $.post("saveOrder", orderStr)
            .done(function( data ) {
            console.log(data);
        });
    }

    $scope.printManifest = function() {
        
        $("#manifestTable").css({display: 'inline'});
        printJS('manifestTable', 'html');
        $("#manifestTable").css({display: 'none'});
        
    }

    $scope.updateCustomDataFlags = function() {
        for (var x = 0; x < $scope.processingOrdersData.length; x++) {
            var orderStruct = $scope.processingOrdersData[x];
            for (var i = 0; i< orderStruct.items.length; i++) {
                if (orderStruct.items[i].supplimented_quantity != 0) {
                    orderStruct.customData.modifiedInvoice = 1;
                    orderStruct.customData.sameAsInvoice = 0;
                }
                 if (orderStruct.items[i].quantity == 0) {
                    orderStruct.customData.supplimentaryItemsIncluded = 1;
                    orderStruct.customData.sameAsInvoice = 0;
                }           
            }
        }

    }

    $scope.printLabel22 = function() {
        printJS('printlayout', 'html');
    }

    $scope.printCustomLabel = function(orderid) {

        var trackingId = "";
        for (var x = 0; x < $scope.processingOrdersData.length; x++) {
            if ($scope.processingOrdersData[x].OrderId ==orderid) {
                if ($scope.processingOrdersData[x].StatusSeq == 1) {
                    alert("Wait for the order to be approved before printing label");
                    return;
                }

                trackingId = $scope.processingOrdersData[x].shipping.trackingId;
                if (trackingId.length == 0 || trackingId == "") {
                    alert("Manifest is not generated. Generate manifest and press sync button");
                    return;
                }
            }
        }

        $.get("getLabelJson?trackingId=" + trackingId, function (datat) {
           
            $("#invoiceImage").attr('src','invoicesPreview/' +  orderid + '.png');
            $("#barcode").attr('src', datat.packages[0].barcode);
            $("#oidcode").attr('src', datat.packages[0].oid_barcode);
            $("#pincode").text(datat.packages[0].pin);
            $("#scancode").text(datat.packages[0].sort_code);
            $("#rtoaddress").text("Return address : " + datat.packages[0].radd);
            $("#sName").text(datat.packages[0].name);
            $("#sAddress").text(datat.packages[0].address);
            $("#sDestination").text(datat.packages[0].destination);
             $("#sPin").text("PIN : " + datat.packages[0].pin);
            $("#pt").text(datat.packages[0].pt);
            $("#rs").text("₹" + datat.packages[0].rs);

            $("#p1").text("₹" + datat.packages[0].rs);
            $("#p2").text("₹" + datat.packages[0].rs);
            $("#p3").text("₹" + datat.packages[0].rs);
            $("#p4").text("₹" + datat.packages[0].rs);
            
            //alert(datat.packages[0].pin);
            var alllabelinfo = document.getElementById('alllabelinfo');
            alllabelinfo.style.transform = 'rotate(90deg)';

            $scope.changeStatusOfOrder = orderid
            $scope.applyStatus(3, 'Invoice Printed', false);
           // alert("opening printjs");
           $("#examplePrinter").modal();
            //printJS('printlayout', 'html');
          //  alert("done printjs");
        });
        

    }


    $scope.syncOrdersFromServer = function() {
        if ($scope.isAdminDashboard == true) {
            $scope.syncOrders();
        } else {
            $scope.syncLite(false);
            //alert("lite sync");
        }
    }

    $scope.syncLite = function(isAdmin) {
        //$scope.SyncTitleText = "Sync Orders to Local DB";
        //$("#exampleModalLongSync").modal();
        $scope.isAdminDashboard = isAdmin;

        $.get("getAllProductList", function (datat) {
            $scope.cached_product_list = datat.productList;
            //alert(datat.productList.length);
        });

        $.get("getProcessingOrdersLite", function (datat) {
            
            //$("#exampleModalLongSync").modal('hide');        
            var data = datat.orders;
            $scope.meta = datat.meta;
            
            $scope.processingOrdersData = [];
            for (var i=0;i<data.length;i++) {
                console.log("--> " + $scope.isAdminDashboard);
                //data[i].customData.handDehandDelivery = true;
                if ($scope.isAdminDashboard == false) {
                    if (typeof(data[i].shipping) != 'undefined' &&
                        (data[i].shipping.status == "new" || data[i].shipping.status == 'manifested' || data[i].removedInWp == false)) {
                        $scope.processingOrdersData.push(data[i]);
                    }
                } else {
                    $scope.processingOrdersData.push(data[i]);
                }
            }

            $scope.updateCustomDataFlags();
            setTimeout(function() {
                $scope.message = 'Fetched after two seconds';
                console.log('message:' + $scope.message);
                $scope.$apply(); //this triggers a $digest
            }, 200);

            $scope.meta.lastTimeString = $scope.getTimeAgo();
        });
    }

    $scope.syncOrders = function() {
        $scope.SyncTitleText = "Sync Orders to Local DB";
        $("#exampleModalLongSync").modal();
        $.get("getProcessingOrders", function (datat) {
            
            $("#exampleModalLongSync").modal('hide');        
            var data = datat.orders;
            $scope.meta = datat.meta;
            
            $scope.processingOrdersData = [];
            for (var i=0;i<data.length;i++) {
                data[i].customData.handDehandDelivery = true;
                $scope.processingOrdersData.push(data[i]);
                console.log("-->" + JSON.stringify(data[i]));
            }

            $scope.updateCustomDataFlags();
            setTimeout(function() {
                $scope.message = 'Fetched after two seconds';
                console.log('message:' + $scope.message);
                $scope.$apply(); //this triggers a $digest
            }, 200);


            $scope.meta.lastTimeString = $scope.getTimeAgo();
        });

        //Now get all the products we have.
        //product_id, name
        $.get("getAllProductList", function (datat) {
            $scope.cached_product_list = datat.productList;
        });
    }

    $scope.listOrderItems = function(orderid) {
        $scope.ModalTitleText = "Viewing all items to be shipped in this order";
        $scope.updateCustomDataFlags();

        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId ==orderid) {
                

                for (var j=0;j<$scope.processingOrdersData[i].items.length;j++) {
                    $scope.processingOrdersData[i].items[j].path = "productImagesPreview/p" + $scope.processingOrdersData[i].items[j].product_id + ".png";
                }
                $scope.itemsInOrder = $scope.processingOrdersData[i].items;
                $scope.isDirtyMessage = $scope.processingOrdersData[i].isDirty? "Changes not saved! Click to " :"";
                $scope.isDirty = $scope.processingOrdersData[i].isDirty? true : false;
                $scope.processingOrdersData[i].customData.orderid = orderid;
                $scope.customData = $scope.processingOrdersData[i].customData;
                //alert(JSON.stringify($scope.processingOrdersData[i].items));
                break;
            }
        }
        $scope.currentlyViewingOrder = orderid;
        $("#exampleModalLongOrderItems").modal();
    }

    $scope.listPreviousCustomerOrders = function() {
        if ($scope.isAdminDashboard) {
            $scope.ModalTitleText = "Viewing all previous orders from this Customer";
            $("#exampleModalLong").modal();
            setTimeout(function(){ $("#exampleModalLong").modal('hide'); }, 30000);
        }
    }

    $scope.changeStatus = function(orderid, name) {
        if ($scope.isAdminDashboard) {
            $scope.ModalTitleText = "Change Status for " + orderid + " " + name;
            $scope.changeStatusOfOrder = orderid;
             $("#exampleModalLongStatus").modal();
        } else {
            for (var i=0;i<$scope.processingOrdersData.length;i++) {
                if ($scope.processingOrdersData[i].OrderId == orderid) {
                     if (parseInt($scope.processingOrdersData[i].StatusSeq) == 1) {
                        alert("Order is not yet approved!");
                        return;
                     }
                }
            }
            //Order is in different state.allow to change.
            $scope.ModalTitleText = "Change Status for " + orderid + " " + name;
            $scope.changeStatusOfOrder = orderid;
            $("#exampleModalLongStatus").modal();
        }

    }

    $scope.applyStatus = function(seq, status, showAlert) {
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == $scope.changeStatusOfOrder) {
                var saveChanges = false;
                if (parseInt($scope.processingOrdersData[i].StatusSeq) == seq || (seq >= 20 && seq <= 24)) {
                    //Dont say anything.
                } else if (parseInt(seq) == 1) {
                    $scope.processingOrdersData[i].Status = status;
                    $scope.processingOrdersData[i].StatusSeq = seq;
                    saveChanges = true;
                } else if (parseInt($scope.processingOrdersData[i].StatusSeq) == 2 && 
                    (parseInt(seq) == 3 || parseInt(seq) == 6 || parseInt(seq) == 7)) {
                        $scope.processingOrdersData[i].Status = status;
                        $scope.processingOrdersData[i].StatusSeq = seq;
                        saveChanges = true;
                } else if ((parseInt($scope.processingOrdersData[i].StatusSeq) == 6 || 
                    parseInt($scope.processingOrdersData[i].StatusSeq) == 7) && seq != 25) {
                    alert("You cannot change the status after item is shipped. Raise issue");
                } else {
                    $scope.processingOrdersData[i].Status = status;
                    $scope.processingOrdersData[i].StatusSeq = seq;
                    saveChanges = true;
                }

                if (seq == 7) {
                    $scope.processingOrdersData[i].customData.handDelivery = true;
                }

                if (saveChanges == true) {
                    $scope.SaveChangesToOrder( $scope.changeStatusOfOrder, showAlert);
                }
                break;
            }
        }
        $("#exampleModalLongStatus").modal('hide');
    }

    $scope.editComment = function(orderid, name) {
        
        if ( $scope.isAdminDashboard) {
            $scope.ModalTitleText = "Edit comments for order " + orderid + " " + name;
        } else {
            $scope.ModalTitleText = "Comments for " + orderid + " " + name;
        }

        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId ==orderid) {
                $("#commentInputText").val($scope.processingOrdersData[i].customData.comments);
                $scope.currentlyViewingOrder = orderid;
                break;
            }
        }
         $("#exampleModalComments").modal();
    }
    $scope.editPackingOptions = function(orderid, name) {
        $scope.ModalTitleText = "Edit Packing options for order " + orderid + " " + name;
        $scope.currentlyViewingOrder = orderid;
         $("#exampleModalComments").modal();
    }

    $scope.printInvoice = function(orderid) {
        if ($scope.isAdminDashboard) {
            for (var i=0;i<$scope.processingOrdersData.length;i++) {
                if ($scope.processingOrdersData[i].OrderId == orderid) {
                    if ($scope.processingOrdersData[i].StatusSeq >= 2) {
                        //alert($scope.processingOrdersData[i].invoiceLink);
                        console.log($scope.processingOrdersData[i].invoiceLink);
                        $scope.applyStatus(3, 'Invoice Printed', false);
                        //intJS($scope.processingOrdersData[i].invoiceLink, 'pdf');
                        //printJS('invoices/16140.txt');
                        printJS("invoices/16159.png", 'image');
                        //window.open($scope.processingOrdersData[i].invoiceLink, "Invoice " + orderid, '')
                        break;
                    } else {
                        alert("Order is not in Approved state");
                        break;
                    }
                    alert($scope.processingOrdersData[i].StatusSeq);
                }
            }            
        }
    }

    $scope.printDeliverySlip = function(orderid) {
        $scope.rtpImage = "RTP/" + orderid + ".png";
        alert("Showing combined label for order " + orderid + " & Link =" + $scope.rtpImage);
        $scope.currentlyViewingOrder = orderid;
        $("#exampleModalLabel").modal();
    }

    $scope.printLabel = function(orderid) {
        //alert(orderid);
        $("#exampleModalLabel").modal('hide');
        $scope.applyStatus(4, 'Delivery Label Generated', false);
        printJS("RTP/" + orderid + ".png", 'image');
    }

    $scope.incrementItemInOrder = function(orderid, productid) {
        //alert("Adding " + productid + " to order " + orderid);
        //ordd.edititems.
        var addItemResult = false;
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid && $scope.processingOrdersData[i].StatusSeq == 1) {
                var newcount = 1;
                for (var j=0;j<$scope.processingOrdersData[i].items.length;j++) {
                    if ($scope.processingOrdersData[i].items[j].product_id == productid) {
                        $scope.processingOrdersData[i].items[j].supplimented_quantity++;
                        $scope.processingOrdersData[i].isDirty = true;
                        $scope.isDirty = true;
                        addItemResult = true;
                        break;
                    }
                }
                break;
            }
        }
        return addItemResult;
    }
    $scope.decrementItemInOrder = function(orderid, productid) {
        var subtractItemResult = false;
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid  && $scope.processingOrdersData[i].StatusSeq == 1) {
                var newcount = 1;
                for (var j=0;j<$scope.processingOrdersData[i].items.length;j++) {
                    if ($scope.processingOrdersData[i].items[j].product_id == productid) {
                        if (($scope.processingOrdersData[i].items[j].supplimented_quantity + $scope.processingOrdersData[i].items[j].quantity) == 0) {
                            alert("Quantity cannot be negative!");
                        } else {
                            $scope.processingOrdersData[i].items[j].supplimented_quantity--;
                            $scope.processingOrdersData[i].isDirty = true;
                            $scope.isDirty = true;
                            subtractItemResult = true;
                        }
                        break;
                    }
                }
                break;
            }
        }
        return subtractItemResult;
    }

    //call only if you are sure that item is not there in the order.
    $scope.insertNewProductInOrder = function(orderid, product_id, name) {
        var addAdditionalItemResult = false;
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                if ($scope.processingOrdersData[i].StatusSeq != 1) {
                    alert("You can add item only for orders in 'New' status");
                    return;
                }
                $scope.processingOrdersData[i].items.push({"product_id":product_id,"quantity":0 ,"name":name,"supplimented_quantity":1});
                $scope.processingOrdersData[i].isDirty = true;
                addAdditionalItemResult = true;
                $scope.isDirty = true;
                break;
            }
        }
        return addAdditionalItemResult;
    }

    $scope.editTrackingId = function(orderid, customOrderid, trackingId) 
    {
        $scope.currentlyViewingOrder = orderid;
        $("#oidDelhivery").val(customOrderid);
        $scope.currentlyViewingOrderCustomOrderid = customOrderid;
        $scope.currentlyViewingOrderTrackingId = trackingId;
        $("#updateTrackingOid").modal();
        $("#updateTrackingOid").trigger('focus');
    }

    $scope.UpdateOidAsinDelhivery = function(orderid) 
    {
        $("#updateTrackingOid").modal('hide');
        $scope.currentlyViewingOrderCustomOrderid = "";
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                $scope.processingOrdersData[i].shipping.customoid = $("#oidDelhivery").val();
                $scope.processingOrdersData[i].isDirty = true;
                $scope.isDirty = true;
                $scope.SaveChangesToOrder(orderid, false);
                break;
            }
        }
    }

    $scope.AddItemToOrder = function(orderid) {
        if ($scope.cached_product_list.length == 0) {
            alert("Product List is *Not* yet downloaded. Click on Bootstrap button on /manage page to download");
            return;
        }
        $scope.currentlyViewingOrder = orderid;
        $("#exampleModalLongOrderItems").modal('hide');
        $("#addItemToOrderWindow").modal();
        $("#addItemToOrderWindow").trigger('focus');
    }

    $scope.addItemToOrderManual = function (orderid, product_id, name) {
        //Kept in a temporary array, do not add this to the order until saved from the order screen.
        if ($scope.incrementItemInOrder(orderid, product_id) == false) {
            //failed to add since its not in supplimentary quantity. So add a new item
            $scope.insertNewProductInOrder(orderid, product_id, name);
        }
        $("#addItemToOrderWindow").modal('hide');

        setTimeout(function(){ 
            $("#exampleModalLongOrderItems").modal();
            $("#exampleModalLongOrderItems").trigger('focus');
        }, 1000);
    }

    $scope.SaveChangesToOrder = function(orderid, showAlert) {
        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                $scope.processingOrdersData[i].isDirty = false;
                if (showAlert) {
                    alert("Order changes have been saved!");
                }
                $scope.isDirtyMessage = "";
                $scope.isDirty = false;
                var orderStr = angular.toJson($scope.processingOrdersData[i]);
                $.post("saveOrder", orderStr)
                    .done(function( data ) {
                    console.log(data);
                });
                break;
            }
        }
    }

    $scope.removeOrder = function(orderid) {
        var postdata = {OrderId: orderid};
        var goodToRemove = false;

        for (var i=0;i<$scope.processingOrdersData.length;i++) {
            if ($scope.processingOrdersData[i].OrderId == orderid) {
                if ($scope.processingOrdersData[i].orderGoodToDelete) {
                    $scope.processingOrdersData.splice(i, 1);
                    goodToRemove = true;
                    break;
                }
                else
                {
                    alert("Order is not updated/dropped for inventory changes (i.e /inventoryadmin). Process inventory first and then delete this order. If order is already processed in inventory, then refresh this page and try again");
                }
            }
        }
        $.post("removeOrder", JSON.stringify(postdata))
            .done(function( data ) {
            console.log(data);
            //$scope.syncOrders();
        });
    }
}]);
