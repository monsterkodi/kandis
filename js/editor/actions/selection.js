// koffee 1.11.0

/*
 0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
000       000       000      000       000          000     000  000   000  0000  000
0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
     000  000       000      000       000          000     000  000   000  000  0000
0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
 */
var _, kerror, post, ref,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, kerror = ref.kerror, post = ref.post;

module.exports = {
    actions: {
        menu: 'Select',
        selectAll: {
            name: 'Select All',
            combo: 'command+a',
            accel: 'ctrl+a'
        },
        selectNone: {
            name: 'Deselect',
            combo: 'command+shift+a',
            accel: 'ctrl+shift+a'
        },
        selectInverted: {
            name: 'Invert Selection',
            text: 'selects all lines that have no cursors and no selections',
            combo: 'command+shift+i',
            accel: 'ctrl+shift+i'
        },
        selectNextHighlight: {
            separator: true,
            name: 'Select Next Highlight',
            combo: 'command+g',
            accel: 'ctrl+g'
        },
        selectPrevHighlight: {
            name: 'Select Previous Highlight',
            combo: 'command+shift+g',
            accel: 'ctrl+shift+g'
        },
        selectTextBetweenCursorsOrSurround: {
            name: 'Select Between Cursors, Brackets or Quotes',
            text: "select text between even cursors, if at least two cursors exist. \nselect text between highlighted brackets or quotes otherwise.",
            combo: 'alt+b',
            accel: 'alt+b'
        },
        toggleStickySelection: {
            separator: true,
            name: 'Toggle Sticky Selection',
            text: 'current selection is not removed when adding new selections',
            combo: 'command+`',
            accel: "ctrl+'"
        }
    },
    selectSingleRange: function(r, opt) {
        var cursorX;
        if (r == null) {
            return kerror("Editor." + name + ".selectSingleRange -- undefined range!");
        }
        cursorX = (opt != null ? opt.before : void 0) ? r[1][0] : r[1][1];
        this["do"].start();
        this["do"].setCursors([[cursorX, r[0]]]);
        this["do"].select([r]);
        this["do"].end();
        return this;
    },
    toggleStickySelection: function() {
        if (this.stickySelection) {
            return this.endStickySelection();
        } else {
            return this.startStickySelection();
        }
    },
    startStickySelection: function() {
        this.stickySelection = true;
        post.emit('sticky', true);
        return this.emit('selection');
    },
    endStickySelection: function() {
        this.stickySelection = false;
        post.emit('sticky', false);
        return this.emit('selection');
    },
    startSelection: function(opt) {
        var c, j, len, ref1, sel;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                this["do"].select([]);
            }
            return;
        }
        if (!this.startSelectionCursors || this.numCursors() !== this.startSelectionCursors.length) {
            this.startSelectionCursors = this["do"].cursors();
            if (this.numSelections()) {
                ref1 = this.startSelectionCursors;
                for (j = 0, len = ref1.length; j < len; j++) {
                    c = ref1[j];
                    if (sel = this.continuousSelectionAtPosInRanges(c, this["do"].selections())) {
                        if (isSamePos(sel[1], c)) {
                            c[0] = sel[0][0];
                            c[1] = sel[0][1];
                        }
                    }
                }
            }
            if (!this.stickySelection) {
                return this["do"].select(rangesFromPositions(this.startSelectionCursors));
            }
        }
    },
    endSelection: function(opt) {
        var ci, j, nc, newCursors, newSelection, oc, oldCursors, ranges, ref1, ref2;
        if (opt == null) {
            opt = {
                extend: false
            };
        }
        if (!(opt != null ? opt.extend : void 0)) {
            this.startSelectionCursors = null;
            if (!this.stickySelection) {
                this["do"].select([]);
            }
        } else {
            oldCursors = (ref1 = this.startSelectionCursors) != null ? ref1 : this["do"].cursors();
            newSelection = this.stickySelection && this["do"].selections() || [];
            newCursors = this["do"].cursors();
            if (oldCursors.length !== newCursors.length) {
                return kerror("Editor." + this.name + ".endSelection -- oldCursors.size != newCursors.size", oldCursors.length, newCursors.length);
            }
            for (ci = j = 0, ref2 = this["do"].numCursors(); 0 <= ref2 ? j < ref2 : j > ref2; ci = 0 <= ref2 ? ++j : --j) {
                oc = oldCursors[ci];
                nc = newCursors[ci];
                if ((oc == null) || (nc == null)) {
                    return kerror("Editor." + this.name + ".endSelection -- invalid cursors", oc, nc);
                } else {
                    ranges = this.rangesForLinesBetweenPositions(oc, nc, true);
                    newSelection = newSelection.concat(ranges);
                }
            }
            this["do"].select(newSelection);
        }
        return this.checkSalterMode();
    },
    addRangeToSelection: function(range) {
        var newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.push(range);
        this["do"].setCursors(endPositionsFromRanges(newSelections), {
            main: 'last'
        });
        this["do"].select(newSelections);
        return this["do"].end();
    },
    removeSelectionAtIndex: function(si) {
        var newCursors, newSelections;
        this["do"].start();
        newSelections = this["do"].selections();
        newSelections.splice(si, 1);
        if (newSelections.length) {
            newCursors = endPositionsFromRanges(newSelections);
            this["do"].setCursors(newCursors, {
                main: (newCursors.length + si - 1) % newCursors.length
            });
        }
        this["do"].select(newSelections);
        return this["do"].end();
    },
    clearSelection: function() {
        return this.selectNone();
    },
    selectNone: function() {
        this["do"].start();
        this["do"].select([]);
        return this["do"].end();
    },
    selectAll: function() {
        this["do"].start();
        this["do"].select(this.rangesForAllLines());
        return this["do"].end();
    },
    selectInverted: function() {
        var invertedRanges, j, li, ref1, sc;
        invertedRanges = [];
        sc = this.selectedAndCursorLineIndices();
        for (li = j = 0, ref1 = this.numLines(); 0 <= ref1 ? j < ref1 : j > ref1; li = 0 <= ref1 ? ++j : --j) {
            if (indexOf.call(sc, li) < 0) {
                invertedRanges.push(this.rangeForLineAtIndex(li));
            }
        }
        if (invertedRanges.length) {
            this["do"].start();
            this["do"].setCursors([rangeStartPos(_.first(invertedRanges))]);
            this["do"].select(invertedRanges);
            return this["do"].end();
        }
    },
    selectTextBetweenCursorsOrSurround: function() {
        var c0, c1, i, j, newCursors, newSelections, oldCursors, ref1;
        if (this.numCursors() && this.numCursors() % 2 === 0) {
            this["do"].start();
            newSelections = [];
            newCursors = [];
            oldCursors = this["do"].cursors();
            for (i = j = 0, ref1 = oldCursors.length; j < ref1; i = j += 2) {
                c0 = oldCursors[i];
                c1 = oldCursors[i + 1];
                newSelections = newSelections.concat(this.rangesForLinesBetweenPositions(c0, c1));
                newCursors.push(c1);
            }
            this["do"].setCursors(newCursors);
            this["do"].select(newSelections);
            return this["do"].end();
        } else {
            return this.selectBetweenSurround();
        }
    },
    selectBetweenSurround: function() {
        var end, s, start, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            start = rangeEndPos(surr[0]);
            end = rangeStartPos(surr[1]);
            s = this.rangesForLinesBetweenPositions(start, end);
            s = cleanRanges(s);
            if (s.length) {
                this["do"].select(s);
                if (this["do"].numSelections()) {
                    this["do"].setCursors([rangeEndPos(_.last(s))], {
                        Main: 'closest'
                    });
                }
            }
            return this["do"].end();
        }
    },
    selectSurround: function() {
        var r, surr;
        if (surr = this.highlightsSurroundingCursor()) {
            this["do"].start();
            this["do"].select(surr);
            if (this["do"].numSelections()) {
                this["do"].setCursors((function() {
                    var j, len, ref1, results;
                    ref1 = this["do"].selections();
                    results = [];
                    for (j = 0, len = ref1.length; j < len; j++) {
                        r = ref1[j];
                        results.push(rangeEndPos(r));
                    }
                    return results;
                }).call(this), {
                    main: 'closest'
                });
            }
            return this["do"].end();
        }
    },
    selectNextHighlight: function() {
        var r, ref1, ref2, searchText;
        if (!this.numHighlights() && (typeof window !== "undefined" && window !== null)) {
            searchText = (ref1 = window.commandline.commands.find) != null ? ref1.currentText : void 0;
            if (searchText != null ? searchText.length : void 0) {
                this.highlightText(searchText);
            }
        }
        if (!this.numHighlights()) {
            return;
        }
        r = rangeAfterPosInRanges(this.cursorPos(), this.highlights());
        if (r != null) {
            r;
        } else {
            r = this.highlight(0);
        }
        if (r != null) {
            this.selectSingleRange(r, {
                before: ((ref2 = r[2]) != null ? ref2.clss : void 0) === 'close'
            });
            return typeof this.scrollCursorIntoView === "function" ? this.scrollCursorIntoView() : void 0;
        }
    },
    selectPrevHighlight: function() {
        var hs, r, ref1, searchText;
        if (!this.numHighlights() && (typeof window !== "undefined" && window !== null)) {
            searchText = (ref1 = window.commandline.commands.find) != null ? ref1.currentText : void 0;
            if (searchText != null ? searchText.length : void 0) {
                this.highlightText(searchText);
            }
        }
        if (!this.numHighlights()) {
            return;
        }
        hs = this.highlights();
        r = rangeBeforePosInRanges(this.cursorPos(), hs);
        if (r != null) {
            r;
        } else {
            r = _.last(hs);
        }
        if (r != null) {
            return this.selectSingleRange(r);
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VsZWN0aW9uLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL2NvZmZlZS9lZGl0b3IvYWN0aW9ucyIsInNvdXJjZXMiOlsic2VsZWN0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvQkFBQTtJQUFBOztBQVFBLE1BQXNCLE9BQUEsQ0FBUSxLQUFSLENBQXRCLEVBQUUsU0FBRixFQUFLLG1CQUFMLEVBQWE7O0FBRWIsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxRQUFOO1FBRUEsU0FBQSxFQUNJO1lBQUEsSUFBQSxFQUFPLFlBQVA7WUFDQSxLQUFBLEVBQU8sV0FEUDtZQUVBLEtBQUEsRUFBTyxRQUZQO1NBSEo7UUFPQSxVQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sVUFBUDtZQUNBLEtBQUEsRUFBTyxpQkFEUDtZQUVBLEtBQUEsRUFBTyxjQUZQO1NBUko7UUFZQSxjQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU8sa0JBQVA7WUFDQSxJQUFBLEVBQU8sMERBRFA7WUFFQSxLQUFBLEVBQU8saUJBRlA7WUFHQSxLQUFBLEVBQU8sY0FIUDtTQWJKO1FBa0JBLG1CQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTyx1QkFEUDtZQUVBLEtBQUEsRUFBTyxXQUZQO1lBR0EsS0FBQSxFQUFPLFFBSFA7U0FuQko7UUF3QkEsbUJBQUEsRUFDSTtZQUFBLElBQUEsRUFBTywyQkFBUDtZQUNBLEtBQUEsRUFBTyxpQkFEUDtZQUVBLEtBQUEsRUFBTyxjQUZQO1NBekJKO1FBNkJBLGtDQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQU0sNENBQU47WUFDQSxJQUFBLEVBQU0sa0lBRE47WUFLQSxLQUFBLEVBQU8sT0FMUDtZQU1BLEtBQUEsRUFBTyxPQU5QO1NBOUJKO1FBc0NBLHFCQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBTyx5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ICAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDBcbjAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDBcbjAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGtlcnJvciwgcG9zdCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgXG4gICAgYWN0aW9uczpcbiAgICAgICAgbWVudTogJ1NlbGVjdCdcbiAgICAgICAgXG4gICAgICAgIHNlbGVjdEFsbDpcbiAgICAgICAgICAgIG5hbWU6ICAnU2VsZWN0IEFsbCdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCthJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK2EnXG4gICAgICAgICAgICBcbiAgICAgICAgc2VsZWN0Tm9uZTpcbiAgICAgICAgICAgIG5hbWU6ICAnRGVzZWxlY3QnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrYSdcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCthJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdEludmVydGVkOlxuICAgICAgICAgICAgbmFtZTogICdJbnZlcnQgU2VsZWN0aW9uJ1xuICAgICAgICAgICAgdGV4dDogICdzZWxlY3RzIGFsbCBsaW5lcyB0aGF0IGhhdmUgbm8gY3Vyc29ycyBhbmQgbm8gc2VsZWN0aW9ucydcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtzaGlmdCtpJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK3NoaWZ0K2knXG4gICAgICAgICAgICBcbiAgICAgICAgc2VsZWN0TmV4dEhpZ2hsaWdodDpcbiAgICAgICAgICAgIHNlcGFyYXRvcjogdHJ1ZVxuICAgICAgICAgICAgbmFtZTogICdTZWxlY3QgTmV4dCBIaWdobGlnaHQnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrZydcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtnJ1xuICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdFByZXZIaWdobGlnaHQ6XG4gICAgICAgICAgICBuYW1lOiAgJ1NlbGVjdCBQcmV2aW91cyBIaWdobGlnaHQnXG4gICAgICAgICAgICBjb21ibzogJ2NvbW1hbmQrc2hpZnQrZydcbiAgICAgICAgICAgIGFjY2VsOiAnY3RybCtzaGlmdCtnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHNlbGVjdFRleHRCZXR3ZWVuQ3Vyc29yc09yU3Vycm91bmQ6XG4gICAgICAgICAgICBuYW1lOiAnU2VsZWN0IEJldHdlZW4gQ3Vyc29ycywgQnJhY2tldHMgb3IgUXVvdGVzJ1xuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgICAgc2VsZWN0IHRleHQgYmV0d2VlbiBldmVuIGN1cnNvcnMsIGlmIGF0IGxlYXN0IHR3byBjdXJzb3JzIGV4aXN0LiBcbiAgICAgICAgICAgICAgICBzZWxlY3QgdGV4dCBiZXR3ZWVuIGhpZ2hsaWdodGVkIGJyYWNrZXRzIG9yIHF1b3RlcyBvdGhlcndpc2UuXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjb21ibzogJ2FsdCtiJ1xuICAgICAgICAgICAgYWNjZWw6ICdhbHQrYidcblxuICAgICAgICB0b2dnbGVTdGlja3lTZWxlY3Rpb246XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICAnVG9nZ2xlIFN0aWNreSBTZWxlY3Rpb24nXG4gICAgICAgICAgICB0ZXh0OiAgJ2N1cnJlbnQgc2VsZWN0aW9uIGlzIG5vdCByZW1vdmVkIHdoZW4gYWRkaW5nIG5ldyBzZWxlY3Rpb25zJ1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK2AnXG4gICAgICAgICAgICBhY2NlbDogXCJjdHJsKydcIlxuICAgICAgICAgICAgXG4gICAgc2VsZWN0U2luZ2xlUmFuZ2U6IChyLCBvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgcj9cbiAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJFZGl0b3IuI3tuYW1lfS5zZWxlY3RTaW5nbGVSYW5nZSAtLSB1bmRlZmluZWQgcmFuZ2UhXCJcbiAgICAgICAgICAgIFxuICAgICAgICBjdXJzb3JYID0gaWYgb3B0Py5iZWZvcmUgdGhlbiByWzFdWzBdIGVsc2UgclsxXVsxXVxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbW2N1cnNvclgsIHJbMF1dXVxuICAgICAgICBAZG8uc2VsZWN0IFtyXVxuICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgQFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgICAgMDAwMDAgICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgdG9nZ2xlU3RpY2t5U2VsZWN0aW9uOiAtPlxuXG4gICAgICAgIGlmIEBzdGlja3lTZWxlY3Rpb24gdGhlbiBAZW5kU3RpY2t5U2VsZWN0aW9uKClcbiAgICAgICAgZWxzZSBAc3RhcnRTdGlja3lTZWxlY3Rpb24oKVxuICAgIFxuICAgIHN0YXJ0U3RpY2t5U2VsZWN0aW9uOiAtPlxuICAgICAgICBcbiAgICAgICAgQHN0aWNreVNlbGVjdGlvbiA9IHRydWVcbiAgICAgICAgcG9zdC5lbWl0ICdzdGlja3knLCB0cnVlXG4gICAgICAgIEBlbWl0ICdzZWxlY3Rpb24nXG5cbiAgICBlbmRTdGlja3lTZWxlY3Rpb246IC0+XG4gICAgICAgIFxuICAgICAgICBAc3RpY2t5U2VsZWN0aW9uID0gZmFsc2VcbiAgICAgICAgcG9zdC5lbWl0ICdzdGlja3knLCBmYWxzZVxuICAgICAgICBAZW1pdCAnc2VsZWN0aW9uJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgc3RhcnRTZWxlY3Rpb246IChvcHQgPSBleHRlbmQ6ZmFsc2UpIC0+XG5cbiAgICAgICAgaWYgbm90IG9wdD8uZXh0ZW5kXG4gICAgICAgICAgICBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzID0gbnVsbFxuICAgICAgICAgICAgaWYgbm90IEBzdGlja3lTZWxlY3Rpb25cbiAgICAgICAgICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICBpZiBub3QgQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycyBvciBAbnVtQ3Vyc29ycygpICE9IEBzdGFydFNlbGVjdGlvbkN1cnNvcnMubGVuZ3RoXG4gICAgICAgICAgICBAc3RhcnRTZWxlY3Rpb25DdXJzb3JzID0gQGRvLmN1cnNvcnMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICAgICAgZm9yIGMgaW4gQHN0YXJ0U2VsZWN0aW9uQ3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBpZiBzZWwgPSBAY29udGludW91c1NlbGVjdGlvbkF0UG9zSW5SYW5nZXMgYywgQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgaXNTYW1lUG9zIHNlbFsxXSwgY1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNbMF0gPSBzZWxbMF1bMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjWzFdID0gc2VsWzBdWzFdXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5vdCBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCByYW5nZXNGcm9tUG9zaXRpb25zIEBzdGFydFNlbGVjdGlvbkN1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgZW5kU2VsZWN0aW9uOiAob3B0ID0gZXh0ZW5kOmZhbHNlKSAtPlxuXG4gICAgICAgIGlmIG5vdCBvcHQ/LmV4dGVuZCBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHN0YXJ0U2VsZWN0aW9uQ3Vyc29ycyA9IG51bGxcbiAgICAgICAgICAgIGlmIG5vdCBAc3RpY2t5U2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBbXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG9sZEN1cnNvcnMgICA9IEBzdGFydFNlbGVjdGlvbkN1cnNvcnMgPyBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb24gPSBAc3RpY2t5U2VsZWN0aW9uIGFuZCBAZG8uc2VsZWN0aW9ucygpIG9yIFtdICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXdDdXJzb3JzICAgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9sZEN1cnNvcnMubGVuZ3RoICE9IG5ld0N1cnNvcnMubGVuZ3RoXG4gICAgICAgICAgICAgICAgcmV0dXJuIGtlcnJvciBcIkVkaXRvci4je0BuYW1lfS5lbmRTZWxlY3Rpb24gLS0gb2xkQ3Vyc29ycy5zaXplICE9IG5ld0N1cnNvcnMuc2l6ZVwiLCBvbGRDdXJzb3JzLmxlbmd0aCwgbmV3Q3Vyc29ycy5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGNpIGluIFswLi4uQGRvLm51bUN1cnNvcnMoKV1cbiAgICAgICAgICAgICAgICBvYyA9IG9sZEN1cnNvcnNbY2ldXG4gICAgICAgICAgICAgICAgbmMgPSBuZXdDdXJzb3JzW2NpXVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIG5vdCBvYz8gb3Igbm90IG5jP1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiRWRpdG9yLiN7QG5hbWV9LmVuZFNlbGVjdGlvbiAtLSBpbnZhbGlkIGN1cnNvcnNcIiwgb2MsIG5jXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICByYW5nZXMgPSBAcmFuZ2VzRm9yTGluZXNCZXR3ZWVuUG9zaXRpb25zIG9jLCBuYywgdHJ1ZSAjPCBleHRlbmQgdG8gZnVsbCBsaW5lcyBpZiBjdXJzb3IgYXQgc3RhcnQgb2YgbGluZSAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbmV3U2VsZWN0aW9uID0gbmV3U2VsZWN0aW9uLmNvbmNhdCByYW5nZXNcbiAgICBcbiAgICAgICAgICAgIEBkby5zZWxlY3QgbmV3U2VsZWN0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgQGNoZWNrU2FsdGVyTW9kZSgpICAgICAgXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkUmFuZ2VUb1NlbGVjdGlvbjogKHJhbmdlKSAtPlxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgbmV3U2VsZWN0aW9ucy5wdXNoIHJhbmdlXG4gICAgICAgIFxuICAgICAgICBAZG8uc2V0Q3Vyc29ycyBlbmRQb3NpdGlvbnNGcm9tUmFuZ2VzKG5ld1NlbGVjdGlvbnMpLCBtYWluOidsYXN0J1xuICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgQGRvLmVuZCgpXG5cbiAgICByZW1vdmVTZWxlY3Rpb25BdEluZGV4OiAoc2kpIC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBuZXdTZWxlY3Rpb25zID0gQGRvLnNlbGVjdGlvbnMoKVxuICAgICAgICBuZXdTZWxlY3Rpb25zLnNwbGljZSBzaSwgMVxuICAgICAgICBpZiBuZXdTZWxlY3Rpb25zLmxlbmd0aFxuICAgICAgICAgICAgbmV3Q3Vyc29ycyA9IGVuZFBvc2l0aW9uc0Zyb21SYW5nZXMgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29ycywgbWFpbjoobmV3Q3Vyc29ycy5sZW5ndGgrc2ktMSkgJSBuZXdDdXJzb3JzLmxlbmd0aFxuICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgQGRvLmVuZCgpICAgICAgICBcblxuICAgIGNsZWFyU2VsZWN0aW9uOiAtPiBAc2VsZWN0Tm9uZSgpXG4gICAgc2VsZWN0Tm9uZTogLT4gXG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAZG8uc2VsZWN0IFtdXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICBzZWxlY3RBbGw6IC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIEBkby5zZWxlY3QgQHJhbmdlc0ZvckFsbExpbmVzKClcbiAgICAgICAgQGRvLmVuZCgpXG4gICAgICAgIFxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc2VsZWN0SW52ZXJ0ZWQ6IC0+XG4gICAgICAgIFxuICAgICAgICBpbnZlcnRlZFJhbmdlcyA9IFtdICAgICAgICBcbiAgICAgICAgc2MgPSBAc2VsZWN0ZWRBbmRDdXJzb3JMaW5lSW5kaWNlcygpXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBudW1MaW5lcygpXVxuICAgICAgICAgICAgaWYgbGkgbm90IGluIHNjXG4gICAgICAgICAgICAgICAgaW52ZXJ0ZWRSYW5nZXMucHVzaCBAcmFuZ2VGb3JMaW5lQXRJbmRleCBsaVxuICAgICAgICBpZiBpbnZlcnRlZFJhbmdlcy5sZW5ndGhcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbcmFuZ2VTdGFydFBvcyBfLmZpcnN0IGludmVydGVkUmFuZ2VzXVxuICAgICAgICAgICAgQGRvLnNlbGVjdCBpbnZlcnRlZFJhbmdlc1xuICAgICAgICAgICAgQGRvLmVuZCgpICAgICBcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgc2VsZWN0VGV4dEJldHdlZW5DdXJzb3JzT3JTdXJyb3VuZDogLT5cblxuICAgICAgICBpZiBAbnVtQ3Vyc29ycygpIGFuZCBAbnVtQ3Vyc29ycygpICUgMiA9PSAwICBcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBuZXdTZWxlY3Rpb25zID0gW11cbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBbXVxuICAgICAgICAgICAgb2xkQ3Vyc29ycyA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgICAgIGZvciBpIGluIFswLi4ub2xkQ3Vyc29ycy5sZW5ndGhdIGJ5IDJcbiAgICAgICAgICAgICAgICBjMCA9IG9sZEN1cnNvcnNbaV1cbiAgICAgICAgICAgICAgICBjMSA9IG9sZEN1cnNvcnNbaSsxXVxuICAgICAgICAgICAgICAgIG5ld1NlbGVjdGlvbnMgPSBuZXdTZWxlY3Rpb25zLmNvbmNhdCBAcmFuZ2VzRm9yTGluZXNCZXR3ZWVuUG9zaXRpb25zIGMwLCBjMVxuICAgICAgICAgICAgICAgIG5ld0N1cnNvcnMucHVzaCBjMVxuICAgICAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgQGRvLnNlbGVjdCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgZWxzZSBAc2VsZWN0QmV0d2VlblN1cnJvdW5kKClcblxuICAgIHNlbGVjdEJldHdlZW5TdXJyb3VuZDogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHN1cnIgPSBAaGlnaGxpZ2h0c1N1cnJvdW5kaW5nQ3Vyc29yKClcbiAgICAgICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgICAgICBzdGFydCA9IHJhbmdlRW5kUG9zIHN1cnJbMF1cbiAgICAgICAgICAgIGVuZCA9IHJhbmdlU3RhcnRQb3Mgc3VyclsxXVxuICAgICAgICAgICAgcyA9IEByYW5nZXNGb3JMaW5lc0JldHdlZW5Qb3NpdGlvbnMgc3RhcnQsIGVuZFxuICAgICAgICAgICAgcyA9IGNsZWFuUmFuZ2VzIHNcbiAgICAgICAgICAgIGlmIHMubGVuZ3RoXG4gICAgICAgICAgICAgICAgQGRvLnNlbGVjdCBzXG4gICAgICAgICAgICAgICAgaWYgQGRvLm51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgICAgICBAZG8uc2V0Q3Vyc29ycyBbcmFuZ2VFbmRQb3MoXy5sYXN0IHMpXSwgTWFpbjogJ2Nsb3Nlc3QnXG4gICAgICAgICAgICBAZG8uZW5kKClcbiAgICAgICAgICAgIFxuICAgIHNlbGVjdFN1cnJvdW5kOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgc3VyciA9IEBoaWdobGlnaHRzU3Vycm91bmRpbmdDdXJzb3IoKVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIEBkby5zZWxlY3Qgc3VyclxuICAgICAgICAgICAgaWYgQGRvLm51bVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIChyYW5nZUVuZFBvcyhyKSBmb3IgciBpbiBAZG8uc2VsZWN0aW9ucygpKSwgbWFpbjogJ2Nsb3Nlc3QnXG4gICAgICAgICAgICBAZG8uZW5kKClcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgICAgIFxuICAgIHNlbGVjdE5leHRIaWdobGlnaHQ6IC0+ICMgY29tbWFuZCtnXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQG51bUhpZ2hsaWdodHMoKSBhbmQgd2luZG93PyAjIDwgdGhpcyBzdWNrc1xuICAgICAgICAgICAgc2VhcmNoVGV4dCA9IHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5maW5kPy5jdXJyZW50VGV4dFxuICAgICAgICAgICAgQGhpZ2hsaWdodFRleHQgc2VhcmNoVGV4dCBpZiBzZWFyY2hUZXh0Py5sZW5ndGhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIHIgPSByYW5nZUFmdGVyUG9zSW5SYW5nZXMgQGN1cnNvclBvcygpLCBAaGlnaGxpZ2h0cygpXG4gICAgICAgIHIgPz0gQGhpZ2hsaWdodCAwXG4gICAgICAgIGlmIHI/XG4gICAgICAgICAgICBAc2VsZWN0U2luZ2xlUmFuZ2UgciwgYmVmb3JlOnJbMl0/LmNsc3MgPT0gJ2Nsb3NlJ1xuICAgICAgICAgICAgQHNjcm9sbEN1cnNvckludG9WaWV3PygpICMgPCB0aGlzIGFsc28gc3Vja3NcblxuICAgIHNlbGVjdFByZXZIaWdobGlnaHQ6IC0+ICMgY29tbWFuZCtzaGlmdCtnXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQG51bUhpZ2hsaWdodHMoKSBhbmQgd2luZG93PyAjIDwgdGhpcyBzdWNrc1xuICAgICAgICAgICAgc2VhcmNoVGV4dCA9IHdpbmRvdy5jb21tYW5kbGluZS5jb21tYW5kcy5maW5kPy5jdXJyZW50VGV4dFxuICAgICAgICAgICAgQGhpZ2hsaWdodFRleHQgc2VhcmNoVGV4dCBpZiBzZWFyY2hUZXh0Py5sZW5ndGhcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAbnVtSGlnaGxpZ2h0cygpXG4gICAgICAgIGhzID0gQGhpZ2hsaWdodHMoKVxuICAgICAgICByID0gcmFuZ2VCZWZvcmVQb3NJblJhbmdlcyBAY3Vyc29yUG9zKCksIGhzXG4gICAgICAgIHIgPz0gXy5sYXN0IGhzXG4gICAgICAgIEBzZWxlY3RTaW5nbGVSYW5nZSByIGlmIHI/XG5cbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/selection.coffee