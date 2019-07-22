// koffee 1.3.0

/*
00     00   0000000   00000000          0000000   0000000  00000000    0000000   000      000    
000   000  000   000  000   000        000       000       000   000  000   000  000      000    
000000000  000000000  00000000         0000000   000       0000000    000   000  000      000    
000 0 000  000   000  000                   000  000       000   000  000   000  000      000    
000   000  000   000  000              0000000    0000000  000   000   0000000   0000000  0000000
 */
var MapScroll, clamp, events,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

clamp = require('kxk').clamp;

events = require('events');

MapScroll = (function(superClass) {
    extend(MapScroll, superClass);

    function MapScroll(cfg) {
        this.setLineHeight = bind(this.setLineHeight, this);
        this.setNumLines = bind(this.setNumLines, this);
        this.setViewHeight = bind(this.setViewHeight, this);
        this.deleteLine = bind(this.deleteLine, this);
        this.insertLine = bind(this.insertLine, this);
        this.setTop = bind(this.setTop, this);
        this.by = bind(this.by, this);
        this.to = bind(this.to, this);
        this.reset = bind(this.reset, this);
        var ref, ref1, ref2, ref3;
        MapScroll.__super__.constructor.call(this);
        this.lineHeight = (ref = cfg.lineHeight) != null ? ref : 0;
        this.viewHeight = (ref1 = cfg.viewHeight) != null ? ref1 : 0;
        this.exposeMax = (ref2 = cfg.exposeMax) != null ? ref2 : -4;
        this.smooth = (ref3 = cfg.smooth) != null ? ref3 : true;
        this.init();
    }

    MapScroll.prototype.init = function() {
        this.scroll = 0;
        this.offsetTop = 0;
        this.offsetSmooth = 0;
        this.fullHeight = 0;
        this.numLines = 0;
        this.top = 0;
        this.bot = 0;
        this.exposed = 0;
        this.exposeTop = 0;
        this.exposeBot = -1;
        this.calc();
        return this.offsetTop = -1;
    };

    MapScroll.prototype.calc = function() {
        this.scrollMax = Math.max(0, this.fullHeight - this.viewHeight);
        this.fullLines = Math.floor(this.viewHeight / this.lineHeight);
        this.viewLines = Math.ceil(this.viewHeight / this.lineHeight);
        this.linesHeight = this.viewLines * this.lineHeight;
        if (this.exposeMax < 0) {
            this.exposeNum = -this.exposeMax * this.viewLines;
        } else {
            this.exposeNum = this.exposeMax;
        }
        return this.exposeHeight = this.exposeNum * this.lineHeight;
    };

    MapScroll.prototype.info = function() {
        return {
            topbot: this.top + " .. " + this.bot + " = " + (this.bot - this.top) + " / " + this.numLines + " lines",
            expose: this.exposeTop + " .. " + this.exposeBot + " = " + (this.exposeBot - this.exposeTop) + " / " + this.exposeNum + " px " + this.exposeHeight,
            scroll: this.scroll + " offsetTop " + this.offsetTop + " scrollMax " + this.scrollMax + " fullLines " + this.fullLines + " viewLines " + this.viewLines + " viewHeight " + this.viewHeight
        };
    };

    MapScroll.prototype.reset = function() {
        this.emit('clearLines');
        return this.init();
    };

    MapScroll.prototype.to = function(p) {
        return this.by(p - this.scroll);
    };

    MapScroll.prototype.by = function(delta) {
        var offset, scroll, top;
        scroll = this.scroll;
        if (Number.isNaN(delta)) {
            delta = 0;
        }
        this.scroll = parseInt(clamp(0, this.scrollMax, this.scroll + delta));
        top = parseInt(this.scroll / this.lineHeight);
        this.offsetSmooth = this.scroll - top * this.lineHeight;
        this.setTop(top);
        offset = 0;
        if (this.smooth) {
            offset += this.offsetSmooth;
        }
        offset += (top - this.exposeTop) * this.lineHeight;
        if (offset !== this.offsetTop || scroll !== this.scroll) {
            this.offsetTop = parseInt(offset);
            return this.emit('scroll', this.scroll, this.offsetTop);
        }
    };

    MapScroll.prototype.setTop = function(top) {
        var n, num, oldBot, oldTop;
        if (this.exposeBot < 0 && this.numLines < 1) {
            return;
        }
        oldTop = this.top;
        oldBot = this.bot;
        this.top = top;
        this.bot = Math.min(this.top + this.viewLines, this.numLines - 1);
        if (oldTop === this.top && oldBot === this.bot && this.exposeBot >= this.bot) {
            return;
        }
        if ((this.top >= this.exposeBot) || (this.bot <= this.exposeTop)) {
            this.emit('clearLines');
            this.exposeTop = this.top;
            this.exposeBot = this.bot;
            num = this.bot - this.top + 1;
            if (num > 0) {
                this.emit('exposeLines', {
                    top: this.top,
                    bot: this.bot,
                    num: num
                });
                this.emit('scroll', this.scroll, this.offsetTop);
            }
            return;
        }
        if (this.top < this.exposeTop) {
            oldTop = this.exposeTop;
            this.exposeTop = Math.max(0, this.top - (Math.min(this.viewLines, this.exposeNum - this.viewLines)));
            num = oldTop - this.exposeTop;
            if (num > 0) {
                this.emit('exposeLines', {
                    top: this.exposeTop,
                    bot: oldTop - 1,
                    num: num
                });
            }
        }
        while (this.bot > this.exposeBot) {
            this.exposeBot += 1;
            this.emit('exposeLine', this.exposeBot);
        }
        if (this.exposeBot - this.exposeTop + 1 > this.exposeNum) {
            num = this.exposeBot - this.exposeTop + 1 - this.exposeNum;
            if (this.top > oldTop) {
                n = clamp(0, this.top - this.exposeTop, num);
                this.exposeTop += n;
                return this.emit('vanishLines', {
                    top: n
                });
            } else {
                n = clamp(0, this.exposeBot - this.bot, num);
                this.exposeBot -= n;
                return this.emit('vanishLines', {
                    bot: n
                });
            }
        }
    };

    MapScroll.prototype.insertLine = function(li, oi) {
        if (this.lineIndexIsInExpose(oi)) {
            this.exposeBot += 1;
        }
        if (this.lineIndexIsInView(oi)) {
            this.bot += 1;
        }
        if (oi < this.top) {
            this.top += 1;
        }
        this.numLines += 1;
        this.fullHeight = this.numLines * this.lineHeight;
        return this.calc();
    };

    MapScroll.prototype.deleteLine = function(li, oi) {
        if (this.lineIndexIsInExpose(oi) || this.numLines < this.exposeNum) {
            this.exposeBot -= 1;
        }
        if (this.lineIndexIsInView(oi)) {
            return this.bot -= 1;
        }
    };

    MapScroll.prototype.lineIndexIsInView = function(li) {
        if ((this.top <= li && li <= this.bot)) {
            return true;
        }
        return this.bot - this.top + 1 < this.fullLines;
    };

    MapScroll.prototype.lineIndexIsInExpose = function(li) {
        if ((this.exposeTop <= li && li <= this.exposeBot)) {
            return true;
        }
        return this.exposeBot - this.exposeTop + 1 < this.exposeNum;
    };

    MapScroll.prototype.setViewHeight = function(h) {
        if (this.viewHeight !== h) {
            this.viewHeight = h;
            this.calc();
            return this.by(0);
        }
    };

    MapScroll.prototype.setNumLines = function(n) {
        if (this.numLines !== n) {
            this.numLines = n;
            this.fullHeight = this.numLines * this.lineHeight;
            if (this.numLines) {
                this.calc();
                return this.by(0);
            } else {
                this.init();
                return this.emit('clearLines');
            }
        }
    };

    MapScroll.prototype.setLineHeight = function(h) {
        if (this.lineHeight !== h) {
            this.lineHeight = h;
            this.fullHeight = this.numLines * this.lineHeight;
            this.calc();
            return this.by(0);
        }
    };

    return MapScroll;

})(events);

module.exports = MapScroll;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwc2Nyb2xsLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSx3QkFBQTtJQUFBOzs7O0FBUUUsUUFBVSxPQUFBLENBQVEsS0FBUjs7QUFFWixNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0FBRUg7OztJQUVXLG1CQUFDLEdBQUQ7Ozs7Ozs7Ozs7QUFFVCxZQUFBO1FBQUEseUNBQUE7UUFDQSxJQUFDLENBQUEsVUFBRCwwQ0FBK0I7UUFDL0IsSUFBQyxDQUFBLFVBQUQsNENBQStCO1FBQy9CLElBQUMsQ0FBQSxTQUFELDJDQUE4QixDQUFDO1FBQy9CLElBQUMsQ0FBQSxNQUFELHdDQUEyQjtRQUMzQixJQUFDLENBQUEsSUFBRCxDQUFBO0lBUFM7O3dCQWViLElBQUEsR0FBTSxTQUFBO1FBQ0YsSUFBQyxDQUFBLE1BQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFVBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFFBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLEdBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLEdBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLE9BQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBaUI7UUFDakIsSUFBQyxDQUFBLFNBQUQsR0FBZ0IsQ0FBQztRQUNqQixJQUFDLENBQUEsSUFBRCxDQUFBO2VBQ0EsSUFBQyxDQUFBLFNBQUQsR0FBZ0IsQ0FBQztJQVpmOzt3QkFjTixJQUFBLEdBQU0sU0FBQTtRQUNGLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxDQUFULEVBQVcsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBMUI7UUFDZixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBMUI7UUFDZixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsVUFBekI7UUFDZixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBO1FBRTdCLElBQUcsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFoQjtZQUNJLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBQyxJQUFDLENBQUEsU0FBRixHQUFjLElBQUMsQ0FBQSxVQURoQztTQUFBLE1BQUE7WUFHSSxJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxVQUhsQjs7ZUFLQSxJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQTtJQVg1Qjs7d0JBbUJOLElBQUEsR0FBTSxTQUFBO2VBQ0Y7WUFBQSxNQUFBLEVBQVcsSUFBQyxDQUFBLEdBQUYsR0FBTSxNQUFOLEdBQVksSUFBQyxDQUFBLEdBQWIsR0FBaUIsS0FBakIsR0FBcUIsQ0FBQyxJQUFDLENBQUEsR0FBRCxHQUFLLElBQUMsQ0FBQSxHQUFQLENBQXJCLEdBQWdDLEtBQWhDLEdBQXFDLElBQUMsQ0FBQSxRQUF0QyxHQUErQyxRQUF6RDtZQUNBLE1BQUEsRUFBVyxJQUFDLENBQUEsU0FBRixHQUFZLE1BQVosR0FBa0IsSUFBQyxDQUFBLFNBQW5CLEdBQTZCLEtBQTdCLEdBQWlDLENBQUMsSUFBQyxDQUFBLFNBQUQsR0FBVyxJQUFDLENBQUEsU0FBYixDQUFqQyxHQUF3RCxLQUF4RCxHQUE2RCxJQUFDLENBQUEsU0FBOUQsR0FBd0UsTUFBeEUsR0FBOEUsSUFBQyxDQUFBLFlBRHpGO1lBRUEsTUFBQSxFQUFXLElBQUMsQ0FBQSxNQUFGLEdBQVMsYUFBVCxHQUFzQixJQUFDLENBQUEsU0FBdkIsR0FBaUMsYUFBakMsR0FBOEMsSUFBQyxDQUFBLFNBQS9DLEdBQXlELGFBQXpELEdBQXNFLElBQUMsQ0FBQSxTQUF2RSxHQUFpRixhQUFqRixHQUE4RixJQUFDLENBQUEsU0FBL0YsR0FBeUcsY0FBekcsR0FBdUgsSUFBQyxDQUFBLFVBRmxJOztJQURFOzt3QkFXTixLQUFBLEdBQU8sU0FBQTtRQUNILElBQUMsQ0FBQSxJQUFELENBQU0sWUFBTjtlQUNBLElBQUMsQ0FBQSxJQUFELENBQUE7SUFGRzs7d0JBVVAsRUFBQSxHQUFJLFNBQUMsQ0FBRDtlQUFPLElBQUMsQ0FBQSxFQUFELENBQUksQ0FBQSxHQUFFLElBQUMsQ0FBQSxNQUFQO0lBQVA7O3dCQVFKLEVBQUEsR0FBSSxTQUFDLEtBQUQ7QUFFQSxZQUFBO1FBQUEsTUFBQSxHQUFTLElBQUMsQ0FBQTtRQUNWLElBQWEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxLQUFiLENBQWI7WUFBQSxLQUFBLEdBQVEsRUFBUjs7UUFDQSxJQUFDLENBQUEsTUFBRCxHQUFVLFFBQUEsQ0FBUyxLQUFBLENBQU0sQ0FBTixFQUFTLElBQUMsQ0FBQSxTQUFWLEVBQXFCLElBQUMsQ0FBQSxNQUFELEdBQVEsS0FBN0IsQ0FBVDtRQUNWLEdBQUEsR0FBTSxRQUFBLENBQVMsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsVUFBcEI7UUFDTixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsTUFBRCxHQUFVLEdBQUEsR0FBTSxJQUFDLENBQUE7UUFFakMsSUFBQyxDQUFBLE1BQUQsQ0FBUSxHQUFSO1FBRUEsTUFBQSxHQUFTO1FBQ1QsSUFBMkIsSUFBQyxDQUFBLE1BQTVCO1lBQUEsTUFBQSxJQUFVLElBQUMsQ0FBQSxhQUFYOztRQUNBLE1BQUEsSUFBVSxDQUFDLEdBQUEsR0FBTSxJQUFDLENBQUEsU0FBUixDQUFBLEdBQXFCLElBQUMsQ0FBQTtRQUVoQyxJQUFHLE1BQUEsS0FBVSxJQUFDLENBQUEsU0FBWCxJQUF3QixNQUFBLEtBQVUsSUFBQyxDQUFBLE1BQXRDO1lBQ0ksSUFBQyxDQUFBLFNBQUQsR0FBYSxRQUFBLENBQVMsTUFBVDttQkFDYixJQUFDLENBQUEsSUFBRCxDQUFNLFFBQU4sRUFBZ0IsSUFBQyxDQUFBLE1BQWpCLEVBQXlCLElBQUMsQ0FBQSxTQUExQixFQUZKOztJQWRBOzt3QkF3QkosTUFBQSxHQUFRLFNBQUMsR0FBRDtBQUVKLFlBQUE7UUFBQSxJQUFVLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBYixJQUFtQixJQUFDLENBQUEsUUFBRCxHQUFZLENBQXpDO0FBQUEsbUJBQUE7O1FBRUEsTUFBQSxHQUFTLElBQUMsQ0FBQTtRQUNWLE1BQUEsR0FBUyxJQUFDLENBQUE7UUFDVixJQUFDLENBQUEsR0FBRCxHQUFPO1FBQ1AsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxHQUFELEdBQUssSUFBQyxDQUFBLFNBQWYsRUFBMEIsSUFBQyxDQUFBLFFBQUQsR0FBVSxDQUFwQztRQUNQLElBQVUsTUFBQSxLQUFVLElBQUMsQ0FBQSxHQUFYLElBQW1CLE1BQUEsS0FBVSxJQUFDLENBQUEsR0FBOUIsSUFBc0MsSUFBQyxDQUFBLFNBQUQsSUFBYyxJQUFDLENBQUEsR0FBL0Q7QUFBQSxtQkFBQTs7UUFFQSxJQUFHLENBQUMsSUFBQyxDQUFBLEdBQUQsSUFBUSxJQUFDLENBQUEsU0FBVixDQUFBLElBQXdCLENBQUMsSUFBQyxDQUFBLEdBQUQsSUFBUSxJQUFDLENBQUEsU0FBVixDQUEzQjtZQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sWUFBTjtZQUNBLElBQUMsQ0FBQSxTQUFELEdBQWEsSUFBQyxDQUFBO1lBQ2QsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFDLENBQUE7WUFDZCxHQUFBLEdBQU0sSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFDLENBQUEsR0FBUixHQUFjO1lBQ3BCLElBQUcsR0FBQSxHQUFNLENBQVQ7Z0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBQXFCO29CQUFBLEdBQUEsRUFBSSxJQUFDLENBQUEsR0FBTDtvQkFBVSxHQUFBLEVBQUksSUFBQyxDQUFBLEdBQWY7b0JBQW9CLEdBQUEsRUFBSyxHQUF6QjtpQkFBckI7Z0JBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxRQUFOLEVBQWdCLElBQUMsQ0FBQSxNQUFqQixFQUF5QixJQUFDLENBQUEsU0FBMUIsRUFGSjs7QUFHQSxtQkFSSjs7UUFVQSxJQUFHLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQyxDQUFBLFNBQVg7WUFDSSxNQUFBLEdBQVMsSUFBQyxDQUFBO1lBQ1YsSUFBQyxDQUFBLFNBQUQsR0FBYSxJQUFJLENBQUMsR0FBTCxDQUFTLENBQVQsRUFBWSxJQUFDLENBQUEsR0FBRCxHQUFPLENBQUMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsU0FBVixFQUFxQixJQUFDLENBQUEsU0FBRCxHQUFhLElBQUMsQ0FBQSxTQUFuQyxDQUFELENBQW5CO1lBQ2IsR0FBQSxHQUFNLE1BQUEsR0FBUyxJQUFDLENBQUE7WUFDaEIsSUFBRyxHQUFBLEdBQU0sQ0FBVDtnQkFDSSxJQUFDLENBQUEsSUFBRCxDQUFNLGFBQU4sRUFBcUI7b0JBQUEsR0FBQSxFQUFJLElBQUMsQ0FBQSxTQUFMO29CQUFnQixHQUFBLEVBQUksTUFBQSxHQUFPLENBQTNCO29CQUE4QixHQUFBLEVBQUssR0FBbkM7aUJBQXJCLEVBREo7YUFKSjs7QUFPQSxlQUFNLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQyxDQUFBLFNBQWQ7WUFDSSxJQUFDLENBQUEsU0FBRCxJQUFjO1lBQ2QsSUFBQyxDQUFBLElBQUQsQ0FBTSxZQUFOLEVBQW9CLElBQUMsQ0FBQSxTQUFyQjtRQUZKO1FBSUEsSUFBRyxJQUFDLENBQUEsU0FBRCxHQUFXLElBQUMsQ0FBQSxTQUFaLEdBQXNCLENBQXRCLEdBQTBCLElBQUMsQ0FBQSxTQUE5QjtZQUNJLEdBQUEsR0FBTyxJQUFDLENBQUEsU0FBRCxHQUFXLElBQUMsQ0FBQSxTQUFaLEdBQXNCLENBQXRCLEdBQTBCLElBQUMsQ0FBQTtZQUNsQyxJQUFHLElBQUMsQ0FBQSxHQUFELEdBQUssTUFBUjtnQkFDSSxDQUFBLEdBQUksS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsR0FBRCxHQUFLLElBQUMsQ0FBQSxTQUFmLEVBQTBCLEdBQTFCO2dCQUNKLElBQUMsQ0FBQSxTQUFELElBQWM7dUJBQ2QsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLEVBQXFCO29CQUFBLEdBQUEsRUFBSyxDQUFMO2lCQUFyQixFQUhKO2FBQUEsTUFBQTtnQkFLSSxDQUFBLEdBQUksS0FBQSxDQUFNLENBQU4sRUFBUyxJQUFDLENBQUEsU0FBRCxHQUFXLElBQUMsQ0FBQSxHQUFyQixFQUEwQixHQUExQjtnQkFDSixJQUFDLENBQUEsU0FBRCxJQUFjO3VCQUNkLElBQUMsQ0FBQSxJQUFELENBQU0sYUFBTixFQUFxQjtvQkFBQSxHQUFBLEVBQUssQ0FBTDtpQkFBckIsRUFQSjthQUZKOztJQS9CSTs7d0JBZ0RSLFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSSxFQUFKO1FBQ1IsSUFBbUIsSUFBQyxDQUFBLG1CQUFELENBQXFCLEVBQXJCLENBQW5CO1lBQUEsSUFBQyxDQUFBLFNBQUQsSUFBYyxFQUFkOztRQUNBLElBQW1CLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixFQUFuQixDQUFuQjtZQUFBLElBQUMsQ0FBQSxHQUFELElBQWMsRUFBZDs7UUFDQSxJQUFtQixFQUFBLEdBQUssSUFBQyxDQUFBLEdBQXpCO1lBQUEsSUFBQyxDQUFBLEdBQUQsSUFBYyxFQUFkOztRQUNBLElBQUMsQ0FBQSxRQUFELElBQWM7UUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO2VBQzNCLElBQUMsQ0FBQSxJQUFELENBQUE7SUFOUTs7d0JBY1osVUFBQSxHQUFZLFNBQUMsRUFBRCxFQUFJLEVBQUo7UUFDUixJQUFtQixJQUFDLENBQUEsbUJBQUQsQ0FBcUIsRUFBckIsQ0FBQSxJQUE0QixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxTQUE1RDtZQUFBLElBQUMsQ0FBQSxTQUFELElBQWMsRUFBZDs7UUFDQSxJQUFtQixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsRUFBbkIsQ0FBbkI7bUJBQUEsSUFBQyxDQUFBLEdBQUQsSUFBYyxFQUFkOztJQUZROzt3QkFJWixpQkFBQSxHQUFtQixTQUFDLEVBQUQ7UUFDZixJQUFlLENBQUEsSUFBQyxDQUFBLEdBQUQsSUFBUSxFQUFSLElBQVEsRUFBUixJQUFjLElBQUMsQ0FBQSxHQUFmLENBQWY7QUFBQSxtQkFBTyxLQUFQOztBQUNBLGVBQU8sSUFBQyxDQUFBLEdBQUQsR0FBSyxJQUFDLENBQUEsR0FBTixHQUFVLENBQVYsR0FBYyxJQUFDLENBQUE7SUFGUDs7d0JBSW5CLG1CQUFBLEdBQXFCLFNBQUMsRUFBRDtRQUNqQixJQUFlLENBQUEsSUFBQyxDQUFBLFNBQUQsSUFBYyxFQUFkLElBQWMsRUFBZCxJQUFvQixJQUFDLENBQUEsU0FBckIsQ0FBZjtBQUFBLG1CQUFPLEtBQVA7O0FBQ0EsZUFBTyxJQUFDLENBQUEsU0FBRCxHQUFXLElBQUMsQ0FBQSxTQUFaLEdBQXNCLENBQXRCLEdBQTBCLElBQUMsQ0FBQTtJQUZqQjs7d0JBVXJCLGFBQUEsR0FBZSxTQUFDLENBQUQ7UUFDWCxJQUFHLElBQUMsQ0FBQSxVQUFELEtBQWUsQ0FBbEI7WUFDSSxJQUFDLENBQUEsVUFBRCxHQUFjO1lBQ2QsSUFBQyxDQUFBLElBQUQsQ0FBQTttQkFDQSxJQUFDLENBQUEsRUFBRCxDQUFJLENBQUosRUFISjs7SUFEVzs7d0JBWWYsV0FBQSxHQUFhLFNBQUMsQ0FBRDtRQUVULElBQUcsSUFBQyxDQUFBLFFBQUQsS0FBYSxDQUFoQjtZQUNJLElBQUMsQ0FBQSxRQUFELEdBQVk7WUFDWixJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO1lBQzNCLElBQUcsSUFBQyxDQUFBLFFBQUo7Z0JBQ0ksSUFBQyxDQUFBLElBQUQsQ0FBQTt1QkFDQSxJQUFDLENBQUEsRUFBRCxDQUFJLENBQUosRUFGSjthQUFBLE1BQUE7Z0JBSUksSUFBQyxDQUFBLElBQUQsQ0FBQTt1QkFDQSxJQUFDLENBQUEsSUFBRCxDQUFNLFlBQU4sRUFMSjthQUhKOztJQUZTOzt3QkFrQmIsYUFBQSxHQUFlLFNBQUMsQ0FBRDtRQUVYLElBQUcsSUFBQyxDQUFBLFVBQUQsS0FBZSxDQUFsQjtZQUNJLElBQUMsQ0FBQSxVQUFELEdBQWM7WUFDZCxJQUFDLENBQUEsVUFBRCxHQUFjLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBO1lBQzNCLElBQUMsQ0FBQSxJQUFELENBQUE7bUJBQ0EsSUFBQyxDQUFBLEVBQUQsQ0FBSSxDQUFKLEVBSko7O0lBRlc7Ozs7R0FyTks7O0FBNk54QixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgIFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMFxuIyMjXG5cbnsgY2xhbXAgfSA9IHJlcXVpcmUgJ2t4aydcblxuZXZlbnRzID0gcmVxdWlyZSAnZXZlbnRzJ1xuXG5jbGFzcyBNYXBTY3JvbGwgZXh0ZW5kcyBldmVudHNcblxuICAgIGNvbnN0cnVjdG9yOiAoY2ZnKSAtPlxuXG4gICAgICAgIHN1cGVyKClcbiAgICAgICAgQGxpbmVIZWlnaHQgPSBjZmcubGluZUhlaWdodCA/IDBcbiAgICAgICAgQHZpZXdIZWlnaHQgPSBjZmcudmlld0hlaWdodCA/IDBcbiAgICAgICAgQGV4cG9zZU1heCAgPSBjZmcuZXhwb3NlTWF4ID8gLTQgIyA8MDogLXYgKiB2aWV3TGluZXMgfCAwOiB1bmxpbWl0ZWQgfCA+MDogdiAqIDFcbiAgICAgICAgQHNtb290aCAgICAgPSBjZmcuc21vb3RoID8gdHJ1ZVxuICAgICAgICBAaW5pdCgpXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDAgICBcblxuICAgIGluaXQ6IC0+XG4gICAgICAgIEBzY3JvbGwgICAgICAgPSAgMCAjIGN1cnJlbnQgc2Nyb2xsIHZhbHVlIGZyb20gZG9jdW1lbnQgc3RhcnQgKHBpeGVscylcbiAgICAgICAgQG9mZnNldFRvcCAgICA9ICAwICMgaGVpZ2h0IG9mIHZpZXcgYWJvdmUgZmlyc3QgdmlzaWJsZSBsaW5lIChwaXhlbHMpXG4gICAgICAgIEBvZmZzZXRTbW9vdGggPSAgMCAjIHNtb290aCBzY3JvbGxpbmcgb2Zmc2V0IC8gcGFydCBvZiB0b3AgbGluZSB0aGF0IGlzIGhpZGRlbiAocGl4ZWxzKVxuICAgICAgICBAZnVsbEhlaWdodCAgID0gIDAgIyB0b3RhbCBoZWlnaHQgb2YgYnVmZmVyIChwaXhlbHMpXG4gICAgICAgIEBudW1MaW5lcyAgICAgPSAgMCAjIHRvdGFsIG51bWJlciBvZiBsaW5lcyBpbiBidWZmZXJcbiAgICAgICAgQHRvcCAgICAgICAgICA9ICAwICMgaW5kZXggb2YgZmlyc3QgdmlzaWJsZSBsaW5lIGluIHZpZXdcbiAgICAgICAgQGJvdCAgICAgICAgICA9ICAwICMgaW5kZXggb2YgbGFzdCAgdmlzaWJsZSBsaW5lIGluIHZpZXdcbiAgICAgICAgQGV4cG9zZWQgICAgICA9ICAwICMgbnVtYmVyIG9mIGN1cnJlbnRseSBleHBvc2VkIGxpbmVzXG4gICAgICAgIEBleHBvc2VUb3AgICAgPSAgMCAjIGluZGV4IG9mIHRvcG1vc3QgbGluZSBpbiB2aWV3IChhbHdheXMgPD0gQHRvcClcbiAgICAgICAgQGV4cG9zZUJvdCAgICA9IC0xICMgaW5kZXggb2YgYm90dG9tIGxpbmUgaW4gdmlldyAoYWx3YXlzID49IEBib3QpXG4gICAgICAgIEBjYWxjKClcbiAgICAgICAgQG9mZnNldFRvcCAgICA9IC0xICMgaGFjayB0byBlbWl0IGluaXRpYWwgc2Nyb2xsXG5cbiAgICBjYWxjOiAtPlxuICAgICAgICBAc2Nyb2xsTWF4ICAgPSBNYXRoLm1heCgwLEBmdWxsSGVpZ2h0IC0gQHZpZXdIZWlnaHQpICAjIG1heGltdW0gc2Nyb2xsIG9mZnNldCAocGl4ZWxzKVxuICAgICAgICBAZnVsbExpbmVzICAgPSBNYXRoLmZsb29yKEB2aWV3SGVpZ2h0IC8gQGxpbmVIZWlnaHQpICAjIG51bWJlciBvZiBsaW5lcyBpbiB2aWV3IChleGNsdWRpbmcgcGFydGlhbHMpXG4gICAgICAgIEB2aWV3TGluZXMgICA9IE1hdGguY2VpbChAdmlld0hlaWdodCAvIEBsaW5lSGVpZ2h0KSAgICMgbnVtYmVyIG9mIGxpbmVzIGluIHZpZXcgKGluY2x1ZGluZyBwYXJ0aWFscylcbiAgICAgICAgQGxpbmVzSGVpZ2h0ID0gQHZpZXdMaW5lcyAqIEBsaW5lSGVpZ2h0ICAgICAgICAgICAgICAgIyBoZWlnaHQgb2YgdmlzaWJsZSBsaW5lcyAocGl4ZWxzKVxuXG4gICAgICAgIGlmIEBleHBvc2VNYXggPCAwXG4gICAgICAgICAgICBAZXhwb3NlTnVtID0gLUBleHBvc2VNYXggKiBAdmlld0xpbmVzICMgbWF4aW11bSBzaXplIG9mIGV4cG9zZSByYW5nZSBpcyB2aWV3SGVpZ2h0IGRlcGVuZGVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZXhwb3NlTnVtID0gQGV4cG9zZU1heFxuICAgICAgICAgICAgXG4gICAgICAgIEBleHBvc2VIZWlnaHQgPSBAZXhwb3NlTnVtICogQGxpbmVIZWlnaHRcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwICAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMDAwMDAgXG4gICAgXG4gICAgaW5mbzogLT5cbiAgICAgICAgdG9wYm90OiBcIiN7QHRvcH0gLi4gI3tAYm90fSA9ICN7QGJvdC1AdG9wfSAvICN7QG51bUxpbmVzfSBsaW5lc1wiXG4gICAgICAgIGV4cG9zZTogXCIje0BleHBvc2VUb3B9IC4uICN7QGV4cG9zZUJvdH0gPSAje0BleHBvc2VCb3QtQGV4cG9zZVRvcH0gLyAje0BleHBvc2VOdW19IHB4ICN7QGV4cG9zZUhlaWdodH1cIlxuICAgICAgICBzY3JvbGw6IFwiI3tAc2Nyb2xsfSBvZmZzZXRUb3AgI3tAb2Zmc2V0VG9wfSBzY3JvbGxNYXggI3tAc2Nyb2xsTWF4fSBmdWxsTGluZXMgI3tAZnVsbExpbmVzfSB2aWV3TGluZXMgI3tAdmlld0xpbmVzfSB2aWV3SGVpZ2h0ICN7QHZpZXdIZWlnaHR9XCJcbiAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICBcbiAgICBcbiAgICByZXNldDogPT5cbiAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG4gICAgICAgIEBpbml0KClcblxuICAgICMgMDAwMDAwMDAwICAgMDAwMDAwMCBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwXG4gICAgIyAgICAwMDAgICAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgIDAwMDAwMDAgXG4gICAgXG4gICAgdG86IChwKSA9PiBAYnkgcC1Ac2Nyb2xsXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMCAwMDAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgICAgICAgMDAwICAgXG4gICAgICAgIFxuICAgIGJ5OiAoZGVsdGEpID0+XG4gICAgICAgIFxuICAgICAgICBzY3JvbGwgPSBAc2Nyb2xsXG4gICAgICAgIGRlbHRhID0gMCBpZiBOdW1iZXIuaXNOYU4gZGVsdGFcbiAgICAgICAgQHNjcm9sbCA9IHBhcnNlSW50IGNsYW1wIDAsIEBzY3JvbGxNYXgsIEBzY3JvbGwrZGVsdGFcbiAgICAgICAgdG9wID0gcGFyc2VJbnQgQHNjcm9sbCAvIEBsaW5lSGVpZ2h0XG4gICAgICAgIEBvZmZzZXRTbW9vdGggPSBAc2Nyb2xsIC0gdG9wICogQGxpbmVIZWlnaHQgXG4gICAgICAgIFxuICAgICAgICBAc2V0VG9wIHRvcFxuXG4gICAgICAgIG9mZnNldCA9IDBcbiAgICAgICAgb2Zmc2V0ICs9IEBvZmZzZXRTbW9vdGggaWYgQHNtb290aFxuICAgICAgICBvZmZzZXQgKz0gKHRvcCAtIEBleHBvc2VUb3ApICogQGxpbmVIZWlnaHRcbiAgICAgICAgXG4gICAgICAgIGlmIG9mZnNldCAhPSBAb2Zmc2V0VG9wIG9yIHNjcm9sbCAhPSBAc2Nyb2xsXG4gICAgICAgICAgICBAb2Zmc2V0VG9wID0gcGFyc2VJbnQgb2Zmc2V0XG4gICAgICAgICAgICBAZW1pdCAnc2Nyb2xsJywgQHNjcm9sbCwgQG9mZnNldFRvcFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICBcbiAgICAgICAgICAgIFxuICAgIHNldFRvcDogKHRvcCkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBAZXhwb3NlQm90IDwgMCBhbmQgQG51bUxpbmVzIDwgMVxuICAgICAgICBcbiAgICAgICAgb2xkVG9wID0gQHRvcFxuICAgICAgICBvbGRCb3QgPSBAYm90XG4gICAgICAgIEB0b3AgPSB0b3BcbiAgICAgICAgQGJvdCA9IE1hdGgubWluIEB0b3ArQHZpZXdMaW5lcywgQG51bUxpbmVzLTFcbiAgICAgICAgcmV0dXJuIGlmIG9sZFRvcCA9PSBAdG9wIGFuZCBvbGRCb3QgPT0gQGJvdCBhbmQgQGV4cG9zZUJvdCA+PSBAYm90XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIChAdG9wID49IEBleHBvc2VCb3QpIG9yIChAYm90IDw9IEBleHBvc2VUb3ApICMgbmV3IHJhbmdlIG91dHNpZGUsIHN0YXJ0IGZyb20gc2NyYXRjaFxuICAgICAgICAgICAgQGVtaXQgJ2NsZWFyTGluZXMnXG4gICAgICAgICAgICBAZXhwb3NlVG9wID0gQHRvcFxuICAgICAgICAgICAgQGV4cG9zZUJvdCA9IEBib3RcbiAgICAgICAgICAgIG51bSA9IEBib3QgLSBAdG9wICsgMVxuICAgICAgICAgICAgaWYgbnVtID4gMFxuICAgICAgICAgICAgICAgIEBlbWl0ICdleHBvc2VMaW5lcycsIHRvcDpAdG9wLCBib3Q6QGJvdCwgbnVtOiBudW1cbiAgICAgICAgICAgICAgICBAZW1pdCAnc2Nyb2xsJywgQHNjcm9sbCwgQG9mZnNldFRvcFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBAdG9wIDwgQGV4cG9zZVRvcFxuICAgICAgICAgICAgb2xkVG9wID0gQGV4cG9zZVRvcFxuICAgICAgICAgICAgQGV4cG9zZVRvcCA9IE1hdGgubWF4IDAsIEB0b3AgLSAoTWF0aC5taW4gQHZpZXdMaW5lcywgQGV4cG9zZU51bSAtIEB2aWV3TGluZXMpXG4gICAgICAgICAgICBudW0gPSBvbGRUb3AgLSBAZXhwb3NlVG9wXG4gICAgICAgICAgICBpZiBudW0gPiAwXG4gICAgICAgICAgICAgICAgQGVtaXQgJ2V4cG9zZUxpbmVzJywgdG9wOkBleHBvc2VUb3AsIGJvdDpvbGRUb3AtMSwgbnVtOiBudW1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgQGJvdCA+IEBleHBvc2VCb3RcbiAgICAgICAgICAgIEBleHBvc2VCb3QgKz0gMVxuICAgICAgICAgICAgQGVtaXQgJ2V4cG9zZUxpbmUnLCBAZXhwb3NlQm90XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgQGV4cG9zZUJvdC1AZXhwb3NlVG9wKzEgPiBAZXhwb3NlTnVtIFxuICAgICAgICAgICAgbnVtICA9IEBleHBvc2VCb3QtQGV4cG9zZVRvcCsxIC0gQGV4cG9zZU51bVxuICAgICAgICAgICAgaWYgQHRvcD5vbGRUb3BcbiAgICAgICAgICAgICAgICBuID0gY2xhbXAgMCwgQHRvcC1AZXhwb3NlVG9wLCBudW1cbiAgICAgICAgICAgICAgICBAZXhwb3NlVG9wICs9IG5cbiAgICAgICAgICAgICAgICBAZW1pdCAndmFuaXNoTGluZXMnLCB0b3A6IG5cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBuID0gY2xhbXAgMCwgQGV4cG9zZUJvdC1AYm90LCBudW1cbiAgICAgICAgICAgICAgICBAZXhwb3NlQm90IC09IG5cbiAgICAgICAgICAgICAgICBAZW1pdCAndmFuaXNoTGluZXMnLCBib3Q6IG5cbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAwMDAgMCAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuICAgIFxuICAgIGluc2VydExpbmU6IChsaSxvaSkgPT5cbiAgICAgICAgQGV4cG9zZUJvdCArPSAxIGlmIEBsaW5lSW5kZXhJc0luRXhwb3NlIG9pXG4gICAgICAgIEBib3QgICAgICAgKz0gMSBpZiBAbGluZUluZGV4SXNJblZpZXcgb2lcbiAgICAgICAgQHRvcCAgICAgICArPSAxIGlmIG9pIDwgQHRvcFxuICAgICAgICBAbnVtTGluZXMgICs9IDFcbiAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodFxuICAgICAgICBAY2FsYygpXG4gICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBkZWxldGVMaW5lOiAobGksb2kpID0+XG4gICAgICAgIEBleHBvc2VCb3QgLT0gMSBpZiBAbGluZUluZGV4SXNJbkV4cG9zZShvaSkgb3IgQG51bUxpbmVzIDwgQGV4cG9zZU51bVxuICAgICAgICBAYm90ICAgICAgIC09IDEgaWYgQGxpbmVJbmRleElzSW5WaWV3IG9pXG4gICAgXG4gICAgbGluZUluZGV4SXNJblZpZXc6IChsaSkgLT4gXG4gICAgICAgIHJldHVybiB0cnVlIGlmIEB0b3AgPD0gbGkgPD0gQGJvdFxuICAgICAgICByZXR1cm4gQGJvdC1AdG9wKzEgPCBAZnVsbExpbmVzXG4gICAgICAgIFxuICAgIGxpbmVJbmRleElzSW5FeHBvc2U6IChsaSkgLT5cbiAgICAgICAgcmV0dXJuIHRydWUgaWYgQGV4cG9zZVRvcCA8PSBsaSA8PSBAZXhwb3NlQm90IFxuICAgICAgICByZXR1cm4gQGV4cG9zZUJvdC1AZXhwb3NlVG9wKzEgPCBAZXhwb3NlTnVtXG4gICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAgMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAgICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBzZXRWaWV3SGVpZ2h0OiAoaCkgPT5cbiAgICAgICAgaWYgQHZpZXdIZWlnaHQgIT0gaFxuICAgICAgICAgICAgQHZpZXdIZWlnaHQgPSBoXG4gICAgICAgICAgICBAY2FsYygpXG4gICAgICAgICAgICBAYnkgMFxuICAgICAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgXG4gICAgICAgIFxuICAgIHNldE51bUxpbmVzOiAobikgPT5cblxuICAgICAgICBpZiBAbnVtTGluZXMgIT0gblxuICAgICAgICAgICAgQG51bUxpbmVzID0gblxuICAgICAgICAgICAgQGZ1bGxIZWlnaHQgPSBAbnVtTGluZXMgKiBAbGluZUhlaWdodCAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQG51bUxpbmVzXG4gICAgICAgICAgICAgICAgQGNhbGMoKVxuICAgICAgICAgICAgICAgIEBieSAwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGluaXQoKVxuICAgICAgICAgICAgICAgIEBlbWl0ICdjbGVhckxpbmVzJyAgICAgICAgICAgICBcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICBcbiAgICAjIDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgXG5cbiAgICBzZXRMaW5lSGVpZ2h0OiAoaCkgPT5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAbGluZUhlaWdodCAhPSBoXG4gICAgICAgICAgICBAbGluZUhlaWdodCA9IGhcbiAgICAgICAgICAgIEBmdWxsSGVpZ2h0ID0gQG51bUxpbmVzICogQGxpbmVIZWlnaHRcbiAgICAgICAgICAgIEBjYWxjKClcbiAgICAgICAgICAgIEBieSAwXG5cbm1vZHVsZS5leHBvcnRzID0gTWFwU2Nyb2xsXG4iXX0=
//# sourceURL=../../coffee/editor/mapscroll.coffee