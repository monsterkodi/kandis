// koffee 0.56.0
var _;

_ = require('kxk')._;

module.exports = {
    actions: {
        menu: 'Line',
        toggleComment: {
            name: 'Toggle Comment',
            combo: 'command+/',
            accel: 'ctrl+/'
        },
        toggleHeader: {
            name: 'Toggle Header',
            combo: 'command+alt+/',
            accel: 'alt+ctrl+/'
        }
    },
    toggleHeader: function() {
        var il, indent, j, k, len, len1, r, rgs;
        if (!this.lineComment) {
            return;
        }
        rgs = this.salterRangesAtPos(this.cursorPos());
        if (!rgs) {
            return;
        }
        il = _.min((function() {
            var j, len, results;
            results = [];
            for (j = 0, len = rgs.length; j < len; j++) {
                r = rgs[j];
                results.push(this.indentationAtLineIndex(r[0]));
            }
            return results;
        }).call(this));
        indent = _.padStart("", il);
        this["do"].start();
        if (!this["do"].line(rgs[0][0]).slice(il).startsWith(this.lineComment)) {
            for (j = 0, len = rgs.length; j < len; j++) {
                r = rgs[j];
                this["do"].change(r[0], this["do"].line(r[0]).splice(il, 0, this.lineComment + ' '));
            }
            this["do"]["delete"](_.first(rgs)[0] - 1);
            this["do"]["delete"](_.last(rgs)[0]);
            this.moveCursorsUp();
            this.moveCursorsRight(false, this.lineComment.length + 1);
        } else if (this.multiComment) {
            for (k = 0, len1 = rgs.length; k < len1; k++) {
                r = rgs[k];
                this["do"].change(r[0], this["do"].line(r[0]).splice(il, this.lineComment.length + 1));
            }
            this["do"].insert(_.last(rgs)[0] + 1, indent + this.multiComment.close);
            this["do"].insert(_.first(rgs)[0], indent + this.multiComment.open);
            this.moveCursorsDown();
            this.moveCursorsLeft(false, this.lineComment.length + 1);
        }
        return this["do"].end();
    },
    toggleComment: function() {
        var cs, i, j, l, len, mainCursorLine, moveInLine, newCursors, newSelections, ref, si, uncomment;
        if (!this.lineComment) {
            return;
        }
        this["do"].start();
        newCursors = this["do"].cursors();
        newSelections = this["do"].selections();
        moveInLine = function(i, d) {
            var c, j, k, len, len1, ref, ref1, results, s;
            ref = rangesAtLineIndexInRanges(i, newSelections);
            for (j = 0, len = ref.length; j < len; j++) {
                s = ref[j];
                s[1][0] += d;
                s[1][1] += d;
            }
            ref1 = positionsAtLineIndexInPositions(i, newCursors);
            results = [];
            for (k = 0, len1 = ref1.length; k < len1; k++) {
                c = ref1[k];
                results.push(cursorDelta(c, d));
            }
            return results;
        };
        mainCursorLine = this["do"].line(this.mainCursor()[1]);
        cs = mainCursorLine.indexOf(this.lineComment);
        uncomment = cs >= 0 && mainCursorLine.substr(0, cs).trim().length === 0;
        ref = this.selectedAndCursorLineIndices();
        for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            cs = this["do"].line(i).indexOf(this.lineComment);
            if (uncomment) {
                if (cs >= 0 && this["do"].line(i).substr(0, cs).trim().length === 0) {
                    this["do"].change(i, this["do"].line(i).splice(cs, this.lineComment.length));
                    moveInLine(i, -this.lineComment.length);
                    si = indentationInLine(this["do"].line(i));
                    if (si % this.indentString.length === 1) {
                        this["do"].change(i, this["do"].line(i).splice(si - 1, 1));
                        moveInLine(i, -1);
                    }
                }
            } else {
                si = indentationInLine(this["do"].line(i));
                if (this["do"].line(i).length > si) {
                    l = (this.lineComment + " ").length;
                    this["do"].change(i, this["do"].line(i).splice(si, 0, this.lineComment + " "));
                    moveInLine(i, l);
                }
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlY29tbWVudC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUUsSUFBTSxPQUFBLENBQVEsS0FBUjs7QUFFUixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLE1BQU47UUFFQSxhQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sZ0JBQVA7WUFDQSxLQUFBLEVBQU8sV0FEUDtZQUVBLEtBQUEsRUFBTyxRQUZQO1NBSEo7UUFPQSxZQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sZUFBUDtZQUNBLEtBQUEsRUFBTyxlQURQO1lBRUEsS0FBQSxFQUFPLFlBRlA7U0FSSjtLQURKO0lBbUJBLFlBQUEsRUFBYyxTQUFBO0FBRVYsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsV0FBZjtBQUFBLG1CQUFBOztRQUVBLEdBQUEsR0FBTSxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBQyxDQUFBLFNBQUQsQ0FBQSxDQUFuQjtRQUNOLElBQVUsQ0FBSSxHQUFkO0FBQUEsbUJBQUE7O1FBQ0EsRUFBQSxHQUFTLENBQUMsQ0FBQyxHQUFGOztBQUFPO2lCQUFBLHFDQUFBOzs2QkFBQSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsQ0FBRSxDQUFBLENBQUEsQ0FBMUI7QUFBQTs7cUJBQVA7UUFDVCxNQUFBLEdBQVMsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxFQUFYLEVBQWUsRUFBZjtRQUNULElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFHLENBQUksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxHQUFJLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFoQixDQUFtQixDQUFDLEtBQXBCLENBQTBCLEVBQTFCLENBQTZCLENBQUMsVUFBOUIsQ0FBeUMsSUFBQyxDQUFBLFdBQTFDLENBQVA7QUFFSSxpQkFBQSxxQ0FBQTs7Z0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFjLENBQUMsTUFBZixDQUFzQixFQUF0QixFQUEwQixDQUExQixFQUE2QixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQTVDLENBQWpCO0FBREo7WUFFQSxJQUFDLEVBQUEsRUFBQSxFQUFFLEVBQUMsTUFBRCxFQUFILENBQVcsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQWEsQ0FBQSxDQUFBLENBQWIsR0FBZ0IsQ0FBM0I7WUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLEVBQUMsTUFBRCxFQUFILENBQVcsQ0FBQyxDQUFDLElBQUYsQ0FBTyxHQUFQLENBQVksQ0FBQSxDQUFBLENBQXZCO1lBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtZQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixFQUF5QixJQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsR0FBb0IsQ0FBN0MsRUFQSjtTQUFBLE1BUUssSUFBRyxJQUFDLENBQUEsWUFBSjtBQUVELGlCQUFBLHVDQUFBOztnQkFDSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLENBQUUsQ0FBQSxDQUFBLENBQWIsRUFBaUIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQWMsQ0FBQyxNQUFmLENBQXNCLEVBQXRCLEVBQTBCLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixHQUFvQixDQUE5QyxDQUFqQjtBQURKO1lBRUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFDLENBQUMsSUFBRixDQUFRLEdBQVIsQ0FBYSxDQUFBLENBQUEsQ0FBYixHQUFnQixDQUEzQixFQUE4QixNQUFBLEdBQVMsSUFBQyxDQUFBLFlBQVksQ0FBQyxLQUFyRDtZQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxHQUFSLENBQWEsQ0FBQSxDQUFBLENBQXhCLEVBQThCLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBWSxDQUFDLElBQXJEO1lBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBQTtZQUNBLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBQXdCLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBYixHQUFvQixDQUE1QyxFQVBDOztlQVFMLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUF6QlUsQ0FuQmQ7SUFvREEsYUFBQSxFQUFlLFNBQUE7QUFFWCxZQUFBO1FBQUEsSUFBVSxDQUFJLElBQUMsQ0FBQSxXQUFmO0FBQUEsbUJBQUE7O1FBRUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEtBQUosQ0FBQTtRQUNBLFVBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtRQUNoQixhQUFBLEdBQWdCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxVQUFKLENBQUE7UUFFaEIsVUFBQSxHQUFhLFNBQUMsQ0FBRCxFQUFJLENBQUo7QUFDVCxnQkFBQTtBQUFBO0FBQUEsaUJBQUEscUNBQUE7O2dCQUNJLENBQUUsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQUwsSUFBVztnQkFDWCxDQUFFLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFMLElBQVc7QUFGZjtBQUdBO0FBQUE7aUJBQUEsd0NBQUE7OzZCQUNJLFdBQUEsQ0FBWSxDQUFaLEVBQWUsQ0FBZjtBQURKOztRQUpTO1FBT2IsY0FBQSxHQUFpQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBYyxDQUFBLENBQUEsQ0FBdkI7UUFDakIsRUFBQSxHQUFLLGNBQWMsQ0FBQyxPQUFmLENBQXVCLElBQUMsQ0FBQSxXQUF4QjtRQUNMLFNBQUEsR0FBWSxFQUFBLElBQU0sQ0FBTixJQUFZLGNBQWMsQ0FBQyxNQUFmLENBQXNCLENBQXRCLEVBQXdCLEVBQXhCLENBQTJCLENBQUMsSUFBNUIsQ0FBQSxDQUFrQyxDQUFDLE1BQW5DLEtBQTZDO0FBRXJFO0FBQUEsYUFBQSxxQ0FBQTs7WUFDSSxFQUFBLEdBQUssSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxPQUFaLENBQW9CLElBQUMsQ0FBQSxXQUFyQjtZQUNMLElBQUcsU0FBSDtnQkFDSSxJQUFHLEVBQUEsSUFBTSxDQUFOLElBQVksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxNQUFaLENBQW1CLENBQW5CLEVBQXFCLEVBQXJCLENBQXdCLENBQUMsSUFBekIsQ0FBQSxDQUErQixDQUFDLE1BQWhDLEtBQTBDLENBQXpEO29CQUVJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUFXLENBQUMsTUFBWixDQUFtQixFQUFuQixFQUF1QixJQUFDLENBQUEsV0FBVyxDQUFDLE1BQXBDLENBQWQ7b0JBQ0EsVUFBQSxDQUFXLENBQVgsRUFBYyxDQUFDLElBQUMsQ0FBQSxXQUFXLENBQUMsTUFBNUI7b0JBQ0EsRUFBQSxHQUFLLGlCQUFBLENBQWtCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUFsQjtvQkFDTCxJQUFHLEVBQUEsR0FBSyxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQW5CLEtBQTZCLENBQWhDO3dCQUNJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBWCxFQUFjLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBVCxDQUFXLENBQUMsTUFBWixDQUFtQixFQUFBLEdBQUcsQ0FBdEIsRUFBeUIsQ0FBekIsQ0FBZDt3QkFDQSxVQUFBLENBQVcsQ0FBWCxFQUFjLENBQUMsQ0FBZixFQUZKO3FCQUxKO2lCQURKO2FBQUEsTUFBQTtnQkFVSSxFQUFBLEdBQUssaUJBQUEsQ0FBa0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQWxCO2dCQUNMLElBQUcsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxNQUFaLEdBQXFCLEVBQXhCO29CQUNJLENBQUEsR0FBSSxDQUFDLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBaEIsQ0FBb0IsQ0FBQztvQkFDekIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxNQUFaLENBQW1CLEVBQW5CLEVBQXVCLENBQXZCLEVBQTBCLElBQUMsQ0FBQSxXQUFELEdBQWUsR0FBekMsQ0FBZDtvQkFDQSxVQUFBLENBQVcsQ0FBWCxFQUFjLENBQWQsRUFISjtpQkFYSjs7QUFGSjtRQWlCQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLGFBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBdENXLENBcERmIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAgICAgICAgICAwMCAgMDAgICAgMDAgIDAwICAgIDAwICAwMCAgIFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAgICAgIDAwICAwMCAgICAwMCAgMDAgICAgMDAgIDAwICAgXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAgIDAwICAgIDAwICAwMCAgICAwMCAgMDAgICBcblxueyBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICBcbiAgICBhY3Rpb25zOlxuICAgICAgICBtZW51OiAnTGluZSdcbiAgICAgICAgXG4gICAgICAgIHRvZ2dsZUNvbW1lbnQ6XG4gICAgICAgICAgICBuYW1lOiAgJ1RvZ2dsZSBDb21tZW50J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kKy8nXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrLydcbiAgICAgICAgICAgIFxuICAgICAgICB0b2dnbGVIZWFkZXI6XG4gICAgICAgICAgICBuYW1lOiAgJ1RvZ2dsZSBIZWFkZXInXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrYWx0Ky8nXG4gICAgICAgICAgICBhY2NlbDogJ2FsdCtjdHJsKy8nXG5cbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICB0b2dnbGVIZWFkZXI6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaW5lQ29tbWVudFxuICAgICAgICBcbiAgICAgICAgcmdzID0gQHNhbHRlclJhbmdlc0F0UG9zIEBjdXJzb3JQb3MoKVxuICAgICAgICByZXR1cm4gaWYgbm90IHJnc1xuICAgICAgICBpbCAgICAgPSBfLm1pbiAoQGluZGVudGF0aW9uQXRMaW5lSW5kZXggclswXSBmb3IgciBpbiByZ3MpXG4gICAgICAgIGluZGVudCA9IF8ucGFkU3RhcnQgXCJcIiwgaWxcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgaWYgbm90IEBkby5saW5lKHJnc1swXVswXSkuc2xpY2UoaWwpLnN0YXJ0c1dpdGggQGxpbmVDb21tZW50XG4gICAgICAgICAgICAjIGNvbnZlcnQgdG8gbGluZSBjb21tZW50c1xuICAgICAgICAgICAgZm9yIHIgaW4gcmdzXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSByWzBdLCBAZG8ubGluZShyWzBdKS5zcGxpY2UgaWwsIDAsIEBsaW5lQ29tbWVudCArICcgJ1xuICAgICAgICAgICAgQGRvLmRlbGV0ZSBfLmZpcnN0KHJncylbMF0tMVxuICAgICAgICAgICAgQGRvLmRlbGV0ZSBfLmxhc3QocmdzKVswXVxuICAgICAgICAgICAgQG1vdmVDdXJzb3JzVXAoKVxuICAgICAgICAgICAgQG1vdmVDdXJzb3JzUmlnaHQgZmFsc2UsIEBsaW5lQ29tbWVudC5sZW5ndGgrMSAgICAgICAgICAgIFxuICAgICAgICBlbHNlIGlmIEBtdWx0aUNvbW1lbnRcbiAgICAgICAgICAgICMgY29udmVydCB0byBtdWx0aSBjb21tZW50XG4gICAgICAgICAgICBmb3IgciBpbiByZ3NcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIHJbMF0sIEBkby5saW5lKHJbMF0pLnNwbGljZSBpbCwgQGxpbmVDb21tZW50Lmxlbmd0aCsxXG4gICAgICAgICAgICBAZG8uaW5zZXJ0IF8ubGFzdCggcmdzKVswXSsxLCBpbmRlbnQgKyBAbXVsdGlDb21tZW50LmNsb3NlXG4gICAgICAgICAgICBAZG8uaW5zZXJ0IF8uZmlyc3QocmdzKVswXSwgICBpbmRlbnQgKyBAbXVsdGlDb21tZW50Lm9wZW5cbiAgICAgICAgICAgIEBtb3ZlQ3Vyc29yc0Rvd24oKVxuICAgICAgICAgICAgQG1vdmVDdXJzb3JzTGVmdCBmYWxzZSwgQGxpbmVDb21tZW50Lmxlbmd0aCsxXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIHRvZ2dsZUNvbW1lbnQ6IC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IEBsaW5lQ29tbWVudFxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3Q3Vyc29ycyAgICA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgXG4gICAgICAgIG1vdmVJbkxpbmUgPSAoaSwgZCkgLT4gXG4gICAgICAgICAgICBmb3IgcyBpbiByYW5nZXNBdExpbmVJbmRleEluUmFuZ2VzIGksIG5ld1NlbGVjdGlvbnNcbiAgICAgICAgICAgICAgICBzWzFdWzBdICs9IGRcbiAgICAgICAgICAgICAgICBzWzFdWzFdICs9IGRcbiAgICAgICAgICAgIGZvciBjIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgaSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGN1cnNvckRlbHRhIGMsIGRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgbWFpbkN1cnNvckxpbmUgPSBAZG8ubGluZSBAbWFpbkN1cnNvcigpWzFdXG4gICAgICAgIGNzID0gbWFpbkN1cnNvckxpbmUuaW5kZXhPZiBAbGluZUNvbW1lbnRcbiAgICAgICAgdW5jb21tZW50ID0gY3MgPj0gMCBhbmQgbWFpbkN1cnNvckxpbmUuc3Vic3RyKDAsY3MpLnRyaW0oKS5sZW5ndGggPT0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxuICAgICAgICAgICAgY3MgPSBAZG8ubGluZShpKS5pbmRleE9mIEBsaW5lQ29tbWVudFxuICAgICAgICAgICAgaWYgdW5jb21tZW50IFxuICAgICAgICAgICAgICAgIGlmIGNzID49IDAgYW5kIEBkby5saW5lKGkpLnN1YnN0cigwLGNzKS50cmltKCkubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICAgICAgIyByZW1vdmUgY29tbWVudFxuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGksIEBkby5saW5lKGkpLnNwbGljZSBjcywgQGxpbmVDb21tZW50Lmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBtb3ZlSW5MaW5lIGksIC1AbGluZUNvbW1lbnQubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIHNpID0gaW5kZW50YXRpb25JbkxpbmUgQGRvLmxpbmUoaSlcbiAgICAgICAgICAgICAgICAgICAgaWYgc2kgJSBAaW5kZW50U3RyaW5nLmxlbmd0aCA9PSAxICMgcmVtb3ZlIHNwYWNlIGFmdGVyIGluZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBpLCBAZG8ubGluZShpKS5zcGxpY2Ugc2ktMSwgMVxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUluTGluZSBpLCAtMVxuICAgICAgICAgICAgZWxzZSAjIGluc2VydCBjb21tZW50XG4gICAgICAgICAgICAgICAgc2kgPSBpbmRlbnRhdGlvbkluTGluZSBAZG8ubGluZShpKVxuICAgICAgICAgICAgICAgIGlmIEBkby5saW5lKGkpLmxlbmd0aCA+IHNpXG4gICAgICAgICAgICAgICAgICAgIGwgPSAoQGxpbmVDb21tZW50ICsgXCIgXCIpLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGksIEBkby5saW5lKGkpLnNwbGljZSBzaSwgMCwgQGxpbmVDb21tZW50ICsgXCIgXCJcbiAgICAgICAgICAgICAgICAgICAgbW92ZUluTGluZSBpLCBsXG4gICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uc1xuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBuZXdDdXJzb3JzXG4gICAgICAgIEBkby5lbmQoKVxuIl19
//# sourceURL=../../../coffee/editor/actions/togglecomment.coffee