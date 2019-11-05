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
  'dojo/_base/declare',
  'jimu/BaseWidget',
  "esri/request",
  "esri/Graphic",
  "esri/geometry/Point",
  "esri/geometry/Polygon",
  "esri/geometry/Polyline",
  "esri/widgets/Slider",
  "esri/geometry/SpatialReference",
  "esri/layers/GraphicsLayer",
  "esri/geometry/geometryEngine",
  "esri/PopupTemplate",
], function (declare, BaseWidget,esriRequest,Graphic,Point,Polygon,Polyline,Slider,SpatialReference,GraphicsLayer,GeometryEngine,PopupTemplate) {
    var clazz = declare([BaseWidget], {
      name: 'DynamicShip',
      baseClass: 'jimu-widget-basemap-gallery',
      shipLayer : null,
      shipMoveUnit : 0.000005,
      flyLatitude : 22.9049941,
      flyLongitude : 113.389453,
      maxShipLongitude : 113.4043,
      shipInterval : null,
      shipTime : 300,
      sliderWidget : null,
      curlon : 0,
      curlat : 0,

      postCreate: function () {
        this.inherited(arguments);
      },

      startup: function () {
        this.sliderWidget = new Slider({
          container: this.sliderNode,
          min: 1,
          max: 20,
          precision : 1,
          values: [ 1 ],
          snapOnClickEnabled: true,
          labelsVisible: true,
          rangeLabelsVisible: true        
        });
        this.sliderWidget.on("value-change",function(e){
            this.doChangeSlider(e.value)
        }.bind(this))
        dojo.connect(this.startNode,"click",function(){
          this.doChangeSlider(this.sliderWidget.values[0])
        }.bind(this))
        dojo.connect(this.cancelNode,"click",function(){
          this.sceneView.graphicsWidgets.forEach(function(graphicsWidget){
            graphicsWidget.TraceStop()
          }.bind(this))
        }.bind(this))
        return
        this.shipLayer = new GraphicsLayer({
          title : "动态船舶",
          listMode : "hide"
        })
        this.sceneView.map.layers.add(this.shipLayer);
        var location = new Point({
          x: 113.388167,
          y: 22.9043672,
          z: 5
        });
        var symbol = {
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
        this.flyShipGraphic = new Graphic({
            geometry : location,
            symbol : symbol,
            attributes : {
            id : 22,
            name : "22"
            },
            popupTemplate : new PopupTemplate({
                title  : "XX货运船",
                content : "XX货运船"
            })
        });
        this.shipLayer.graphics.add(this.flyShipGraphic)
        dojo.connect(this.startNode,"click",function(){
          this.flyShip()
        }.bind(this))
        dojo.connect(this.cancelNode,"click",function(){
          this.clearflyShip()
        }.bind(this))
      },

      doChangeSlider: function(value){
        this.sceneView.graphicsWidgets.forEach(function(graphicsWidget){
          this.shipTime = value * 24*60*60*1000;
          graphicsWidget.TracePlay({
            speed : this.shipTime
          })
        }.bind(this))
        return
        this.clearflyShip();
        this.shipTime = value * 1000;
        this.shipInterval = window.setInterval(function() {
          this.curlon = this.curlon + this.shipMoveUnit;
          if(this.curlon > this.maxShipLongitude){
            this.curlon = this.flyLongitude;
            this.curlat = this.flyLatitude;
          }
          this.drawShip(this.curlon,this.curlat)
        }.bind(this), this.shipTime);           //setInterval间隔时间
      },

      flyShip: function() {
        this.curlon = this.flyLongitude;
        this.curlat = this.flyLatitude;
        this.drawShip(this.curlon,this.curlat)
        this.shipInterval = window.setInterval(function() {
          this.curlon = this.curlon + this.shipMoveUnit;
          if(this.curlon > this.maxShipLongitude){
            this.curlon = this.flyLongitude;
            this.curlat = this.flyLatitude;
          }
          this.drawShip(this.curlon,this.curlat)
        }.bind(this), this.shipTime);           //setInterval间隔时间
      },

      drawShip: function (x,y){
        var point = new Point({
          x: x,
          y: y,
          z: 5
        });
        this.flyShipGraphic.geometry = point;
      },

      clearflyShip: function(){
        this.shipInterval ? window.clearInterval(this.shipInterval) : null
      },

      destroy: function () {
        this.inherited(arguments);
      }
    }
  );
  return clazz;
});