// koffee 1.11.0

/*
 0000000  00000000   000   000  00     00  0000000  
000       000   000  000   000  000   000  000   000
000       0000000    000   000  000000000  0000000  
000       000   000  000   000  000 0 000  000   000
 0000000  000   000   0000000   000   000  0000000
 */
var Crumb, File, elem, kpos, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), elem = ref.elem, kpos = ref.kpos, slash = ref.slash;

File = require('../tools/file');

Crumb = (function() {
    function Crumb(column) {
        this.column = column;
        this.onMouseUp = bind(this.onMouseUp, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.elem = elem({
            "class": 'crumb'
        });
        this.elem.columnIndex = this.column.index;
        this.elem.addEventListener('mousedown', this.onMouseDown);
        this.elem.addEventListener('mouseup', this.onMouseUp);
        this.column.div.insertBefore(this.elem, this.column.div.firstChild);
    }

    Crumb.prototype.show = function() {
        return this.elem.style.display = 'block';
    };

    Crumb.prototype.hide = function() {
        return this.elem.style.display = 'none';
    };

    Crumb.prototype.onMouseDown = function(event) {
        return this.downPos = kpos(window.win.getBounds());
    };

    Crumb.prototype.onMouseUp = function(event) {
        var br, root, upPos;
        if (!this.downPos) {
            return;
        }
        upPos = kpos(window.win.getBounds());
        if (upPos.to(this.downPos).length() > 0) {
            delete this.downPos;
            this.column.focus();
            return;
        }
        if (this.column.index === 0) {
            if (event.target.id) {
                this.column.browser.browse(event.target.id);
            } else {
                root = this.elem.firstChild;
                br = root.getBoundingClientRect();
                if (kpos(event).x < br.left) {
                    this.column.browser.browse(root.id);
                } else {
                    this.column.browser.browse(this.column.parent.file);
                }
            }
        } else {
            this.column.makeRoot();
        }
        return delete this.downPos;
    };

    Crumb.prototype.setFile = function(file) {
        if (this.column.index === 0) {
            return this.elem.innerHTML = File.crumbSpan(slash.tilde(file));
        } else {
            return this.elem.innerHTML = slash.file(file);
        }
    };

    Crumb.prototype.clear = function() {
        return this.elem.innerHTML = '';
    };

    return Crumb;

})();

module.exports = Crumb;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J1bWIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImNydW1iLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtQ0FBQTtJQUFBOztBQVFBLE1BQXdCLE9BQUEsQ0FBUSxLQUFSLENBQXhCLEVBQUUsZUFBRixFQUFRLGVBQVIsRUFBYzs7QUFFZCxJQUFBLEdBQU8sT0FBQSxDQUFRLGVBQVI7O0FBRUQ7SUFFQyxlQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7O1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE9BQU47U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixHQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDO1FBQzVCLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsV0FBdkIsRUFBbUMsSUFBQyxDQUFBLFdBQXBDO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixTQUF2QixFQUFtQyxJQUFDLENBQUEsU0FBcEM7UUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxZQUFaLENBQXlCLElBQUMsQ0FBQSxJQUExQixFQUFnQyxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUE1QztJQU5EOztvQkFRSCxJQUFBLEdBQU0sU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVosR0FBc0I7SUFBekI7O29CQUNOLElBQUEsR0FBTSxTQUFBO2VBQUcsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWixHQUFzQjtJQUF6Qjs7b0JBRU4sV0FBQSxHQUFhLFNBQUMsS0FBRDtlQUVULElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBQSxDQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBWCxDQUFBLENBQUw7SUFGRjs7b0JBSWIsU0FBQSxHQUFXLFNBQUMsS0FBRDtBQUVQLFlBQUE7UUFBQSxJQUFVLENBQUksSUFBQyxDQUFBLE9BQWY7QUFBQSxtQkFBQTs7UUFFQSxLQUFBLEdBQVEsSUFBQSxDQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBWCxDQUFBLENBQUw7UUFFUixJQUFHLEtBQUssQ0FBQyxFQUFOLENBQVMsSUFBQyxDQUFBLE9BQVYsQ0FBa0IsQ0FBQyxNQUFuQixDQUFBLENBQUEsR0FBOEIsQ0FBakM7WUFDSSxPQUFPLElBQUMsQ0FBQTtZQUNSLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixDQUFBO0FBQ0EsbUJBSEo7O1FBS0EsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLEtBQVIsS0FBaUIsQ0FBcEI7WUFDSSxJQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBaEI7Z0JBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBaEIsQ0FBdUIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFwQyxFQURKO2FBQUEsTUFBQTtnQkFHSSxJQUFBLEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQztnQkFDYixFQUFBLEdBQUssSUFBSSxDQUFDLHFCQUFMLENBQUE7Z0JBQ0wsSUFBRyxJQUFBLENBQUssS0FBTCxDQUFXLENBQUMsQ0FBWixHQUFnQixFQUFFLENBQUMsSUFBdEI7b0JBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBaEIsQ0FBdUIsSUFBSSxDQUFDLEVBQTVCLEVBREo7aUJBQUEsTUFBQTtvQkFHSSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFoQixDQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUF0QyxFQUhKO2lCQUxKO2FBREo7U0FBQSxNQUFBO1lBV0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFSLENBQUEsRUFYSjs7ZUFhQSxPQUFPLElBQUMsQ0FBQTtJQXhCRDs7b0JBMEJYLE9BQUEsR0FBUyxTQUFDLElBQUQ7UUFHTCxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixLQUFpQixDQUFwQjttQkFDSSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0IsSUFBSSxDQUFDLFNBQUwsQ0FBZSxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBZixFQUR0QjtTQUFBLE1BQUE7bUJBR0ksSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLEdBQWtCLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUh0Qjs7SUFISzs7b0JBUVQsS0FBQSxHQUFPLFNBQUE7ZUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0I7SUFBckI7Ozs7OztBQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwICAgICAwMCAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgXG4wMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwXG4gMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgXG4jIyNcblxueyBlbGVtLCBrcG9zLCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcblxuY2xhc3MgQ3J1bWJcblxuICAgIEA6IChAY29sdW1uKSAtPlxuICAgICAgICBcbiAgICAgICAgQGVsZW0gPSBlbGVtIGNsYXNzOidjcnVtYidcbiAgICAgICAgQGVsZW0uY29sdW1uSW5kZXggPSBAY29sdW1uLmluZGV4XG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlZG93bicgQG9uTW91c2VEb3duXG4gICAgICAgIEBlbGVtLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNldXAnICAgQG9uTW91c2VVcFxuICAgICAgICBAY29sdW1uLmRpdi5pbnNlcnRCZWZvcmUgQGVsZW0sIEBjb2x1bW4uZGl2LmZpcnN0Q2hpbGRcblxuICAgIHNob3c6IC0+IEBlbGVtLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgaGlkZTogLT4gQGVsZW0uc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgICBcbiAgICBvbk1vdXNlRG93bjogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgQGRvd25Qb3MgPSBrcG9zIHdpbmRvdy53aW4uZ2V0Qm91bmRzKClcbiAgICAgICAgICAgIFxuICAgIG9uTW91c2VVcDogKGV2ZW50KSA9PlxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAZG93blBvc1xuICAgICAgICBcbiAgICAgICAgdXBQb3MgPSBrcG9zIHdpbmRvdy53aW4uZ2V0Qm91bmRzKClcbiAgICAgICAgXG4gICAgICAgIGlmIHVwUG9zLnRvKEBkb3duUG9zKS5sZW5ndGgoKSA+IDBcbiAgICAgICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICAgICAgQGNvbHVtbi5mb2N1cygpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIEBjb2x1bW4uaW5kZXggPT0gMFxuICAgICAgICAgICAgaWYgZXZlbnQudGFyZ2V0LmlkXG4gICAgICAgICAgICAgICAgQGNvbHVtbi5icm93c2VyLmJyb3dzZSBldmVudC50YXJnZXQuaWRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByb290ID0gQGVsZW0uZmlyc3RDaGlsZFxuICAgICAgICAgICAgICAgIGJyID0gcm9vdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgICAgIGlmIGtwb3MoZXZlbnQpLnggPCBici5sZWZ0XG4gICAgICAgICAgICAgICAgICAgIEBjb2x1bW4uYnJvd3Nlci5icm93c2Ugcm9vdC5pZFxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbi5icm93c2VyLmJyb3dzZSBAY29sdW1uLnBhcmVudC5maWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjb2x1bW4ubWFrZVJvb3QoKVxuICAgICAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICBcbiAgICBzZXRGaWxlOiAoZmlsZSkgLT5cbiAgICAgICAgXG4gICAgICAgICMga2xvZyAnc2V0RmlsZScgZmlsZVxuICAgICAgICBpZiBAY29sdW1uLmluZGV4ID09IDBcbiAgICAgICAgICAgIEBlbGVtLmlubmVySFRNTCA9IEZpbGUuY3J1bWJTcGFuIHNsYXNoLnRpbGRlIGZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGVsZW0uaW5uZXJIVE1MID0gc2xhc2guZmlsZSBmaWxlXG4gICAgICAgIFxuICAgIGNsZWFyOiAtPiBAZWxlbS5pbm5lckhUTUwgPSAnJ1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBDcnVtYlxuIl19
//# sourceURL=../../coffee/browser/crumb.coffee