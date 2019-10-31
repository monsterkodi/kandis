// koffee 1.4.0

/*
 0000000   0000000  00000000    0000000   000      000      00000000  00000000
000       000       000   000  000   000  000      000      000       000   000
0000000   000       0000000    000   000  000      000      0000000   0000000
     000  000       000   000  000   000  000      000      000       000   000
0000000    0000000  000   000   0000000   0000000  0000000  00000000  000   000
 */
var Scroller, clamp, drag, elem, ref, scheme, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), stopEvent = ref.stopEvent, clamp = ref.clamp, drag = ref.drag, elem = ref.elem;

scheme = require('../tools/scheme');

Scroller = (function() {
    function Scroller(column) {
        this.column = column;
        this.update = bind(this.update, this);
        this.onScroll = bind(this.onScroll, this);
        this.onWheel = bind(this.onWheel, this);
        this.onDrag = bind(this.onDrag, this);
        this.onStart = bind(this.onStart, this);
        this.elem = elem({
            "class": 'scrollbar right'
        });
        this.column.div.insertBefore(this.elem, this.column.table);
        this.handle = elem({
            "class": 'scrollhandle right'
        });
        this.elem.appendChild(this.handle);
        this.drag = new drag({
            target: this.elem,
            onStart: this.onStart,
            onMove: this.onDrag,
            cursor: 'ns-resize'
        });
        this.elem.addEventListener('wheel', this.onWheel);
        this.column.div.addEventListener('wheel', this.onWheel);
        this.column.div.addEventListener('scroll', this.onScroll);
        this.target = this.column.div;
    }

    Scroller.prototype.numRows = function() {
        return this.column.numRows();
    };

    Scroller.prototype.visRows = function() {
        return 1 + parseInt(this.column.browser.height() / this.column.rowHeight());
    };

    Scroller.prototype.rowHeight = function() {
        return this.column.rowHeight();
    };

    Scroller.prototype.height = function() {
        return this.column.browser.height();
    };

    Scroller.prototype.onStart = function(drag, event) {
        var br, ln, ly, sy;
        br = this.elem.getBoundingClientRect();
        sy = clamp(0, this.height(), event.clientY - br.top);
        ln = parseInt(this.numRows() * sy / this.height());
        ly = (ln - this.visRows() / 2) * this.rowHeight();
        return this.target.scrollTop = ly;
    };

    Scroller.prototype.onDrag = function(drag) {
        var delta;
        delta = (drag.delta.y / (this.visRows() * this.rowHeight())) * this.numRows() * this.rowHeight();
        this.target.scrollTop += delta;
        return this.update();
    };

    Scroller.prototype.onWheel = function(event) {
        if (Math.abs(event.deltaX) >= 2 * Math.abs(event.deltaY) || Math.abs(event.deltaY) === 0) {
            this.target.scrollLeft += event.deltaX;
        } else {
            this.target.scrollTop += event.deltaY;
        }
        return stopEvent(event);
    };

    Scroller.prototype.onScroll = function(event) {
        return this.update();
    };

    Scroller.prototype.toIndex = function(i) {
        var newTop, row;
        row = this.column.rows[i].div;
        newTop = this.target.scrollTop;
        if (newTop < row.offsetTop + this.rowHeight() - this.height()) {
            newTop = row.offsetTop + this.rowHeight() - this.height();
        } else if (newTop > row.offsetTop) {
            newTop = row.offsetTop;
        }
        this.target.scrollTop = parseInt(newTop);
        return this.update();
    };

    Scroller.prototype.update = function() {
        var base, base1, bh, cf, cs, longColor, ref1, ref2, ref3, scrollHeight, scrollTop, shortColor, vh;
        if (this.numRows() * this.rowHeight() < this.height()) {
            this.elem.style.display = 'none';
            this.elem.style.top = "0";
            this.handle.style.top = "0";
            this.handle.style.height = "0";
            this.handle.style.width = "0";
        } else {
            this.elem.style.display = 'block';
            bh = this.numRows() * this.rowHeight();
            vh = Math.min(this.visRows() * this.rowHeight(), this.height());
            scrollTop = parseInt((this.target.scrollTop / bh) * vh);
            scrollHeight = parseInt(((this.visRows() * this.rowHeight()) / bh) * vh);
            scrollHeight = Math.max(scrollHeight, parseInt(this.rowHeight() / 4));
            scrollTop = Math.min(scrollTop, this.height() - scrollHeight);
            scrollTop = Math.max(0, scrollTop);
            this.elem.style.top = this.target.scrollTop + "px";
            this.handle.style.top = scrollTop + "px";
            this.handle.style.height = scrollHeight + "px";
            this.handle.style.width = "2px";
            longColor = scheme.colorForClass('scroller long');
            shortColor = scheme.colorForClass('scroller short');
            cf = 1 - clamp(0, 1, (scrollHeight - 10) / 200);
            cs = scheme.fadeColor(longColor, shortColor, cf);
            this.handle.style.backgroundColor = cs;
        }
        if (((ref1 = this.column.parent) != null ? ref1.type : void 0) === 'preview') {
            if ((typeof (base = this.column).prevColumn === "function" ? base.prevColumn().div.scrollTop : void 0) !== this.target.scrollTop) {
                this.column.prevColumn().div.scrollTop = this.target.scrollTop;
            }
        } else if ((typeof (base1 = this.column).nextColumn === "function" ? (ref2 = base1.nextColumn()) != null ? (ref3 = ref2.parent) != null ? ref3.type : void 0 : void 0 : void 0) === 'preview') {
            if (this.column.nextColumn().div.scrollTop !== this.target.scrollTop) {
                this.column.nextColumn().div.scrollTop = this.target.scrollTop;
            }
        }
        return this.handle.style.right = "-" + this.target.scrollLeft + "px";
    };

    return Scroller;

})();

module.exports = Scroller;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLG1EQUFBO0lBQUE7O0FBUUEsTUFBbUMsT0FBQSxDQUFRLEtBQVIsQ0FBbkMsRUFBRSx5QkFBRixFQUFhLGlCQUFiLEVBQW9CLGVBQXBCLEVBQTBCOztBQUUxQixNQUFBLEdBQVMsT0FBQSxDQUFRLGlCQUFSOztBQUVIO0lBRUMsa0JBQUMsTUFBRDtRQUFDLElBQUMsQ0FBQSxTQUFEOzs7Ozs7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7U0FBTDtRQUNSLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVosQ0FBeUIsSUFBQyxDQUFBLElBQTFCLEVBQWdDLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBeEM7UUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0JBQVA7U0FBTDtRQUNWLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsTUFBbkI7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxJQUFWO1lBQ0EsT0FBQSxFQUFTLElBQUMsQ0FBQSxPQURWO1lBRUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxNQUZWO1lBR0EsTUFBQSxFQUFTLFdBSFQ7U0FESTtRQU1SLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBNkIsT0FBN0IsRUFBdUMsSUFBQyxDQUFBLE9BQXhDO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQVosQ0FBNkIsT0FBN0IsRUFBdUMsSUFBQyxDQUFBLE9BQXhDO1FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFHLENBQUMsZ0JBQVos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K0NBQWlCLENBQUUsY0FBaEIsS0FBd0IsU0FBM0I7WUFDSSxpRUFBVSxDQUFDLFlBQWEsQ0FBQyxHQUFHLENBQUMsbUJBQTFCLEtBQXVDLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBbEQ7Z0JBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxHQUFHLENBQUMsU0FBekIsR0FBcUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQURqRDthQURKO1NBQUEsTUFHSyx1SUFBZ0MsQ0FBRSxnQ0FBL0IsS0FBdUMsU0FBMUM7WUFDRCxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBUixDQUFBLENBQW9CLENBQUMsR0FBRyxDQUFDLFNBQXpCLEtBQXNDLElBQUMsQ0FBQSxNQUFNLENBQUMsU0FBakQ7Z0JBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxHQUFHLENBQUMsU0FBekIsR0FBcUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQURqRDthQURDOztlQUlMLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQWQsR0FBc0IsR0FBQSxHQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsVUFBWixHQUF1QjtJQXZDekM7Ozs7OztBQXlDWixNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4wMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgc3RvcEV2ZW50LCBjbGFtcCwgZHJhZywgZWxlbSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5zY2hlbWUgPSByZXF1aXJlICcuLi90b29scy9zY2hlbWUnXG5cbmNsYXNzIFNjcm9sbGVyXG5cbiAgICBAOiAoQGNvbHVtbikgLT5cblxuICAgICAgICBAZWxlbSA9IGVsZW0gY2xhc3M6ICdzY3JvbGxiYXIgcmlnaHQnXG4gICAgICAgIEBjb2x1bW4uZGl2Lmluc2VydEJlZm9yZSBAZWxlbSwgQGNvbHVtbi50YWJsZVxuXG4gICAgICAgIEBoYW5kbGUgPSBlbGVtIGNsYXNzOiAnc2Nyb2xsaGFuZGxlIHJpZ2h0J1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAaGFuZGxlXG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGVsZW1cbiAgICAgICAgICAgIG9uU3RhcnQ6IEBvblN0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnXG4gICAgICAgICAgICBjdXJzb3I6ICAnbnMtcmVzaXplJ1xuXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgICAgICAgJ3doZWVsJywgIEBvbldoZWVsXG4gICAgICAgIEBjb2x1bW4uZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJywgIEBvbldoZWVsXG4gICAgICAgIEBjb2x1bW4uZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ3Njcm9sbCcsIEBvblNjcm9sbFxuICAgICAgICBAdGFyZ2V0ID0gQGNvbHVtbi5kaXZcbiAgICAgICAgXG4gICAgbnVtUm93czogICAtPiBAY29sdW1uLm51bVJvd3MoKVxuICAgIHZpc1Jvd3M6ICAgLT4gMSArIHBhcnNlSW50IEBjb2x1bW4uYnJvd3Nlci5oZWlnaHQoKSAvIEBjb2x1bW4ucm93SGVpZ2h0KClcbiAgICByb3dIZWlnaHQ6IC0+IEBjb2x1bW4ucm93SGVpZ2h0KClcbiAgICBoZWlnaHQ6ICAgIC0+IEBjb2x1bW4uYnJvd3Nlci5oZWlnaHQoKVxuICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgICAgIDAwMFxuICAgICMgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuXG4gICAgb25TdGFydDogKGRyYWcsIGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgYnIgPSBAZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBzeSA9IGNsYW1wIDAsIEBoZWlnaHQoKSwgZXZlbnQuY2xpZW50WSAtIGJyLnRvcFxuICAgICAgICBsbiA9IHBhcnNlSW50IEBudW1Sb3dzKCkgKiBzeS9AaGVpZ2h0KClcbiAgICAgICAgbHkgPSAobG4gLSBAdmlzUm93cygpIC8gMikgKiBAcm93SGVpZ2h0KClcbiAgICAgICAgQHRhcmdldC5zY3JvbGxUb3AgPSBseVxuXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIG9uRHJhZzogKGRyYWcpID0+XG4gICAgICAgIFxuICAgICAgICBkZWx0YSA9IChkcmFnLmRlbHRhLnkgLyAoQHZpc1Jvd3MoKSAqIEByb3dIZWlnaHQoKSkpICogQG51bVJvd3MoKSAqIEByb3dIZWlnaHQoKVxuICAgICAgICBAdGFyZ2V0LnNjcm9sbFRvcCArPSBkZWx0YVxuICAgICAgICBAdXBkYXRlKClcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBvbldoZWVsOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBNYXRoLmFicyhldmVudC5kZWx0YVgpID49IDIqTWF0aC5hYnMoZXZlbnQuZGVsdGFZKSBvciBNYXRoLmFicyhldmVudC5kZWx0YVkpID09IDBcbiAgICAgICAgICAgIEB0YXJnZXQuc2Nyb2xsTGVmdCArPSBldmVudC5kZWx0YVhcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHRhcmdldC5zY3JvbGxUb3AgKz0gZXZlbnQuZGVsdGFZXG4gICAgICAgIHN0b3BFdmVudCBldmVudCAgICBcbiAgICAgICAgXG4gICAgb25TY3JvbGw6IChldmVudCkgPT4gQHVwZGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMFxuXG4gICAgdG9JbmRleDogKGkpIC0+XG4gICAgICAgIFxuICAgICAgICByb3cgPSBAY29sdW1uLnJvd3NbaV0uZGl2XG4gICAgICAgIG5ld1RvcCA9IEB0YXJnZXQuc2Nyb2xsVG9wXG4gICAgICAgIGlmIG5ld1RvcCA8IHJvdy5vZmZzZXRUb3AgKyBAcm93SGVpZ2h0KCkgLSBAaGVpZ2h0KClcbiAgICAgICAgICAgIG5ld1RvcCA9IHJvdy5vZmZzZXRUb3AgKyBAcm93SGVpZ2h0KCkgLSBAaGVpZ2h0KClcbiAgICAgICAgZWxzZSBpZiBuZXdUb3AgPiByb3cub2Zmc2V0VG9wXG4gICAgICAgICAgICBuZXdUb3AgPSByb3cub2Zmc2V0VG9wXG4gICAgICAgIEB0YXJnZXQuc2Nyb2xsVG9wID0gcGFyc2VJbnQgbmV3VG9wXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgdXBkYXRlOiA9PlxuICAgICAgICBcbiAgICAgICAgaWYgQG51bVJvd3MoKSAqIEByb3dIZWlnaHQoKSA8IEBoZWlnaHQoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZWxlbS5zdHlsZS5kaXNwbGF5ICAgPSAnbm9uZSdcbiAgICAgICAgICAgIEBlbGVtLnN0eWxlLnRvcCAgICAgICA9IFwiMFwiXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLnRvcCAgICAgPSBcIjBcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgID0gXCIwXCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUud2lkdGggICA9IFwiMFwiXG4gICAgICAgICAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVsZW0uc3R5bGUuZGlzcGxheSAgID0gJ2Jsb2NrJ1xuICAgICAgICAgICAgYmggICAgICAgICAgID0gQG51bVJvd3MoKSAqIEByb3dIZWlnaHQoKVxuICAgICAgICAgICAgdmggICAgICAgICAgID0gTWF0aC5taW4gKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpLCBAaGVpZ2h0KClcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IHBhcnNlSW50IChAdGFyZ2V0LnNjcm9sbFRvcCAvIGJoKSAqIHZoXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSBwYXJzZUludCAoKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpIC8gYmgpICogdmhcbiAgICAgICAgICAgIHNjcm9sbEhlaWdodCA9IE1hdGgubWF4IHNjcm9sbEhlaWdodCwgcGFyc2VJbnQgQHJvd0hlaWdodCgpLzRcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IE1hdGgubWluIHNjcm9sbFRvcCwgQGhlaWdodCgpLXNjcm9sbEhlaWdodFxuICAgICAgICAgICAgc2Nyb2xsVG9wICAgID0gTWF0aC5tYXggMCwgc2Nyb2xsVG9wXG5cbiAgICAgICAgICAgIEBlbGVtLnN0eWxlLnRvcCA9IFwiI3tAdGFyZ2V0LnNjcm9sbFRvcH1weFwiXG5cbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUudG9wICAgICA9IFwiI3tzY3JvbGxUb3B9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5oZWlnaHQgID0gXCIje3Njcm9sbEhlaWdodH1weFwiXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLndpZHRoICAgPSBcIjJweFwiXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxvbmdDb2xvciAgPSBzY2hlbWUuY29sb3JGb3JDbGFzcyAnc2Nyb2xsZXIgbG9uZydcbiAgICAgICAgICAgIHNob3J0Q29sb3IgPSBzY2hlbWUuY29sb3JGb3JDbGFzcyAnc2Nyb2xsZXIgc2hvcnQnXG4gICAgICAgICAgICBjZiA9IDEgLSBjbGFtcCAwLCAxLCAoc2Nyb2xsSGVpZ2h0LTEwKS8yMDBcbiAgICAgICAgICAgIGNzID0gc2NoZW1lLmZhZGVDb2xvciBsb25nQ29sb3IsIHNob3J0Q29sb3IsIGNmXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IGNzXG5cbiAgICAgICAgaWYgQGNvbHVtbi5wYXJlbnQ/LnR5cGUgPT0gJ3ByZXZpZXcnXG4gICAgICAgICAgICBpZiBAY29sdW1uLnByZXZDb2x1bW4/KCkuZGl2LnNjcm9sbFRvcCAhPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgIEBjb2x1bW4ucHJldkNvbHVtbigpLmRpdi5zY3JvbGxUb3AgPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICBlbHNlIGlmIEBjb2x1bW4ubmV4dENvbHVtbj8oKT8ucGFyZW50Py50eXBlID09ICdwcmV2aWV3J1xuICAgICAgICAgICAgaWYgQGNvbHVtbi5uZXh0Q29sdW1uKCkuZGl2LnNjcm9sbFRvcCAhPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgIEBjb2x1bW4ubmV4dENvbHVtbigpLmRpdi5zY3JvbGxUb3AgPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICAgICAgXG4gICAgICAgIEBoYW5kbGUuc3R5bGUucmlnaHQgPSBcIi0je0B0YXJnZXQuc2Nyb2xsTGVmdH1weFwiXG5cbm1vZHVsZS5leHBvcnRzID0gU2Nyb2xsZXJcbiJdfQ==
//# sourceURL=../../coffee/browser/scroller.coffee