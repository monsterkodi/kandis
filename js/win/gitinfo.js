// koffee 1.14.0

/*
 0000000   000  000000000  000  000   000  00000000   0000000 
000        000     000     000  0000  000  000       000   000
000  0000  000     000     000  000 0 000  000000    000   000
000   000  000     000     000  000  0000  000       000   000
 0000000   000     000     000  000   000  000        0000000
 */
var GitInfo, Syntax, empty, fs, hub, lineDiff, post, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf;

ref = require('kxk'), empty = ref.empty, fs = ref.fs, post = ref.post, slash = ref.slash;

lineDiff = require('../tools/linediff');

Syntax = require('../editor/syntax');

hub = require('../git/hub');

GitInfo = (function() {
    function GitInfo() {
        this.onMetaClick = bind(this.onMetaClick, this);
    }

    GitInfo.prototype.onMetaClick = function(meta, event) {
        var href;
        if (href = meta[2].href) {
            href += ':' + window.terminal.posForEvent(event)[0];
            post.emit('openFiles', [href], {
                newTab: event.metaKey
            });
        }
        return 'unhandled';
    };

    GitInfo.prototype.logText = function(text) {
        var terminal;
        terminal = window.terminal;
        return terminal.appendMeta({
            clss: 'searchHeader',
            diss: Syntax.dissForTextAndSyntax(text, 'ko')
        });
    };

    GitInfo.prototype.logChanges = function(changes) {
        var diff, diffs, dss, extn, index, j, k, len, len1, lineMeta, meta, ref1, syntaxName, sytx, terminal, text;
        terminal = window.terminal;
        extn = slash.ext(changes.file);
        if (indexOf.call(Syntax.syntaxNames, extn) >= 0) {
            syntaxName = extn;
        } else {
            syntaxName = 'txt';
        }
        sytx = new Syntax(syntaxName, function(i) {
            return changes.lines[i];
        });
        index = 0;
        ref1 = changes.lines;
        for (j = 0, len = ref1.length; j < len; j++) {
            text = ref1[j];
            dss = sytx.getDiss(index);
            if (changes.change === 'deleted') {
                dss.map(function(ds) {
                    return ds.clss += ' ' + 'git-deleted';
                });
            } else if (changes.change === 'changed') {
                diffs = lineDiff(changes.info.mod[index].old, changes.info.mod[index]["new"]);
                for (k = 0, len1 = diffs.length; k < len1; k++) {
                    diff = diffs[k];
                    if (diff.change === 'delete') {
                        continue;
                    }
                    lineMeta = {
                        line: terminal.numLines(),
                        start: diff["new"],
                        end: diff["new"] + diff.length,
                        clss: 'gitInfoChange'
                    };
                    terminal.meta.add(lineMeta);
                }
            }
            meta = {
                diss: dss,
                href: changes.file + ":" + (changes.line + index),
                clss: 'searchResult',
                click: this.onMetaClick
            };
            terminal.appendMeta(meta);
            post.emit('search-result', meta);
            index += 1;
        }
        return index;
    };

    GitInfo.prototype.logFile = function(change, file) {
        var meta, symbol, terminal, text;
        text = (function() {
            switch (change) {
                case 'changed':
                    return '  ● ';
                case 'added':
                    return '  ◼ ';
                case 'deleted':
                    return '  ✘ ';
            }
        })();
        symbol = (function() {
            switch (change) {
                case 'changed':
                    return '●';
                case 'added':
                    return '◼';
                case 'deleted':
                    return '✘';
            }
        })();
        terminal = window.terminal;
        meta = {
            diss: Syntax.dissForTextAndSyntax("" + (slash.tilde(file)), 'ko'),
            href: file,
            clss: 'gitInfoFile',
            click: this.onMetaClick,
            line: symbol,
            lineClss: 'gitInfoLine ' + change
        };
        terminal.appendMeta(meta);
        return terminal.appendMeta({
            clss: 'spacer'
        });
    };

    GitInfo.prototype.start = function() {
        var dirOrFile, ref1, terminal;
        dirOrFile = (ref1 = window.cwd.cwd) != null ? ref1 : window.editor.currentFile;
        window.split.raise('terminal');
        terminal = window.terminal;
        terminal.clear();
        return hub.info(dirOrFile, (function(_this) {
            return function(info) {
                var change, changeInfo, data, file, j, k, len, len1, len2, len3, line, lines, m, n, ref2, ref3, ref4, ref5;
                if (empty(info)) {
                    return;
                }
                terminal = window.terminal;
                terminal.appendMeta({
                    clss: 'salt',
                    text: slash.tilde(info.gitDir)
                });
                terminal.appendMeta({
                    clss: 'spacer'
                });
                ref2 = info.deleted;
                for (j = 0, len = ref2.length; j < len; j++) {
                    file = ref2[j];
                    _this.logFile('deleted', file);
                }
                ref3 = info.added;
                for (k = 0, len1 = ref3.length; k < len1; k++) {
                    file = ref3[k];
                    _this.logFile('added', file);
                    if (slash.isText(file)) {
                        data = fs.readFileSync(file, {
                            encoding: 'utf8'
                        });
                        lines = data.split(/\r?\n/);
                        line = 1;
                        line += _this.logChanges({
                            lines: lines,
                            file: file,
                            line: line,
                            change: 'new'
                        });
                    }
                    terminal.appendMeta({
                        clss: 'spacer'
                    });
                }
                ref4 = info.changed;
                for (m = 0, len2 = ref4.length; m < len2; m++) {
                    changeInfo = ref4[m];
                    _this.logFile('changed', changeInfo.file);
                    ref5 = changeInfo.changes;
                    for (n = 0, len3 = ref5.length; n < len3; n++) {
                        change = ref5[n];
                        line = change.line;
                        if (!empty(change.mod)) {
                            lines = change.mod.map(function(l) {
                                return l["new"];
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'changed'
                            });
                        }
                        if (!empty(change.add)) {
                            lines = change.add.map(function(l) {
                                return l["new"];
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'added'
                            });
                        }
                        if (!empty(change.del)) {
                            lines = change.del.map(function(l) {
                                return l.old;
                            });
                            line += _this.logChanges({
                                lines: lines,
                                file: changeInfo.file,
                                line: line,
                                info: change,
                                change: 'deleted'
                            });
                        }
                        terminal.appendMeta({
                            clss: 'spacer'
                        });
                    }
                }
                return terminal.scroll.cursorToTop(7);
            };
        })(this));
    };

    return GitInfo;

})();

module.exports = new GitInfo;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aW5mby5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJnaXRpbmZvLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwyREFBQTtJQUFBOzs7QUFRQSxNQUE2QixPQUFBLENBQVEsS0FBUixDQUE3QixFQUFFLGlCQUFGLEVBQVMsV0FBVCxFQUFhLGVBQWIsRUFBbUI7O0FBRW5CLFFBQUEsR0FBYSxPQUFBLENBQVEsbUJBQVI7O0FBQ2IsTUFBQSxHQUFhLE9BQUEsQ0FBUSxrQkFBUjs7QUFDYixHQUFBLEdBQWEsT0FBQSxDQUFRLFlBQVI7O0FBRVA7SUFFQyxpQkFBQTs7SUFBQTs7c0JBUUgsV0FBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLEtBQVA7QUFFVCxZQUFBO1FBQUEsSUFBRyxJQUFBLEdBQU8sSUFBSyxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQWxCO1lBQ0ksSUFBQSxJQUFRLEdBQUEsR0FBTSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWhCLENBQTRCLEtBQTVCLENBQW1DLENBQUEsQ0FBQTtZQUNqRCxJQUFJLENBQUMsSUFBTCxDQUFVLFdBQVYsRUFBdUIsQ0FBQyxJQUFELENBQXZCLEVBQStCO2dCQUFBLE1BQUEsRUFBUSxLQUFLLENBQUMsT0FBZDthQUEvQixFQUZKOztlQUdBO0lBTFM7O3NCQU9iLE9BQUEsR0FBUyxTQUFDLElBQUQ7QUFFTCxZQUFBO1FBQUEsUUFBQSxHQUFXLE1BQU0sQ0FBQztlQUNsQixRQUFRLENBQUMsVUFBVCxDQUFvQjtZQUFBLElBQUEsRUFBSyxjQUFMO1lBQXFCLElBQUEsRUFBSyxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsSUFBNUIsRUFBa0MsSUFBbEMsQ0FBMUI7U0FBcEI7SUFISzs7c0JBV1QsVUFBQSxHQUFZLFNBQUMsT0FBRDtBQUVSLFlBQUE7UUFBQSxRQUFBLEdBQVcsTUFBTSxDQUFDO1FBRWxCLElBQUEsR0FBTyxLQUFLLENBQUMs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QUFDLENBQUQ7dUNBQU8sQ0FBQyxDQUFDOzRCQUFULENBQWY7NEJBQ1IsSUFBQSxJQUFRLEtBQUMsQ0FBQSxVQUFELENBQVk7Z0NBQUEsS0FBQSxFQUFNLEtBQU47Z0NBQWEsSUFBQSxFQUFLLFVBQVUsQ0FBQyxJQUE3QjtnQ0FBbUMsSUFBQSxFQUFLLElBQXhDO2dDQUE4QyxJQUFBLEVBQUssTUFBbkQ7Z0NBQTJELE1BQUEsRUFBTyxTQUFsRTs2QkFBWixFQUZaOzt3QkFJQSxRQUFRLENBQUMsVUFBVCxDQUFvQjs0QkFBQSxJQUFBLEVBQU0sUUFBTjt5QkFBcEI7QUFmSjtBQUpKO3VCQXFCQSxRQUFRLENBQUMsTUFBTSxDQUFDLFdBQWhCLENBQTRCLENBQTVCO1lBOUNnQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBcEI7SUFSRzs7Ozs7O0FBd0RYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgXG4wMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDAgMCAwMDAgIDAwMDAwMCAgICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gMDAwMDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwIFxuIyMjXG5cbnsgZW1wdHksIGZzLCBwb3N0LCBzbGFzaCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5saW5lRGlmZiAgID0gcmVxdWlyZSAnLi4vdG9vbHMvbGluZWRpZmYnXG5TeW50YXggICAgID0gcmVxdWlyZSAnLi4vZWRpdG9yL3N5bnRheCdcbmh1YiAgICAgICAgPSByZXF1aXJlICcuLi9naXQvaHViJ1xuXG5jbGFzcyBHaXRJbmZvXG4gICAgXG4gICAgQDogLT5cbiAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwICAwMDAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG9uTWV0YUNsaWNrOiAobWV0YSwgZXZlbnQpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBocmVmID0gbWV0YVsyXS5ocmVmXG4gICAgICAgICAgICBocmVmICs9ICc6JyArIHdpbmRvdy50ZXJtaW5hbC5wb3NGb3JFdmVudChldmVudClbMF1cbiAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGVzJywgW2hyZWZdLCBuZXdUYWI6IGV2ZW50Lm1ldGFLZXlcbiAgICAgICAgJ3VuaGFuZGxlZCcgIyBvdGhlcndpc2UgY3Vyc29yIGRvZXNuJ3QgZ2V0IHNldFxuICAgICAgICBcbiAgICBsb2dUZXh0OiAodGV4dCkgLT5cbiAgICAgICAgXG4gICAgICAgIHRlcm1pbmFsID0gd2luZG93LnRlcm1pbmFsXG4gICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczonc2VhcmNoSGVhZGVyJywgZGlzczpTeW50YXguZGlzc0ZvclRleHRBbmRTeW50YXggdGV4dCwgJ2tvJ1xuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBsb2dDaGFuZ2VzOiAoY2hhbmdlcykgLT5cbiAgICAgICAgXG4gICAgICAgIHRlcm1pbmFsID0gd2luZG93LnRlcm1pbmFsXG4gICAgICAgIFxuICAgICAgICBleHRuID0gc2xhc2guZXh0IGNoYW5nZXMuZmlsZVxuICAgICAgICBpZiBleHRuIGluIFN5bnRheC5zeW50YXhOYW1lc1xuICAgICAgICAgICAgc3ludGF4TmFtZSA9IGV4dG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc3ludGF4TmFtZSA9ICd0eHQnXG4gICAgICAgIFxuICAgICAgICBzeXR4ID0gbmV3IFN5bnRheCBzeW50YXhOYW1lLCAoaSkgLT4gY2hhbmdlcy5saW5lc1tpXVxuICAgICAgICBcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIGZvciB0ZXh0IGluIGNoYW5nZXMubGluZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZHNzID0gc3l0eC5nZXREaXNzIGluZGV4XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGNoYW5nZXMuY2hhbmdlID09ICdkZWxldGVkJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGRzcy5tYXAgKGRzKSAtPiBkcy5jbHNzICs9ICcgJyArICdnaXQtZGVsZXRlZCdcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGVsc2UgaWYgY2hhbmdlcy5jaGFuZ2UgPT0gJ2NoYW5nZWQnXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgZGlmZnMgPSBsaW5lRGlmZiBjaGFuZ2VzLmluZm8ubW9kW2luZGV4XS5vbGQsIGNoYW5nZXMuaW5mby5tb2RbaW5kZXhdLm5ld1xuICAgICAgICAgICAgICAgIGZvciBkaWZmIGluIGRpZmZzIFxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBpZiBkaWZmLmNoYW5nZSA9PSAnZGVsZXRlJ1xuICAgICAgICAgICAgICAgICAgICBsaW5lTWV0YSA9XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lOiAgICAgICB0ZXJtaW5hbC5udW1MaW5lcygpXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogICAgICBkaWZmLm5ld1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiAgICAgICAgZGlmZi5uZXcrZGlmZi5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsc3M6ICAgICAgICdnaXRJbmZvQ2hhbmdlJ1xuICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hbC5tZXRhLmFkZCBsaW5lTWV0YVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgbWV0YSA9XG4gICAgICAgICAgICAgICAgZGlzczogZHNzXG4gICAgICAgICAgICAgICAgaHJlZjogXCIje2NoYW5nZXMuZmlsZX06I3tjaGFuZ2VzLmxpbmUraW5kZXh9XCJcbiAgICAgICAgICAgICAgICBjbHNzOiAnc2VhcmNoUmVzdWx0J1xuICAgICAgICAgICAgICAgIGNsaWNrOiBAb25NZXRhQ2xpY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgbWV0YVxuICAgICAgICAgICAgcG9zdC5lbWl0ICdzZWFyY2gtcmVzdWx0JywgbWV0YVxuICAgICAgICAgICAgaW5kZXggKz0gMVxuICAgICAgICBpbmRleFxuICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBsb2dGaWxlOiAoY2hhbmdlLCBmaWxlKSAtPiBcbiAgICAgICAgXG4gICAgICAgIHRleHQgPSBzd2l0Y2ggY2hhbmdlXG4gICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyB0aGVuICcgIOKXjyAnXG4gICAgICAgICAgICB3aGVuICdhZGRlZCcgICB0aGVuICcgIOKXvCAnXG4gICAgICAgICAgICB3aGVuICdkZWxldGVkJyB0aGVuICcgIOKcmCAnXG4gICAgICAgICAgICBcbiAgICAgICAgc3ltYm9sID0gc3dpdGNoIGNoYW5nZVxuXG4gICAgICAgICAgICB3aGVuICdjaGFuZ2VkJyB0aGVuICfil48nXG4gICAgICAgICAgICB3aGVuICdhZGRlZCcgICB0aGVuICfil7wnXG4gICAgICAgICAgICB3aGVuICdkZWxldGVkJyB0aGVuICfinJgnXG4gICAgICAgICAgICBcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgbWV0YSA9IFxuICAgICAgICAgICAgZGlzczogICAgICAgU3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IFwiI3tzbGFzaC50aWxkZSBmaWxlfVwiLCAna28nXG4gICAgICAgICAgICBocmVmOiAgICAgICBmaWxlXG4gICAgICAgICAgICBjbHNzOiAgICAgICAnZ2l0SW5mb0ZpbGUnXG4gICAgICAgICAgICBjbGljazogICAgICBAb25NZXRhQ2xpY2tcbiAgICAgICAgICAgIGxpbmU6ICAgICAgIHN5bWJvbFxuICAgICAgICAgICAgbGluZUNsc3M6ICAgJ2dpdEluZm9MaW5lICcrY2hhbmdlXG4gICAgICAgICAgICBcbiAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBtZXRhXG4gICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgc3RhcnQ6IC0+IFxuICAgICAgICBcbiAgICAgICAgZGlyT3JGaWxlID0gd2luZG93LmN3ZC5jd2QgPyB3aW5kb3cuZWRpdG9yLmN1cnJlbnRGaWxlXG5cbiAgICAgICAgd2luZG93LnNwbGl0LnJhaXNlICd0ZXJtaW5hbCdcbiAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgdGVybWluYWwuY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgaHViLmluZm8gZGlyT3JGaWxlLCAoaW5mbykgPT5cblxuICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGluZm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGVybWluYWwgPSB3aW5kb3cudGVybWluYWxcbiAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NhbHQnLCB0ZXh0OiBzbGFzaC50aWxkZSBpbmZvLmdpdERpclxuICAgICAgICAgICAgdGVybWluYWwuYXBwZW5kTWV0YSBjbHNzOiAnc3BhY2VyJ1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIGZpbGUgaW4gaW5mby5kZWxldGVkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGxvZ0ZpbGUgJ2RlbGV0ZWQnLCBmaWxlICMgZG9udCBkZWxldGUgdGhpcyBmb3Igbm93IDopXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgZmlsZSBpbiBpbmZvLmFkZGVkXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQGxvZ0ZpbGUgJ2FkZGVkJywgZmlsZSAgIyBkb250IGRlbGV0ZSB0aGlzIGZvciBub3cgOilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBzbGFzaC5pc1RleHQgZmlsZVxuICAgICAgICAgICAgICAgICAgICBkYXRhICA9IGZzLnJlYWRGaWxlU3luYyBmaWxlLCBlbmNvZGluZzogJ3V0ZjgnXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzID0gZGF0YS5zcGxpdCAvXFxyP1xcbi9cbiAgICAgICAgICAgICAgICAgICAgbGluZSAgPSAxXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmZpbGUsIGxpbmU6bGluZSwgY2hhbmdlOiduZXcnXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciBjaGFuZ2VJbmZvIGluIGluZm8uY2hhbmdlZCAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAbG9nRmlsZSAnY2hhbmdlZCcsIGNoYW5nZUluZm8uZmlsZSAjIGRvbnQgZGVsZXRlIHRoaXMgZm9yIG5vdyA6KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciBjaGFuZ2UgaW4gY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICAgICAgICAgIGxpbmUgPSBjaGFuZ2UubGluZVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGVtcHR5IGNoYW5nZS5tb2RcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzID0gY2hhbmdlLm1vZC5tYXAgKGwpIC0+IGwubmV3XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmNoYW5nZUluZm8uZmlsZSwgbGluZTpsaW5lLCBpbmZvOmNoYW5nZSwgY2hhbmdlOidjaGFuZ2VkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBlbXB0eSBjaGFuZ2UuYWRkXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lcyA9IGNoYW5nZS5hZGQubWFwIChsKSAtPiBsLm5ld1xuICAgICAgICAgICAgICAgICAgICAgICAgbGluZSArPSBAbG9nQ2hhbmdlcyBsaW5lczpsaW5lcywgZmlsZTpjaGFuZ2VJbmZvLmZpbGUsIGxpbmU6bGluZSwgaW5mbzpjaGFuZ2UsIGNoYW5nZTonYWRkZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGVtcHR5IGNoYW5nZS5kZWxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzID0gY2hhbmdlLmRlbC5tYXAgKGwpIC0+IGwub2xkXG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5lICs9IEBsb2dDaGFuZ2VzIGxpbmVzOmxpbmVzLCBmaWxlOmNoYW5nZUluZm8uZmlsZSwgbGluZTpsaW5lLCBpbmZvOmNoYW5nZSwgY2hhbmdlOidkZWxldGVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHRlcm1pbmFsLmFwcGVuZE1ldGEgY2xzczogJ3NwYWNlcidcblxuICAgICAgICAgICAgdGVybWluYWwuc2Nyb2xsLmN1cnNvclRvVG9wIDdcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBHaXRJbmZvXG4iXX0=
//# sourceURL=../../coffee/win/gitinfo.coffee