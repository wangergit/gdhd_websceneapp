///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/Deferred',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/promise/all',
  'esri/kernel',
  'esri/WebScene',
  'esri/views/SceneView',
  'esri/portal/Portal',
  'esri/portal/PortalItem',
  'esri/core/has',
  './utils',
  './portalUtils',
  './portalUrlUtils',
  "esri/layers/FeatureLayer",
  "esri/layers/ImageryLayer",
  "esri/layers/ElevationLayer",
  "esri/layers/TileLayer",
  "esri/layers/VectorTileLayer",
  "esri/layers/BaseElevationLayer",
  "esri/layers/SceneLayer",
  "esri/layers/IntegratedMeshLayer",
  "esri/Camera",
  "esri/geometry/Mesh",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/ObjectSymbol3DLayer",
  "esri/layers/GraphicsLayer",
  "esri/PopupTemplate",
  "esri/Map",
  "esri/geometry/support/webMercatorUtils",
  "esri/geometry/Point",
  "esri/layers/BuildingSceneLayer",
  "esri/Graphic",
  './DynamicShip'
], function(Deferred, lang, array, html, all, esriNS, WebScene, SceneView, Portal, PortalItem, has,
  jimuUtils, portalUtils, portalUrlUtils,FeatureLayer,ImageryLayer,ElevationLayer,TileLayer,VectorTileLayer,BaseElevationLayer,SceneLayer,IntegratedMeshLayer,Camera,Mesh,PointSymbol3D,
  ObjectSymbol3DLayer,GraphicsLayer,PopupTemplate,Map,webMercatorUtils,Point,BuildingSceneLayer,Graphic,DynamicShip) {

  var mo = {
    createMap: function(mapDivId, portalUrl, itemId) {
      var def = new Deferred();
      if(has("esri-webgl")){
        def = this._createMap(mapDivId, portalUrl, itemId);
      }else{
        def.reject("The browser doesn't support webgl.");
        var webglSupportTip = lang.getObject("webSceneLoader.webglSupportTip", false, window.jimuNls);
        if(!webglSupportTip){
          webglSupportTip = "3D web apps aren't supported in your browser.";
        }
        html.create('div', {
          'class': 'app-error',
          innerHTML: webglSupportTip
        }, document.body);
      }
      return def;
    },

    _createMap: function(mapDivId, portalUrl, itemId) {
      var esriConfig = jimuUtils.getEsriConfig();
      esriConfig.portalUrl = portalUrlUtils.getStandardPortalUrl(portalUrl);

      var def = new Deferred();
      var defs = [];

      /************************************************************
       * Creates a new WebScene instance. A WebScene must reference
       * a PortalItem ID that represents a WebScene saved to
       * arcgis.com or an on premise portal.
       *
       * To load a WebScene from an onpremise portal, set the portal
       * url in esriConfig.portalUrl.
       ************************************************************/
      var addLayer = true
      var graphicsWidgets = []
      map = new Map({
        basemap: "satellite",//"hybrid","topo"
        //ground: "world-topobathymetry"//"world-topobathymetry"//"world-elevation"
      });
      
      var shipLayer = new GraphicsLayer({
          title : "社会船舶"
      })
      var bridgeLayer = new GraphicsLayer({
        title : "桥梁净空高",
        visible : true,
        minScale : 1000
      })

      sceneView = new SceneView({
          container: mapDivId,
          map: map,
          camera: {
            position: [0, 0, 1000000],
            heading: 90,
            tilt: 60
          },
          zoom: 10,
      });
      
      map.layers.add(shipLayer);
      map.layers.add(bridgeLayer);
      
      //广东航道图
      var tileLayer = new TileLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/gd/hdt/MapServer",
          visible : true,
          title : "二维电子航道图"
      });
      addLayer ? map.layers.add(tileLayer) : null;
      
      //河底高程
      var elevLyr = new ElevationLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/gd/river_dem/ImageServer",
          visible : false,
          title : "东莞水道河底高程"
      });
      addLayer ? map.ground.layers.add(elevLyr) : null;
      
      //dem水面
      var layer3 = new ImageryLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/gd/river_surface/ImageServer",
          title : "东莞水道dem水面",
          visible : false,
          format: "jpgpng" // server exports in either jpg or png format
      });
      map.layers.add(layer3);
      
      //BIM模型
      var buildingLayer = new SceneLayer({
          url: "http://wanger.scene.com/arcgis/rest/services/Hosted/school/SceneServer",
          title : "办公楼BIM模型",
          visible : false,
      });
      addLayer ? map.layers.add(buildingLayer) : null;

      buildingLayer = new SceneLayer({
        url: "http://wanger.scene.com/arcgis/rest/services/Hosted/house/SceneServer",
        title : "别墅BIM模型",
        visible : false,
      });
      addLayer ? map.layers.add(buildingLayer) : null;
      
      //桥梁模型
      const buildingLayer2 = new SceneLayer({
          url: "http://wanger.scene.com/arcgis/rest/services/Hosted/qiao/SceneServer",
          // elevationInfo : {
          //     mode : "on-the-ground"
          // },
          listMode : "hide",
          title : "桥梁",
      });
      addLayer ? map.layers.add(buildingLayer2) : null;

      //桥梁模型
      var buildingLayer22 = new SceneLayer({
        url: "http://wanger.scene.com/arcgis/rest/services/Hosted/yl/SceneServer",
        listMode : "hide",
        title : "游轮",
        elevationInfo : {
          mode : "absolute-height",
          offset  : -1
        },
      });
      addLayer ? map.layers.add(buildingLayer22) : null;
      
      const slpk01 = new IntegratedMeshLayer({
          url: "http://wanger.scene.com/arcgis/rest/services/Hosted/01bupai/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(slpk01) : null;
      
      const slpk04 = new IntegratedMeshLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/04/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(slpk04) : null;
      
      const slpk0567 = new IntegratedMeshLayer({
          url: "http://wanger.scene.com/arcgis/rest/services/Hosted/0567_1021/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(slpk0567) : null;
      
      const slpk08 = new IntegratedMeshLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/08/SceneServer",
          listMode : "hide",
          elevationInfo : {
              mode : "absolute-height",
              offset  : -82
          }
      });
      addLayer ? map.layers.add(slpk08) : null;
      
      const jzw1 = new SceneLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/jzw1_bp/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(jzw1) : null;
      
      const jzw4 = new SceneLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/jzw4/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(jzw4) : null;
      
      const jzw567 = new SceneLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/jzw567/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(jzw567) : null;
      
      const jzw8 = new SceneLayer({
          url: "https://wanger.scene.com/arcgis/rest/services/Hosted/jzw8/SceneServer",
          listMode : "hide"
      });
      addLayer ? map.layers.add(jzw8) : null;

      //水面动态效果
      var waterLayer = new FeatureLayer({
          url:
              "https://wanger.scene.com/arcgis/rest/services/gd/waterArea/MapServer/0",
          elevationInfo: {
              mode: "on-the-ground",//"on-the-ground",//"absolute-height",
              offset: 0
          },
          visible : false,
          title : "广东航道水纹面",
          renderer: {
              type: "simple",
              symbol: {
                  type: "polygon-3d",
                  symbolLayers: [{
                  type: "water",
                  waveDirection: 400,
                  color : "#5975a3",
                  //color: "rgba(83,139,171,0.6)",
                  waveStrength: "moderate",
                  waterbodySize: "large"
                  }]
              }
          }
      });
      //addLayer ? map.add(waterLayer) : null;

      //水面动态效果
      var waterSymbol = new FeatureLayer({
        url:
            "https://wanger.scene.com/arcgis/rest/services/gd/waterSymbol/MapServer/0",
        elevationInfo: {
            mode: "on-the-ground",//"on-the-ground",//"absolute-height",
            offset: 0
        },
        visible : false,
        title : "航道",
        renderer: {
            type: "simple",
            symbol: {
                type: "polygon-3d",
                symbolLayers: [{
                type: "water",
                waveDirection: 400,
                color : "#5975a3",
                //color: "rgba(83,139,171,0.6)",
                waveStrength: "moderate",
                waterbodySize: "large"
                }]
            }
        }
      });
      addLayer ? map.add(waterSymbol) : null;
      
      var location = new Point({
        x: 113.390888,
        y: 22.9047366,
        z: 5
      });
      var symbol1 = {
          type: "point-3d",  // autocasts as new PointSymbol3D()
          symbolLayers: [{
            type: "object",  // autocasts as new ObjectSymbol3DLayer()
            resource: {
                href: "http://localhost/ship3.gltf"
            },
            height: 70,//船高
            width : 12,//船长
            depth : 15,//船宽
            anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
            heading : 90,
            tilt : 90
          }]
      };
      var graphic = new Graphic({
          geometry : location,
          symbol : symbol1,
          popupTemplate : new PopupTemplate({
              title  : "XX货运船",
              content : "XX货运船"
          })
      });
      addLayer ? shipLayer.graphics.add(graphic) : null;
      var dynamicShip = new DynamicShip({
        sceneGraphic : graphic,
        graphics : [{
          x : 113.390888,
          y : 22.9047366,
          time : "2019-10-23 10:08:06"
        },{
          x : 113.398829,
          y : 22.904247,
          time : "2019-10-23 11:09:06"
        },{
          x : 113.403337,
          y : 22.905565,
          time : "2019-10-23 12:10:06"
        },{
          x : 113.411075,
          y : 22.909427,
          time : "2019-10-23 13:10:06"
        }]
      })
      dynamicShip.TracePlay()
      graphicsWidgets.push(dynamicShip)

      var location = new Point({
        x: 113.398701,
        y: 22.905898,
        z: 5
      });
      var symbol1 = {
          type: "point-3d",  // autocasts as new PointSymbol3D()
          symbolLayers: [{
            type: "object",  // autocasts as new ObjectSymbol3DLayer()
            resource: {
                href: "http://localhost/ship3.gltf"
            },
            height: 70,//船高
            width : 12,//船长
            depth : 15,//船宽
            anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
            heading : 250,
            tilt : 90
          }]
      };
      var graphic = new Graphic({
          geometry : location,
          symbol : symbol1,
          popupTemplate : new PopupTemplate({
              title  : "XX货运船",
              content : "XX货运船"
          })
      });
      addLayer ? shipLayer.graphics.add(graphic) : null;
      var dynamicShip = new DynamicShip({
        sceneGraphic : graphic,
        graphics : [{
          x : 113.398701,
          y : 22.905898,
          time : "2019-10-23 9:08:06"
        },{
          x : 113.395493,
          y : 22.904926,
          time : "2019-10-23 10:08:06"
        },{
          x : 113.393164,
          y : 22.904865,
          time : "2019-10-23 11:09:06"
        },{
          x : 113.391723,
          y : 22.904937,
          time : "2019-10-23 12:10:06"
        },{
          x : 113.388364,
          y : 22.905915,
          time : "2019-10-23 13:10:06"
        }]
      })
      dynamicShip.TracePlay()
      graphicsWidgets.push(dynamicShip)

      var location = new Point({
        x: 113.400467,
        y: 22.905394,
        z: 5
      });
      var symbol1 = {
          type: "point-3d",  // autocasts as new PointSymbol3D()
          symbolLayers: [{
            type: "object",  // autocasts as new ObjectSymbol3DLayer()
            resource: {
                href: "http://localhost/ship3.gltf"
            },
            height: 70,//船高
            width : 12,//船长
            depth : 15,//船宽
            anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
            heading : 260,
            tilt : 90
          }]
      };
      var graphic = new Graphic({
          geometry : location,
          symbol : symbol1,
          popupTemplate : new PopupTemplate({
              title  : "XX货运船",
              content : "XX货运船"
          })
      });
      addLayer ? shipLayer.graphics.add(graphic) : null;
      var dynamicShip = new DynamicShip({
        sceneGraphic : graphic,
        graphics : [{
          x : 113.400467,
          y : 22.905394,
          time : "2019-10-23 9:08:06"
        },{
          x : 113.396279,
          y : 22.904886,
          time : "2019-10-23 10:08:06"
        }]
      })
      dynamicShip.TracePlay()
      graphicsWidgets.push(dynamicShip)

      sceneView.graphicsWidgets = graphicsWidgets
      
      
      // location = new Point({
      //         x: 113.388167,
      //         y: 22.9043672,
      //         z: 5
      // });
      // symbol1 = {
      //     type: "point-3d",  // autocasts as new PointSymbol3D()
      //     symbolLayers: [{
      //     type: "object",  // autocasts as new ObjectSymbol3DLayer()
      //     resource: {
      //         href: "http://localhost/ship3.gltf"
      //     },
      //     height: 70,//船高
      //     width : 12,//船长
      //     depth : 15,//船宽
      //     anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
      //     heading : 90,
      //     tilt : 90
      //     }]
      // };
      // graphic = new Graphic({
      //     geometry : location,
      //     symbol : symbol1,
      //     popupTemplate : new PopupTemplate({
      //         title  : "XX货运船",
      //         content : "XX货运船"
      //     })
      // });

      // addLayer ? shipLayer.graphics.add(graphic) : null;
      
      // location = new Point({
      //         x: 113.3950858,
      //         y: 22.9056597,
      //         z: 5
      // });
      // symbol1 = {
      //     type: "point-3d",  // autocasts as new PointSymbol3D()
      //     symbolLayers: [{
      //     type: "object",  // autocasts as new ObjectSymbol3DLayer()
      //     resource: {
      //         href: "http://localhost/ship3.gltf"
      //     },
      //     height: 70,//船高
      //     width : 12,//船长
      //     depth : 15,//船宽
      //     anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
      //     heading : 270,
      //     tilt : 90
      //     }]
      // };
      // graphic = new Graphic({
      //     geometry : location,
      //     symbol : symbol1,
      //     attributes : {
      //     id : 22,
      //     name : "22"
      //     },
      //     popupTemplate : new PopupTemplate({
      //         title  : "XX货运船",
      //         content : "XX货运船"
      //     })
      // });

      // addLayer ? shipLayer.graphics.add(graphic) : null;
      
      // location = new Point({
      //         x: 113.3993012,
      //         y: 22.9059187,
      //         z: 5
      // });
      // symbol1 = {
      //     type: "point-3d",  // autocasts as new PointSymbol3D()
      //     symbolLayers: [{
      //     type: "object",  // autocasts as new ObjectSymbol3DLayer()
      //     resource: {
      //         href: "http://localhost/ship3.gltf"
      //     },
      //     height: 70,//船高
      //     width : 12,//船长
      //     depth : 15,//船宽
      //     anchor : "top" ,//对齐方式//"center"|"top"|"bottom"|"origin"|"relative"
      //     heading : 250,
      //     tilt : 90
      //     }]
      // };
      // graphic = new Graphic({
      //     geometry : location,
      //     symbol : symbol1,
      //     attributes : {
      //         id : 22,
      //         name : "22"
      //     },
      //     popupTemplate : new PopupTemplate({
      //         title  : "XX货运船",
      //         content : "XX货运船"
      //     })
      // });

      // addLayer ? shipLayer.graphics.add(graphic) : null;

      var polyline = {
        type: "polyline", // autocasts as new Polyline()
        paths: [[113.392711, 22.904668, 0], [113.392711, 22.904668, 22]]
      };

      var lineSymbol = {
        type: "simple-line", // autocasts as SimpleLineSymbol()
        color: [255, 0, 0],
        width: 1
      };

      var polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: lineSymbol
      });

      bridgeLayer.graphics.add(polylineGraphic);

      var point = {
        type: "point", // autocasts as new Point()
        x: 113.392711,
        y: 22.904668,
        z: 15
      };

      var textSymbol = {
        type: "text", // autocasts as new TextSymbol()
        color: "white",
        haloColor: "black",
        text: "22米",
        font: {
          // autocast as new Font()
          family: "Playfair Display",
          size: 12
        }
      }
      var pointGraphic = new Graphic({
        geometry: point,
        symbol: textSymbol
      });
      bridgeLayer.graphics.add(pointGraphic);

      //defs.push(scene.load());
      defs.push(sceneView.when());

      // var portal = portalUtils.getPortal(portalUrl);
      // defs.push(portal.getItemById(itemId));
      // defs.push(portal.getItemData(itemId));

      all(defs).then(lang.hitch(this, function(results) {
        if(sceneView.popup){
          sceneView.popup.closeOnViewChangeEnabled = true;
        }
        // scene.id = mapDivId;
        // scene.itemId = itemId;
        // scene.itemInfo = {
        //   item: results[1],
        //   itemData: results[2]
        // };
        this._handleLocalScene(sceneView);
        def.resolve(sceneView);
        //this._handleAttribution(sceneView);
      }), lang.hitch(this, function(err) {
        console.error(err);
        def.reject(err);
      }));

      return def;
    },

    _handleLocalScene: function(sceneView){
      try{
        if(sceneView.viewingMode && sceneView.viewingMode.toLowerCase() === 'local'){
          lang.setObject("constraints.collision.enabled", false, sceneView);
          lang.setObject("constraints.tilt.max", 179.99, sceneView);
        }
      }catch(e){
        console.error(e);
      }
    },

    _handleAttribution: function(sceneView) {
      try {
        if (esriNS.version !== "4.0") {
          var components = sceneView.ui && sceneView.ui._components;
          if (components && components.length > 0) {
            array.some(components, function(component) {
              var widget = component && component._widget;
              if (widget && widget.declaredClass === "esri.widgets.Attribution") {
                widget.domNode.parentNode.style.width = "100%";
                html.create("span", {
                  "innerHTML": "Powered by Esri",
                  "class": "esri-attribution-powered-by"
                }, widget.domNode);
                return true;
              } else {
                return false;
              }
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return mo;
});
