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
    name: 'Fly',
    baseClass: 'jimu-widget-basemap-gallery',
    flyMoveUnit : 0.0001,
    flyLatitude : 22.9049941,
    flyLongitude : 113.3742873,
    maxFlyLongitude : 113.41,
    flyInterval : null,
    flyTime : 200,
    zoom : 19,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      dojo.connect(this.startNode,"click",function(){
        this.flyLine()
      }.bind(this))
      dojo.connect(this.cancelNode,"click",function(){
        this.clearFlyLine()
      }.bind(this))
    },

    flyLine: function() {
      var lon = this.flyLongitude;
      var lat = this.flyLatitude;
      this.sceneView.goTo({ zoom: this.zoom, tilt: 60,heading: 90, center: [lon, lat] }).then(function() {
        this.flyInterval = window.setInterval(function() {
              lon = lon + this.flyMoveUnit;
              if(lon > this.maxFlyLongitude){
                this.clearFlyLine()
                  return
              }
              this.sceneView.goTo(
              {
                  zoom: this.zoom,
                  tilt: 60,
                  heading: 90,
                  center: [lon, lat]
              },
              {
                  easing: "linear", //动画效果  linear为线性速度
                  speedFactor: 1  //速度因素，相机移动的速度参数，默认为1
              }
              );
          }.bind(this), this.flyTime);           //setInterval间隔时间
      }.bind(this));
    },
    
    clearFlyLine: function(){
      this.flyInterval ? window.clearInterval(this.flyInterval) : null
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
  });
  return clazz;
});