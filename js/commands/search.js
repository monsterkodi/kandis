// koffee 1.14.0

/*
 0000000  00000000   0000000   00000000    0000000  000   000
000       000       000   000  000   000  000       000   000
0000000   0000000   000000000  0000000    000       000000000
     000  000       000   000  000   000  000       000   000
0000000   00000000  000   000  000   000   0000000  000   000
 */
var Command, FileSearcher, Search, Syntax, _, fs, kerror, klor, matchr, post, ref, slash, stream, walker,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf;

ref = require('kxk'), _ = ref._, fs = ref.fs, kerror = ref.kerror, klor = ref.klor, matchr = ref.matchr, post = ref.post, slash = ref.slash;

walker = require('../tools/walker');

Syntax = require('../editor/syntax');

Command = require('../commandline/command');

stream = require('stream');

Search = (function(superClass) {
    extend(Search, superClass);

    function Search(commandline) {
        this.onMetaClick = bind(this.onMetaClick, this);
        this.searchInFile = bind(this.searchInFile, this);
        Search.__super__.constructor.call(this, commandline);
        this.names = ['search', 'Search', '/search/', '/Search/'];
    }

    Search.prototype.historyKey = function() {
        return this.name;
    };

    Search.prototype.execute = function(command) {
        var file, ref1, rngs;
        if (!command.length) {
            return;
        }
        switch (this.name) {
            case '/search/':
            case '/Search/':
                if (command === '^' || command === '$' || command === '.') {
                    return;
                }
                rngs = matchr.ranges(command, '  ');
                if (rngs.length === 2) {
                    return;
                }
        }
        command = Search.__super__.execute.call(this, command);
        file = (ref1 = window.editor.currentFile) != null ? ref1 : _.first(_.keys(post.get('indexer', 'files')));
        if (file == null) {
            return;
        }
        window.terminal.clear();
        this.startSearchInFiles({
            text: command,
            name: this.name,
            file: slash.path(file)
        });
        return {
            focus: 'terminal',
            show: 'terminal',
            text: command,
            select: true
        };
    };

    Search.prototype.startSearchInFiles = function(opt) {
        var dir, terminal;
        terminal = window.terminal;
        terminal.appendMeta({
            clss: 'searchHeader',
            diss: Syntax.dissForTextAndSyntax("▸ Search for '" + opt.text + "':", 'ko')
        });
        terminal.appendMeta({
            clss: 'spacer'
        });
        terminal.singleCursorAtPos([0, terminal.numLines() - 2]);
        dir = slash.pkg(slash.dir(opt.file));
        if (dir != null) {
            dir;
        } else {
            dir = slash.dir(opt.file);
        }
        this.walker = new walker({
            root: dir,
            maxDepth: 12,
            maxFiles: 5000,
            includeDirs: false,
            file: (function(_this) {
                return function(f, stat) {
                    return _this.searchInFile(opt, slash.path(f));
                };
            })(this)
        });
        this.walker.cfg.ignore.push('js');
        this.walker.cfg.ignore.push('lib');
        return this.walker.start();
    };

    Search.prototype.searchInFile = function(opt, file) {
        stream = fs.createReadStream(file, {
            encoding: 'utf8'
        });
        return stream.pipe(new FileSearcher(this, opt, file));
    };

    Search.prototype.onMetaClick = function(meta, event) {
        var command, file, href, split;
        href = meta[2].href;
        if (href.startsWith('>')) {
            split = href.split('>');
            if (window.commandline.commands[split[1]] != null) {
                command = window.commandline.commands[split[1]];
                window.commandline.startCommand(split[1]);
                window.commandline.setText(split[2]);
                command.execute(split[2]);
            }
        } else {
            file = href + ':' + window.terminal.posForEvent(event)[0];
            post.emit('openFiles', [file], {
                newTab: event.metaKey
            });
        }
        return 'unhandled';
    };

    return Search;

})(Command);

FileSearcher = (function(superClass) {
    extend(FileSearcher, superClass);

    function FileSearcher(command1, opt1, file1) {
        var extn;
        this.command = command1;
        this.opt = opt1;
        this.file = file1;
        this.end = bind(this.end, this);
        FileSearcher.__super__.constructor.call(this);
        this.line = 0;
        this.flags = '';
        this.patterns = (function() {
            switch (this.opt.name) {
                case 'search':
                    return [[new RegExp(_.escapeRegExp(this.opt.text), 'i'), 'found']];
                case 'Search':
                    return [[new RegExp(_.escapeRegExp(this.opt.text)), 'found']];
                case '/search/':
                    this.flags = 'i';
                    return this.opt.text;
                case '/Search/':
                    return this.opt.text;
                default:
                    kerror("commands/search FileSearcher -- unhandled '" + this.opt.name + "' command:", this.command.name, 'opt:', this.opt, 'file:', this.file);
                    return [[new RegExp(_.escapeRegExp(this.opt.text), 'i'), 'found']];
            }
        }).call(this);
        this.found = [];
        extn = slash.ext(this.file);
        if (indexOf.call(Syntax.syntaxNames, extn) >= 0) {
            this.syntaxName = extn;
        } else {
            this.syntaxName = null;
        }
    }

    FileSearcher.prototype.write = function(chunk, encoding, cb) {
        var i, l, len, lines, rngs;
        lines = chunk.split('\n');
        if (this.syntaxName == null) {
            this.syntaxName = Syntax.shebang(lines[0]);
        }
        for (i = 0, len = lines.length; i < len; i++) {
            l = lines[i];
            this.line += 1;
            rngs = matchr.ranges(this.patterns, l, this.flags);
            if (rngs.length) {
                this.found.push([this.line, l, rngs]);
            }
        }
        return true;
    };

    FileSearcher.prototype.end = function(chunk, encoding, cb) {
        var dss, f, fi, i, meta, ref1, regions, terminal;
        if (this.found.length) {
            terminal = window.terminal;
            meta = {
                diss: Syntax.dissForTextAndSyntax("" + (slash.tilde(this.file)), 'ko'),
                href: this.file,
                clss: 'gitInfoFile',
                click: this.command.onMetaClick,
                line: '◼'
            };
            terminal.appendMeta(meta);
            terminal.appendMeta({
                clss: 'spacer'
            });
            for (fi = i = 0, ref1 = this.found.length; 0 <= ref1 ? i < ref1 : i > ref1; fi = 0 <= ref1 ? ++i : --i) {
                f = this.found[fi];
                regions = klor.dissect([f[1]], this.syntaxName)[0];
                dss = matchr.merge(regions, matchr.dissect(f[2]));
                meta = {
                    diss: dss,
                    href: this.file + ":" + f[0],
                    clss: 'searchResult',
                    click: this.command.onMetaClick
                };
                if (fi && this.found[fi - 1][0] !== f[0] - 1) {
                    terminal.appendMeta({
                        clss: 'spacer'
                    });
                }
                terminal.appendMeta(meta);
                post.emit('search-result', meta);
            }
            terminal.appendMeta({
                clss: 'spacer'
            });
            return terminal.scroll.cursorToTop();
        }
    };

    return FileSearcher;

})(stream.Writable);

module.exports = Search;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VhcmNoLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uL2NvZmZlZS9jb21tYW5kcyIsInNvdXJjZXMiOlsic2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxvR0FBQTtJQUFBOzs7OztBQVFBLE1BQStDLE9BQUEsQ0FBUSxLQUFSLENBQS9DLEVBQUUsU0FBRixFQUFLLFdBQUwsRUFBUyxtQkFBVCxFQUFpQixlQUFqQixFQUF1QixtQkFBdkIsRUFBK0IsZUFBL0IsRUFBcUM7O0FBRXJDLE1BQUEsR0FBVSxPQUFBLENBQVEsaUJBQVI7O0FBQ1YsTUFBQSxHQUFVLE9BQUEsQ0FBUSxrQkFBUjs7QUFDVixPQUFBLEdBQVUsT0FBQSxDQUFRLHdCQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsUUFBUjs7QUFFSjs7O0lBRUMsZ0JBQUMsV0FBRDs7O1FBRUMsd0NBQU0sV0FBTjtRQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsQ0FBQyxRQUFELEVBQVUsUUFBVixFQUFtQixVQUFuQixFQUE4QixVQUE5QjtJQUpWOztxQkFNSCxVQUFBLEdBQVksU0FBQTtlQUFHLElBQUMsQ0FBQTtJQUFKOztxQkFRWixPQUFBLEdBQVMsU0FBQyxPQUFEO0FBRUwsWUFBQTtRQUFBLElBQVUsQ0FBSSxPQUFPLENBQUMsTUFBdEI7QUFBQSxtQkFBQTs7QUFFQSxnQkFBTyxJQUFDLENBQUEsSUFBUjtBQUFBLGlCQUNTLFVBRFQ7QUFBQSxpQkFDcUIsVUFEckI7Z0JBRVEsSUFBRyxPQUFBLEtBQVksR0FBWixJQUFBLE9BQUEsS0FBZ0IsR0FBaEIsSUFBQSxPQUFBLEtBQW9CLEdBQXZCO0FBQ0ksMkJBREo7O2dCQUVBLElBQUEsR0FBTyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsRUFBdUIsSUFBdkI7Z0JBQ1AsSUFBRyxJQUFJLENBQUMsTUFBTCxLQUFlLENBQWxCO0FBQ0ksMkJBREo7O0FBTFI7UUFRQSxPQUFBLEdBQVUsb0NBQU0s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Q0FBQSxDQUFBLENBRHBCO29CQUVBLElBQUEsRUFBTSxjQUZOO29CQUdBLEtBQUEsRUFBTyxJQUFDLENBQUEsT0FBTyxDQUFDLFdBSGhCOztnQkFLSixJQUFHLEVBQUEsSUFBTyxJQUFDLENBQUEsS0FBTSxDQUFBLEVBQUEsR0FBRyxDQUFILENBQU0sQ0FBQSxDQUFBLENBQWIsS0FBbUIsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWxDO29CQUNJLFFBQVEsQ0FBQyxVQUFULENBQW9CO3dCQUFBLElBQUEsRUFBTSxRQUFOO3FCQUFwQixFQURKOztnQkFHQSxRQUFRLENBQUMsVUFBVCxDQUFvQixJQUFwQjtnQkFDQSxJQUFJLENBQUMsSUFBTCxDQUFVLGVBQVYsRUFBMEIsSUFBMUI7QUFqQko7WUFtQkEsUUFBUSxDQUFDLFVBQVQsQ0FBb0I7Z0JBQUEsSUFBQSxFQUFNLFFBQU47YUFBcEI7bUJBQ0EsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFoQixDQUFBLEVBbENKOztJQUZDOzs7O0dBbENrQixNQUFNLENBQUM7O0FBd0VsQyxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgIDAwMDAwMDAwMFxuICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgXywgZnMsIGtlcnJvciwga2xvciwgbWF0Y2hyLCBwb3N0LCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG53YWxrZXIgID0gcmVxdWlyZSAnLi4vdG9vbHMvd2Fsa2VyJ1xuU3ludGF4ICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5Db21tYW5kID0gcmVxdWlyZSAnLi4vY29tbWFuZGxpbmUvY29tbWFuZCdcbnN0cmVhbSAgPSByZXF1aXJlICdzdHJlYW0nXG5cbmNsYXNzIFNlYXJjaCBleHRlbmRzIENvbW1hbmRcblxuICAgIEA6IChjb21tYW5kbGluZSkgLT5cbiAgICAgICAgXG4gICAgICAgIHN1cGVyIGNvbW1hbmRsaW5lXG4gICAgICAgIFxuICAgICAgICBAbmFtZXMgPSBbJ3NlYXJjaCcgJ1NlYXJjaCcgJy9zZWFyY2gvJyAnL1NlYXJjaC8nXVxuICAgICBcbiAgICBoaXN0b3J5S2V5OiAtPiBAbmFtZVxuICAgICAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgMDAwIDAwMCAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwIFxuICAgICMgMDAwICAgICAgICAwMDAgMDAwICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwXG4gICAgXG4gICAgZXhlY3V0ZTogKGNvbW1hbmQpIC0+XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgbm90IGNvbW1hbmQubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggQG5hbWVcbiAgICAgICAgICAgIHdoZW4gJy9zZWFyY2gvJywgJy9TZWFyY2gvJ1xuICAgICAgICAgICAgICAgIGlmIGNvbW1hbmQgaW4gWydeJyAnJCcgJy4nXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXG4gICAgICAgICAgICAgICAgcm5ncyA9IG1hdGNoci5yYW5nZXMgY29tbWFuZCwgJyAgJ1xuICAgICAgICAgICAgICAgIGlmIHJuZ3MubGVuZ3RoID09IDJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGNvbW1hbmQgPSBzdXBlciBjb21tYW5kXG4gICAgICAgIGZpbGUgPSB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlID8gXy5maXJzdCBfLmtleXMocG9zdC5nZXQoJ2luZGV4ZXInICdmaWxlcycpKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIG5vdCBmaWxlP1xuICAgICAgICBcbiAgICAgICAgd2luZG93LnRlcm1pbmFsLmNsZWFyKClcbiAgICAgICAgXG4gICAgICAgIEBzdGFydFNlYXJjaEluRmlsZXMgXG4gICAgICAgICAgICB0ZXh0OiBjb21tYW5kXG4gICAgICAgICAgICBuYW1lOiBAbmFtZVxuICAgICAgICAgICAgZmlsZTogc2xhc2gucGF0aCBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgZm9jdXM6ICAndGVybWluYWwnXG4gICAgICAgIHNob3c6ICAgJ3Rlcm1pbmFsJ1xuICAgICAgICB0ZXh0OiAgIGNvbW1hbmRcbiAgICAgICAgc2VsZWN0OiB0cnVlXG4gICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDBcbiAgICBcbiAgICBzdGFydFNlYXJjaEluRmlsZXM6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICB0ZXJtaW5hbCA9IHdpbmRvdy50ZXJtaW5hbFxuICAgICAgICAjIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NhbHQnLCB0ZXh0OiBvcHQudGV4dC5zbGljZSAwLCAxNFxuICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6J3NlYXJjaEhlYWRlcicgZGlzczpTeW50YXguZGlzc0ZvclRleHRBbmRTeW50YXggXCLilrggU2VhcmNoIGZvciAnI3tvcHQudGV4dH0nOlwiICdrbydcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOidzcGFjZXInXG4gICAgICAgIHRlcm1pbmFsLnNpbmdsZUN1cnNvckF0UG9zIFswLCB0ZXJtaW5hbC5udW1MaW5lcygpLTJdXG4gICAgICAgIGRpciA9IHNsYXNoLnBrZyBzbGFzaC5kaXIgb3B0LmZpbGVcbiAgICAgICAgZGlyID89IHNsYXNoLmRpciBvcHQuZmlsZVxuICAgICAgICBAd2Fsa2VyID0gbmV3IHdhbGtlclxuICAgICAgICAgICAgcm9vdDogICAgICAgIGRpclxuICAgICAgICAgICAgbWF4RGVwdGg6ICAgIDEyXG4gICAgICAgICAgICBtYXhGaWxlczogICAgNTAwMFxuICAgICAgICAgICAgaW5jbHVkZURpcnM6IGZhbHNlXG4gICAgICAgICAgICBmaWxlOiAgICAgICAgKGYsc3RhdCkgPT4gQHNlYXJjaEluRmlsZSBvcHQsIHNsYXNoLnBhdGggZlxuICAgICAgICBAd2Fsa2VyLmNmZy5pZ25vcmUucHVzaCAnanMnICAjIHRoZXNlIGRpcmVjdG9yaWVzIGFyZSBub3QgaW5jbHVkZWQgaW4gc2VhcmNoIHJlc3VsdHNcbiAgICAgICAgQHdhbGtlci5jZmcuaWdub3JlLnB1c2ggJ2xpYicgIyB0aGV5IHNob3VsZCBiZSBjb25maWd1cmFibGUsIG1heWJlIGluIHBhY2thZ2Uubm9vbiBvciAua29ucmFkLm5vb24/XG4gICAgICAgIEB3YWxrZXIuc3RhcnQoKVxuICAgICAgICBcbiAgICBzZWFyY2hJbkZpbGU6IChvcHQsIGZpbGUpID0+XG5cbiAgICAgICAgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbSBmaWxlLCBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgIHN0cmVhbS5waXBlIG5ldyBGaWxlU2VhcmNoZXIgQCwgb3B0LCBmaWxlXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBvbk1ldGFDbGljazogKG1ldGEsIGV2ZW50KSA9PlxuXG4gICAgICAgIGhyZWYgPSBtZXRhWzJdLmhyZWYgICBcbiAgICAgICAgXG4gICAgICAgIGlmIGhyZWYuc3RhcnRzV2l0aCAnPidcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc3BsaXQgPSBocmVmLnNwbGl0ICc+J1xuICAgICAgICAgICAgaWYgd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzW3NwbGl0WzFdXT9cbiAgICAgICAgICAgICAgICBjb21tYW5kID0gd2luZG93LmNvbW1hbmRsaW5lLmNvbW1hbmRzW3NwbGl0WzFdXVxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb21tYW5kbGluZS5zdGFydENvbW1hbmQgc3BsaXRbMV1cbiAgICAgICAgICAgICAgICB3aW5kb3cuY29tbWFuZGxpbmUuc2V0VGV4dCBzcGxpdFsyXVxuICAgICAgICAgICAgICAgIGNvbW1hbmQuZXhlY3V0ZSBzcGxpdFsyXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBmaWxlID0gaHJlZiArICc6JyArIHdpbmRvdy50ZXJtaW5hbC5wb3NGb3JFdmVudChldmVudClbMF1cbiAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGVzJyBbZmlsZV0sIG5ld1RhYjogZXZlbnQubWV0YUtleVxuXG4gICAgICAgICd1bmhhbmRsZWQnXG5cbiMgIDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwIFxuIyAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4jIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiMgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIyAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG5cbmNsYXNzIEZpbGVTZWFyY2hlciBleHRlbmRzIHN0cmVhbS5Xcml0YWJsZVxuICAgIFxuICAgIEA6IChAY29tbWFuZCwgQG9wdCwgQGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBzdXBlcigpXG4gICAgICAgIEBsaW5lID0gMFxuICAgICAgICBAZmxhZ3MgPSAnJ1xuICAgICAgICBAcGF0dGVybnMgPSBzd2l0Y2ggQG9wdC5uYW1lXG4gICAgICAgICAgICB3aGVuICdzZWFyY2gnICAgdGhlbiBbW25ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAoQG9wdC50ZXh0KSwgJ2knKSwgJ2ZvdW5kJ11dXG4gICAgICAgICAgICB3aGVuICdTZWFyY2gnICAgdGhlbiBbW25ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAoQG9wdC50ZXh0KSksICAgICAgJ2ZvdW5kJ11dXG4gICAgICAgICAgICB3aGVuICcvc2VhcmNoLycgdGhlbiBAZmxhZ3M9J2knOyBAb3B0LnRleHRcbiAgICAgICAgICAgIHdoZW4gJy9TZWFyY2gvJyB0aGVuIEBvcHQudGV4dFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGtlcnJvciBcImNvbW1hbmRzL3NlYXJjaCBGaWxlU2VhcmNoZXIgLS0gdW5oYW5kbGVkICcje0BvcHQubmFtZX0nIGNvbW1hbmQ6XCIsIEBjb21tYW5kLm5hbWUsICdvcHQ6JywgQG9wdCwgJ2ZpbGU6JywgQGZpbGVcbiAgICAgICAgICAgICAgICBbW25ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAoQG9wdC50ZXh0KSwgJ2knKSwgJ2ZvdW5kJ11dXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBmb3VuZCA9IFtdXG4gICAgICAgIGV4dG4gPSBzbGFzaC5leHQgQGZpbGVcbiAgICAgICAgaWYgZXh0biBpbiBTeW50YXguc3ludGF4TmFtZXNcbiAgICAgICAgICAgIEBzeW50YXhOYW1lID0gZXh0blxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc3ludGF4TmFtZSA9IG51bGxcbiAgICAgICAgICAgIFxuICAgIHdyaXRlOiAoY2h1bmssIGVuY29kaW5nLCBjYikgLT5cbiAgICAgICAgXG4gICAgICAgIGxpbmVzID0gY2h1bmsuc3BsaXQgJ1xcbidcbiAgICAgICAgQHN5bnRheE5hbWUgPSBTeW50YXguc2hlYmFuZyBsaW5lc1swXSBpZiBub3QgQHN5bnRheE5hbWU/XG4gICAgICAgIGZvciBsIGluIGxpbmVzXG4gICAgICAgICAgICBAbGluZSArPSAxICAgICAgICAgICAgXG4gICAgICAgICAgICBybmdzID0gbWF0Y2hyLnJhbmdlcyBAcGF0dGVybnMsIGwsIEBmbGFnc1xuICAgICAgICAgICAgaWYgcm5ncy5sZW5ndGhcbiAgICAgICAgICAgICAgICBAZm91bmQucHVzaCBbQGxpbmUsIGwsIHJuZ3NdXG4gICAgICAgIHRydWVcbiAgICAgICAgXG4gICAgZW5kOiAoY2h1bmssIGVuY29kaW5nLCBjYikgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBmb3VuZC5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbWV0YSA9IFxuICAgICAgICAgICAgICAgIGRpc3M6ICBTeW50YXguZGlzc0ZvclRleHRBbmRTeW50YXggXCIje3NsYXNoLnRpbGRlIEBmaWxlfVwiICdrbydcbiAgICAgICAgICAgICAgICBocmVmOiAgQGZpbGVcbiAgICAgICAgICAgICAgICBjbHNzOiAgJ2dpdEluZm9GaWxlJ1xuICAgICAgICAgICAgICAgIGNsaWNrOiBAY29tbWFuZC5vbk1ldGFDbGlja1xuICAgICAgICAgICAgICAgIGxpbmU6ICAn4pe8J1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBmaSBpbiBbMC4uLkBmb3VuZC5sZW5ndGhdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZiA9IEBmb3VuZFtmaV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICByZWdpb25zID0ga2xvci5kaXNzZWN0KFtmWzFdXSwgQHN5bnRheE5hbWUpWzBdXG4gICAgICAgICAgICAgICAgZHNzID0gbWF0Y2hyLm1lcmdlIHJlZ2lvbnMsIG1hdGNoci5kaXNzZWN0IGZbMl1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtZXRhID1cbiAgICAgICAgICAgICAgICAgICAgZGlzczogZHNzXG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IFwiI3tAZmlsZX06I3tmWzBdfVwiXG4gICAgICAgICAgICAgICAgICAgIGNsc3M6ICdzZWFyY2hSZXN1bHQnXG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiBAY29tbWFuZC5vbk1ldGFDbGlja1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBmaSBhbmQgQGZvdW5kW2ZpLTFdWzBdICE9IGZbMF0tMVxuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbC5hcHBlbmRNZXRhIGNsc3M6ICdzcGFjZXInXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgbWV0YVxuICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnc2VhcmNoLXJlc3VsdCcgbWV0YVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgICAgICAgICAgdGVybWluYWwuc2Nyb2xsLmN1cnNvclRvVG9wKClcbiAgICAgICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gU2VhcmNoXG4iXX0=
//# sourceURL=../../coffee/commands/search.coffee