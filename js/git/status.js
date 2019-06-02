// koffee 0.56.0

/*
 0000000  000000000   0000000   000000000  000   000   0000000  
000          000     000   000     000     000   000  000       
0000000      000     000000000     000     000   000  0000000   
     000     000     000   000     000     000   000       000  
0000000      000     000   000     000      0000000   0000000
 */
var _, childp, dir, empty, gitCmd, gitOpt, parseResult, ref, slash, status, str, valid;

ref = require('kxk'), childp = ref.childp, valid = ref.valid, empty = ref.empty, slash = ref.slash, str = ref.str, _ = ref._;

gitCmd = 'git status --porcelain';

gitOpt = function(gitDir) {
    return {
        encoding: 'utf8',
        cwd: slash.unslash(gitDir),
        stdio: ['pipe', 'pipe', 'ignore']
    };
};

status = function(gitDir, cb) {
    var err, r;
    if (_.isFunction(cb)) {
        if (empty(gitDir)) {
            return cb({});
        } else {
            try {
                return childp.exec(gitCmd, gitOpt(gitDir), function(err, r) {
                    if (valid(err)) {
                        return cb({});
                    } else {
                        return cb(parseResult(gitDir, r));
                    }
                });
            } catch (error) {
                err = error;
                return cb({});
            }
        }
    } else {
        if (empty(gitDir)) {
            return {};
        }
        try {
            r = childp.execSync(gitCmd, gitOpt(gitDir));
        } catch (error) {
            err = error;
            return {};
        }
        return parseResult(gitDir, r);
    }
};

parseResult = function(gitDir, result) {
    var dirSet, file, header, info, line, lines, rel;
    if (result.startsWith('fatal:')) {
        return {};
    }
    lines = result.split('\n');
    info = {
        gitDir: gitDir,
        changed: [],
        deleted: [],
        added: []
    };
    dirSet = new Set;
    while (line = lines.shift()) {
        rel = line.slice(3);
        file = slash.join(gitDir, line.slice(3));
        while ((rel = slash.dir(rel)) !== '') {
            dirSet.add(rel);
        }
        header = line.slice(0, 2);
        switch (header) {
            case ' D':
                info.deleted.push(file);
                break;
            case ' M':
                info.changed.push(file);
                break;
            case '??':
                info.added.push(file);
        }
    }
    info.dirs = Array.from(dirSet).map(function(d) {
        return slash.join(gitDir, d);
    });
    return info;
};

if (module.parent) {
    module.exports = status;
} else {
    if (!empty(process.argv[2])) {
        dir = slash.resolve(process.argv[2]);
    } else {
        dir = process.cwd();
    }
    console.log(status(dir));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUEwQyxPQUFBLENBQVEsS0FBUixDQUExQyxFQUFFLG1CQUFGLEVBQVUsaUJBQVYsRUFBaUIsaUJBQWpCLEVBQXdCLGlCQUF4QixFQUErQixhQUEvQixFQUFvQzs7QUFFcEMsTUFBQSxHQUFTOztBQUNULE1BQUEsR0FBUyxTQUFDLE1BQUQ7V0FBWTtRQUFBLFFBQUEsRUFBVSxNQUFWO1FBQWtCLEdBQUEsRUFBSyxLQUFLLENBQUMsT0FBTixDQUFjLE1BQWQsQ0FBdkI7UUFBOEMsS0FBQSxFQUFNLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsUUFBakIsQ0FBcEQ7O0FBQVo7O0FBRVQsTUFBQSxHQUFTLFNBQUMsTUFBRCxFQUFTLEVBQVQ7QUFFTCxRQUFBO0lBQUEsSUFBRyxDQUFDLENBQUMsVUFBRixDQUFhLEVBQWIsQ0FBSDtRQUVJLElBQUcsS0FBQSxDQUFNLE1BQU4sQ0FBSDttQkFDSSxFQUFBLENBQUcsRUFBSCxFQURKO1NBQUEsTUFBQTtBQUdJO3VCQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVksTUFBWixFQUFvQixNQUFBLENBQU8sTUFBUCxDQUFwQixFQUFvQyxTQUFDLEdBQUQsRUFBSyxDQUFMO29CQUNoQyxJQUFHLEtBQUEsQ0FBTSxHQUFOLENBQUg7K0JBQ0ksRUFBQSxDQUFHLEVBQUgsRUFESjtxQkFBQSxNQUFBOytCQUdJLEVBQUEsQ0FBRyxXQUFBLENBQVksTUFBWixFQUFvQixDQUFwQixDQUFILEVBSEo7O2dCQURnQyxDQUFwQyxFQURKO2FBQUEsYUFBQTtnQkFNTTt1QkFDRixFQUFBLENBQUcsRUFBSCxFQVBKO2FBSEo7U0FGSjtLQUFBLE1BQUE7UUFjSSxJQUFhLEtBQUEsQ0FBTSxNQUFOLENBQWI7QUFBQSxtQkFBTyxHQUFQOztBQUNBO1lBQ0ksQ0FBQSxHQUFJLE1BQU0sQ0FBQyxRQUFQLENBQWdCLE1BQWhCLEVBQXdCLE1BQUEsQ0FBTyxNQUFQLENBQXhCLEVBRFI7U0FBQSxhQUFBO1lBRU07QUFDRixtQkFBTyxHQUhYOztlQUtBLFdBQUEsQ0FBWSxNQUFaLEVBQW9CLENBQXBCLEVBcEJKOztBQUZLOztBQThCVCxXQUFBLEdBQWMsU0FBQyxNQUFELEVBQVMsTUFBVDtBQUVWLFFBQUE7SUFBQSxJQUFHLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFFBQWxCLENBQUg7QUFBbUMsZUFBTyxHQUExQzs7SUFFQSxLQUFBLEdBQVEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxJQUFiO0lBRVIsSUFBQSxHQUNJO1FBQUEsTUFBQSxFQUFTLE1BQVQ7UUFDQSxPQUFBLEVBQVMsRUFEVDtRQUVBLE9BQUEsRUFBUyxFQUZUO1FBR0EsS0FBQSxFQUFTLEVBSFQ7O0lBS0osTUFBQSxHQUFTLElBQUk7QUFFYixXQUFNLElBQUEsR0FBTyxLQUFLLENBQUMsS0FBTixDQUFBLENBQWI7UUFDSSxHQUFBLEdBQVMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFYO1FBQ1QsSUFBQSxHQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsTUFBWCxFQUFtQixJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsQ0FBbkI7QUFDVCxlQUFNLENBQUMsR0FBQSxHQUFNLEtBQUssQ0FBQyxHQUFOLENBQVUsR0FBVixDQUFQLENBQUEsS0FBeUIsRUFBL0I7WUFDSSxNQUFNLENBQUMsR0FBUCxDQUFXLEdBQVg7UUFESjtRQUdBLE1BQUEsR0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLENBQVgsRUFBYSxDQUFiO0FBQ1QsZ0JBQU8sTUFBUDtBQUFBLGlCQUNTLElBRFQ7Z0JBQ21CLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBYixDQUFrQixJQUFsQjtBQUFWO0FBRFQsaUJBRVMsSUFGVDtnQkFFbUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFiLENBQWtCLElBQWxCO0FBQVY7QUFGVCxpQkFHUyxJQUhUO2dCQUdtQixJQUFJLENBQUMsS0FBTyxDQUFDLElBQWIsQ0FBa0IsSUFBbEI7QUFIbkI7SUFQSjtJQVlBLElBQUksQ0FBQyxJQUFMLEdBQVksS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFYLENBQWtCLENBQUMsR0FBbkIsQ0FBdUIsU0FBQyxDQUFEO2VBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxNQUFYLEVBQW1CLENBQW5CO0lBQVAsQ0FBdkI7V0FDWjtBQTNCVTs7QUFtQ2QsSUFBRyxNQUFNLENBQUMsTUFBVjtJQUVJLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE9BRnJCO0NBQUEsTUFBQTtJQUtJLElBQUcsQ0FBSSxLQUFBLENBQU0sT0FBTyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQW5CLENBQVA7UUFDSSxHQUFBLEdBQU0sS0FBSyxDQUFDLE9BQU4sQ0FBYyxPQUFPLENBQUMsSUFBSyxDQUFBLENBQUEsQ0FBM0IsRUFEVjtLQUFBLE1BQUE7UUFHSSxHQUFBLEdBQU0sT0FBTyxDQUFDLEdBQVIsQ0FBQSxFQUhWOztJQUtBLE9BQUEsQ0FBQSxHQUFBLENBQUksTUFBQSxDQUFPLEdBQVAsQ0FBSixFQVZKIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4gMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgXG4wMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIDAwMCAgXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIyNcblxueyBjaGlsZHAsIHZhbGlkLCBlbXB0eSwgc2xhc2gsIHN0ciwgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5naXRDbWQgPSAnZ2l0IHN0YXR1cyAtLXBvcmNlbGFpbidcbmdpdE9wdCA9IChnaXREaXIpIC0+IGVuY29kaW5nOsKgJ3V0ZjgnLCBjd2Q6IHNsYXNoLnVuc2xhc2goZ2l0RGlyKSwgc3RkaW86WydwaXBlJywgJ3BpcGUnLCAnaWdub3JlJ11cblxuc3RhdHVzID0gKGdpdERpciwgY2IpIC0+XG5cbiAgICBpZiBfLmlzRnVuY3Rpb24gY2JcbiAgICAgICAgXG4gICAgICAgIGlmIGVtcHR5IGdpdERpclxuICAgICAgICAgICAgY2Ige31cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgICAgY2hpbGRwLmV4ZWMgZ2l0Q21kLCBnaXRPcHQoZ2l0RGlyKSwgKGVycixyKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiIHt9XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiIHBhcnNlUmVzdWx0IGdpdERpciwgclxuICAgICAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICAgICAgY2Ige31cbiAgICBlbHNlXG4gICAgICAgIHJldHVybiB7fSBpZiBlbXB0eSBnaXREaXJcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICByID0gY2hpbGRwLmV4ZWNTeW5jIGdpdENtZCwgZ2l0T3B0IGdpdERpclxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIHJldHVybiB7fVxuICAgICAgICBcbiAgICAgICAgcGFyc2VSZXN1bHQgZ2l0RGlyLCByXG4gICAgXG4jIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgXG4jIDAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgXG4jIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG5cbnBhcnNlUmVzdWx0ID0gKGdpdERpciwgcmVzdWx0KSAtPlxuICAgIFxuICAgIGlmIHJlc3VsdC5zdGFydHNXaXRoICdmYXRhbDonIHRoZW4gcmV0dXJuIHt9XG4gICAgXG4gICAgbGluZXMgPSByZXN1bHQuc3BsaXQgJ1xcbidcblxuICAgIGluZm8gPSBcbiAgICAgICAgZ2l0RGlyOiAgZ2l0RGlyXG4gICAgICAgIGNoYW5nZWQ6IFtdXG4gICAgICAgIGRlbGV0ZWQ6IFtdXG4gICAgICAgIGFkZGVkOiAgIFtdXG4gICAgICAgIFxuICAgIGRpclNldCA9IG5ldyBTZXRcbiAgICBcbiAgICB3aGlsZSBsaW5lID0gbGluZXMuc2hpZnQoKVxuICAgICAgICByZWwgICAgPSBsaW5lLnNsaWNlIDNcbiAgICAgICAgZmlsZSAgID0gc2xhc2guam9pbiBnaXREaXIsIGxpbmUuc2xpY2UgM1xuICAgICAgICB3aGlsZSAocmVsID0gc2xhc2guZGlyIHJlbCkgIT0gJydcbiAgICAgICAgICAgIGRpclNldC5hZGQgcmVsXG4gICAgICAgICAgICBcbiAgICAgICAgaGVhZGVyID0gbGluZS5zbGljZSAwLDJcbiAgICAgICAgc3dpdGNoIGhlYWRlclxuICAgICAgICAgICAgd2hlbiAnIEQnIHRoZW4gaW5mby5kZWxldGVkLnB1c2ggZmlsZVxuICAgICAgICAgICAgd2hlbiAnIE0nIHRoZW4gaW5mby5jaGFuZ2VkLnB1c2ggZmlsZVxuICAgICAgICAgICAgd2hlbiAnPz8nIHRoZW4gaW5mby5hZGRlZCAgLnB1c2ggZmlsZVxuICAgICAgICAgICAgXG4gICAgaW5mby5kaXJzID0gQXJyYXkuZnJvbShkaXJTZXQpLm1hcCAoZCkgLT4gc2xhc2guam9pbiBnaXREaXIsIGRcbiAgICBpbmZvXG5cbiMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4jIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiMgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4jIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuXG5pZiBtb2R1bGUucGFyZW50XG4gICAgXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzdGF0dXNcbiAgICBcbmVsc2VcbiAgICBpZiBub3QgZW1wdHkgcHJvY2Vzcy5hcmd2WzJdXG4gICAgICAgIGRpciA9IHNsYXNoLnJlc29sdmUgcHJvY2Vzcy5hcmd2WzJdXG4gICAgZWxzZVxuICAgICAgICBkaXIgPSBwcm9jZXNzLmN3ZCgpXG4gICAgXG4gICAgbG9nIHN0YXR1cyBkaXJcbiAgICAiXX0=
//# sourceURL=../../coffee/git/status.coffee