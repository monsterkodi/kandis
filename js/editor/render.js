// koffee 1.4.0

/*
00000000   00000000  000   000  0000000    00000000  00000000
000   000  000       0000  000  000   000  000       000   000
0000000    0000000   000 0 000  000   000  0000000   0000000
000   000  000       000  0000  000   000  000       000   000
000   000  00000000  000   000  0000000    00000000  000   000
 */
var Render, elem, kstr, ref;

ref = require('kxk'), kstr = ref.kstr, elem = ref.elem;

Render = (function() {
    function Render() {}

    Render.line = function(diss, size) {
        var clrzd, d, di, j, l, ref1, ref2, tx, value;
        if (size == null) {
            size = {
                charWidth: 0
            };
        }
        l = "";
        if (diss != null ? diss.length : void 0) {
            for (di = j = ref1 = diss.length - 1; ref1 <= 0 ? j <= 0 : j >= 0; di = ref1 <= 0 ? ++j : --j) {
                d = diss[di];
                tx = d.start * size.charWidth;
                value = (d.value != null) && (" class=\"" + d.value + "\"") || '';
                clrzd = "<span style=\"transform:translatex(" + tx + "px);" + ((ref2 = d.styl) != null ? ref2 : '') + "\"" + value + ">" + (kstr.encode(d.match)) + "</span>";
                l = clrzd + l;
            }
        }
        return l;
    };

    Render.lineSpan = function(diss, size) {
        var d, div, j, k, len, len1, ref1, ref2, span, ss, st;
        div = elem({
            "class": 'linespans'
        });
        ref1 = diss != null ? diss : [];
        for (j = 0, len = ref1.length; j < len; j++) {
            d = ref1[j];
            span = elem('span');
            span.style.transform = "translatex(" + (d.start * size.charWidth) + "px)";
            if (d.value != null) {
                span.className = d.value;
            }
            span.textContent = d.match.replace(/\x1b/g, '▪');
            if (d.styl != null) {
                ref2 = d.styl.split(';');
                for (k = 0, len1 = ref2.length; k < len1; k++) {
                    st = ref2[k];
                    ss = st.split(':');
                    span.style[ss[0]] = ss[1];
                }
            }
            div.appendChild(span);
        }
        return div;
    };

    Render.cursors = function(cs, size) {
        var c, cls, cw, h, i, j, len, lh, tx, ty, zi;
        i = 0;
        h = "";
        cw = size.charWidth;
        lh = size.lineHeight;
        for (j = 0, len = cs.length; j < len; j++) {
            c = cs[j];
            tx = c[0] * cw + size.offsetX;
            ty = c[1] * lh;
            cls = "";
            if (c.length > 2) {
                cls = c[2];
            }
            zi = cls !== 'virtual' && c[1] + 1000 || 0;
            h += "<span class=\"cursor " + cls + "\" style=\"z-index:" + zi + ";transform:translate3d(" + tx + "px," + ty + "px,0); height:" + lh + "px\"></span>";
            i += 1;
        }
        return h;
    };

    Render.selection = function(ss, size, clss) {
        var b, h, j, n, p, ref1, ref2, ref3, ref4, s, si;
        if (clss == null) {
            clss = 'selection';
        }
        h = "";
        p = null;
        n = null;
        for (si = j = 0, ref1 = ss.length; 0 <= ref1 ? j < ref1 : j > ref1; si = 0 <= ref1 ? ++j : --j) {
            s = ss[si];
            n = (si < ss.length - 1) && (ss[si + 1][0] === s[0] + 1) && ss[si + 1] || null;
            b = (p != null ? p[0] : void 0) === s[0] - 1 && p || null;
            h += Render.selectionSpan(b, s, n, size, (ref2 = (ref3 = (ref4 = s[2]) != null ? ref4.clss : void 0) != null ? ref3 : s[2]) != null ? ref2 : clss);
            p = s;
        }
        return h;
    };

    Render.selectionSpan = function(prev, sel, next, size, clss) {
        var border, empty, lh, sw, tx, ty;
        border = "";
        if (!prev) {
            border += " tl tr";
        } else {
            if ((sel[1][0] < prev[1][0]) || (sel[1][0] > prev[1][1])) {
                border += " tl";
            }
            if ((sel[1][1] > prev[1][1]) || (sel[1][1] < prev[1][0])) {
                border += " tr";
            }
        }
        if (!next) {
            border += " bl br";
        } else {
            if (sel[1][1] > next[1][1] || (sel[1][1] < next[1][0])) {
                border += " br";
            }
            if ((sel[1][0] < next[1][0]) || (sel[1][0] > next[1][1])) {
                border += " bl";
            }
        }
        if (sel[1][0] === 0 && !size.centerText) {
            border += " start";
        }
        sw = size.charWidth * (sel[1][1] - sel[1][0]);
        tx = size.charWidth * sel[1][0] + size.offsetX;
        ty = size.lineHeight * sel[0];
        lh = size.lineHeight;
        if (clss.startsWith('stringmatch')) {
            if (clss.endsWith('single')) {
                lh /= 2;
            }
            if (clss.endsWith('double')) {
                lh /= 2;
            }
            if (clss.endsWith('bold')) {
                ty += lh / 4;
                lh /= 2;
            }
        }
        empty = sel[1][0] === sel[1][1] && "empty" || "";
        return "<span class=\"" + clss + border + " " + empty + "\" style=\"transform: translate(" + tx + "px," + ty + "px); width: " + sw + "px; height: " + lh + "px\"></span>";
    };

    return Render;

})();

module.exports = Render;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFpQixPQUFBLENBQVEsS0FBUixDQUFqQixFQUFFLGVBQUYsRUFBUTs7QUFFRjs7O0lBUUYsTUFBQyxDQUFBLElBQUQsR0FBTyxTQUFDLElBQUQsRUFBTyxJQUFQO0FBQ0gsWUFBQTs7WUFEVSxPQUFLO2dCQUFDLFNBQUEsRUFBVSxDQUFYOzs7UUFDZixDQUFBLEdBQUk7UUFDSixtQkFBRyxJQUFJLENBQUUsZUFBVDtBQUNJLGlCQUFVLHdGQUFWO2dCQUNJLENBQUEsR0FBSSxJQUFLLENBQUEsRUFBQTtnQkFDVCxFQUFBLEdBQUssQ0FBQyxDQUFDLEtBQUYsR0FBVSxJQUFJLENBQUM7Z0JBQ3BCLEtBQUEsR0FBUSxpQkFBQSxJQUFhLENBQUEsV0FBQSxHQUFZLENBQUMsQ0FBQyxLQUFkLEdBQW9CLElBQXBCLENBQWIsSUFBd0M7Z0JBQ2hELEtBQUEsR0FBUSxxQ0FBQSxHQUFzQyxFQUF0QyxHQUF5QyxNQUF6QyxHQUE4QyxrQ0FBVSxFQUFWLENBQTlDLEdBQTJELElBQTNELEdBQStELEtBQS9ELEdBQXFFLEdBQXJFLEdBQXVFLENBQUMsSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFDLENBQUMsS0FBZCxDQUFELENBQXZFLEdBQTRGO2dCQUNwRyxDQUFBLEdBQUksS0FBQSxHQUFRO0FBTGhCLGFBREo7O2VBT0E7SUFURzs7SUFXUCxNQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsSUFBRCxFQUFPLElBQVA7QUFJUCxZQUFBO1FBQUEsR0FBQSxHQUFNLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtTQUFMO0FBQ047QUFBQSxhQUFBLHNDQUFBOztZQUNJLElBQUEsR0FBTyxJQUFBLENBQUssTUFBTDtZQUNQLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBWCxHQUF1QixhQUFBLEdB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WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMCAgMDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsga3N0ciwgZWxlbSB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBSZW5kZXJcblxuICAgICMgMDAwICAgICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBAbGluZTogKGRpc3MsIHNpemU9e2NoYXJXaWR0aDowfSkgLT5cbiAgICAgICAgbCA9IFwiXCJcbiAgICAgICAgaWYgZGlzcz8ubGVuZ3RoXG4gICAgICAgICAgICBmb3IgZGkgaW4gW2Rpc3MubGVuZ3RoLTEuLjBdXG4gICAgICAgICAgICAgICAgZCA9IGRpc3NbZGldXG4gICAgICAgICAgICAgICAgdHggPSBkLnN0YXJ0ICogc2l6ZS5jaGFyV2lkdGhcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGQudmFsdWU/IGFuZCBcIiBjbGFzcz1cXFwiI3tkLnZhbHVlfVxcXCJcIiBvciAnJ1xuICAgICAgICAgICAgICAgIGNscnpkID0gXCI8c3BhbiBzdHlsZT1cXFwidHJhbnNmb3JtOnRyYW5zbGF0ZXgoI3t0eH1weCk7I3tkLnN0eWwgPyAnJ31cXFwiI3t2YWx1ZX0+I3trc3RyLmVuY29kZSBkLm1hdGNofTwvc3Bhbj5cIlxuICAgICAgICAgICAgICAgIGwgPSBjbHJ6ZCArIGxcbiAgICAgICAgbFxuXG4gICAgQGxpbmVTcGFuOiAoZGlzcywgc2l6ZSkgLT5cblxuICAgICAgICAjIGxvZyBkaXNzXG4gICAgICAgIFxuICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiAnbGluZXNwYW5zJ1xuICAgICAgICBmb3IgZCBpbiBkaXNzID8gW11cbiAgICAgICAgICAgIHNwYW4gPSBlbGVtICdzcGFuJ1xuICAgICAgICAgICAgc3Bhbi5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZXgoI3tkLnN0YXJ0ICogc2l6ZS5jaGFyV2lkdGh9cHgpXCJcbiAgICAgICAgICAgIHNwYW4uY2xhc3NOYW1lID0gZC52YWx1ZSBpZiBkLnZhbHVlP1xuICAgICAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IGQubWF0Y2gucmVwbGFjZSAvXFx4MWIvZywgJ+KWqidcbiAgICAgICAgICAgIGlmIGQuc3R5bD9cbiAgICAgICAgICAgICAgICBmb3Igc3QgaW4gZC5zdHlsLnNwbGl0ICc7J1xuICAgICAgICAgICAgICAgICAgICBzcyA9IHN0LnNwbGl0ICc6J1xuICAgICAgICAgICAgICAgICAgICBzcGFuLnN0eWxlW3NzWzBdXSA9IHNzWzFdXG4gICAgICAgICAgICBkaXYuYXBwZW5kQ2hpbGQgc3BhblxuICAgICAgICBkaXZcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuXG4gICAgQGN1cnNvcnM6IChjcywgc2l6ZSkgLT4gIyBjczogWyBbY2hhckluZGV4LCBsaW5lSW5kZXhdIC4uLiBdICAobGluZUluZGV4IHJlbGF0aXZlIHRvIHZpZXcpXG5cbiAgICAgICAgaSA9IDBcbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgY3cgPSBzaXplLmNoYXJXaWR0aFxuICAgICAgICBsaCA9IHNpemUubGluZUhlaWdodFxuICAgICAgICBmb3IgYyBpbiBjc1xuICAgICAgICAgICAgdHggID0gY1swXSAqIGN3ICsgc2l6ZS5vZmZzZXRYXG4gICAgICAgICAgICB0eSAgPSBjWzFdICogbGhcbiAgICAgICAgICAgIGNscyA9IFwiXCJcbiAgICAgICAgICAgIGNscyA9IGNbMl0gaWYgYy5sZW5ndGggPiAyXG4gICAgICAgICAgICB6aSAgPSBjbHMgIT0gJ3ZpcnR1YWwnIGFuZCBjWzFdKzEwMDAgb3IgMFxuICAgICAgICAgICAgaCArPSBcIjxzcGFuIGNsYXNzPVxcXCJjdXJzb3IgI3tjbHN9XFxcIiBzdHlsZT1cXFwiei1pbmRleDoje3ppfTt0cmFuc2Zvcm06dHJhbnNsYXRlM2QoI3t0eH1weCwje3R5fXB4LDApOyBoZWlnaHQ6I3tsaH1weFxcXCI+PC9zcGFuPlwiXG4gICAgICAgICAgICBpICs9IDFcbiAgICAgICAgaFxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBAc2VsZWN0aW9uOiAoc3MsIHNpemUsIGNsc3M9J3NlbGVjdGlvbicpID0+ICMgc3M6IFsgW2xpbmVJbmRleCwgW3N0YXJ0SW5kZXgsIGVuZEluZGV4XV0sIC4uLiBdICAobGluZUluZGV4IHJlbGF0aXZlIHRvIHZpZXcpXG5cbiAgICAgICAgaCA9IFwiXCJcbiAgICAgICAgcCA9IG51bGxcbiAgICAgICAgbiA9IG51bGxcbiAgICAgICAgZm9yIHNpIGluIFswLi4uc3MubGVuZ3RoXVxuICAgICAgICAgICAgcyA9IHNzW3NpXVxuICAgICAgICAgICAgbiA9IChzaSA8IHNzLmxlbmd0aC0xKSBhbmQgKHNzW3NpKzFdWzBdID09IHNbMF0rMSkgYW5kIHNzW3NpKzFdIG9yIG51bGwgIyBuZXh0IGxpbmUgc2VsZWN0aW9uXG4gICAgICAgICAgICBiID0gcD9bMF0gPT0gc1swXS0xIGFuZCBwIG9yIG51bGwgIyBzZWxlY3Rpb24gaW4gbGluZSBiZWZvcmVcbiAgICAgICAgICAgIGggKz0gQHNlbGVjdGlvblNwYW4gYiwgcywgbiwgc2l6ZSwgc1syXT8uY2xzcyA/IHNbMl0gPyBjbHNzXG4gICAgICAgICAgICBwID0gc1xuICAgICAgICBoXG5cbiAgICBAc2VsZWN0aW9uU3BhbjogKHByZXYsIHNlbCwgbmV4dCwgc2l6ZSwgY2xzcykgLT5cblxuICAgICAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuXG4gICAgICAgIGJvcmRlciA9IFwiXCJcbiAgICAgICAgaWYgbm90IHByZXZcbiAgICAgICAgICAgIGJvcmRlciArPSBcIiB0bCB0clwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIChzZWxbMV1bMF0gPCBwcmV2WzFdWzBdKSBvciAoc2VsWzFdWzBdID4gcHJldlsxXVsxXSlcbiAgICAgICAgICAgICAgICBib3JkZXIgKz0gXCIgdGxcIlxuICAgICAgICAgICAgaWYgKHNlbFsxXVsxXSA+IHByZXZbMV1bMV0pIG9yIChzZWxbMV1bMV0gPCBwcmV2WzFdWzBdKVxuICAgICAgICAgICAgICAgIGJvcmRlciArPSBcIiB0clwiXG5cbiAgICAgICAgaWYgbm90IG5leHRcbiAgICAgICAgICAgIGJvcmRlciArPSBcIiBibCBiclwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIHNlbFsxXVsxXSA+IG5leHRbMV1bMV0gb3IgKHNlbFsxXVsxXSA8IG5leHRbMV1bMF0pXG4gICAgICAgICAgICAgICAgYm9yZGVyICs9IFwiIGJyXCJcbiAgICAgICAgICAgIGlmIChzZWxbMV1bMF0gPCBuZXh0WzFdWzBdKSBvciAoc2VsWzFdWzBdID4gbmV4dFsxXVsxXSlcbiAgICAgICAgICAgICAgICBib3JkZXIgKz0gXCIgYmxcIlxuXG4gICAgICAgIGlmIHNlbFsxXVswXSA9PSAwIGFuZCBub3Qgc2l6ZS5jZW50ZXJUZXh0XG4gICAgICAgICAgICBib3JkZXIgKz0gXCIgc3RhcnRcIiAjIHdpZGVyIG9mZnNldCBhdCBzdGFydCBvZiBsaW5lXG5cbiAgICAgICAgc3cgPSBzaXplLmNoYXJXaWR0aCAqIChzZWxbMV1bMV0tc2VsWzFdWzBdKVxuICAgICAgICB0eCA9IHNpemUuY2hhcldpZHRoICogIHNlbFsxXVswXSArIHNpemUub2Zmc2V0WFxuICAgICAgICB0eSA9IHNpemUubGluZUhlaWdodCAqIHNlbFswXVxuICAgICAgICBsaCA9IHNpemUubGluZUhlaWdodFxuXG4gICAgICAgIGlmIGNsc3Muc3RhcnRzV2l0aCAnc3RyaW5nbWF0Y2gnXG4gICAgICAgICAgICBsaCAvPSAyIGlmIGNsc3MuZW5kc1dpdGggJ3NpbmdsZSdcbiAgICAgICAgICAgIGxoIC89IDIgaWYgY2xzcy5lbmRzV2l0aCAnZG91YmxlJ1xuICAgICAgICAgICAgaWYgY2xzcy5lbmRzV2l0aCAnYm9sZCdcbiAgICAgICAgICAgICAgICB0eSArPSBsaC80XG4gICAgICAgICAgICAgICAgbGggLz0gMlxuXG4gICAgICAgIGVtcHR5ID0gc2VsWzFdWzBdID09IHNlbFsxXVsxXSBhbmQgXCJlbXB0eVwiIG9yIFwiXCJcblxuICAgICAgICBcIjxzcGFuIGNsYXNzPVxcXCIje2Nsc3N9I3tib3JkZXJ9ICN7ZW1wdHl9XFxcIiBzdHlsZT1cXFwidHJhbnNmb3JtOiB0cmFuc2xhdGUoI3t0eH1weCwje3R5fXB4KTsgd2lkdGg6ICN7c3d9cHg7IGhlaWdodDogI3tsaH1weFxcXCI+PC9zcGFuPlwiXG5cbm1vZHVsZS5leHBvcnRzID0gUmVuZGVyXG4iXX0=
//# sourceURL=../../coffee/editor/render.coffee