// koffee 1.11.0

/*
000  000   000  00000000   0000000     
000  0000  000  000       000   000    
000  000 0 000  000000    000   000    
000  000  0000  000       000   000    
000  000   000  000        0000000
 */
var $, File, elem, fileInfo, imageInfo, moment, open, pbytes, ref, slash;

ref = require('kxk'), $ = ref.$, elem = ref.elem, open = ref.open, slash = ref.slash;

File = require('../tools/file');

pbytes = require('pretty-bytes');

moment = require('moment');

imageInfo = function(file) {
    var cnt, img;
    img = elem('img', {
        "class": 'browserImage',
        src: slash.fileUrl(file)
    });
    cnt = elem({
        "class": 'browserImageContainer',
        child: img
    });
    cnt.addEventListener('dblclick', function() {
        return open(file);
    });
    img.onload = function() {
        var age, br, height, html, info, num, range, ref1, size, stat, width, x;
        img = $('.browserImage');
        br = img.getBoundingClientRect();
        x = img.clientX;
        width = parseInt(br.right - br.left - 2);
        height = parseInt(br.bottom - br.top - 2);
        img.style.opacity = '1';
        img.style.maxWidth = '100%';
        stat = slash.fileExists(file);
        size = pbytes(stat.size).split(' ');
        age = moment().to(moment(stat.mtime), true);
        ref1 = age.split(' '), num = ref1[0], range = ref1[1];
        if (num[0] === 'a') {
            num = '1';
        }
        html = "<tr><th colspan=2>" + width + "<span class='punct'>x</span>" + height + "</th></tr>";
        html += "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr>";
        html += "<tr><th>" + num + "</th><td>" + range + "</td></tr>";
        info = elem({
            "class": 'browserFileInfo',
            children: [
                elem('div', {
                    "class": "fileInfoFile " + (slash.ext(file)),
                    html: File.span(file)
                }), elem('table', {
                    "class": "fileInfoData",
                    html: html
                })
            ]
        });
        cnt = $('.browserImageContainer');
        return cnt.appendChild(info);
    };
    return cnt;
};

fileInfo = function(file) {
    var age, info, num, range, ref1, size, stat, t;
    stat = slash.fileExists(file);
    size = pbytes(stat.size).split(' ');
    t = moment(stat.mtime);
    age = moment().to(t, true);
    ref1 = age.split(' '), num = ref1[0], range = ref1[1];
    if (num[0] === 'a') {
        num = '1';
    }
    if (range === 'few') {
        num = moment().diff(t, 'seconds');
        range = 'seconds';
    }
    info = elem({
        "class": 'browserFileInfo',
        children: [
            elem('div', {
                "class": "fileInfoIcon " + (slash.ext(file)) + " " + (File.iconClassName(file))
            }), elem('div', {
                "class": "fileInfoFile " + (slash.ext(file)),
                html: File.span(file)
            }), elem('table', {
                "class": "fileInfoData",
                html: "<tr><th>" + size[0] + "</th><td>" + size[1] + "</td></tr><tr><th>" + num + "</th><td>" + range + "</td></tr>"
            })
        ]
    });
    return info;
};

module.exports = {
    file: fileInfo,
    image: imageInfo
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mby5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvYnJvd3NlciIsInNvdXJjZXMiOlsiaW5mby5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBMkIsT0FBQSxDQUFRLEtBQVIsQ0FBM0IsRUFBRSxTQUFGLEVBQUssZUFBTCxFQUFXLGVBQVgsRUFBaUI7O0FBRWpCLElBQUEsR0FBVyxPQUFBLENBQVEsZUFBUjs7QUFDWCxNQUFBLEdBQVcsT0FBQSxDQUFRLGNBQVI7O0FBQ1gsTUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSOztBQVFYLFNBQUEsR0FBWSxTQUFDLElBQUQ7QUFFUixRQUFBO0lBQUEsR0FBQSxHQUFNLElBQUEsQ0FBSyxLQUFMLEVBQVc7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGNBQU47UUFBcUIsR0FBQSxFQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBZCxDQUF6QjtLQUFYO0lBQ04sR0FBQSxHQUFNLElBQUEsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sdUJBQU47UUFBOEIsS0FBQSxFQUFNLEdBQXBDO0tBQUw7SUFDTixHQUFHLENBQUMsZ0JBQUosQ0FBcUIsVUFBckIsRUFBZ0MsU0FBQTtlQUFHLElBQUEsQ0FBSyxJQUFMO0lBQUgsQ0FBaEM7SUFFQSxHQUFHLENBQUMsTUFBSixHQUFhLFNBQUE7QUFDVCxZQUFBO1FBQUEsR0FBQSxHQUFLLENBQUEsQ0FBRSxlQUFGO1FBQ0wsRUFBQSxHQUFLLEdBQUcsQ0FBQyxxQkFBSixDQUFBO1FBQ0wsQ0FBQSxHQUFJLEdBQUcsQ0FBQztRQUNSLEtBQUEsR0FBUyxRQUFBLENBQVMsRUFBRSxDQUFDLEtBQUgsR0FBVyxFQUFFLENBQUMsSUFBZCxHQUFxQixDQUE5QjtRQUNULE1BQUEsR0FBUyxRQUFBLENBQVMsRUFBRSxDQUFDLE1BQUgsR0FBWSxFQUFFLENBQUMsR0FBZixHQUFxQixDQUE5QjtRQUVULEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBVixHQUFzQjtRQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVYsR0FBc0I7UUFFdEIsSUFBQSxHQUFPLEtBQUssQ0FBQyxVQUFOLENBQWlCLElBQWpCO1FBQ1AsSUFBQSxHQUFPLE1BQUEsQ0FBTyxJQUFJLENBQUMsSUFBWixDQUFpQixDQUFDLEtBQWxCLENBQXdCLEdBQXhCO1FBRVAsR0FBQSxHQUFNLE1BQUEsQ0FBQSxDQUFRLENBQUMsRUFBVCxDQUFZLE1BQUEsQ0FBTyxJQUFJLENBQUMsS0FBWixDQUFaLEVBQWdDLElBQWhDO1FBQ04sT0FBZSxHQUFHLENBQUMsS0FBSixDQUFVLEdBQVYsQ0FBZixFQUFDLGFBQUQsRUFBTTtRQUNOLElBQWEsR0FBSSxDQUFBLENBQUEsQ0FBSixLQUFVLEdBQXZCO1lBQUEsR0FBQSxHQUFNLElBQU47O1FBRUEsSUFBQSxHQUFRLG9CQUFBLEdBQXFCLEtBQXJCLEdBQTJCLDhCQUEzQixHQUF5RCxNQUF6RCxHQUFnRTtRQUN4RSxJQUFBLElBQVEsVUFBQSxHQUFXLElBQUssQ0FBQSxDQUFBLENBQWhCLEdBQW1CLFdBQW5CLEdBQThCLElBQUssQ0FBQSxDQUFBLENBQW5DLEdBQXNDO1FBQzlDLElBQUEsSUFBUSxVQUFBLEdBQVcsR0FBWCxHQUFlLFdBQWYsR0FBMEIsS0FBMUIsR0FBZ0M7UUFFeEMsSUFBQSxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0saUJBQU47WUFBd0IsUUFBQSxFQUFVO2dCQUMxQyxJQUFBLENBQUssS0FBTCxFQUFXO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sZUFBQSxHQUFlLENBQUMsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFWLENBQUQsQ0FBckI7b0JBQXVDLElBQUEsRUFBSyxJQUFJLENBQUMsSUFBTCxDQUFVLElBQVYsQ0FBNUM7aUJBQVgsQ0FEMEMsRUFFMUMsSUFBQSxDQUFLLE9BQUwsRUFBYTtvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGNBQU47b0JBQXFCLElBQUEsRUFBSyxJQUExQjtpQkFBYixDQUYwQzthQUFsQztTQUFMO1FBSVAsR0FBQSxHQUFLLENBQUEsQ0FBRSx3QkFBRjtlQUNMLEdBQUcsQ0FBQyxXQUFKLENBQWdCLElBQWhCO0lBMUJTO1dBNEJiO0FBbENROztBQTBDWixRQUFBLEdBQVcsU0FBQyxJQUFEO0FBRVAsUUFBQTtJQUFBLElBQUEsR0FBTyxLQUFLLENBQUMsVUFBTixDQUFpQixJQUFqQjtJQUNQLElBQUEsR0FBTyxNQUFBLENBQU8sSUFBSSxDQUFDLElBQVosQ0FBaUIsQ0FBQyxLQUFsQixDQUF3QixHQUF4QjtJQUVQLENBQUEsR0FBSSxNQUFBLENBQU8sSUFBSSxDQUFDLEtBQVo7SUFFSixHQUFBLEdBQU0sTUFBQSxDQUFBLENBQVEsQ0FBQyxFQUFULENBQVksQ0FBWixFQUFlLElBQWY7SUFDTixPQUFlLEdBQUcsQ0FBQyxLQUFKLENBQVUsR0FBVixDQUFmLEVBQUMsYUFBRCxFQUFNO0lBQ04sSUFBYSxHQUFJLENBQUEsQ0FBQSxDQUFKLEtBQVUsR0FBdkI7UUFBQSxHQUFBLEdBQU0sSUFBTjs7SUFDQSxJQUFHLEtBQUEsS0FBUyxLQUFaO1FBQ0ksR0FBQSxHQUFNLE1BQUEsQ0FBQSxDQUFRLENBQUMsSUFBVCxDQUFjLENBQWQsRUFBaUIsU0FBakI7UUFDTixLQUFBLEdBQVEsVUFGWjs7SUFJQSxJQUFBLEdBQU8sSUFBQSxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxpQkFBTjtRQUF3QixRQUFBLEVBQVU7WUFDMUMsSUFBQSxDQUFLLEtBQUwsRUFBVztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGVBQUEsR0FBZSxDQUFDLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFELENBQWYsR0FBK0IsR0FBL0IsR0FBaUMsQ0FBQyxJQUFJLENBQUMsYUFBTCxDQUFtQixJQUFuQixDQUFELENBQXZDO2FBQVgsQ0FEMEMsRUFFMUMsSUFBQSxDQUFLLEtBQUwsRUFBVztnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGVBQUEsR0FBZSxDQUFDLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBVixDQUFELENBQXJCO2dCQUF1QyxJQUFBLEVBQUssSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFWLENBQTVDO2FBQVgsQ0FGMEMsRUFHMUMsSUFBQSxDQUFLLE9BQUwsRUFBYTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLGNBQU47Z0JBQXFCLElBQUEsRUFBSyxVQUFBLEdBQVcsSUFBSyxDQUFBLENBQUEsQ0FBaEIsR0FBbUIsV0FBbkIsR0FBOEIsSUFBSyxDQUFBLENBQUEsQ0FBbkMsR0FBc0Msb0JBQXRDLEdBQTBELEdBQTFELEdBQThELFdBQTlELEdBQXlFLEtBQXpFLEdBQStFLFlBQXpHO2FBQWIsQ0FIMEM7U0FBbEM7S0FBTDtXQU1QO0FBcEJPOztBQXNCWCxNQUFNLENBQUMsT0FBUCxHQUNJO0lBQUEsSUFBQSxFQUFLLFFBQUw7SUFDQSxLQUFBLEVBQU0sU0FETiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgXG4wMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICBcbjAwMCAgMDAwIDAgMDAwICAwMDAwMDAgICAgMDAwICAgMDAwICAgIFxuMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgXG4wMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgICBcbiMjI1xuXG57ICQsIGVsZW0sIG9wZW4sIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbkZpbGUgICAgID0gcmVxdWlyZSAnLi4vdG9vbHMvZmlsZSdcbnBieXRlcyAgID0gcmVxdWlyZSAncHJldHR5LWJ5dGVzJ1xubW9tZW50ICAgPSByZXF1aXJlICdtb21lbnQnXG4gICAgXG4jIDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgIDAwMCAgICAgICBcbiMgMDAwICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4jIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcblxuaW1hZ2VJbmZvID0gKGZpbGUpIC0+XG4gICAgXG4gICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczonYnJvd3NlckltYWdlJyBzcmM6c2xhc2guZmlsZVVybCBmaWxlXG4gICAgY250ID0gZWxlbSBjbGFzczonYnJvd3NlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snIC0+IG9wZW4gZmlsZVxuICAgICAgICAgICAgICAgIFxuICAgIGltZy5vbmxvYWQgPSAtPlxuICAgICAgICBpbWcgPSQgJy5icm93c2VySW1hZ2UnXG4gICAgICAgIGJyID0gaW1nLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgICAgIHggPSBpbWcuY2xpZW50WFxuICAgICAgICB3aWR0aCAgPSBwYXJzZUludCBici5yaWdodCAtIGJyLmxlZnQgLSAyXG4gICAgICAgIGhlaWdodCA9IHBhcnNlSW50IGJyLmJvdHRvbSAtIGJyLnRvcCAtIDJcblxuICAgICAgICBpbWcuc3R5bGUub3BhY2l0eSAgID0gJzEnXG4gICAgICAgIGltZy5zdHlsZS5tYXhXaWR0aCAgPSAnMTAwJSdcbiAgICAgICAgXG4gICAgICAgIHN0YXQgPSBzbGFzaC5maWxlRXhpc3RzIGZpbGVcbiAgICAgICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgICAgICBcbiAgICAgICAgYWdlID0gbW9tZW50KCkudG8obW9tZW50KHN0YXQubXRpbWUpLCB0cnVlKVxuICAgICAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgICAgIG51bSA9ICcxJyBpZiBudW1bMF0gPT0gJ2EnXG4gICAgICAgIFxuICAgICAgICBodG1sICA9IFwiPHRyPjx0aCBjb2xzcGFuPTI+I3t3aWR0aH08c3BhbiBjbGFzcz0ncHVuY3QnPng8L3NwYW4+I3toZWlnaHR9PC90aD48L3RyPlwiXG4gICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7c2l6ZVswXX08L3RoPjx0ZD4je3NpemVbMV19PC90ZD48L3RyPlwiXG4gICAgICAgIGh0bWwgKz0gXCI8dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgICAgIFxuICAgICAgICBpbmZvID0gZWxlbSBjbGFzczonYnJvd3NlckZpbGVJbmZvJyBjaGlsZHJlbjogW1xuICAgICAgICAgICAgZWxlbSAnZGl2JyBjbGFzczpcImZpbGVJbmZvRmlsZSAje3NsYXNoLmV4dCBmaWxlfVwiIGh0bWw6RmlsZS5zcGFuIGZpbGVcbiAgICAgICAgICAgIGVsZW0gJ3RhYmxlJyBjbGFzczpcImZpbGVJbmZvRGF0YVwiIGh0bWw6aHRtbFxuICAgICAgICBdXG4gICAgICAgIGNudCA9JCAnLmJyb3dzZXJJbWFnZUNvbnRhaW5lcidcbiAgICAgICAgY250LmFwcGVuZENoaWxkIGluZm9cbiAgICBcbiAgICBjbnRcblxuIyAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMFxuIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuIyAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwIFxuIyAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgIFxuIyAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMFxuICAgIFxuZmlsZUluZm8gPSAoZmlsZSkgLT5cbiAgICBcbiAgICBzdGF0ID0gc2xhc2guZmlsZUV4aXN0cyBmaWxlXG4gICAgc2l6ZSA9IHBieXRlcyhzdGF0LnNpemUpLnNwbGl0ICcgJ1xuICAgIFxuICAgIHQgPSBtb21lbnQgc3RhdC5tdGltZVxuXG4gICAgYWdlID0gbW9tZW50KCkudG8odCwgdHJ1ZSlcbiAgICBbbnVtLCByYW5nZV0gPSBhZ2Uuc3BsaXQgJyAnXG4gICAgbnVtID0gJzEnIGlmIG51bVswXSA9PSAnYSdcbiAgICBpZiByYW5nZSA9PSAnZmV3J1xuICAgICAgICBudW0gPSBtb21lbnQoKS5kaWZmIHQsICdzZWNvbmRzJ1xuICAgICAgICByYW5nZSA9ICdzZWNvbmRzJ1xuICAgIFxuICAgIGluZm8gPSBlbGVtIGNsYXNzOidicm93c2VyRmlsZUluZm8nIGNoaWxkcmVuOiBbXG4gICAgICAgIGVsZW0gJ2RpdicgY2xhc3M6XCJmaWxlSW5mb0ljb24gI3tzbGFzaC5leHQgZmlsZX0gI3tGaWxlLmljb25DbGFzc05hbWUgZmlsZX1cIlxuICAgICAgICBlbGVtICdkaXYnIGNsYXNzOlwiZmlsZUluZm9GaWxlICN7c2xhc2guZXh0IGZpbGV9XCIgaHRtbDpGaWxlLnNwYW4gZmlsZVxuICAgICAgICBlbGVtICd0YWJsZScgY2xhc3M6XCJmaWxlSW5mb0RhdGFcIiBodG1sOlwiPHRyPjx0aD4je3NpemVbMF19PC90aD48dGQ+I3tzaXplWzFdfTwvdGQ+PC90cj48dHI+PHRoPiN7bnVtfTwvdGg+PHRkPiN7cmFuZ2V9PC90ZD48L3RyPlwiXG4gICAgXVxuICAgICAgICAgICAgXG4gICAgaW5mb1xuICAgIFxubW9kdWxlLmV4cG9ydHMgPSBcbiAgICBmaWxlOmZpbGVJbmZvXG4gICAgaW1hZ2U6aW1hZ2VJbmZvXG4gICAgIl19
//# sourceURL=../../coffee/browser/info.coffee