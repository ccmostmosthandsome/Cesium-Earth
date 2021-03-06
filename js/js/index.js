// 全局开启tooltip弹窗
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});
// 弹出菜单
$(".fa-bars").click(function () {
    $('#navdrawer').navdrawer('show');
});
// 图层选择
$("#menuLayerStyle").click(function () {
    $('#navdrawer').navdrawer('hide');
    $('#layerdrawer').navdrawer('show');
});
// 探索页面
$(".fa-magic").click(function () {
    $("#exploreModal").modal('show');
});


var viewer, viewerNav, scene, camera, canvas, magnitude,
    imageryLayers, cameraHeight, cameraHeightValue, baseLayer, measureHandler, screenCenter;
var mapboxSatelliteProvider, mapboxStreetsSatelliteProvider,
    mapboxStreetsProvider, mapboxDarkProvider, mapboxPiratesProvider;
var measureBackgroundColor, measureFillColor, measureBackgroundPadding, measurePolylineColor;
var showGlobePhotos = false;
var billboard;
var billboardArr = [];

function onload(Cesium) {
    var terrainURL = 'https://assets.agi.com/stk-terrain/world';
    viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: new Cesium.CesiumTerrainProvider({
            url: terrainURL
            // requestWaterMask: true
        })
    });
    scene = viewer.scene;
    camera = scene.camera;
    canvas = viewer.canvas;

    // 鹰眼导航 viewer
    viewerNav = new Cesium.Viewer('cesiumNavContainer', {
        skyAtmosphere: false,
        skyBox: false,
        imageryProvider: new Cesium.MapboxImageryProvider({
            url: 'https://api.mapbox.com/v4/',
            mapId: 'mapbox.high-contrast',
            maximumLevel: 14,
            accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
        })
    });

    // 设置鹰眼的div为圆形
    var viewerNavCanvas = viewerNav.canvas;
    viewerNavCanvas.setAttribute("class", "cesium-nav-circle ");
    // var masterCamera = camera;
    // var slaveCamera = viewerNav.scene.camera;

    // viewerNav.scene.preRender.addEventListener(function(){
    //     if(viewerNav.scene.mode !== Cesium.SceneMode.MORPHING){
    //         // console.log(Cesium.SceneMode);
    //         slaveCamera.setView({
    //             position : masterCamera.position,
    //             heading : masterCamera.heading,
    //             pitch : masterCamera.pitch,
    //             roll :  masterCamera.roll
    //         });
    //         // console.log(slaveCamera);
    //     }
    // });

    // 鹰眼相机同步
    viewerNav.scene.preRender.addEventListener(function () {
        Cesium.Cartesian3.clone(camera.position, viewerNav.scene.camera.position);
        // Cesium.Cartesian3.clone(camera.newPosition, viewerNav.scene.camera.position);
        Cesium.Cartesian3.clone(camera.direction, viewerNav.scene.camera.direction);
        Cesium.Cartesian3.clone(camera.up, viewerNav.scene.camera.up);
        // Cesium.Cartesian3.clone(camera.write, viewerNav.scene.camera.write);
        viewerNav.scene.camera.lookAtTransform(camera.transform);
        // viewerNav.scene.camera.frustum.near=500000000;
        // viewerNav.scene.camera.frustum.far=500000000;
    });


    // 5种地图风格
    mapboxSatelliteProvider = new Cesium.MapboxImageryProvider({
        url: 'https://api.mapbox.com/v4/',
        mapId: 'mapbox.satellite',
        accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
    });
    mapboxStreetsSatelliteProvider = new Cesium.MapboxImageryProvider({
        url: 'https://api.mapbox.com/v4/',
        mapId: 'mapbox.streets-satellite',
        accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
    });
    mapboxStreetsProvider = new Cesium.MapboxImageryProvider({
        url: 'https://api.mapbox.com/v4/',
        mapId: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
    });
    mapboxDarkProvider = new Cesium.MapboxImageryProvider({
        url: 'https://api.mapbox.com/v4/',
        mapId: 'mapbox.dark',
        accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
    });
    mapboxPiratesProvider = new Cesium.MapboxImageryProvider({
        url: 'https://api.mapbox.com/v4/',
        mapId: 'mapbox.pirates',
        accessToken: 'pk.eyJ1IjoiZ29vaW4iLCJhIjoiY2ppY3RjcGd5MDRqcjNrbWFlanEyazk2OCJ9.-v6OvStrPvVwu2-Tx9Uogg'
    });


    imageryLayers = viewer.imageryLayers;
    imageryLayers.removeAll();
    // imageryLayers.addImageryProvider(mapboxSatelliteProvider);
    // 默认开启街道卫星底图
    imageryLayers.addImageryProvider(mapboxStreetsSatelliteProvider);


    //设置无影像时，地球颜色
    scene.globe.baseColor = Cesium.Color.GAINSBORO;


    // 测量的手柄
    measureHandler = new Cesium.MeasureHandler(viewer, Cesium.MeasureMode.Distance, 0);
    measureHandler.clampMode = 0;
    // measureHandler.clampMode = Cesium.ClampMode.Ground;
    // measureHandler.clampMode = Cesium.ClampMode.Space;
    // measureHandler.clampMode = Cesium.ClampMode.S3mModel;
    // 测量时label样式
    measurePolylineColor = new Cesium.Color.fromCssColorString('#E3BE04');
    measureBackgroundColor = new Cesium.Color.fromCssColorString('#f5b903');
    measureFillColor = Cesium.Color.BLACK;
    measureBackgroundPadding = new Cesium.Cartesian2(8, 8);

    // 监听相机事件
    camera.changed.addEventListener(function () {

        // 当相机高度小于200km时，测量结果为贴地模式
        if (cameraHeight < 200) {
            measureHandler.clampMode = 1;
        } else {
            measureHandler.clampMode = 0;
        }
        // 当相机高度小于5000km时，停止自动旋转
        if (cameraHeight < 5000) {
            if (viewer.clock.onTick._listeners.length > 1) {
                viewer.clock.onTick.removeEventListener(autoRotate);
            }
        }


        //=====================计算屏幕坐标=======================
        var coordTopLeft = findCoordinate(new Cesium.Cartesian2(57, 0), new Cesium.Cartesian2(canvas.width, canvas.height))
        var degreeTopLeft = CesiumHandyFuns.cartesian3ToDegree(Cesium, coordTopLeft);
        // console.log(degreeTopLeft);
        // 计算屏幕右下角坐标
        var coordBottomRight = findCoordinate(new Cesium.Cartesian2(canvas.width, canvas.height), new Cesium.Cartesian2(57, 0))
        var degreeBottomRight = CesiumHandyFuns.cartesian3ToDegree(Cesium, coordBottomRight);
        // console.log(degreeBottomRight);
        var left = degreeTopLeft.longitude;
        var bottom = degreeBottomRight.latitude;
        var top = degreeBottomRight.longitude;
        var right = degreeTopLeft.latitude;

        // 鹰眼viewer绘制主viewer视窗范围
        viewerNav.entities.removeAll();
        if (top > bottom && right > left) {
            var viewerRectangle = viewerNav.entities.add(new Cesium.Entity({
                name: "viewerRectangle",
                rectangle: {
                    coordinates: Cesium.Rectangle.fromDegrees(left, bottom, top, right),
                    material: Cesium.Color.RED.withAlpha(0.2),
                    height: 500,
                    outline: true, // height must be set for outline to display
                    outlineWidth: 5,
                    outlineColor: Cesium.Color.RED
                }
            }));
        }


        // 开启全球照片
        console.log(showGlobePhotos);
        if (showGlobePhotos) {
            // 获取屏幕中心点的经纬度
            var screenBounds = [left, bottom, top, right];
            screenCenter = CesiumHandyFuns.screenCenterDegree(Cesium, viewer);
            showPhotos(Cesium, viewer, screenBounds);
        }
    });
    // 照片开关点击事件
    $(".custom-switch").mousedown(function () {
        console.log(showGlobePhotos);
        showGlobePhotos = !showGlobePhotos;
        if (!showGlobePhotos) {
            billboardArr.map(function (billboard) {
                billboard.show = false;
            });
            console.log(billboardArr);
        } else {
            billboardArr.map(function (billboard) {
                billboardArr = [];
                billboard.show = true;
            });
            // TODO:点击获得布告板信息,弹窗显示大图
            // 根据传回的flickrID 查询图片详细信息并显示
            // var bHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            // bHandler.setInputAction(function (click) {
            //     var pickedObject = scene.pick(click.position);
            //     if (Cesium.defined(pickedObject)) {
            //         var infoboxContainer = document.getElementById("infobox");
            //         viewer.customInfobox = infoboxContainer;
            //         var widget = viewer.CesiumWidget;
            //         console.log(pickedObject);
            //         console.log(pickedObject.id._name);
            //         console.log(pickedObject.id.flickrID);
            //         // image url
            //         console.log(pickedObject.primitive._imageId);
            //
            //         //添加自定义infobox
            //         var title = document.getElementById("infobox-title");
            //         var address = document.getElementById("infobox-address");
            //         var img = document.getElementById("infobox-image");
            //
            //         var title1 = Cesium.defaultValue(pickedObject.id.flickrID, '');
            //         var address1 = Cesium.defaultValue(pickedObject.id._name, '');
            //         console.log(title1);
            //         console.log(address1);
            //         title.innerText = title1;
            //         address.innerText = address1;
            //         img.src = img;
            //     }
            // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            console.log(billboardArr);
        }
    });
    //====================我的位置按钮点击====================================
    $("#myLocation").click(function () {
        //// 原生 HTML5 浏览器定位方法 // 仅在https下生效
        if (!navigator.geolocation) {
            console.log("您的浏览器不支持地理位置");
            return;
        }

        navigator.geolocation.getCurrentPosition(success, error);

        function success(position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;
            // alert(longitude + "," + latitude);
            // console.log(latitude);
            // console.log(longitude);
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 15000.0)
            })
        }

        function error() {
            // 无法获取位置的时候， 用ip定位
            $.ajax('https://ipapi.co/json/')
                .done(function (response) {
                    // console.log(response);
                    viewer.camera.flyTo({
                        destination: Cesium.Cartesian3.fromDegrees(response.longitude, response.latitude, 15000.0)
                    })
                });
        }

        // // 相对还行
        // $.ajax('https://ipapi.co/json/')
        //     .done(function (response) {
        //         console.log(response);
        //         viewer.camera.flyTo({
        //             destination: Cesium.Cartesian3.fromDegrees(response.longitude,response.latitude, 15000.0)
        //         })
        //     });
        //
        // // ipINFO 定位， 不准
        // $.get("https://ipinfo.io", function (response) {
        //     var lonlat = response.loc.split(',');
        //     // alert(response);
        //     console.log(response);
        //     viewer.camera.flyTo({
        //         destination: Cesium.Cartesian3.fromDegrees(lonlat[1] * 1, lonlat[0] * 1, 15000.0)
        //     })
        // }, "jsonp");
    });

    //============================指北针点击==================================
    $("#compass").click(function () {
        var scene = viewer.scene;
        $("#compass").css("transform", "rotate(0)");
        scene.camera.flyTo({
            destination: scene.camera.position,
            orientation: {
                heading: Cesium.Math.toRadians(0)
            }
        });
    });

    var prevHeading, heading;
    scene.postRender.addEventListener(function () {
        //==================================
        // 指北针跟随
        //==================================

        // 解决在相机在一定高度缩放时， heading突变的问题
        prevHeading = heading;
        heading = scene.camera.heading;
        if (prevHeading - heading > 3) {
            heading = heading * 2;
        }
        // 指北针跟随
        var x = Cesium.Math.toDegrees(heading - 0.01);
        var degrees = "rotate(" + x + "deg)";
        $("#compass").css("transform", degrees);

        //==================================
        // 获取地心到相机的高度
        //==================================

        // 高度
        cameraHeight = camera.positionCartographic.height / 1000;
        // 加单位用于显示
        cameraHeightValue = camera.positionCartographic.height;
        if (cameraHeightValue < 10000) {
            cameraHeightValue = parseFloat(cameraHeightValue).toFixed(0) + "米";
        } else {
            cameraHeightValue = cameraHeightValue / 1000;
            cameraHeightValue = parseFloat(cameraHeightValue).toFixed(0) + "千米";
        }
    });


    // 鼠标移动事件手柄，用于显示右下角状态
    var moveHandler = new Cesium.ScreenSpaceEventHandler;
    moveHandler.setInputAction(function (move) {
        var position = scene.pickPosition(move.endPosition);
        // 判断鼠标位置是否在球体上，如果不在,position=undefined
        if (position) {
            var carto = Cesium.Cartographic.fromCartesian(position);
            var alt = carto.height;
            var lon = Cesium.Math.toDegrees(carto.longitude);
            var lat = Cesium.Math.toDegrees(carto.latitude);

            // 经纬度转度分秒
            function transformDMS(degree, direction) {
                var D = addZeroAtHead(Math.floor(degree));
                var M = addZeroAtHead(Math.floor((degree - D) * 60));
                var S = addZeroAtHead(Math.floor(((degree - D) * 60 - M) * 60));
                var result = D + "°" + M + "′" + S + "″";

                // 如果是个位数， 则在首位加 0
                function addZeroAtHead(num) {
                    if (num > -10 && num < 0) {
                        num = "-0" + Math.abs(num)
                    }
                    if (num > 0 && num < 10) {
                        return "0" + num
                    }
                    return num;
                }

                if (direction === "lon") {
                    D > 0 ? result += "E" : result += "W";
                    return result;
                }
                if (direction === "lat") {
                    D > 0 ? result += "N" : result += "S";
                    return result;
                }
                return result;
            }

            var lonDMS = transformDMS(lon, "lon");
            var latDMS = transformDMS(lat, "lat");

            // 默认相机高度为 15000km
            cameraHeight == undefined ?
                $("#camHeight").html("相机：15000千米&nbsp;&nbsp;") : $("#camHeight").html("相机：" + cameraHeightValue + "&nbsp;&nbsp;");
            // $("#lon").html("经度:" + lon.toFixed(5));
            // $("#lat").html("&nbsp;纬度:" + lat.toFixed(5) + "&nbsp;");
            $("#lon").html("经度:" + lonDMS);
            $("#lat").html("&nbsp;纬度:" + latDMS + "&nbsp;");
            if (cameraHeight < 2000) {
                $("#alt").html("&nbsp;&nbsp;海拔：" + alt.toFixed(0) + "米&nbsp;");
            } else {
                $("#alt").html("");
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


    // 计算坐标点  //即使球体不在屏幕点上
    function findCoordinate(startCoordinates, endCoordinates) {
        var coordinate = scene.camera.pickEllipsoid(startCoordinates, this.ellipsoid);
        // Translate coordinates
        var x1 = startCoordinates.x;
        var y1 = startCoordinates.y;
        var x2 = endCoordinates.x;
        var y2 = endCoordinates.y;
        // Define differences and error check
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var sx = (x1 < x2) ? 1 : -1;
        var sy = (y1 < y2) ? 1 : -1;
        var err = dx - dy;

        coordinate = scene.camera.pickEllipsoid({x: x1, y: y1}, this.ellipsoid);
        if (coordinate) {
            return coordinate;
        }
        // Main loop
        while (!((x1 == x2) && (y1 == y2))) {
            var e2 = err << 1;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }

            coordinate = scene.camera.pickEllipsoid({x: x1, y: y1}, this.ellipsoid);
            if (coordinate) {
                return coordinate;
            }
        }
        return;
    }

    //================================探索界面卡片点击===================================
    $("#niaochao").click(function (e) {
        $("#exploreModal").modal('hide');
        var niaochao = scene.open('http://www.supermapol.com/realspace/services/3D-Olympic/rest/realspace');
        viewer.flyTo(niaochao, {duration: 5});
        var niaochaoWater = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_NIAOCHAO_WATER, {name: 'water'});
    });
    $("#suofeiya").click(function (e) {
        $("#exploreModal").modal('hide');
        var suofeiya = scene.addS3MTilesLayerByScp(URL_CONFIG.SCP_SUOFEIYA);
        viewer.flyTo(suofeiya, {duration: 5});
    });
    $("#pointcloud").click(function (e) {
        $("#exploreModal").modal('hide');
        var pointCloud = scene.addS3MTilesLayerByScp("http://www.supermapol.com/realspace/services/3D-cloud/rest/realspace/datas/POINTCLOUD23/config");
        Cesium.when(pointCloud, function (layer) {
            //设置相机位置、视角，便于观察场景
            scene.camera.setView({
                destination: new Cesium.Cartesian3(-3726950.8178392285, 3087276.1287523108, 4154724.882310502),
                orientation: {
                    heading: 3.7690494906963523,
                    pitch: 0.014489436405058287,
                    roll: 6.283185307179586
                }
            });
        });
    });
    $("#vector").click(function (e) {
        $("#exploreModal").modal('hide');
        var vector = scene.open('http://www.supermapol.com/realspace/services/3D-GuangZhou/rest/realspace');
        viewer.flyTo(vector, {duration: 5});
    });

    //==================================地球自动旋转=====================================
    var lastNow = Date.now();
    var autoRotate = function () {
        var now = Date.now();
        var spinRate = 0.02;
        var delta = (now - lastNow) / 1000;
        lastNow = now;
        viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
    };
    viewer.clock.onTick.addEventListener(autoRotate);

}
