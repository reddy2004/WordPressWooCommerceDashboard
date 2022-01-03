var volumeListData = null;
var volumeTable = null;
var root_volume = null;
var max_vol_id = 0;
var configDataJson = "";

var redfsSettings = {"Volumes" : "", "Free Space" : "", "Used Space" : "", "DedupeSavings" : "", "CompressionSavings" : ""};
var volumeSettings = {"Volume Name" : "", "Comments" : "", "HEX Color" : "", "HEX Color Mounted" : ""};

//angular
var myApp = angular.module('myApp',[]);

myApp.controller('myCtrl', ['$scope', function($scope) {
    $scope.operations = {};

    $scope.opsdata = {};

    $scope.greetMe = 'Hola!';
    $scope.mystyle = {
        "display" : 'none',
        "font-size" : "10px",
    }
    $scope.myrightstyle = {
        "display" : 'none',
        "font-size" : "15px",
    }
    $scope.anchorstyle = {
        "background-color" : "#FF00FF"
    }

    $scope.shout = function(){
      $scope.anchorstyle = {
          "background-color" : "#FFFF00"
      }
    }

    $scope.showOperationDialog = function(type) {
        $scope.aaopbutton = {
            "display" : "none"
        }
        alert(type);
    }

    $scope.parent = "rootVolume [0 -> 10]";
    $scope.volsize = "165 GB [Snapshot]";
    $scope.volname = "First Volume X";
    $scope.ctime = "March 20 2020 8:30AM GMT+5:30"

    $scope.update_operation_progress = function() {

        $scope.dedupeprogressstyle = {
            "width" : $scope.opsdata.dedupeProgress
        }
        $scope.compressionprogressstyle = {
            "width" : $scope.opsdata.compressionProgress,
            "color" : "#000000"
        }
        $scope.cleanprogressstyle = {
            "width" : $scope.opsdata.cleanProgress
        }
        $scope.raidprogressstyle = {
            "width" : $scope.opsdata.raidProgress
        }
        $scope.fsckprogressstyle = {
            "width" : $scope.opsdata.fsckProgress
        }

        $scope.backupprogressstyle = {
            "width" : $scope.opsdata.fsckProgress
        }

        $scope.cloudsyncprogressstyle = {
            "width" : $scope.opsdata.fsckProgress
        }

        $scope.aaprogressstyle = {
            "width" : $scope.opsdata.fsckProgress
        }

        $scope.dedupeString = $scope.opsdata.dedupeString;
        $scope.compressString = $scope.opsdata.compressString;
        $scope.cleanString = $scope.opsdata.cleanString;
        $scope.raidString = $scope.opsdata.raidString;
        $scope.fsckString = $scope.opsdata.fsckString;

        $scope.aaopbutton = {
            "display" : "none"
        }
    }
}]);


$("head").append (
    '<link '
    + 'href="//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.css" '
    + 'rel="stylesheet" type="text/css">'
);

$("head").append (
    '<link '
    + 'href="//cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.theme.css" '
    + 'rel="stylesheet" type="text/css">'
);

//For the dialog widget, it must be on top to be properly clickable.
$("body").append('<style> .ui-dialog { position: fixed; padding: .2em; } .ui-widget-overlay { overflow: auto; position: fixed; top: 0;left: 0;width: 50%;height: 80%;} .ui-front {z-index: 100;} </style>');
$("body").append('<style> label, input { display:block; } input.text { margin-bottom:8px; width:95%; padding: .4em; } textarea.text { margin-bottom:12px; width:95%; padding: .4em; } fieldset { padding:0; border:0; margin-top:25px; } h1 { font-size: 1.2em; margin: .6em 0; } .validateTips { border: 1px solid transparent; padding: 0.3em; } </style>');

$(document).ready(function() {
      
      $.get("allvolumelist", function( data ) {
            //serverJsonData = data;
            volumeListData = JSON.parse(data);
            console.log(data); 
            updateVolumeStatusWithEmpty();
      });  

      function volume_operation(op, volumeId, callback) {
         var datax = {"operation": op, "volumeId": volumeId};
          $.ajax({
              type: 'POST',
              url: '/volumeOperation',
              data: JSON.stringify (datax),
              success: function(data) {
                 //alert('data: ' + data);
                 callback();
              },
              contentType: "application/json",
              dataType: 'json'
          });
      }

      function show_volume_operation_options(volumeId) { 
            $("#ng-dialog-form-clone").dialog(
                 {  modal: true,
                    title: "Select Clone or Snapshot",
                    width: 400,
                    buttons: [                                    
                      {
                        text: "Clone Volume",
                        click: function() {
                          $( this ).dialog( "close" );
                          volume_operation("clone", volumeId, function(){
                              download_volume_data(function(data){
                                  //do loading operation after this.
                                  refresh_left_sidebar();
                                  update_table(true);
                              });
                          });
                        }
                      },
                      {
                        text: "Create Snapshot",
                        click: function() {
                          $( this ).dialog( "close" );
                          volume_operation("snapshot", volumeId, function(){
                              download_volume_data(function(data){
                                  //do loading operation after this.
                                  refresh_left_sidebar();
                                  update_table(true);
                              });
                          });
                        }
                      },
                      {
                        text: "Cancel",
                        click: function() {
                          $( this ).dialog( "close" );
                        }
                      } 
                    ]
                 });
      }

      //Traverse the list from root_volume
      function findVolume(current, volumeId) {

          if (current.volumeId == volumeId) {
              return current;
          }

          //current height is already done.
          var nextSibling = current.sibling;

          if (nextSibling != null) {
              var v = findVolume(nextSibling, volumeId);
              if (v != null) {
                  return v;
              }
          }

          for (var i = 0; i< current.children.length; i++) {
              var v = findVolume(current.children[i], volumeId);
              if (v != null) {
                  return v;
              }
          }
          return null;
      }

      function show_options_for_volume(volumeId) { 
            $("#ng-dialog-form").dialog(
               {  modal: true,
                  title: "Selected Volume Details",
                  width: 400,
                  buttons: [          
                    {
                      text: "New Clone/Snapshot",
                      click: function() {
                        $( this ).dialog( "close" );
                        show_volume_operation_options(volumeId);
                      }
                    },            
                    {
                      text: "Delete",
                      click: function() {
                        $( this ).dialog( "close" );
                        volume_operation("delete", volumeId, function(){
                            download_volume_data(function(data){
                                //do loading operation after this.
                                refresh_left_sidebar();
                                update_table(true);
                            });
                        });
                      }
                    },                 
                    {
                      text: "Save",
                      click: function() {
                        $( this ).dialog( "close" );
                        volume_operation("save", volumeId, function(){
                            download_volume_data(function(data){
                                //do loading operation after this.
                                refresh_left_sidebar();
                                update_table(true);
                            });
                        });
                      }
                    },
                    {
                      text: "Close",
                      click: function() {
                        $( this ).dialog( "close" );
                      }
                    } 
                  ]
               });
      }

      function updateVolumeStatusWithEmpty() {
            var array = volumeListData;
            for(i in array) {
              array[i].status = '-';
            }   

      }

      function download_volume_data(callback) {
        $.get("allvolumelist", function( data ) {
              //serverJsonData = data;
              volumeListData = JSON.parse(data);
              //volumeListData
              console.log(data);
              updateVolumeStatusWithEmpty();
              callback(data);
        });  
      }

  		function refresh_left_sidebar() {
          $('#mysidebar').remove();
          $('#leftenclosebar').animate({
            'width': '20px',
            'height': '100%',
            'background-color': 'gray'  // Confirm it shows up
          });               
          
          $('#volTreeBar').attr('windowsize','minimized');  
        	$("#volTreeBar").trigger("click");
      }

      var rightenclosebar, aggrOPsBar, volTreeBar, leftenclosebar;
      $('body').css({
          'padding-right': '20px',
          'padding-left': '20px'
      });
  		rightenclosebar = $("<div id='rightenclosebar' ></div>");
  		leftenclosebar = $("<div id='leftenclosebar' ></div>");
  		aggrOPsBar = $("<div id='aggrOPsBar' class='bg-secondary' windowsize='minimized'></div>");
			volTreeBar = $("<div id='volTreeBar' class='bg-secondary' windowsize='minimized'></div>");
  
      rightenclosebar.css({
            'position': 'fixed',
            'right': '0px',
            'top': '0px',
            'z-index': 999,
            'width': '10px',
            'height': '100%',
            'display' : 'block',
            'background-color': 'black'  // Confirm it shows up
      });
    
      aggrOPsBar.css({
            'float': 'right',
            'right': '0px',
            'top': '0px',
            'z-index': 999,
            'width': '20px',
            'height': '100%',
            //'margin': '16px 8px';
            'background-color': 'black'  // Confirm it shows up
      });

  		$('body').append(rightenclosebar);
  		$('#rightenclosebar').append(aggrOPsBar);
  
  		
      leftenclosebar.css({
            'position': 'fixed',
            'left': '0px',
            'top': '0px',
            'z-index': 100,
            'width': '20px',
            'height': '100%',
            'display' : 'block',
            'background-color': 'black'  // Confirm it shows up
      });
  
      volTreeBar.css({
            'float': 'left',
            'left': '0px',
            'top': '0px',
            'z-index': 100,
            'width': '20px',
            'height': '100%',
            //'margin': '16px 8px';
            'background-color': 'black'  // Confirm it shows up
      });
			
  		$('body').prepend(leftenclosebar);
  		$('#leftenclosebar').append(volTreeBar);    

  		$('#volTreeBar').click(function(e) {
        	e.stopPropagation();
					
        	if (volumeListData == null) {
              alert("Data not yet loaded, please try in a few seconds..");
              return;
          }
          console.log("--> " + $(this).attr('windowsize'));

        	if ('minimized' == $(this).attr('windowsize')) {
            	//Download the issue config to a JSON file
              function download(filename, text) {
                  var pom = document.createElement('a');
                  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                  pom.setAttribute('download', filename);

                  if (document.createEvent) {
                      var event = document.createEvent('MouseEvents');
                      event.initEvent('click', true, true);
                      pom.dispatchEvent(event);
                  } else {
                      pom.click();
                  }
              }

							//Bring out the left bar outside
              $('#leftenclosebar').animate({
                  'width': '800px',
                  'height': '100%',
                  'background-color': 'gray'  // Confirm it shows up
              });

              var mysidebar = $("<div id='mysidebar' ></div>");
              var konvadiv = $("<div id='konvadiv'> </div>"); 

              var htmlString2 = '<div style="width:90%;float: bottom; padding-bottom: 30px;">';
              htmlString2 += '<br><button type="button"  class="btn btn-dark btn-sm" id="btnSave">Download volume information</button>&nbsp;&nbsp; ';
              htmlString2 += '</div>';

              var buttons = $(htmlString2);
              mysidebar.append(buttons);
              
              mysidebar.css({
                  'float': 'right',
                  'right': '20px',
                  'top': '0px',
                  'z-index': 100,
                  'width': '780px',
                  'height': '100%',
                  'padding' : '5px',
                  'background-color': 'black'  // Confirm it shows up
              });    

            	//Set background for konva
              konvadiv.css({'background-color': 'white'});

              $('#leftenclosebar').append(mysidebar);
              $('#mysidebar').prepend(konvadiv);


              $(this).attr('windowsize','maximized');
              var height2 = window.innerHeight - 70;

              var stage = new Konva.Stage({
                    container: 'konvadiv',
                    width: 770,
                    height: height2,
                    draggable: true,
                    x: 0,
                    y: 0,
                    color: 'yellow',
                    fill : 'yellow'           
              });

              var layer2 = new Konva.Layer({draggable: true,fill: 'green', x:0, y:0});
              stage.add(layer2);

              var infoRect = new Konva.Rect({
                  x: 0,
                  y: 0,
                  width: 800,
                  height: 280,
                  fill: 'red',
                  opacity: 0,
                  stroke: 'black',
                  cornerRadius: 5,
                  shadowBlur: 10,
                  shadowOffsetX: 10,
                  shadowOffsetY: 3,
                  name: ''
              });
              layer2.add(infoRect);

              layer2.draw();

              stage.on('click', function (e) {
                  if (!(typeof e.target.name() == "undefined")) {
                    	if (e.target.name() == "DIV") {
                        console.log("cannot edit this..");
                      	alert("Currently you cannot edit the DIV section from within the UI, Edit JSON directly and upload it to the right place and refresh this page");
                      } else if (e.target.name() == "V0") {
                    			alert("This is the root of the document, you cannot edit this");
                  		} else {
                        	var volumeId = e.target.name().substring(1, e.target.name().length);
                    			show_options_for_volume(volumeId);
                      }
                  }
              });

              var current_volume_list = [];

              var load_volume_list = function() {
                    var array = volumeListData;
                    for(i in array) {
                      current_volume_list.push(array[i]);
                      console.log("volume " + JSON.stringify(array[i]));

                      if (array[i].volumeId > max_vol_id)
                        max_vol_id = array[i].volumeId;
                    }               	
              }

              var create_root_volume = function () {
                    root_volume = new Object();
                    root_volume.volumeId = 0;
                    root_volume.sibling = null;
                    root_volume.parentVolumeId = -1;
                    root_volume.parentIsSnapshot = false;
                    root_volume.volname = "rootVolume";
                    root_volume.children = [];
                    root_volume.width = 0;
                    root_volume.height = 0;
                    root_volume.color = 'yellow';
              }

              var create_volume = function(volumeId, parentVolumeId, volname, parentIsSnapshot) {
                    var obj = new Object();
                    obj.volumeId = volumeId;
                    obj.parentVolumeId = parentVolumeId;
                    obj.parentIsSnapshot = parentIsSnapshot;

                    //XXX todo fix
                    root_volume.sibling = null;

                    obj.volname = volname;
                    obj.children = [];
                    obj.width = 0;
                    obj.height = 0;
                    return obj;
              }

              //return net height added in this tree.
              var adjust_heights = function(current) {
                    //current height is already done.
                    var nextSibling = current.sibling;
                    var tree_start_height = current.height;

                    if (nextSibling != null) {
                        nextSibling.width = current.width + 1;
                        nextSibling.height = current.height;
                        tree_start_height = adjust_heights(nextSibling);
                    }

                    console.log(current.volname + "," + tree_start_height);

                    

                    for (var i = 0; i< current.children.length; i++) {
                        current.children[i].width = current.width + 1;
                        current.children[i].height = tree_start_height + 2; 
                        tree_start_height = adjust_heights(current.children[i]);
                    }

                    if (tree_start_height > current.height)
                      	return tree_start_height;
                    else
                      	return current.height;
              }
            	
              var find_and_insert = function(current, volume) {
                
                    if (volume.parentVolumeId == current.volumeId) {
                        if (volume.parentIsSnapshot) {
                          current.sibling = volume;
                        } else {
                          current.children.push(volume);
                          if (current.deleted == true)
                            current.color = 'gray';	
                          return true;
                        }
                    } else {
                        if (current.sibling != null && find_and_insert(current.sibling, volume))
                          	return true;
                        for (var i=0;i<current.children.length; i++) {
                            if (find_and_insert(current.children[i], volume))
                              return true;
                        }
                    }
                    return false;
              }

              //Adjust the list so that we can insert correctly. i.e parents come first before children
              var order_volume_list = function() {


              }

              //Insert this into the tree, do traversal
              var create_tree = function() {
                    load_volume_list();
                    create_root_volume();

                    //FIX this .. todo
                    order_volume_list();

                    for(var i = 0;i < current_volume_list.length; i++) {
                        var vol = create_volume(current_volume_list[i].volumeId, current_volume_list[i].parentVolumeId, current_volume_list[i].volname, current_volume_list[i].parentIsSnapshot);
                        find_and_insert(root_volume, vol);
                        console.log(JSON.stringify(vol));
                    }

                    var workingtreeheight = adjust_heights(root_volume);
              }

              function volumebox2(volname, volumeId, x1, y1, color2) {
                    var volCode = "V" + volumeId;
                    var group = new Konva.Group({
                        x: x1,
                        y: y1,
                        width: 200,
                        height: 70,
                        rotation: 0,
                        //draggable: true,
                        opacity: 1,
                        fill: 'green',
                        stroke: 'black',
                        strokeWidth: 1

                    });

                    var rect = new Konva.Rect({
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 70,
                        //fill: color2,
                        stroke: 'black',
                        cornerRadius: 5,
                        shadowBlur: 10,
                        shadowOffsetX: 10,
                        shadowOffsetY: 3,
                        name: volCode
                    });


                    var text3 = new Konva.Text({
                        x: 10,
                        y: 10,
                        fontFamily: 'Verdana',
                        fontSize: 40,
                        text: volname,
                        fill: 'black'
                    });	

                    group.add(text3);      
                    group.add(rect);
                    return group;		    			
              }

              //200x70 is box size
              function draw_connector(mylayer, w1, h1, w2, h2) {
                    let quad1 = new Konva.Shape({
                        stroke: 'black',
                        strokeWidth: 10,
                        lineCap: 'round',
                        sceneFunc: function(context) {
                          context.beginPath();
                          context.moveTo(w1*250 + 100, h1*50 + 70 + 4);
                          context.quadraticCurveTo(w1*250 + 100, h2*50 + 35,w2*250 - 4,h2*50 + 35);
                          context.strokeShape(this);
                        }
                    });        	
                    mylayer.add(quad1);
              }

              function draw_line(mylayer, w1, h1, w2, h2) {
                    var redLine = new Konva.Line({
                          points: [w1*250 + 200 + 4, h1*50 + 35, w2*250 - 4, h2*50 + 35],
                          stroke: 'black',
                          strokeWidth: 10,
                          lineCap: 'round',
                          lineJoin: 'round'
                    });      	
                    mylayer.add(redLine);
              }

              var draw_vol_tree = function(mylayer, current) {
                    var volbox1 = volumebox2(current.volname, current.volumeId, current.width*250, current.height*50, current.color);
                    mylayer.add(volbox1);
                
                    if (current.sibling != null) {
                        draw_vol_tree(mylayer, current.sibling);
                        draw_line(mylayer, current.width, current.height, current.sibling.width, current.sibling.height);
                    }

                    if (current.children.length > 0) {
                        for (var i=0;i<current.children.length;i++) {
                            draw_vol_tree(mylayer, current.children[i]);
                            draw_connector(mylayer, current.width, current.height, current.children[i].width, current.children[i].height);
                        }
                    }
              }

              //Lets create the tree here.
              create_tree();
              draw_vol_tree(layer2, root_volume);    

              layer2.draw();
              stage.scale({ x: 0.3, y: 0.3 });
              stage.batchDraw();

              $("#btnSave").click(function() { 
                  download('volumeList.json', JSON.stringify(volumeListData));     
              });              
      		} else {
              $('#mysidebar').remove();
              $('#leftenclosebar').animate({
                'width': '20px',
                'height': '100%',
                'background-color': 'gray'  // Confirm it shows up
              });               

              $(this).attr('windowsize','minimized');             
          }    
      });
      
  		$('#aggrOPsBar').click(function(e){
            e.stopPropagation();

              //Download the debug info to a HTML file
              function download(filename, text) {
                  var pom = document.createElement('a');
                  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                  pom.setAttribute('download', filename);

                  if (document.createEvent) {
                      var event = document.createEvent('MouseEvents');
                      event.initEvent('click', true, true);
                      pom.dispatchEvent(event);
                  } else {
                      pom.click();
                  }
              }
        
            if ('minimized' == $(this).attr('windowsize')) {

                $('#rightenclosebar').animate({
                    'width': '290px',
                    'height': '100%',
                    'background-color': 'gray'  // Confirm it shows up
                });            

                var mysidebar = $("#rightslideout"); //$("<div id='mysidebar6' ></div>");
                //mysidebar.html( $("#rightslideout").html());

                $("#rightslideout").css({
                  'float': 'left',
                  'right': '20px',
                  'top': '0px',
                  'z-index': 9999,
                  'width': '270px',
                  'height': '100%',
                  'padding' : '10px',
                  'color' : 'white',
                  'background-color': 'black'  // Confirm it shows up
                });            
                $("#rightslideout").show();

                $('#rightenclosebar').prepend(mysidebar);
                $(this).attr('windowsize','maximized');
              	
            } else {
                $('#rightslideout').hide();
                $('#rightenclosebar').animate({
                  'width': '20px',
                  'height': '100%',
                  'background-color': 'gray'  // Confirm it shows up
                });               

                $(this).attr('windowsize','minimized');             
            }
      });

      volumeTable = null;

      //Refresh thread, refreshes every 1 second
      setInterval(function(){
          if (volumeTable != null) {
              $.get("allvolumestatus", function( data ) {
                    statusData = JSON.parse(data).volumes;
                    for (var i=0; i < volumeTable.data().count(); i++) {
                        var temp = volumeTable.row(i).data();
                        for (var j=0; j< statusData.length; j++) {
                            if (statusData[j].volumeId == temp.volumeId) {
                               temp.status = statusData[j].status;
                               $('#table_id').dataTable().fnUpdate(temp,i,undefined,false);    
                            }
                        }
                    }
                    $scope = angular.element('[ng-controller=myCtrl]').scope();
                    $scope.$apply(function () {
                        var dxdata = {};
                        var odata = JSON.parse(data);
                        dxdata.dedupeProgress = odata.ops.dedupeProgress + "%";
                        dxdata.compressionProgress = odata.ops.compressionProgress + "%";
                        dxdata.cleanProgress = odata.ops.cleanProgress + "%";
                        dxdata.raidProgress = odata.ops.raidProgress + "%";
                        dxdata.fsckProgress = odata.ops.fsckProgress + "%";

                        dxdata.dedupeString = odata.ops.dedupeMessage;
                        dxdata.compressString = odata.ops.compressionMessage;
                        dxdata.cleanString = odata.ops.cleanMessage;
                        dxdata.raidString = odata.ops.raidMessage;
                        dxdata.fsckString = odata.ops.fsckMessage;
                        
                        $scope.opsdata = dxdata;
                        $scope.update_operation_progress();
                    });
              });

          }
      }, 1000);

      function update_table(showdata) {
          $(".loader").show();
          $('#table_id').hide();
          
          download_volume_data(function(data){
                if (volumeTable != null)
                  volumeTable.destroy();

                //Copy only the required data to dData aka display data.
                var dData = showdata ? volumeListData : {};

                volumeTable = $('#table_id').DataTable( {
                    data: dData,
                    columns: [
                    {
                        data: "volumeId",
                        title: "Vol ID"
                    },
                    {
                        data: "volname",
                        title: "Vol Name"
                    },
                    {
                        data: "parentvolname",
                        title: "Parent"
                    },
                    {
                        data: "mtime",
                        title: "Modified"
                    },
                    {
                        data: "ctime",
                        title: "Created"
                    },
                    {
                        data: "uniqueData",
                        title: "Unique Data"
                    },
                    {
                        data: "uniqueDataTimeStamp",
                        title: "Last Scanned"
                    },
                    {
                        data: "status",
                        title: "Status"
                    }]
                } );
                $(".loader").hide();
                $('#table_id').show(); 
          });

      }

      $("#sharedvols").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-light');
          $("#allvols").attr('class', 'col-2 bg-link');
          $("#snapshotvols").attr('class', 'col-2 bg-link');
          $("#leafvols").attr('class', 'col-2 bg-link');
          $("#aggrops").attr('class', 'col-2 bg-link');
          $("#aggrconfig").attr('class', 'col-2 bg-link');
          $("#xtable").show();
          $("#xconfig").hide();
          update_table(true);
      });

      $("#allvols").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-link');
          $("#allvols").attr('class', 'col-2 bg-light');
          $("#snapshotvols").attr('class', 'col-2 bg-link');
          $("#leafvols").attr('class', 'col-2 bg-link');
          $("#aggrops").attr('class', 'col-2 bg-link');
          $("#aggrconfig").attr('class', 'col-2 bg-link');
          $("#xtable").show();
          $("#xconfig").hide();
          update_table(true);
      });

      $("#snapshotvols").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-link');
          $("#allvols").attr('class', 'col-2 bg-link');
          $("#snapshotvols").attr('class', 'col-2 bg-light');
          $("#leafvols").attr('class', 'col-2 bg-link');
          $("#aggrops").attr('class', 'col-2 bg-link');
          $("#aggrconfig").attr('class', 'col-2 bg-link');
          $("#xtable").show();
          $("#xconfig").hide();
          update_table(true);
      });

      $("#leafvols").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-link');
          $("#allvols").attr('class', 'col-2 bg-link');
          $("#snapshotvols").attr('class', 'col-2 bg-link');
          $("#leafvols").attr('class', 'col-2 bg-light');
          $("#aggrops").attr('class', 'col-2 bg-link');
          $("#aggrconfig").attr('class', 'col-2 bg-link');
          $("#xtable").show();
          $("#xconfig").hide();
          update_table(true);
      });

      $("#aggrops").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-link');
          $("#allvols").attr('class', 'col-2 bg-link');
          $("#snapshotvols").attr('class', 'col-2 bg-link');
          $("#leafvols").attr('class', 'col-2 bg-link');
          $("#aggrops").attr('class', 'col-2 bg-light');
          $("#aggrconfig").attr('class', 'col-2 bg-link');
          $("#xtable").hide();
          $("#xconfig").show();
      });

      $("#aggrconfig").click(function() {
          $("#sharedvols").attr('class', 'col-2 bg-link');
          $("#allvols").attr('class', 'col-2 bg-link');
          $("#snapshotvols").attr('class', 'col-2 bg-link');
          $("#leafvols").attr('class', 'col-2 bg-link');
          $("#aggrops").attr('class', 'col-2 bg-link');
          $("#aggrconfig").attr('class', 'col-2 bg-light');
          $("#xtable").hide();
          $("#xconfig").show();
      });

      $('#table_id tbody').on('click', 'tr', function () {
          if (volumeTable != null) {
                var data = volumeTable.row( this ).data();
                //Open the volume table, same as the one clicked in graph
                alert( 'You clicked on '+ data.volname +'\'s row' );

                //The whole process of tree construction has to be done here.
                //show_options_for_volume(data.volumeId);
          }
      });

      $(".loader").hide();
      update_table(true);
});

