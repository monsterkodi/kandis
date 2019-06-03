// koffee 0.56.0
var _, empty, ref, reversed,
    indexOf = [].indexOf;

ref = require('kxk'), reversed = ref.reversed, empty = ref.empty, _ = ref._;

module.exports = {
    actions: {
        toggleGitChange: {
            name: 'Toggle Git Changes at Cursors',
            combo: 'command+u',
            accel: 'ctrl+u'
        }
    },
    toggleGitChange: function(key, info) {
        return this.toggleGitChangesInLines(this.selectedAndCursorLineIndices());
    },
    toggleGitChangesInLines: function(lineIndices) {
        var cursors, i, j, k, l, len, len1, len2, len3, li, lineMeta, metas, offset, oi, ref1, untoggled;
        metas = [];
        untoggled = false;
        this["do"].start();
        this["do"].setCursors([this.mainCursor()]);
        this["do"].select([]);
        this["do"].end();
        for (i = 0, len = lineIndices.length; i < len; i++) {
            li = lineIndices[i];
            ref1 = this.meta.metasAtLineIndex(li);
            for (j = 0, len1 = ref1.length; j < len1; j++) {
                lineMeta = ref1[j];
                if (lineMeta[2].clss.startsWith('git')) {
                    if (!lineMeta[2].toggled) {
                        untoggled = true;
                    }
                    metas.push(lineMeta);
                }
            }
        }
        for (k = 0, len2 = metas.length; k < len2; k++) {
            lineMeta = metas[k];
            oi = lineMeta[0];
            if (untoggled) {
                if (!lineMeta[2].toggled) {
                    this.reverseGitChange(lineMeta);
                }
            } else {
                if (lineMeta[2].toggled) {
                    this.applyGitChange(lineMeta);
                } else {
                    this.reverseGitChange(lineMeta);
                }
            }
            if (oi !== lineMeta[0]) {
                offset = oi - lineMeta[0];
                if (offset < 0) {
                    this.meta.moveLineMeta(lineMeta, offset);
                }
            }
        }
        cursors = [];
        for (l = 0, len3 = metas.length; l < len3; l++) {
            lineMeta = metas[l];
            cursors.push([0, lineMeta[0]]);
            if (indexOf.call(this.meta.metas, lineMeta) < 0) {
                this.meta.addLineMeta(lineMeta);
                this.meta.addDiv(lineMeta);
            }
        }
        this["do"].start();
        this["do"].setCursors(cursors, {
            main: 'closest'
        });
        this["do"].select([]);
        return this["do"].end();
    },
    reverseGitChange: function(lineMeta) {
        var i, len, li, line, meta, ref1, ref2;
        meta = lineMeta[2];
        li = lineMeta[0];
        this["do"].start();
        meta.toggled = true;
        if ((ref1 = meta.div) != null) {
            ref1.classList.add('toggled');
        }
        switch (meta.clss) {
            case 'git mod':
            case 'git mod boring':
                this["do"].change(li, meta.change.old);
                break;
            case 'git add':
            case 'git add boring':
                this["do"]["delete"](li);
                break;
            case 'git del':
                ref2 = reversed(meta.change);
                for (i = 0, len = ref2.length; i < len; i++) {
                    line = ref2[i];
                    this["do"].insert(li, line.old);
                }
        }
        return this["do"].end();
    },
    applyGitChange: function(lineMeta) {
        var i, len, li, line, meta, ref1, ref2;
        meta = lineMeta[2];
        li = lineMeta[0];
        this["do"].start();
        delete meta.toggled;
        if ((ref1 = meta.div) != null) {
            ref1.classList.remove('toggled');
        }
        switch (meta.clss) {
            case 'git mod':
            case 'git mod boring':
                this["do"].change(li, meta.change["new"]);
                break;
            case 'git add':
            case 'git add boring':
                this["do"].insert(li, meta.change["new"]);
                break;
            case 'git del':
                ref2 = reversed(meta.change);
                for (i = 0, len = ref2.length; i < len; i++) {
                    line = ref2[i];
                    this["do"]["delete"](li);
                }
        }
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9nZ2xlZ2l0LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsSUFBQSx1QkFBQTtJQUFBOztBQUFBLE1BQXlCLE9BQUEsQ0FBUSxLQUFSLENBQXpCLEVBQUUsdUJBQUYsRUFBWSxpQkFBWixFQUFtQjs7QUFFbkIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFFSTtRQUFBLGVBQUEsRUFDSTtZQUFBLElBQUEsRUFBTywrQkFBUDtZQUNBLEtBQUEsRUFBTyxXQURQO1lBRUEsS0FBQSxFQUFPLFFBRlA7U0FESjtLQUZKO0lBT0EsZUFBQSxFQUFpQixTQUFDLEdBQUQsRUFBTSxJQUFOO2VBRWIsSUFBQyxDQUFBLHVCQUFELENBQXlCLElBQUMsQ0FBQSw0QkFBRCxDQUFBLENBQXpCO0lBRmEsQ0FQakI7SUFXQSx1QkFBQSxFQUF5QixTQUFDLFdBQUQ7QUFFckIsWUFBQTtRQUFBLEtBQUEsR0FBUTtRQUNSLFNBQUEsR0FBWTtRQUVaLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLENBQUMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFELENBQWY7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0FBRUEsYUFBQSw2Q0FBQTs7QUFFSTtBQUFBLGlCQUFBLHdDQUFBOztnQkFFSSxJQUFHLFFBQVMsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFJLENBQUMsVUFBakIsQ0FBNEIsS0FBNUIsQ0FBSDtvQkFFSSxJQUFHLENBQUksUUFBUyxDQUFBLENBQUEsQ0FBRSxDQUFDLE9BQW5CO3dCQUNJLFNBQUEsR0FBWSxLQURoQjs7b0JBR0EsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUFYLEVBTEo7O0FBRko7QUFGSjtBQVdB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aUJBRW9CLGdCQUZwQjtnQkFJUSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQVgsRUFBZSxJQUFJLENBQUMsTUFBTSxFQUFDLEdBQUQsRUFBMUI7QUFGWTtBQUZwQixpQkFNUyxTQU5UO0FBQUEsaUJBTW9CLGdCQU5wQjtnQkFRUSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLEVBQVgsRUFBZSxJQUFJLENBQUMsTUFBTSxFQUFDLEdBQUQsRUFBMUI7QUFGWTtBQU5wQixpQkFVUyxTQVZUO0FBWVE7QUFBQSxxQkFBQSxzQ0FBQTs7b0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxFQUFDLE1BQUQsRUFBSCxDQUFXLEVBQVg7QUFESjtBQVpSO2VBZUEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLEdBQUosQ0FBQTtJQXpCWSxDQW5HaEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAwMFxuIyAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwXG4jICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgICAgIDAwMCAgMDAwMCAgMDAwICAgICAwMDBcbiMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgIDAwMFxuIyAgICAwMDAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgMDAwXG5cbnsgcmV2ZXJzZWQsIGVtcHR5LCBfIH0gPSByZXF1aXJlICdreGsnXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG5cbiAgICAgICAgdG9nZ2xlR2l0Q2hhbmdlOlxuICAgICAgICAgICAgbmFtZTogICdUb2dnbGUgR2l0IENoYW5nZXMgYXQgQ3Vyc29ycydcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCt1J1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3UnXG5cbiAgICB0b2dnbGVHaXRDaGFuZ2U6IChrZXksIGluZm8pIC0+XG5cbiAgICAgICAgQHRvZ2dsZUdpdENoYW5nZXNJbkxpbmVzIEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcblxuICAgIHRvZ2dsZUdpdENoYW5nZXNJbkxpbmVzOiAobGluZUluZGljZXMpIC0+XG5cbiAgICAgICAgbWV0YXMgPSBbXVxuICAgICAgICB1bnRvZ2dsZWQgPSBmYWxzZVxuXG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZXRDdXJzb3JzIFtAbWFpbkN1cnNvcigpXVxuICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGxpIGluIGxpbmVJbmRpY2VzXG5cbiAgICAgICAgICAgIGZvciBsaW5lTWV0YSBpbiBAbWV0YS5tZXRhc0F0TGluZUluZGV4KGxpKVxuXG4gICAgICAgICAgICAgICAgaWYgbGluZU1ldGFbMl0uY2xzcy5zdGFydHNXaXRoICdnaXQnXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGxpbmVNZXRhWzJdLnRvZ2dsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHVudG9nZ2xlZCA9IHRydWVcblxuICAgICAgICAgICAgICAgICAgICBtZXRhcy5wdXNoIGxpbmVNZXRhXG5cbiAgICAgICAgZm9yIGxpbmVNZXRhIGluIG1ldGFzXG5cbiAgICAgICAgICAgIG9pID0gbGluZU1ldGFbMF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgdW50b2dnbGVkXG4gICAgICAgICAgICAgICAgaWYgbm90IGxpbmVNZXRhWzJdLnRvZ2dsZWRcbiAgICAgICAgICAgICAgICAgICAgQHJldmVyc2VHaXRDaGFuZ2UgbGluZU1ldGFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBsaW5lTWV0YVsyXS50b2dnbGVkXG4gICAgICAgICAgICAgICAgICAgIEBhcHBseUdpdENoYW5nZSBsaW5lTWV0YVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHJldmVyc2VHaXRDaGFuZ2UgbGluZU1ldGFcblxuICAgICAgICAgICAgaWYgb2kgIT0gbGluZU1ldGFbMF1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSBvaSAtIGxpbmVNZXRhWzBdXG4gICAgICAgICAgICAgICAgaWYgb2Zmc2V0IDwgMFxuICAgICAgICAgICAgICAgICAgICBAbWV0YS5tb3ZlTGluZU1ldGEgbGluZU1ldGEsIG9mZnNldFxuICAgICAgICBcbiAgICAgICAgY3Vyc29ycyA9IFtdXG4gICAgICAgIGZvciBsaW5lTWV0YSBpbiBtZXRhc1xuICAgICAgICAgICAgY3Vyc29ycy5wdXNoIFswLGxpbmVNZXRhWzBdXVxuICAgICAgICAgICAgaWYgbGluZU1ldGEgbm90IGluIEBtZXRhLm1ldGFzXG4gICAgICAgICAgICAgICAgQG1ldGEuYWRkTGluZU1ldGEgbGluZU1ldGFcbiAgICAgICAgICAgICAgICBAbWV0YS5hZGREaXYgbGluZU1ldGFcblxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBjdXJzb3JzLCBtYWluOidjbG9zZXN0J1xuICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDBcblxuICAgIHJldmVyc2VHaXRDaGFuZ2U6IChsaW5lTWV0YSkgLT5cblxuICAgICAgICBtZXRhID0gbGluZU1ldGFbMl1cbiAgICAgICAgbGkgICA9IGxpbmVNZXRhWzBdXG5cbiAgICAgICAgQGRvLnN0YXJ0KClcblxuICAgICAgICBtZXRhLnRvZ2dsZWQgPSB0cnVlXG4gICAgICAgIG1ldGEuZGl2Py5jbGFzc0xpc3QuYWRkICd0b2dnbGVkJ1xuXG4gICAgICAgIHN3aXRjaCBtZXRhLmNsc3NcblxuICAgICAgICAgICAgd2hlbiAnZ2l0IG1vZCcsICdnaXQgbW9kIGJvcmluZydcbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGxpLCBtZXRhLmNoYW5nZS5vbGRcblxuICAgICAgICAgICAgd2hlbiAnZ2l0IGFkZCcsICdnaXQgYWRkIGJvcmluZycgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGRvLmRlbGV0ZSBsaVxuXG4gICAgICAgICAgICB3aGVuICdnaXQgZGVsJ1xuXG4gICAgICAgICAgICAgICAgZm9yIGxpbmUgaW4gcmV2ZXJzZWQgbWV0YS5jaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgQGRvLmluc2VydCBsaSwgbGluZS5vbGRcblxuICAgICAgICBAZG8uZW5kKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICAgMDAwICAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgICAwMDAwMDAwICAgICAwMDBcblxuICAgIGFwcGx5R2l0Q2hhbmdlOiAobGluZU1ldGEpIC0+XG5cbiAgICAgICAgbWV0YSA9IGxpbmVNZXRhWzJdXG4gICAgICAgIGxpICAgPSBsaW5lTWV0YVswXVxuXG4gICAgICAgIEBkby5zdGFydCgpXG5cbiAgICAgICAgZGVsZXRlIG1ldGEudG9nZ2xlZFxuICAgICAgICBtZXRhLmRpdj8uY2xhc3NMaXN0LnJlbW92ZSAndG9nZ2xlZCdcblxuICAgICAgICBzd2l0Y2ggbWV0YS5jbHNzXG5cbiAgICAgICAgICAgIHdoZW4gJ2dpdCBtb2QnLCAnZ2l0IG1vZCBib3JpbmcnXG5cbiAgICAgICAgICAgICAgICBAZG8uY2hhbmdlIGxpLCBtZXRhLmNoYW5nZS5uZXdcblxuICAgICAgICAgICAgd2hlbiAnZ2l0IGFkZCcsICdnaXQgYWRkIGJvcmluZydcblxuICAgICAgICAgICAgICAgIEBkby5pbnNlcnQgbGksIG1ldGEuY2hhbmdlLm5ld1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAnZ2l0IGRlbCdcblxuICAgICAgICAgICAgICAgIGZvciBsaW5lIGluIHJldmVyc2VkIG1ldGEuY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgIEBkby5kZWxldGUgbGlcblxuICAgICAgICBAZG8uZW5kKClcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/togglegit.coffee