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
  "esri/geometry/geometryEngine"
], function (declare, BaseWidget,esriRequest,Graphic,Point,Polygon,Polyline,Slider,SpatialReference,GraphicsLayer,GeometryEngine) {
  var clazz = declare([BaseWidget], {
    name: 'Airworthiness',
    baseClass: 'jimu-widget-basemap-gallery',
    airworthinessWidget : null,
    depthLayer : null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.depthLayer = new GraphicsLayer({
        //listMode : "hide",
        title : "适航水深"
      })
      this.sceneView.map.layers.add(this.depthLayer);
      //适航水深滑块
      this.airworthinessWidget = new Slider({
        container: this.airworthinessNode,
        min: 3,
        max: 12,
        precision : 1,
        values: [ 3 ],
        snapOnClickEnabled: true,
        labelsVisible: true,
        rangeLabelsVisible: true
      });
      this.airworthinessWidget.on("value-change",function(e){
          this.doGetWaterDepth(e.value)
      }.bind(this))
      dojo.connect(this.cancelAirworthiness,"click",function(){
        this.depthLayer.graphics.removeAll()
      }.bind(this))
    },

    destroy: function () {
      if (this.airworthinessWidget) {
        this.airworthinessWidget.destroy();
      }
      this.inherited(arguments);
    },

    doGetWaterDepth: function(value){
      value = value.toString();
      value = value.indexOf(".") > -1 ? value : value + ".0"
      var code = encodeURI("'" + value + "'");
      var path = "https://wanger.scene.com/arcgis/rest/services/gd/airworthiness/MapServer/0/query?where=depth = " + code + "&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson"
      esriRequest(path, {
          responseType: "json"
      }).then(function(response){
          this.depthLayer.graphics.removeAll()
          if(response.data.features && response.data.features.length > 0){
              var graphics = [];
              for(var i = 0 ; i < response.data.features.length ; i ++){
                  graphics.push(new Polygon({
                      rings : response.data.features[i].geometry.rings,
                      spatialReference : new SpatialReference(4326)
                  }))
              }
              var union = GeometryEngine.union(graphics);
              var symbol = {
                  type: "simple-fill",  // autocasts as new SimpleFillSymbol()
                  color: [ 51,51, 204,0.75],
                  style: "solid",
                  outline: {  // autocasts as new SimpleLineSymbol()
                  color: "white",
                  width: 0
                  }
              };
              this.depthLayer.graphics.add(new Graphic({
                      geometry: union,
                      symbol: symbol,
                      //attributes: polylineAtt
              }))
          }
      }.bind(this))
    }
  });
  return clazz;
});