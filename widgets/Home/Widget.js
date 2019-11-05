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
    'dojo/on',
    'dojo/_base/declare',
    'dojo/_base/html',
    'dojo/_base/lang',
    'jimu/BaseWidget',
    "esri/Viewpoint",
    "esri/geometry/Point",
    "esri/Camera",
  ], function(on, declare, html, lang, BaseWidget,Viewpoint,Point,Camera) {
    var clazz = declare([BaseWidget], {

      name: 'Home',
      baseClass: 'jimu-widget-home',

      postCreate: function(){
        this.inherited(arguments);
        this.iconNode = html.create("div", {
          'class': 'operate-node',
          title: this.label
        }, this.domNode);
        this.own(on(this.iconNode, 'click', lang.hitch(this, this._onIconNodeClick)));
      },

      _onIconNodeClick: function(){
        //var viewPoint = this.sceneView.map.initialViewProperties.viewpoint.clone();
        var viewPoint = new Viewpoint({
          camera : new Camera({
            position: new Point({
              x: 113.397387, // lon
              y: 22.904435,      // lat
              z: 3000,   // elevation in meters
            }),
            heading: 0, // facing due south
            tilt: 0     // bird's eye view
          })
        })
        this.sceneView.goTo(viewPoint);
      }
    });

    return clazz;
  });