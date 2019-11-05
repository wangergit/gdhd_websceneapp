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
  'jimu/BaseWidget'
], function (declare, BaseWidget) {
    var clazz = declare([BaseWidget], {
    name: 'export',
    baseClass: 'jimu-widget-basemap-gallery',

    postCreate: function () {
      this.inherited(arguments);
    },

    startup: function () {
      dojo.connect(this.exportNode,"click",function(){
        this.screenshot()
      }.bind(this))
    },

    screenshot: function(){
      var options = {
          width: this.sceneView.width,
          height: this.sceneView.height
      };
  
      this.sceneView.takeScreenshot(options).then(function(screenshot) {
          //调用
          // var blob = this.dataURLtoBlob(screenshot.dataUrl);
          // var file = blobToFile(blob, "export");
          var file = this.dataURLtoFile(screenshot.dataUrl,"export")
          var imageElement = document.createElement("a");
          //imageElement.href = file;
          imageElement.href = window.URL.createObjectURL(file)
          //imageElement.href = "_blank";
          imageElement.download = "export.png"
          imageElement.click();
          document.removeChild(imageElement);
      }.bind(this));
    },

    dataURLtoBlob(dataurl) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
    },

    dataURLtoFile: function(dataurl, filename) {//将base64转换为文件
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
    },

    destroy: function () {
      this.inherited(arguments);
    }
  });
  return clazz;
});