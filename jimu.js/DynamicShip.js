/**
 * 动态船舶动画
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on", 
    "dojo/topic",
    "dojo/dom",
    "esri/geometry/Point",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
],
function(
    declare,lang,query, on, topic,dom,Point,_WidgetBase,_TemplatedMixin,_WidgetsInTemplateMixin
    ) {
	return declare([_WidgetBase], {

		traceTimer : null,              //定时器
		sleepTime : 1000,
		sleepDataNum : 3000,
        timeattrname : "time",   //轨迹数据中默认的时间字段名字
        defaultduration : 100,           //默认的轨迹播放时间间隔
        currenttime : null,             //记录轨迹播放的当前时间
        defaultwkid : 4326,             //默认轨迹数据的空间参考wkid
        graphics: null,                 //所有的轨迹数据
        valuesetter: null, 
        mintime:null,
        maxtime:null,
        speed: 24*60*60*1000,           //和时间有关，是每秒钟前进多长时间，默认一天
        sceneGraphic : null,
	
        postCreate: function () {   
            this.inherited(arguments); 
            this.init()
        },

        startup : function () {
        	this.init();
        }, 
        
        init: function(){
            var timeattrname = this.timeattrname;
            //记录时间范围
            this.mintime = new Date(2999,1,1,0,0,0);
            this.maxtime = new Date(1000,1,1,0,0,0);
			//处理时间格式
			for(var i = 0 ; i < this.graphics.length ;){
				if(i > 0 && i % this.sleepDataNum == 0){
					this.sleep(this.sleepTime)
				}
				if(this.graphics[i - 1] && this.graphics[i].x == this.graphics[i - 1].x && this.graphics[i].y == this.graphics[i - 1].y){
					this.graphics.splice(i,1);
					continue;
				}
				var str = this.graphics[i].time;
				this.graphics[i].timeStr = str;
				var d1 = str.split(" ")[0].replace(" ","").split("-")[0];
				var d2 = parseInt(str.split(" ")[0].replace(" ","").split("-")[1]) - 1;
				var d3 = str.split(" ")[0].replace(" ","").split("-")[2];
				
				var d4 = str.split(" ")[1].replace(" ","").split(":")[0];
				var d5 = str.split(" ")[1].replace(" ","").split(":")[1];
				var d6 = str.split(" ")[1].replace(" ","").split(":")[2];
				this.graphics[i].time = new Date(d1,d2,d3,d4,d5,d6);
				i ++;
			}
            //按照时间字段进行排序
            if(this.graphics && this.graphics.length && this.graphics.length>1)
            	this.graphics.sort(this._compareFun(timeattrname));
			this.mintime = this.graphics[0][timeattrname];
			this.maxtime = this.graphics[this.graphics.length - 1][timeattrname];
        },

        _compareFun: function(propertyName){
            return dojo.hitch(propertyName, function(object1,object2){
                var value1 = object1[propertyName];
                var value2 = object2[propertyName];
                if(value1<value2){
                    return -1;
                } else if(value1>value2){
                    return 1;
                }else{
                    return 0;
                }
            });
        },
        
        TracePlay: function(param){
			this.defaultduration = (param && param.duration) || this.defaultduration;
            this.speed = (param && param.speed) || this.speed;
			this.speed = this.speed / 20000;
            this.currenttime = (param && param.currenttime) || this.currenttime;
            if(this.traceTimer)
            	this.TraceStop();
            this.traceTimer = setInterval(dojo.hitch(this,this.play), this.defaultduration);
                
        },
        
        TraceReplay: function(param){
        	this.TraceStop();
        	this.currenttime = this.mintime;
        	this.TracePlay(param);
        },

        play : function(){
            var duration = this.defaultduration;
            var starttime = this.currenttime || this.mintime;
            var nexttime = new Date(starttime.valueOf() + this.speed*duration/1000);
            if(nexttime > this.maxtime){
            	this.drawArrowAtTime(this.mintime);
                this.currenttime = this.mintime;
            }else{
                if(!this.graphics || !this.graphics.length || this.graphics.length<2){
                    console.log("请先添加轨迹数据");
                    return;
                }
                if(this.valuesetter) 
                    this.valuesetter(100*(nexttime.valueOf()-this.mintime.valueOf())/(this.maxtime.valueOf()-this.mintime.valueOf()));
                this.drawArrowAtTime(nexttime);
                this.currenttime = nexttime;
            }
        },

        drawArrowAtTime: function(time){
            //查找在哪两个点的中间
            var startandcurrent = this.computePointAtTime(time);
            var start = startandcurrent && startandcurrent.start;
			var next = startandcurrent && startandcurrent.next;
            var current = startandcurrent && startandcurrent.current;
            if(start && current){
                if(current){
                    var angle = this.GetAzimuth(start, next);
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
                          heading : angle,
                          tilt : 90
                        }]
                    };
                    this.sceneGraphic.symbol = symbol
                    var point = new Point({
                        x: current.x,
                        y: current.y,
                        z: 5
                    });
                    this.sceneGraphic.geometry = point;
                }
            }
        },

        computePointAtTime: function(time){
            var startandcurrent = {};
            for(var i=0;i<this.graphics.length;i++){
                var graphic = this.graphics[i];
                var nextgraphic = this.graphics[i+1];
                if(graphic && graphic[this.timeattrname] && graphic.x && graphic.y 
                    && nextgraphic && nextgraphic[this.timeattrname] && nextgraphic.x && nextgraphic.y ){
                    if(graphic[this.timeattrname] < time && nextgraphic[this.timeattrname] >= time){
                        //根据时间计算坐标
                        var deltatime = nextgraphic[this.timeattrname] - graphic[this.timeattrname];
                        var deltax = nextgraphic.x - graphic.x;
                        var deltay = nextgraphic.y - graphic.y;
                        var rate = (time-graphic[this.timeattrname])/deltatime;
                        var x = graphic.x + deltax*rate;
                        var y = graphic.y + deltay*rate;
                        startandcurrent.start = graphic;
						startandcurrent.next = nextgraphic;
                        startandcurrent.current = {x: x, y: y, time: new Date(time.valueOf() + deltatime)};
                        return startandcurrent;
                    }
                }
            }
        },
		
		GetAzimuth : function(startgraphic, endgraphic) {
			var x1 = startgraphic.x;
			var y1 = startgraphic.y;
			var x2 = endgraphic.x;
			var y2 = endgraphic.y;
			var azimuth = 0.0;
			var _startLongitudeRad = this.Rad(x1);
			var _startLatitudeRad = this.Rad(y1);
			var _targetLongitudeRad = this.Rad(x2);
			var _targetLatitudeRad = this.Rad(y2);
			if (_startLongitudeRad == _targetLongitudeRad) {
				if (_targetLatitudeRad < _startLatitudeRad)  azimuth = 180.0;
			} else {
				var _cosC = Math.cos(this.Rad(90.0 - y2)) * Math.cos(this.Rad(90.0 - y1)) + Math.sin(this.Rad(90.0 - y2)) * Math.sin(this.Rad(90.0 - y1)) * Math.cos(_targetLongitudeRad - _startLongitudeRad);
				var _sinC = Math.sqrt(1.0 - _cosC * _cosC);
				var azimuthRad = Math.asin(Math.sin(this.Rad(90.0 - y2)) * Math.sin(_targetLongitudeRad - _startLongitudeRad) / _sinC);
				azimuth = this.Degree(azimuthRad);
				if (_startLatitudeRad > _targetLatitudeRad) {
					azimuth = 180.0 - azimuth;
				} else {
					if (_startLongitudeRad > _targetLongitudeRad) {
						azimuth = 360.0 + azimuth;
					}
				}
			}
			return azimuth;
		},

		Rad : function( d) {
			return d * Math.PI / 180.0;
		},

		Degree : function(r) {
			return r * 180.0 / Math.PI;
		},

        clear: function(){
        	this.traceLayer.clear();
        	this.playLayer.clear();
        },
        
        TraceStop: function(){
            dojo.hitch(this, this.clearTraceTimeout());
        },

        clearTraceTimeout: function(){
            clearInterval(this.traceTimer);
            delete this.traceTimer;
        },
		
		sleep: function(milliseconds) {
			for(var t = Date.now();Date.now() - t <= milliseconds;);
		}
        
    });
});