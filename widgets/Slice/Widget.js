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
  "esri/widgets/Slice",
], function (declare, BaseWidget,Slice) {
  var clazz = declare([BaseWidget], {
    name: 'Slice',
    baseClass: 'jimu-widget-basemap-gallery',
    domEvent : null,

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      this.sliceNode.innerHTML = "<div data-dojo-attach-point='sliceDom' id='sliceDom'</div>"
      this.sliceWidget = new Slice({
        view: this.sceneView,
        container: dojo.byId("sliceDom"),
      });
      this.domEvent = dojo.connect(this.cancelSlice,"click",function(){
        if (this.sliceWidget) {
          this.sliceWidget.destroy();
        }
        this.domEvent ? dojo.disconnect(this.domEvent) :null
        this.startup()
      }.bind(this))
      
    },

    destroy: function () {
      if (this.sliceWidget) {
        this.sliceWidget.destroy();
      }
      this.inherited(arguments);
    }
  });
  return clazz;
});