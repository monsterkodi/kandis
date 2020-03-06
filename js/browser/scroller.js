// koffee 1.12.0

/*
 0000000   0000000  00000000    0000000   000      000      00000000  00000000
000       000       000   000  000   000  000      000      000       000   000
0000000   000       0000000    000   000  000      000      0000000   0000000
     000  000       000   000  000   000  000      000      000       000   000
0000000    0000000  000   000   0000000   0000000  0000000  00000000  000   000
 */
var Scroller, clamp, drag, elem, ref, scheme, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), clamp = ref.clamp, drag = ref.drag, elem = ref.elem, scheme = ref.scheme, stopEvent = ref.stopEvent;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2Nyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbInNjcm9sbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtREFBQTtJQUFBOztBQVFBLE1BQTJDLE9BQUEsQ0FBUSxLQUFSLENBQTNDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQixtQkFBckIsRUFBNkI7O0FBRTdCLE1BQUEsR0FBUyxPQUFBLENBQVEsaUJBQVI7O0FBRUg7SUFFQyxrQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7OztRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBUDtTQUFMO1FBQ1IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWixDQUF5QixJQUFDLENBQUEsSUFBMUIsRUFBZ0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUF4QztRQUVBLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQSxDQUFLO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQkFBUDtTQUFMO1FBQ1YsSUFBQyxDQUFBLElBQUksQ0FBQyxXQUFOLENBQWtCLElBQUMsQ0FBQSxNQUFuQjtRQUVBLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBSSxJQUFKLENBQ0o7WUFBQSxNQUFBLEVBQVMsSUFBQyxDQUFBLElBQVY7WUFDQSxPQUFBLEVBQVMsSUFBQyxDQUFBLE9BRFY7WUFFQSxNQUFBLEVBQVMsSUFBQyxDQUFBLE1BRlY7WUFHQSxNQUFBLEVBQVMsV0FIVDtTQURJO1FBTVIsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUE2QixPQUE3QixFQUFzQyxJQUFDLENBQUEsT0FBdkM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxJQUFDLENBQUEsT0FB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QUFNLENBQUMsS0FBSyxDQUFDLGVBQWQsR0FBZ0MsR0E1QnBDOztRQThCQSwrQ0FBaUIsQ0FBRSxjQUFoQixLQUF3QixTQUEzQjtZQUNJLGlFQUFVLENBQUMsWUFBYSxDQUFDLEdBQUcsQ0FBQyxtQkFBMUIsS0FBdUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFsRDtnQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUF6QixHQUFxQyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBRGpEO2FBREo7U0FBQSxNQUdLLHVJQUFnQyxDQUFFLGdDQUEvQixLQUF1QyxTQUExQztZQUNELElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFSLENBQUEsQ0FBb0IsQ0FBQyxHQUFHLENBQUMsU0FBekIsS0FBc0MsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFqRDtnQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFvQixDQUFDLEdBQUcsQ0FBQyxTQUF6QixHQUFxQyxJQUFDLENBQUEsTUFBTSxDQUFDLFVBRGpEO2FBREM7O2VBSUwsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBZCxHQUFzQixHQUFBLEdBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxVQUFaLEdBQXVCO0lBdkN6Qzs7Ozs7O0FBeUNaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBjbGFtcCwgZHJhZywgZWxlbSwgc2NoZW1lLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuc2NoZW1lID0gcmVxdWlyZSAnLi4vdG9vbHMvc2NoZW1lJ1xuXG5jbGFzcyBTY3JvbGxlclxuXG4gICAgQDogKEBjb2x1bW4pIC0+XG5cbiAgICAgICAgQGVsZW0gPSBlbGVtIGNsYXNzOiAnc2Nyb2xsYmFyIHJpZ2h0J1xuICAgICAgICBAY29sdW1uLmRpdi5pbnNlcnRCZWZvcmUgQGVsZW0sIEBjb2x1bW4udGFibGVcblxuICAgICAgICBAaGFuZGxlID0gZWxlbSBjbGFzczogJ3Njcm9sbGhhbmRsZSByaWdodCdcbiAgICAgICAgQGVsZW0uYXBwZW5kQ2hpbGQgQGhhbmRsZVxuXG4gICAgICAgIEBkcmFnID0gbmV3IGRyYWdcbiAgICAgICAgICAgIHRhcmdldDogIEBlbGVtXG4gICAgICAgICAgICBvblN0YXJ0OiBAb25TdGFydFxuICAgICAgICAgICAgb25Nb3ZlOiAgQG9uRHJhZ1xuICAgICAgICAgICAgY3Vyc29yOiAgJ25zLXJlc2l6ZSdcblxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICAgICAgICd3aGVlbCcgIEBvbldoZWVsXG4gICAgICAgIEBjb2x1bW4uZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ3doZWVsJyAgQG9uV2hlZWxcbiAgICAgICAgQGNvbHVtbi5kaXYuYWRkRXZlbnRMaXN0ZW5lciAnc2Nyb2xsJyBAb25TY3JvbGxcbiAgICAgICAgQHRhcmdldCA9IEBjb2x1bW4uZGl2XG4gICAgICAgIFxuICAgIG51bVJvd3M6ICAgLT4gQGNvbHVtbi5udW1Sb3dzKClcbiAgICB2aXNSb3dzOiAgIC0+IDEgKyBwYXJzZUludCBAY29sdW1uLmJyb3dzZXIuaGVpZ2h0KCkgLyBAY29sdW1uLnJvd0hlaWdodCgpXG4gICAgcm93SGVpZ2h0OiAtPiBAY29sdW1uLnJvd0hlaWdodCgpXG4gICAgaGVpZ2h0OiAgICAtPiBAY29sdW1uLmJyb3dzZXIuaGVpZ2h0KClcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgICAwMDBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIG9uU3RhcnQ6IChkcmFnLCBldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIGJyID0gQGVsZW0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgc3kgPSBjbGFtcCAwLCBAaGVpZ2h0KCksIGV2ZW50LmNsaWVudFkgLSBici50b3BcbiAgICAgICAgbG4gPSBwYXJzZUludCBAbnVtUm93cygpICogc3kvQGhlaWdodCgpXG4gICAgICAgIGx5ID0gKGxuIC0gQHZpc1Jvd3MoKSAvIDIpICogQHJvd0hlaWdodCgpXG4gICAgICAgIEB0YXJnZXQuc2Nyb2xsVG9wID0gbHlcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkRyYWc6IChkcmFnKSA9PlxuICAgICAgICBcbiAgICAgICAgZGVsdGEgPSAoZHJhZy5kZWx0YS55IC8gKEB2aXNSb3dzKCkgKiBAcm93SGVpZ2h0KCkpKSAqIEBudW1Sb3dzKCkgKiBAcm93SGVpZ2h0KClcbiAgICAgICAgQHRhcmdldC5zY3JvbGxUb3AgKz0gZGVsdGFcbiAgICAgICAgQHVwZGF0ZSgpXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAgICAgIDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgb25XaGVlbDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgaWYgTWF0aC5hYnMoZXZlbnQuZGVsdGFYKSA+PSAyKk1hdGguYWJzKGV2ZW50LmRlbHRhWSkgb3IgTWF0aC5hYnMoZXZlbnQuZGVsdGFZKSA9PSAwXG4gICAgICAgICAgICBAdGFyZ2V0LnNjcm9sbExlZnQgKz0gZXZlbnQuZGVsdGFYXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB0YXJnZXQuc2Nyb2xsVG9wICs9IGV2ZW50LmRlbHRhWVxuICAgICAgICBzdG9wRXZlbnQgZXZlbnQgICAgXG4gICAgICAgIFxuICAgIG9uU2Nyb2xsOiAoZXZlbnQpID0+IEB1cGRhdGUoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHRvSW5kZXg6IChpKSAtPlxuICAgICAgICBcbiAgICAgICAgcm93ID0gQGNvbHVtbi5yb3dzW2ldLmRpdlxuICAgICAgICBuZXdUb3AgPSBAdGFyZ2V0LnNjcm9sbFRvcFxuICAgICAgICBpZiBuZXdUb3AgPCByb3cub2Zmc2V0VG9wICsgQHJvd0hlaWdodCgpIC0gQGhlaWdodCgpXG4gICAgICAgICAgICBuZXdUb3AgPSByb3cub2Zmc2V0VG9wICsgQHJvd0hlaWdodCgpIC0gQGhlaWdodCgpXG4gICAgICAgIGVsc2UgaWYgbmV3VG9wID4gcm93Lm9mZnNldFRvcFxuICAgICAgICAgICAgbmV3VG9wID0gcm93Lm9mZnNldFRvcFxuICAgICAgICBAdGFyZ2V0LnNjcm9sbFRvcCA9IHBhcnNlSW50IG5ld1RvcFxuICAgICAgICBAdXBkYXRlKClcblxuICAgIHVwZGF0ZTogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBudW1Sb3dzKCkgKiBAcm93SGVpZ2h0KCkgPCBAaGVpZ2h0KClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGVsZW0uc3R5bGUuZGlzcGxheSAgID0gJ25vbmUnXG4gICAgICAgICAgICBAZWxlbS5zdHlsZS50b3AgICAgICAgPSBcIjBcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS50b3AgICAgID0gXCIwXCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUuaGVpZ2h0ICA9IFwiMFwiXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLndpZHRoICAgPSBcIjBcIlxuICAgICAgICAgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlbGVtLnN0eWxlLmRpc3BsYXkgICA9ICdibG9jaydcbiAgICAgICAgICAgIGJoICAgICAgICAgICA9IEBudW1Sb3dzKCkgKiBAcm93SGVpZ2h0KClcbiAgICAgICAgICAgIHZoICAgICAgICAgICA9IE1hdGgubWluIChAdmlzUm93cygpICogQHJvd0hlaWdodCgpKSwgQGhlaWdodCgpXG4gICAgICAgICAgICBzY3JvbGxUb3AgICAgPSBwYXJzZUludCAoQHRhcmdldC5zY3JvbGxUb3AgLyBiaCkgKiB2aFxuICAgICAgICAgICAgc2Nyb2xsSGVpZ2h0ID0gcGFyc2VJbnQgKChAdmlzUm93cygpICogQHJvd0hlaWdodCgpKSAvIGJoKSAqIHZoXG4gICAgICAgICAgICBzY3JvbGxIZWlnaHQgPSBNYXRoLm1heCBzY3JvbGxIZWlnaHQsIHBhcnNlSW50IEByb3dIZWlnaHQoKS80XG4gICAgICAgICAgICBzY3JvbGxUb3AgICAgPSBNYXRoLm1pbiBzY3JvbGxUb3AsIEBoZWlnaHQoKS1zY3JvbGxIZWlnaHRcbiAgICAgICAgICAgIHNjcm9sbFRvcCAgICA9IE1hdGgubWF4IDAsIHNjcm9sbFRvcFxuXG4gICAgICAgICAgICBAZWxlbS5zdHlsZS50b3AgPSBcIiN7QHRhcmdldC5zY3JvbGxUb3B9cHhcIlxuXG4gICAgICAgICAgICBAaGFuZGxlLnN0eWxlLnRvcCAgICAgPSBcIiN7c2Nyb2xsVG9wfXB4XCJcbiAgICAgICAgICAgIEBoYW5kbGUuc3R5bGUuaGVpZ2h0ICA9IFwiI3tzY3JvbGxIZWlnaHR9cHhcIlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS53aWR0aCAgID0gXCIycHhcIlxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsb25nQ29sb3IgID0gc2NoZW1lLmNvbG9yRm9yQ2xhc3MgJ3Njcm9sbGVyIGxvbmcnXG4gICAgICAgICAgICBzaG9ydENvbG9yID0gc2NoZW1lLmNvbG9yRm9yQ2xhc3MgJ3Njcm9sbGVyIHNob3J0J1xuICAgICAgICAgICAgY2YgPSAxIC0gY2xhbXAgMCwgMSwgKHNjcm9sbEhlaWdodC0xMCkvMjAwXG4gICAgICAgICAgICBjcyA9IHNjaGVtZS5mYWRlQ29sb3IgbG9uZ0NvbG9yLCBzaG9ydENvbG9yLCBjZlxuICAgICAgICAgICAgQGhhbmRsZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBjc1xuXG4gICAgICAgIGlmIEBjb2x1bW4ucGFyZW50Py50eXBlID09ICdwcmV2aWV3J1xuICAgICAgICAgICAgaWYgQGNvbHVtbi5wcmV2Q29sdW1uPygpLmRpdi5zY3JvbGxUb3AgIT0gQHRhcmdldC5zY3JvbGxUb3BcbiAgICAgICAgICAgICAgICBAY29sdW1uLnByZXZDb2x1bW4oKS5kaXYuc2Nyb2xsVG9wID0gQHRhcmdldC5zY3JvbGxUb3BcbiAgICAgICAgZWxzZSBpZiBAY29sdW1uLm5leHRDb2x1bW4/KCk/LnBhcmVudD8udHlwZSA9PSAncHJldmlldydcbiAgICAgICAgICAgIGlmIEBjb2x1bW4ubmV4dENvbHVtbigpLmRpdi5zY3JvbGxUb3AgIT0gQHRhcmdldC5zY3JvbGxUb3BcbiAgICAgICAgICAgICAgICBAY29sdW1uLm5leHRDb2x1bW4oKS5kaXYuc2Nyb2xsVG9wID0gQHRhcmdldC5zY3JvbGxUb3BcbiAgICAgICAgICAgIFxuICAgICAgICBAaGFuZGxlLnN0eWxlLnJpZ2h0ID0gXCItI3tAdGFyZ2V0LnNjcm9sbExlZnR9cHhcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcm9sbGVyXG4iXX0=
//# sourceURL=../../coffee/browser/scroller.coffee