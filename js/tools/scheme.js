// koffee 0.56.0

/*
 0000000   0000000  000   000  00000000  00     00  00000000  
000       000       000   000  000       000   000  000       
0000000   000       000000000  0000000   000000000  0000000   
     000  000       000   000  000       000 0 000  000       
0000000    0000000  000   000  00000000  000   000  00000000
 */
var $, Scheme, _, elem, post, prefs, ref, slash;

ref = require('kxk'), prefs = ref.prefs, elem = ref.elem, post = ref.post, slash = ref.slash, $ = ref.$, _ = ref._;

Scheme = (function() {
    function Scheme() {}

    Scheme.colors = {};

    Scheme.toggle = function(schemes) {
        var currentScheme, link, nextScheme, nextSchemeIndex;
        if (schemes == null) {
            schemes = ['dark', 'bright'];
        }
        link = $('.scheme-link');
        currentScheme = slash.basename(slash.dir(link.href));
        nextSchemeIndex = (schemes.indexOf(currentScheme) + 1) % schemes.length;
        nextScheme = schemes[nextSchemeIndex];
        return Scheme.set(nextScheme);
    };

    Scheme.set = function(scheme) {
        var css, j, len, link, newlink, ref1;
        this.colors = {};
        ref1 = document.querySelectorAll('.scheme-link');
        for (j = 0, len = ref1.length; j < len; j++) {
            link = ref1[j];
            css = slash.basename(link.href);
            newlink = elem('link', {
                href: "css/" + scheme + "/" + css,
                rel: 'stylesheet',
                type: 'text/css',
                "class": 'scheme-link'
            });
            link.parentNode.replaceChild(newlink, link);
        }
        prefs.set('scheme', scheme);
        return post.emit('schemeChanged', scheme);
    };

    Scheme.colorForClass = function(clss) {
        var color, div;
        if (this.colors[clss] == null) {
            div = elem({
                "class": clss
            });
            document.body.appendChild(div);
            color = window.getComputedStyle(div).color;
            this.colors[clss] = color;
            div.remove();
        }
        return this.colors[clss];
    };

    Scheme.fadeColor = function(a, b, f) {
        var av, bv, fv, i, j;
        av = this.parseColor(a);
        bv = this.parseColor(b);
        fv = [0, 0, 0];
        for (i = j = 0; j < 3; i = ++j) {
            fv[i] = Math.round((1 - f) * av[i] + f * bv[i]);
        }
        return "rgb(" + fv[0] + ", " + fv[1] + ", " + fv[2] + ")";
    };

    Scheme.parseColor = function(c) {
        var e, s, v;
        if (_.isString(c) && c.startsWith('rgb')) {
            s = c.indexOf('(');
            e = c.indexOf(')');
            c = c.slice(s + 1, e);
            v = c.split(',');
            return [parseInt(v[0]), parseInt(v[1]), parseInt(v[2])];
        }
    };

    return Scheme;

})();

module.exports = Scheme;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1lLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFxQyxPQUFBLENBQVEsS0FBUixDQUFyQyxFQUFFLGlCQUFGLEVBQVMsZUFBVCxFQUFlLGVBQWYsRUFBcUIsaUJBQXJCLEVBQTRCLFNBQTVCLEVBQStCOztBQUV6Qjs7O0lBRUYsTUFBQyxDQUFBLE1BQUQsR0FBVTs7SUFFVixNQUFDLENBQUEsTUFBRCxHQUFTLFNBQUMsT0FBRDtBQUVMLFlBQUE7O1lBRk0sVUFBVSxDQUFDLE1BQUQsRUFBUyxRQUFUOztRQUVoQixJQUFBLEdBQU0sQ0FBQSxDQUFFLGNBQUY7UUFDTixhQUFBLEdBQWdCLEtBQUssQ0FBQyxRQUFOLENBQWUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFJLENBQUMsSUFBZixDQUFmO1FBRWhCLGVBQUEsR0FBa0IsQ0FBRSxPQUFPLENBQUMsT0FBUixDQUFnQixhQUFoQixDQUFBLEdBQWlDLENBQW5DLENBQUEsR0FBd0MsT0FBTyxDQUFDO1FBQ2xFLFVBQUEsR0FBYSxPQUFRLENBQUEsZUFBQTtlQUVyQixNQUFNLENBQUMsR0FBUCxDQUFXLFVBQVg7SUFSSzs7SUFVVCxNQUFDLENBQUEsR0FBRCxHQUFNLFNBQUMsTUFBRDtBQUVGLFlBQUE7UUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVO0FBRVY7QUFBQSxhQUFBLHNDQUFBOztZQUNJLEdBQUEsR0FBTSxLQUFLLENBQUMsUUFBTixDQUFlLElBQUksQ0FBQyxJQUFwQjtZQUNOLE9BQUEsR0FBVSxJQUFBLENBQUssTUFBTCxFQUNOO2dCQUFBLElBQUEsRUFBTyxNQUFBLEdBQU8sTUFBUCxHQUFjLEdBQWQsR0FBaUIsR0FBeEI7Z0JBQ0EsR0FBQSxFQUFPLFlBRFA7Z0JBRUEsSUFBQSxFQUFPLFVBRlA7Z0JBR0EsQ0FBQSxLQUFBLENBQUEsRUFBTyxhQUhQO2FBRE07WUFNVixJQUFJLENBQUMsVUFBVSxDQUFDLFlBQWhCLENBQTZCLE9BQTdCLEVBQXNDLElBQXRDO0FBUko7UUFVQSxLQUFLLENBQUMsR0FBTixDQUFVLFFBQVYsRUFBb0IsTUFBcEI7ZUFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGVBQVYsRUFBMkIsTUFBM0I7SUFmRTs7SUFpQk4sTUFBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxJQUFEO0FBRVosWUFBQTtRQUFBLElBQU8seUJBQVA7WUFFSSxHQUFBLEdBQU0sSUFBQSxDQUFLO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sSUFBUDthQUFMO1lBQ04sUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFkLENBQTBCLEdBQTFCO1lBQ0EsS0FBQSxHQUFRLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixHQUF4QixDQUE0QixDQUFDO1lBQ3JDLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQSxDQUFSLEdBQWdCO1lBQ2hCLEdBQUcsQ0FBQyxNQUFKLENBQUEsRUFOSjs7QUFRQSxlQUFPLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQTtJQVZIOztJQVloQixNQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMO0FBRVIsWUFBQTtRQUFBLEVBQUEsR0FBSyxJQUFDLENBQUEsVUFBRCxDQUFZLENBQVo7UUFDTCxFQUFBLEdBQUssSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFaO1FBQ0wsRUFBQSxHQUFLLENBQUMsQ0FBRCxFQUFHLENBQUgsRUFBSyxDQUFMO0FBQ0wsYUFBUyx5QkFBVDtZQUNJLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsQ0FBQSxHQUFFLENBQUgsQ0FBQSxHQUFRLEVBQUcsQ0FBQSxDQUFBLENBQVgsR0FBZ0IsQ0FBQSxHQUFJLEVBQUcsQ0FBQSxDQUFBLENBQWxDO0FBRFo7ZUFFQSxNQUFBLEdBQU8sRUFBRyxDQUFBLENBQUEsQ0FBVixHQUFhLElBQWIsR0FBaUIsRUFBRyxDQUFBLENBQUEsQ0FBcEIsR0FBdUIsSUFBdkIsR0FBMkIsRUFBRyxDQUFBLENBQUEsQ0FBOUIsR0FBaUM7SUFQekI7O0lBU1osTUFBQyxDQUFBLFVBQUQsR0FBYSxTQUFDLENBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBRyxDQUFDLENBQUMsUUFBRixDQUFXLENBQVgsQ0FBQSxJQUFrQixDQUFDLENBQUMsVUFBRixDQUFhLEtBQWIsQ0FBckI7WUFDSSxDQUFBLEdBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxHQUFWO1lBQ0osQ0FBQSxHQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsR0FBVjtZQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLENBQUEsR0FBRSxDQUFWLEVBQWEsQ0FBYjtZQUNKLENBQUEsR0FBSSxDQUFDLENBQUMsS0FBRixDQUFRLEdBQVI7QUFDSixtQkFBTyxDQUFDLFFBQUEsQ0FBUyxDQUFFLENBQUEsQ0FBQSxDQUFYLENBQUQsRUFBaUIsUUFBQSxDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBakIsRUFBaUMsUUFBQSxDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBakMsRUFMWDs7SUFGUzs7Ozs7O0FBU2pCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICBcbjAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgXG4gICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIFxuMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICBcbiMjI1xuXG57IHByZWZzLCBlbGVtLCBwb3N0LCBzbGFzaCwgJCwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5jbGFzcyBTY2hlbWVcbiAgICBcbiAgICBAY29sb3JzID0ge31cbiAgICBcbiAgICBAdG9nZ2xlOiAoc2NoZW1lcyA9IFsnZGFyaycsICdicmlnaHQnXSkgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmsgPSQgJy5zY2hlbWUtbGluaydcbiAgICAgICAgY3VycmVudFNjaGVtZSA9IHNsYXNoLmJhc2VuYW1lIHNsYXNoLmRpciBsaW5rLmhyZWZcbiAgICAgICAgXG4gICAgICAgIG5leHRTY2hlbWVJbmRleCA9ICggc2NoZW1lcy5pbmRleE9mKGN1cnJlbnRTY2hlbWUpICsgMSkgJSBzY2hlbWVzLmxlbmd0aFxuICAgICAgICBuZXh0U2NoZW1lID0gc2NoZW1lc1tuZXh0U2NoZW1lSW5kZXhdXG4gICAgICAgIFxuICAgICAgICBTY2hlbWUuc2V0IG5leHRTY2hlbWVcbiAgICBcbiAgICBAc2V0OiAoc2NoZW1lKSAtPlxuICAgICAgICBcbiAgICAgICAgQGNvbG9ycyA9IHt9XG4gICAgICAgIFxuICAgICAgICBmb3IgbGluayBpbiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsICcuc2NoZW1lLWxpbmsnXG4gICAgICAgICAgICBjc3MgPSBzbGFzaC5iYXNlbmFtZSBsaW5rLmhyZWZcbiAgICAgICAgICAgIG5ld2xpbmsgPSBlbGVtICdsaW5rJywgXG4gICAgICAgICAgICAgICAgaHJlZjogIFwiY3NzLyN7c2NoZW1lfS8je2Nzc31cIlxuICAgICAgICAgICAgICAgIHJlbDogICAnc3R5bGVzaGVldCdcbiAgICAgICAgICAgICAgICB0eXBlOiAgJ3RleHQvY3NzJ1xuICAgICAgICAgICAgICAgIGNsYXNzOiAnc2NoZW1lLWxpbmsnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5rLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkIG5ld2xpbmssIGxpbmtcbiAgICAgICAgICAgIFxuICAgICAgICBwcmVmcy5zZXQgJ3NjaGVtZScsIHNjaGVtZSAgICBcbiAgICAgICAgcG9zdC5lbWl0ICdzY2hlbWVDaGFuZ2VkJywgc2NoZW1lXG5cbiAgICBAY29sb3JGb3JDbGFzczogKGNsc3MpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGNvbG9yc1tjbHNzXT9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZGl2ID0gZWxlbSBjbGFzczogY2xzc1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCBkaXZcbiAgICAgICAgICAgIGNvbG9yID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZGl2KS5jb2xvclxuICAgICAgICAgICAgQGNvbG9yc1tjbHNzXSA9IGNvbG9yXG4gICAgICAgICAgICBkaXYucmVtb3ZlKClcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gQGNvbG9yc1tjbHNzXVxuICAgICAgICBcbiAgICBAZmFkZUNvbG9yOiAoYSxiLGYpIC0+XG4gICAgICAgIFxuICAgICAgICBhdiA9IEBwYXJzZUNvbG9yIGFcbiAgICAgICAgYnYgPSBAcGFyc2VDb2xvciBiXG4gICAgICAgIGZ2ID0gWzAsMCwwXVxuICAgICAgICBmb3IgaSBpbiBbMC4uLjNdXG4gICAgICAgICAgICBmdltpXSA9IE1hdGgucm91bmQgKDEtZikgKiBhdltpXSArIGYgKiBidltpXVxuICAgICAgICBcInJnYigje2Z2WzBdfSwgI3tmdlsxXX0sICN7ZnZbMl19KVwiXG4gICAgXG4gICAgQHBhcnNlQ29sb3I6IChjKSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgXy5pc1N0cmluZyhjKSBhbmQgYy5zdGFydHNXaXRoICdyZ2InXG4gICAgICAgICAgICBzID0gYy5pbmRleE9mICcoJ1xuICAgICAgICAgICAgZSA9IGMuaW5kZXhPZiAnKSdcbiAgICAgICAgICAgIGMgPSBjLnNsaWNlIHMrMSwgZVxuICAgICAgICAgICAgdiA9IGMuc3BsaXQgJywnXG4gICAgICAgICAgICByZXR1cm4gW3BhcnNlSW50KHZbMF0pLCBwYXJzZUludCh2WzFdKSwgcGFyc2VJbnQodlsyXSldXG4gICAgXG5tb2R1bGUuZXhwb3J0cyA9IFNjaGVtZVxuXG4iXX0=
//# sourceURL=../../coffee/tools/scheme.coffee