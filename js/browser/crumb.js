// koffee 1.12.0

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
        this.column.div.appendChild(this.elem);
    }

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
            return this.elem.innerHTML = slash.base(file);
        }
    };

    Crumb.prototype.clear = function() {
        return this.elem.innerHTML = '';
    };

    Crumb.prototype.updateRect = function(br) {
        this.elem.style.left = br.left + "px";
        return this.elem.style.width = (br.right - br.left) + "px";
    };

    return Crumb;

})();

module.exports = Crumb;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3J1bWIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL2Jyb3dzZXIiLCJzb3VyY2VzIjpbImNydW1iLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxtQ0FBQTtJQUFBOztBQVFBLE1BQXdCLE9BQUEsQ0FBUSxLQUFSLENBQXhCLEVBQUUsZUFBRixFQUFRLGVBQVIsRUFBYzs7QUFFZCxJQUFBLEdBQU8sT0FBQSxDQUFRLGVBQVI7O0FBRUQ7SUFFQyxlQUFDLE1BQUQ7UUFBQyxJQUFDLENBQUEsU0FBRDs7O1FBRUEsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE9BQU47U0FBTDtRQUNSLElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixHQUFvQixJQUFDLENBQUEsTUFBTSxDQUFDO1FBQzVCLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsV0FBdkIsRUFBbUMsSUFBQyxDQUFBLFdBQXBDO1FBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxnQkFBTixDQUF1QixTQUF2QixFQUFtQyxJQUFDLENBQUEsU0FBcEM7UUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFaLENBQXdCLElBQUMsQ0FBQSxJQUF6QjtJQVBEOztvQkFTSCxXQUFBLEdBQWEsU0FBQyxLQUFEO2VBRVQsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFYLENBQUEsQ0FBTDtJQUZGOztvQkFJYixTQUFBLEdBQVcsU0FBQyxLQUFEO0FBRVAsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsT0FBZjtBQUFBLG1CQUFBOztRQUVBLEtBQUEsR0FBUSxJQUFBLENBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFYLENBQUEsQ0FBTDtRQUVSLElBQUcsS0FBSyxDQUFDLEVBQU4sQ0FBUyxJQUFDLENBQUEsT0FBVixDQUFrQixDQUFDLE1BQW5CLENBQUEsQ0FBQSxHQUE4QixDQUFqQztZQUNJLE9BQU8sSUFBQyxDQUFBO1lBQ1IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQUE7QUFDQSxtQkFISjs7UUFLQSxJQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsS0FBUixLQUFpQixDQUFwQjtZQUNJLElBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFoQjtnQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFoQixDQUF1QixLQUFLLENBQUMsTUFBTSxDQUFDLEVBQXBDLEVBREo7YUFBQSxNQUFBO2dCQUdJLElBQUEsR0FBTyxJQUFDLENBQUEsSUFBSSxDQUFDO2dCQUNiLEVBQUEsR0FBSyxJQUFJLENBQUMscUJBQUwsQ0FBQTtnQkFDTCxJQUFHLElBQUEsQ0FBSyxLQUFMLENBQVcsQ0FBQyxDQUFaLEdBQWdCLEVBQUUsQ0FBQyxJQUF0QjtvQkFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFoQixDQUF1QixJQUFJLENBQUMsRUFBNUIsRUFESjtpQkFBQSxNQUFBO29CQUdJLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQWhCLENBQXVCLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQXRDLEVBSEo7aUJBTEo7YUFESjtTQUFBLE1BQUE7WUFXSSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBQSxFQVhKOztlQWFBLE9BQU8sSUFBQyxDQUFBO0lBeEJEOztvQkEwQlgsT0FBQSxHQUFTLFNBQUMsSUFBRDtRQUVMLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLEtBQWlCLENBQXBCO21CQUNJLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQixJQUFJLENBQUMsU0FBTCxDQUFlLEtBQUssQ0FBQyxLQUFOLENBQVksSUFBWixDQUFmLEVBRHRCO1NBQUEsTUFBQTttQkFHSSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sR0FBa0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYLEVBSHRCOztJQUZLOztvQkFPVCxLQUFBLEdBQU8sU0FBQTtlQUFHLElBQUMsQ0FBQSxJQUFJLENBQUMsU0FBTixHQUFrQjtJQUFyQjs7b0JBRVAsVUFBQSxHQUFZLFNBQUMsRUFBRDtRQUVSLElBQUMsQ0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVosR0FBc0IsRUFBRSxDQUFDLElBQUosR0FBUztlQUM5QixJQUFDLENBQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFaLEdBQXNCLENBQUMsRUFBRSxDQUFDLEtBQUgsR0FBVyxFQUFFLENBQUMsSUFBZixDQUFBLEdBQW9CO0lBSGxDOzs7Ozs7QUFLaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAgICAgIDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICBcbiMjI1xuXG57IGVsZW0sIGtwb3MsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkZpbGUgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuXG5jbGFzcyBDcnVtYlxuXG4gICAgQDogKEBjb2x1bW4pIC0+XG4gICAgICAgIFxuICAgICAgICBAZWxlbSA9IGVsZW0gY2xhc3M6J2NydW1iJ1xuICAgICAgICBAZWxlbS5jb2x1bW5JbmRleCA9IEBjb2x1bW4uaW5kZXhcbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vkb3duJyBAb25Nb3VzZURvd25cbiAgICAgICAgQGVsZW0uYWRkRXZlbnRMaXN0ZW5lciAnbW91c2V1cCcgICBAb25Nb3VzZVVwXG4gICAgICAgICMgJCgnY3J1bWJzJykuYXBwZW5kQ2hpbGQgQGVsZW1cbiAgICAgICAgQGNvbHVtbi5kaXYuYXBwZW5kQ2hpbGQgQGVsZW1cblxuICAgIG9uTW91c2VEb3duOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBAZG93blBvcyA9IGtwb3Mgd2luZG93Lndpbi5nZXRCb3VuZHMoKVxuICAgICAgICAgICAgXG4gICAgb25Nb3VzZVVwOiAoZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBkb3duUG9zXG4gICAgICAgIFxuICAgICAgICB1cFBvcyA9IGtwb3Mgd2luZG93Lndpbi5nZXRCb3VuZHMoKVxuICAgICAgICBcbiAgICAgICAgaWYgdXBQb3MudG8oQGRvd25Qb3MpLmxlbmd0aCgpID4gMFxuICAgICAgICAgICAgZGVsZXRlIEBkb3duUG9zXG4gICAgICAgICAgICBAY29sdW1uLmZvY3VzKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA9PSAwXG4gICAgICAgICAgICBpZiBldmVudC50YXJnZXQuaWRcbiAgICAgICAgICAgICAgICBAY29sdW1uLmJyb3dzZXIuYnJvd3NlIGV2ZW50LnRhcmdldC5pZFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvb3QgPSBAZWxlbS5maXJzdENoaWxkXG4gICAgICAgICAgICAgICAgYnIgPSByb290LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8IGJyLmxlZnRcbiAgICAgICAgICAgICAgICAgICAgQGNvbHVtbi5icm93c2VyLmJyb3dzZSByb290LmlkXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAY29sdW1uLmJyb3dzZXIuYnJvd3NlIEBjb2x1bW4ucGFyZW50LmZpbGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbHVtbi5tYWtlUm9vdCgpXG4gICAgICAgICAgICBcbiAgICAgICAgZGVsZXRlIEBkb3duUG9zXG4gICAgICAgIFxuICAgIHNldEZpbGU6IChmaWxlKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQGNvbHVtbi5pbmRleCA9PSAwXG4gICAgICAgICAgICBAZWxlbS5pbm5lckhUTUwgPSBGaWxlLmNydW1iU3BhbiBzbGFzaC50aWxkZSBmaWxlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBlbGVtLmlubmVySFRNTCA9IHNsYXNoLmJhc2UgZmlsZVxuICAgICAgICBcbiAgICBjbGVhcjogLT4gQGVsZW0uaW5uZXJIVE1MID0gJydcbiAgICBcbiAgICB1cGRhdGVSZWN0OiAoYnIpIC0+XG4gICAgICAgIFxuICAgICAgICBAZWxlbS5zdHlsZS5sZWZ0ID0gXCIje2JyLmxlZnR9cHhcIlxuICAgICAgICBAZWxlbS5zdHlsZS53aWR0aCA9IFwiI3tici5yaWdodCAtIGJyLmxlZnR9cHhcIlxuICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gQ3J1bWJcbiJdfQ==
//# sourceURL=../../coffee/browser/crumb.coffee