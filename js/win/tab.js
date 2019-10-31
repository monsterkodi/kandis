// koffee 1.4.0

/*
000000000   0000000   0000000
   000     000   000  000   000
   000     000000000  0000000
   000     000   000  000   000
   000     000   000  0000000
 */
var File, Tab, Watcher, _, elem, kerror, klog, post, ref, render, slash, syntax, tooltip;

ref = require('kxk'), post = ref.post, tooltip = ref.tooltip, slash = ref.slash, elem = ref.elem, klog = ref.klog, kerror = ref.kerror, _ = ref._;

File = require('../tools/file');

Watcher = require('../tools/watcher');

render = require('../editor/render');

syntax = require('../editor/syntax');

Tab = (function() {
    function Tab(tabs, file) {
        this.tabs = tabs;
        this.file = file;
        this.dirty = false;
        this.div = elem({
            "class": 'tab',
            text: ''
        });
        this.tabs.div.appendChild(this.div);
        if (!this.file.startsWith('untitled')) {
            this.pkg = slash.pkg(this.file);
            if (this.pkg != null) {
                this.pkg = slash.basename(this.pkg);
            }
        }
        this.update();
        this.watcher = new Watcher(this.file);
    }

    Tab.prototype.foreignChanges = function(lineChanges) {
        if (this.foreign != null) {
            this.foreign;
        } else {
            this.foreign = [];
        }
        this.foreign.push(lineChanges);
        return this.update();
    };

    Tab.prototype.reload = function() {
        delete this.state;
        this.dirty = false;
        return this.update();
    };

    Tab.prototype.saveChanges = function() {
        var change, changes, i, j, len, len1, ref1, ref2;
        if (this.state) {
            if ((ref1 = this.foreign) != null ? ref1.length : void 0) {
                ref2 = this.foreign;
                for (i = 0, len = ref2.length; i < len; i++) {
                    changes = ref2[i];
                    for (j = 0, len1 = changes.length; j < len1; j++) {
                        change = changes[j];
                        switch (change.change) {
                            case 'changed':
                                this.state.state = this.state.state.changeLine(change.doIndex, change.after);
                                break;
                            case 'inserted':
                                this.state.state = this.state.state.insertLine(change.doIndex, change.after);
                                break;
                            case 'deleted':
                                this.state.state = this.state.state.deleteLine(change.doIndex);
                        }
                    }
                }
            }
            if (this.state.state) {
                return File.save(this.state.file, this.state.state.text(), (function(_this) {
                    return function(err) {
                        if (err) {
                            return kerror("tab.saveChanges failed " + err);
                        }
                        return _this.revert();
                    };
                })(this));
            } else {
                return kerror('tab.saveChanges -- nothing to save?');
            }
        } else {
            return post.emit('saveChanges');
        }
    };

    Tab.prototype.setFile = function(newFile) {
        if (!slash.samePath(this.file, newFile)) {
            klog('setFile', slash.path(newFile));
            this.file = slash.path(newFile);
            return this.update();
        }
    };

    Tab.prototype.storeState = function() {
        if (window.editor.currentFile) {
            return this.state = window.editor["do"].tabState();
        }
    };

    Tab.prototype.restoreState = function() {
        var ref1;
        if (((ref1 = this.state) != null ? ref1.file : void 0) == null) {
            return kerror('no file in state?', this.state);
        }
        window.editor["do"].setTabState(this.state);
        return delete this.state;
    };

    Tab.prototype.update = function() {
        var diss, html, name, sep;
        this.div.innerHTML = '';
        this.div.classList.toggle('dirty', this.dirty);
        sep = '●';
        if (window.editor.newlineCharacters === '\r\n') {
            sep = '■';
        }
        this.div.appendChild(elem('span', {
            "class": 'dot',
            text: sep
        }));
        sep = "<span class='dot'>►</span>";
        this.pkgDiv = elem('span', {
            "class": 'pkg',
            html: this.pkg && (this.pkg + sep) || ''
        });
        this.div.appendChild(this.pkgDiv);
        diss = syntax.dissForTextAndSyntax(slash.basename(this.file), 'ko');
        name = elem('span', {
            "class": 'name',
            html: render.line(diss, {
                charWidth: 0
            })
        });
        this.div.appendChild(name);
        this.div.appendChild(elem('span', {
            "class": 'tabdrag'
        }));
        if (this.file != null) {
            diss = syntax.dissForTextAndSyntax(slash.tilde(this.file), 'ko');
            html = render.line(diss, {
                charWidth: 0
            });
            this.tooltip = new tooltip({
                elem: name,
                html: html,
                x: 0
            });
        }
        if (this.dirty) {
            this.div.appendChild(elem('span', {
                "class": 'dot',
                text: '●'
            }));
        }
        return this;
    };

    Tab.prototype.index = function() {
        return this.tabs.tabs.indexOf(this);
    };

    Tab.prototype.prev = function() {
        if (this.index() > 0) {
            return this.tabs.tab(this.index() - 1);
        }
    };

    Tab.prototype.next = function() {
        if (this.index() < this.tabs.numTabs() - 1) {
            return this.tabs.tab(this.index() + 1);
        }
    };

    Tab.prototype.nextOrPrev = function() {
        var ref1;
        return (ref1 = this.next()) != null ? ref1 : this.prev();
    };

    Tab.prototype.close = function() {
        var ref1;
        this.watcher.stop();
        if (this.dirty) {
            this.saveChanges();
        }
        this.div.remove();
        if ((ref1 = this.tooltip) != null) {
            ref1.del();
        }
        post.emit('tabClosed', this.file);
        return this;
    };

    Tab.prototype.hidePkg = function() {
        var ref1;
        return (ref1 = this.pkgDiv) != null ? ref1.style.display = 'none' : void 0;
    };

    Tab.prototype.showPkg = function() {
        var ref1;
        return (ref1 = this.pkgDiv) != null ? ref1.style.display = 'initial' : void 0;
    };

    Tab.prototype.setDirty = function(dirty) {
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            this.update();
        }
        return this;
    };

    Tab.prototype.revert = function() {
        delete this.foreign;
        delete this.state;
        this.dirty = false;
        this.update();
        this.tabs.update();
        return this;
    };

    Tab.prototype.activate = function() {
        post.emit('jumpToFile', {
            file: this.file
        });
        return this;
    };

    Tab.prototype.finishActivation = function() {
        var changes, i, len, ref1, ref2;
        this.setActive();
        if (this.state != null) {
            this.restoreState();
        }
        if ((ref1 = this.foreign) != null ? ref1.length : void 0) {
            ref2 = this.foreign;
            for (i = 0, len = ref2.length; i < len; i++) {
                changes = ref2[i];
                window.editor["do"].foreignChanges(changes);
            }
            delete this.foreign;
        }
        this.tabs.update();
        return this;
    };

    Tab.prototype.isActive = function() {
        return this.div.classList.contains('active');
    };

    Tab.prototype.setActive = function() {
        if (!this.isActive()) {
            this.div.classList.add('active');
        }
        return this;
    };

    Tab.prototype.clearActive = function() {
        this.div.classList.remove('active');
        return this;
    };

    return Tab;

})();

module.exports = Tab;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFiLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQTs7QUFRQSxNQUFrRCxPQUFBLENBQVEsS0FBUixDQUFsRCxFQUFFLGVBQUYsRUFBUSxxQkFBUixFQUFpQixpQkFBakIsRUFBd0IsZUFBeEIsRUFBOEIsZUFBOUIsRUFBb0MsbUJBQXBDLEVBQTRDOztBQUU1QyxJQUFBLEdBQVUsT0FBQSxDQUFRLGVBQVI7O0FBQ1YsT0FBQSxHQUFVLE9BQUEsQ0FBUSxrQkFBUjs7QUFDVixNQUFBLEdBQVUsT0FBQSxDQUFRLGtCQUFSOztBQUNWLE1BQUEsR0FBVSxPQUFBLENBQVEsa0JBQVI7O0FBRUo7SUFFQyxhQUFDLElBQUQsRUFBUSxJQUFSO1FBQUMsSUFBQyxDQUFBLE9BQUQ7UUFBTyxJQUFDLENBQUEsT0FBRDtRQUVQLElBQUMsQ0FBQSxLQUFELEdBQVM7UUFDVCxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUEsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sS0FBUDtZQUFhLElBQUEsRUFBTSxFQUFuQjtTQUFMO1FBQ1AsSUFBQyxDQUFBLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVixDQUFzQixJQUFDLENBQUEsR0FBdkI7UUFFQSxJQUFHLENBQUksSUFBQyxDQUFBLElBQUksQ0FBQyxVQUFOLENBQWlCLFVBQWpCLENBQVA7WUFDSSxJQUFDLENBQUEsR0FBRCxHQUFPLEtBQUssQ0FBQyxHQUFOLENBQVUsSUFBQyxDQUFBLElBQVg7WUFDUCxJQUE4QixnQkFBOUI7Z0JBQUEsSUFBQyxDQUFBLEdBQUQsR0FBTyxLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxHQUFoQixFQUFQO2FBRko7O1FBSUEsSUFBQyxDQUFBLE1BQUQsQ0FBQTtRQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFKLENBQVksSUFBQyxDQUFBLElBQWI7SUFaWjs7a0JBY0gsY0FBQSxH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a0JBQUg7WUFDSSxJQUFDLENBQUEsWUFBRCxDQUFBLEVBREo7O1FBR0Esd0NBQVcsQ0FBRSxlQUFiO0FBQ0k7QUFBQSxpQkFBQSxzQ0FBQTs7Z0JBQ0ksTUFBTSxDQUFDLE1BQU0sRUFBQyxFQUFELEVBQUcsQ0FBQyxjQUFqQixDQUFnQyxPQUFoQztBQURKO1lBRUEsT0FBTyxJQUFDLENBQUEsUUFIWjs7UUFLQSxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTtlQUNBO0lBYmM7O2tCQXFCbEIsUUFBQSxHQUFVLFNBQUE7ZUFBRyxJQUFDLENBQUEsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFmLENBQXdCLFFBQXhCO0lBQUg7O2tCQUVWLFNBQUEsR0FBVyxTQUFBO1FBRVAsSUFBRyxDQUFJLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBUDtZQUNJLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsUUFBbkIsRUFESjs7ZUFFQTtJQUpPOztrQkFNWCxXQUFBLEdBQWEsU0FBQTtRQUVULElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQWYsQ0FBc0IsUUFBdEI7ZUFDQTtJQUhTOzs7Ozs7QUFLakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAwMDAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDBcbiMjI1xuXG57IHBvc3QsIHRvb2x0aXAsIHNsYXNoLCBlbGVtLCBrbG9nLCBrZXJyb3IsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuRmlsZSAgICA9IHJlcXVpcmUgJy4uL3Rvb2xzL2ZpbGUnXG5XYXRjaGVyID0gcmVxdWlyZSAnLi4vdG9vbHMvd2F0Y2hlcidcbnJlbmRlciAgPSByZXF1aXJlICcuLi9lZGl0b3IvcmVuZGVyJ1xuc3ludGF4ICA9IHJlcXVpcmUgJy4uL2VkaXRvci9zeW50YXgnXG5cbmNsYXNzIFRhYlxuXG4gICAgQDogKEB0YWJzLCBAZmlsZSkgLT5cblxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczogJ3RhYicgdGV4dDogJydcbiAgICAgICAgQHRhYnMuZGl2LmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICBpZiBub3QgQGZpbGUuc3RhcnRzV2l0aCAndW50aXRsZWQnXG4gICAgICAgICAgICBAcGtnID0gc2xhc2gucGtnIEBmaWxlXG4gICAgICAgICAgICBAcGtnID0gc2xhc2guYmFzZW5hbWUgQHBrZyBpZiBAcGtnP1xuXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgICAgIEB3YXRjaGVyID0gbmV3IFdhdGNoZXIgQGZpbGVcblxuICAgIGZvcmVpZ25DaGFuZ2VzOiAobGluZUNoYW5nZXMpIC0+XG5cbiAgICAgICAgQGZvcmVpZ24gPz0gW11cbiAgICAgICAgQGZvcmVpZ24ucHVzaCBsaW5lQ2hhbmdlc1xuICAgICAgICBAdXBkYXRlKClcblxuICAgIHJlbG9hZDogLT5cblxuICAgICAgICBkZWxldGUgQHN0YXRlXG4gICAgICAgIEBkaXJ0eSA9IGZhbHNlXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMFxuXG4gICAgc2F2ZUNoYW5nZXM6IC0+XG5cbiAgICAgICAgaWYgQHN0YXRlXG5cbiAgICAgICAgICAgIGlmIEBmb3JlaWduPy5sZW5ndGhcbiAgICAgICAgICAgICAgICBmb3IgY2hhbmdlcyBpbiBAZm9yZWlnblxuICAgICAgICAgICAgICAgICAgICBmb3IgY2hhbmdlIGluIGNoYW5nZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCBjaGFuZ2UuY2hhbmdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAnY2hhbmdlZCcgIHRoZW4gQHN0YXRlLnN0YXRlID0gQHN0YXRlLnN0YXRlLmNoYW5nZUxpbmUgY2hhbmdlLmRvSW5kZXgsIGNoYW5nZS5hZnRlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gJ2luc2VydGVkJyB0aGVuIEBzdGF0ZS5zdGF0ZSA9IEBzdGF0ZS5zdGF0ZS5pbnNlcnRMaW5lIGNoYW5nZS5kb0luZGV4LCBjaGFuZ2UuYWZ0ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGVuICdkZWxldGVkJyAgdGhlbiBAc3RhdGUuc3RhdGUgPSBAc3RhdGUuc3RhdGUuZGVsZXRlTGluZSBjaGFuZ2UuZG9JbmRleFxuXG4gICAgICAgICAgICBpZiBAc3RhdGUuc3RhdGVcbiAgICAgICAgICAgICAgICBGaWxlLnNhdmUgQHN0YXRlLmZpbGUsIEBzdGF0ZS5zdGF0ZS50ZXh0KCksIChlcnIpID0+XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBrZXJyb3IgXCJ0YWIuc2F2ZUNoYW5nZXMgZmFpbGVkICN7ZXJyfVwiIGlmIGVyclxuICAgICAgICAgICAgICAgICAgICBAcmV2ZXJ0KClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBrZXJyb3IgJ3RhYi5zYXZlQ2hhbmdlcyAtLSBub3RoaW5nIHRvIHNhdmU/J1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3NhdmVDaGFuZ2VzJ1xuXG4gICAgc2V0RmlsZTogKG5ld0ZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBub3Qgc2xhc2guc2FtZVBhdGggQGZpbGUsIG5ld0ZpbGVcbiAgICAgICAgICAgIGtsb2cgJ3NldEZpbGUnIHNsYXNoLnBhdGggbmV3RmlsZVxuICAgICAgICAgICAgQGZpbGUgPSBzbGFzaC5wYXRoIG5ld0ZpbGVcbiAgICAgICAgICAgIEB1cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHN0b3JlU3RhdGU6IC0+XG5cbiAgICAgICAgaWYgd2luZG93LmVkaXRvci5jdXJyZW50RmlsZVxuICAgICAgICAgICAgQHN0YXRlID0gd2luZG93LmVkaXRvci5kby50YWJTdGF0ZSgpXG5cbiAgICByZXN0b3JlU3RhdGU6IC0+XG5cbiAgICAgICAgcmV0dXJuIGtlcnJvciAnbm8gZmlsZSBpbiBzdGF0ZT8nLCBAc3RhdGUgaWYgbm90IEBzdGF0ZT8uZmlsZT9cbiAgICAgICAgd2luZG93LmVkaXRvci5kby5zZXRUYWJTdGF0ZSBAc3RhdGVcbiAgICAgICAgZGVsZXRlIEBzdGF0ZVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZTogLT5cblxuICAgICAgICBAZGl2LmlubmVySFRNTCA9ICcnXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnRvZ2dsZSAnZGlydHknIEBkaXJ0eVxuXG4gICAgICAgIHNlcCA9ICfil48nXG4gICAgICAgIHNlcCA9ICfilqAnIGlmIHdpbmRvdy5lZGl0b3IubmV3bGluZUNoYXJhY3RlcnMgPT0gJ1xcclxcbidcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBlbGVtICdzcGFuJyBjbGFzczonZG90JyB0ZXh0OnNlcFxuXG4gICAgICAgIHNlcCA9IFwiPHNwYW4gY2xhc3M9J2RvdCc+4pa6PC9zcGFuPlwiXG4gICAgICAgIEBwa2dEaXYgPSBlbGVtICdzcGFuJyBjbGFzczoncGtnJyBodG1sOiBAcGtnIGFuZCAoQHBrZyArIHNlcCkgb3IgJydcbiAgICAgICAgQGRpdi5hcHBlbmRDaGlsZCBAcGtnRGl2XG5cbiAgICAgICAgZGlzcyA9IHN5bnRheC5kaXNzRm9yVGV4dEFuZFN5bnRheCBzbGFzaC5iYXNlbmFtZShAZmlsZSksICdrbydcbiAgICAgICAgbmFtZSA9IGVsZW0gJ3NwYW4nIGNsYXNzOiduYW1lJyBodG1sOnJlbmRlci5saW5lIGRpc3MsIGNoYXJXaWR0aDowXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgbmFtZVxuXG4gICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgZWxlbSAnc3BhbicgY2xhc3M6J3RhYmRyYWcnXG5cbiAgICAgICAgaWYgQGZpbGU/XG4gICAgICAgICAgICBkaXNzID0gc3ludGF4LmRpc3NGb3JUZXh0QW5kU3ludGF4IHNsYXNoLnRpbGRlKEBmaWxlKSwgJ2tvJ1xuICAgICAgICAgICAgaHRtbCA9IHJlbmRlci5saW5lIGRpc3MsIGNoYXJXaWR0aDowXG4gICAgICAgICAgICBAdG9vbHRpcCA9IG5ldyB0b29sdGlwIGVsZW06bmFtZSwgaHRtbDpodG1sLCB4OjBcblxuICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGVsZW0gJ3NwYW4nIGNsYXNzOidkb3QnIHRleHQ6J+KXjycgaWYgQGRpcnR5XG4gICAgICAgIEBcblxuICAgIGluZGV4OiAtPiBAdGFicy50YWJzLmluZGV4T2YgQFxuICAgIHByZXY6ICAtPiBAdGFicy50YWIgQGluZGV4KCktMSBpZiBAaW5kZXgoKSA+IDBcbiAgICBuZXh0OiAgLT4gQHRhYnMudGFiIEBpbmRleCgpKzEgaWYgQGluZGV4KCkgPCBAdGFicy5udW1UYWJzKCktMVxuICAgIG5leHRPclByZXY6IC0+IEBuZXh0KCkgPyBAcHJldigpXG5cbiAgICBjbG9zZTogLT5cblxuICAgICAgICBAd2F0Y2hlci5zdG9wKClcblxuICAgICAgICBpZiBAZGlydHlcbiAgICAgICAgICAgIEBzYXZlQ2hhbmdlcygpXG5cbiAgICAgICAgQGRpdi5yZW1vdmUoKVxuICAgICAgICBAdG9vbHRpcD8uZGVsKClcbiAgICAgICAgcG9zdC5lbWl0ICd0YWJDbG9zZWQnIEBmaWxlXG4gICAgICAgIEBcblxuICAgIGhpZGVQa2c6IC0+IEBwa2dEaXY/LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICBzaG93UGtnOiAtPiBAcGtnRGl2Py5zdHlsZS5kaXNwbGF5ID0gJ2luaXRpYWwnXG5cbiAgICAjIDAwMDAwMDAgICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAwMDAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDAgICAgICAgMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgICAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgIDAwMFxuXG4gICAgc2V0RGlydHk6IChkaXJ0eSkgLT5cblxuICAgICAgICBpZiBAZGlydHkgIT0gZGlydHlcbiAgICAgICAgICAgIEBkaXJ0eSA9IGRpcnR5XG4gICAgICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgICAwMDAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDBcblxuICAgIHJldmVydDogLT5cblxuICAgICAgICBkZWxldGUgQGZvcmVpZ25cbiAgICAgICAgZGVsZXRlIEBzdGF0ZVxuICAgICAgICBAZGlydHkgPSBmYWxzZVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQHRhYnMudXBkYXRlKClcbiAgICAgICAgQFxuXG4gICAgIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIGFjdGl2YXRlOiAtPlxuXG4gICAgICAgIHBvc3QuZW1pdCAnanVtcFRvRmlsZScgZmlsZTpAZmlsZVxuICAgICAgICBAXG5cbiAgICBmaW5pc2hBY3RpdmF0aW9uOiAtPlxuXG4gICAgICAgIEBzZXRBY3RpdmUoKVxuXG4gICAgICAgIGlmIEBzdGF0ZT9cbiAgICAgICAgICAgIEByZXN0b3JlU3RhdGUoKVxuXG4gICAgICAgIGlmIEBmb3JlaWduPy5sZW5ndGhcbiAgICAgICAgICAgIGZvciBjaGFuZ2VzIGluIEBmb3JlaWduXG4gICAgICAgICAgICAgICAgd2luZG93LmVkaXRvci5kby5mb3JlaWduQ2hhbmdlcyBjaGFuZ2VzXG4gICAgICAgICAgICBkZWxldGUgQGZvcmVpZ25cblxuICAgICAgICBAdGFicy51cGRhdGUoKVxuICAgICAgICBAXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwIDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuICAgIGlzQWN0aXZlOiAtPiBAZGl2LmNsYXNzTGlzdC5jb250YWlucyAnYWN0aXZlJ1xuXG4gICAgc2V0QWN0aXZlOiAtPlxuXG4gICAgICAgIGlmIG5vdCBAaXNBY3RpdmUoKVxuICAgICAgICAgICAgQGRpdi5jbGFzc0xpc3QuYWRkICdhY3RpdmUnXG4gICAgICAgIEBcblxuICAgIGNsZWFyQWN0aXZlOiAtPlxuXG4gICAgICAgIEBkaXYuY2xhc3NMaXN0LnJlbW92ZSAnYWN0aXZlJ1xuICAgICAgICBAXG5cbm1vZHVsZS5leHBvcnRzID0gVGFiXG4iXX0=
//# sourceURL=../../coffee/win/tab.coffee