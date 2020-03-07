// koffee 1.12.0

/*
000000000   0000000   0000000     0000000
   000     000   000  000   000  000
   000     000000000  0000000    0000000
   000     000   000  000   000       000
   000     000   000  0000000    0000000
 */
var $, Tab, Tabs, _, drag, elem, empty, first, kerror, kpos, last, popup, post, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), $ = ref.$, _ = ref._, drag = ref.drag, elem = ref.elem, empty = ref.empty, first = ref.first, kerror = ref.kerror, kpos = ref.kpos, last = ref.last, popup = ref.popup, post = ref.post, slash = ref.slash, stopEvent = ref.stopEvent;

Tab = require('./tab');

Tabs = (function() {
    function Tabs(titlebar) {
        this.showContextMenu = bind(this.showContextMenu, this);
        this.onContextMenu = bind(this.onContextMenu, this);
        this.onDirty = bind(this.onDirty, this);
        this.revertFile = bind(this.revertFile, this);
        this.restore = bind(this.restore, this);
        this.stash = bind(this.stash, this);
        this.onNewTabWithFile = bind(this.onNewTabWithFile, this);
        this.onNewEmptyTab = bind(this.onNewEmptyTab, this);
        this.onCloseOtherTabs = bind(this.onCloseOtherTabs, this);
        this.onCloseTabOrWindow = bind(this.onCloseTabOrWindow, this);
        this.onDragStop = bind(this.onDragStop, this);
        this.onDragMove = bind(this.onDragMove, this);
        this.onDragStart = bind(this.onDragStart, this);
        this.onClick = bind(this.onClick, this);
        this.onFileSaved = bind(this.onFileSaved, this);
        this.onFileLineChanges = bind(this.onFileLineChanges, this);
        this.onSendTabs = bind(this.onSendTabs, this);
        this.emptyid = 0;
        this.tabs = [];
        this.div = elem({
            "class": 'tabs'
        });
        titlebar.insertBefore(this.div, $(".minimize"));
        this.div.addEventListener('click', this.onClick);
        this.div.addEventListener('contextmenu', this.onContextMenu);
        this.drag = new drag({
            target: this.div,
            onStart: this.onDragStart,
            onMove: this.onDragMove,
            onStop: this.onDragStop
        });
        post.on('newTabWithFile', this.onNewTabWithFile);
        post.on('newEmptyTab', this.onNewEmptyTab);
        post.on('closeTabOrWindow', this.onCloseTabOrWindow);
        post.on('closeOtherTabs', this.onCloseOtherTabs);
        post.on('stash', this.stash);
        post.on('dirty', this.onDirty);
        post.on('restore', this.restore);
        post.on('revertFile', this.revertFile);
        post.on('sendTabs', this.onSendTabs);
        post.on('fileLineChanges', this.onFileLineChanges);
        post.on('fileSaved', this.onFileSaved);
    }

    Tabs.prototype.onSendTabs = function(winID) {
        var i, len, ref1, t, tab;
        t = '';
        ref1 = this.tabs;
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            t += tab.div.innerHTML;
        }
        return post.toWin(winID, 'winTabs', window.winID, t);
    };

    Tabs.prototype.onFileLineChanges = function(file, lineChanges) {
        var tab;
        tab = this.tab(file);
        if ((tab != null) && tab !== this.activeTab()) {
            return tab.foreignChanges(lineChanges);
        }
    };

    Tabs.prototype.onFileSaved = function(file, winID) {
        var tab;
        if (winID === window.winID) {
            return kerror("fileSaved from this window? " + file + " " + winID);
        }
        tab = this.tab(file);
        if ((tab != null) && tab !== this.activeTab()) {
            return tab.revert();
        }
    };

    Tabs.prototype.onClick = function(event) {
        var tab;
        if (tab = this.tab(event.target)) {
            if (event.target.classList.contains('dot')) {
                this.onCloseTabOrWindow(tab);
            } else {
                tab.activate();
            }
        }
        return true;
    };

    Tabs.prototype.onDragStart = function(d, event) {
        var br;
        this.dragTab = this.tab(event.target);
        if (empty(this.dragTab)) {
            return 'skip';
        }
        if (event.button !== 1) {
            return 'skip';
        }
        this.dragDiv = this.dragTab.div.cloneNode(true);
        this.dragTab.div.style.opacity = '0';
        br = this.dragTab.div.getBoundingClientRect();
        this.dragDiv.style.position = 'absolute';
        this.dragDiv.style.top = br.top + "px";
        this.dragDiv.style.left = br.left + "px";
        this.dragDiv.style.width = br.width + "px";
        this.dragDiv.style.height = br.height + "px";
        this.dragDiv.style.flex = 'unset';
        this.dragDiv.style.pointerEvents = 'none';
        return document.body.appendChild(this.dragDiv);
    };

    Tabs.prototype.onDragMove = function(d, e) {
        var tab;
        this.dragDiv.style.transform = "translateX(" + d.deltaSum.x + "px)";
        if (tab = this.tabAtX(d.pos.x)) {
            if (tab.index() !== this.dragTab.index()) {
                return this.swap(tab, this.dragTab);
            }
        }
    };

    Tabs.prototype.onDragStop = function(d, e) {
        this.dragTab.div.style.opacity = '';
        return this.dragDiv.remove();
    };

    Tabs.prototype.tab = function(id) {
        if (_.isNumber(id)) {
            return this.tabs[id];
        }
        if (_.isElement(id)) {
            return _.find(this.tabs, function(t) {
                return t.div.contains(id);
            });
        }
        if (_.isString(id)) {
            return _.find(this.tabs, function(t) {
                return t.file === id;
            });
        }
    };

    Tabs.prototype.activeTab = function(create) {
        var tab;
        if (!this.tabs.length && create) {
            tab = this.onNewEmptyTab();
            tab.setActive();
            return tab;
        }
        tab = _.find(this.tabs, function(t) {
            return t.isActive();
        });
        if (!tab && create) {
            tab = first(this.tabs);
            tab.setActive();
        }
        return tab;
    };

    Tabs.prototype.numTabs = function() {
        return this.tabs.length;
    };

    Tabs.prototype.tabAtX = function(x) {
        return _.find(this.tabs, function(t) {
            var br;
            br = t.div.getBoundingClientRect();
            return (br.left <= x && x <= br.left + br.width);
        });
    };

    Tabs.prototype.closeTab = function(tab) {
        _.pull(this.tabs, tab.close());
        if (empty(this.tabs)) {
            this.onNewEmptyTab();
        }
        return this;
    };

    Tabs.prototype.onCloseTabOrWindow = function(tab) {
        if (this.numTabs() <= 1) {
            return window.win.close();
        } else {
            if (tab != null) {
                tab;
            } else {
                tab = this.activeTab();
            }
            tab.nextOrPrev().activate();
            this.closeTab(tab);
            return this.update();
        }
    };

    Tabs.prototype.onCloseOtherTabs = function() {
        var keep;
        if (!this.activeTab()) {
            return;
        }
        keep = _.pullAt(this.tabs, this.activeTab().index());
        while (this.numTabs()) {
            this.tabs.pop().close();
        }
        this.tabs = keep;
        return this.update();
    };

    Tabs.prototype.addTab = function(file) {
        var i, index, ref1;
        if (this.tabs.length > 4) {
            for (index = i = 0, ref1 = this.tabs.length; 0 <= ref1 ? i < ref1 : i > ref1; index = 0 <= ref1 ? ++i : --i) {
                if (!this.tabs[index].dirty) {
                    this.closeTab(this.tabs[index]);
                    break;
                }
            }
        }
        this.tabs.push(new Tab(this, file));
        return last(this.tabs);
    };

    Tabs.prototype.onNewEmptyTab = function() {
        var tab;
        this.emptyid += 1;
        tab = this.addTab("untitled-" + this.emptyid).activate();
        this.update();
        return tab;
    };

    Tabs.prototype.onNewTabWithFile = function(file) {
        var col, line, ref1, tab;
        console.log('onNewTabWithFile', file);
        ref1 = slash.splitFileLine(file), file = ref1[0], line = ref1[1], col = ref1[2];
        if (tab = this.tab(file)) {
            tab.activate();
        } else {
            this.addTab(file).activate();
        }
        this.update();
        if (line || col) {
            return post.emit('singleCursorAtPos', [col, line - 1]);
        }
    };

    Tabs.prototype.navigate = function(key) {
        var index;
        index = this.activeTab().index();
        index += (function() {
            switch (key) {
                case 'left':
                    return -1;
                case 'right':
                    return +1;
            }
        })();
        index = (this.numTabs() + index) % this.numTabs();
        return this.tabs[index].activate();
    };

    Tabs.prototype.swap = function(ta, tb) {
        var ref1;
        if ((ta == null) || (tb == null)) {
            return;
        }
        if (ta.index() > tb.index()) {
            ref1 = [tb, ta], ta = ref1[0], tb = ref1[1];
        }
        this.tabs[ta.index()] = tb;
        this.tabs[tb.index() + 1] = ta;
        this.div.insertBefore(tb.div, ta.div);
        return this.update();
    };

    Tabs.prototype.move = function(key) {
        var tab;
        tab = this.activeTab();
        switch (key) {
            case 'left':
                return this.swap(tab, tab.prev());
            case 'right':
                return this.swap(tab, tab.next());
        }
    };

    Tabs.prototype.stash = function() {
        var files, ref1, t;
        files = (function() {
            var i, len, ref1, results;
            ref1 = this.tabs;
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
                t = ref1[i];
                results.push(t.file);
            }
            return results;
        }).call(this);
        files = files.filter(function(file) {
            return !file.startsWith('untitled');
        });
        return window.stash.set('tabs', {
            files: files,
            active: Math.min((ref1 = this.activeTab()) != null ? ref1.index() : void 0, files.length - 1)
        });
    };

    Tabs.prototype.restore = function() {
        var active, files, ref1;
        active = window.stash.get('tabs|active', 0);
        files = window.stash.get('tabs|files');
        if (empty(files)) {
            return;
        }
        this.tabs = [];
        while (files.length) {
            this.addTab(files.shift());
        }
        if ((ref1 = this.tabs[active]) != null) {
            ref1.activate();
        }
        return this.update();
    };

    Tabs.prototype.revertFile = function(file) {
        var ref1;
        return (ref1 = this.tab(file)) != null ? ref1.revert() : void 0;
    };

    Tabs.prototype.update = function() {
        var i, len, pkg, ref1, tab;
        this.stash();
        if (empty(this.tabs)) {
            return;
        }
        pkg = this.tabs[0].pkg;
        this.tabs[0].showPkg();
        ref1 = this.tabs.slice(1);
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            if (tab.pkg === pkg) {
                tab.hidePkg();
            } else {
                pkg = tab.pkg;
                tab.showPkg();
            }
        }
        return this;
    };

    Tabs.prototype.onDirty = function(dirty) {
        var ref1;
        return (ref1 = this.activeTab()) != null ? ref1.setDirty(dirty) : void 0;
    };

    Tabs.prototype.onContextMenu = function(event) {
        return stopEvent(event, this.showContextMenu(kpos(event)));
    };

    Tabs.prototype.showContextMenu = function(absPos) {
        var opt, tab;
        if (tab = this.tab(event.target)) {
            tab.activate();
        }
        if (absPos == null) {
            absPos = kpos(this.view.getBoundingClientRect().left, this.view.getBoundingClientRect().top);
        }
        opt = {
            items: [
                {
                    text: 'Close Other Tabs',
                    combo: 'ctrl+shift+w'
                }, {
                    text: 'New Window',
                    combo: 'ctrl+shift+n'
                }
            ]
        };
        opt.x = absPos.x;
        opt.y = absPos.y;
        return popup.menu(opt);
    };

    return Tabs;

})();

module.exports = Tabs;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFicy5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi9jb2ZmZWUvd2luIiwic291cmNlcyI6WyJ0YWJzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpR0FBQTtJQUFBOztBQVFBLE1BQXdGLE9BQUEsQ0FBUSxLQUFSLENBQXhGLEVBQUUsU0FBRixFQUFLLFNBQUwsRUFBUSxlQUFSLEVBQWMsZUFBZCxFQUFvQixpQkFBcEIsRUFBMkIsaUJBQTNCLEVBQWtDLG1CQUFsQyxFQUEwQyxlQUExQyxFQUFnRCxlQUFoRCxFQUFzRCxpQkFBdEQsRUFBNkQsZUFBN0QsRUFBbUUsaUJBQW5FLEVBQTBFOztBQUUxRSxHQUFBLEdBQU0sT0FBQSxDQUFRLE9BQVI7O0FBRUE7SUFFQyxjQUFDLFFBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztRQUVDLElBQUMsQ0FBQSxPQUFELEdBQVc7UUFDWCxJQUFDLENBQUEsSUFBRCxHQUFRO1FBQ1IsSUFBQyxDQUFBLEdBQUQsR0FBTyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLE1BQVA7U0FBTDtRQUVQLFFBQVEsQ0FBQyxZQUFULENBQXNCLElBQUMsQ0FBQSxHQUF2QixFQUE0QixDQUFBLENBQUUsV0FBRixDQUE1QjtRQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsT0FBdEIsRUFBb0MsSUFBQyxDQUFBLE9BQXJDO1FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxnQkFBTCxDQUFzQixhQUF0QixFQUFvQyxJQUFDLENBQUEsYUFBckM7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUksSUFBSixDQUNKO1lBQUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxHQUFWO1lBQ0EsT0FBQSxFQUFTLElBQUMsQ0FBQSxXQURWO1lBRUEsTUFBQSxFQUFTLElBQUMsQ0FBQSxVQUZWO1lBR0EsTUFBQSxFQUFTLElBQUMsQ0FBQSxVQUhWO1NBREk7UUFNUixJQUFJLENBQUMsRUFBTCxD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QUFDLENBQUEsR0FBRCxDQUFLLEtBQUssQ0FBQyxNQUFYLENBQVQ7WUFDSSxHQUFHLENBQUMsUUFBSixDQUFBLEVBREo7O1FBR0EsSUFBTyxjQUFQO1lBQ0ksTUFBQSxHQUFTLElBQUEsQ0FBSyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUEsQ0FBNkIsQ0FBQyxJQUFuQyxFQUF5QyxJQUFDLENBQUEsSUFBSSxDQUFDLHFCQUFOLENBQUEsQ0FBNkIsQ0FBQyxHQUF2RSxFQURiOztRQUdBLEdBQUEsR0FBTTtZQUFBLEtBQUEsRUFBTztnQkFDVDtvQkFBQSxJQUFBLEVBQVEsa0JBQVI7b0JBQ0EsS0FBQSxFQUFRLGNBRFI7aUJBRFMsRUFJVDtvQkFBQSxJQUFBLEVBQVEsWUFBUjtvQkFDQSxLQUFBLEVBQVEsY0FEUjtpQkFKUzthQUFQOztRQVFOLEdBQUcsQ0FBQyxDQUFKLEdBQVEsTUFBTSxDQUFDO1FBQ2YsR0FBRyxDQUFDLENBQUosR0FBUSxNQUFNLENBQUM7ZUFDZixLQUFLLENBQUMsSUFBTixDQUFXLEdBQVg7SUFsQmE7Ozs7OztBQW9CckIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAwMDAwMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiAgIDAwMCAgICAgMDAwMDAwMDAwICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwXG4gICAwMDAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwXG4jIyNcblxueyAkLCBfLCBkcmFnLCBlbGVtLCBlbXB0eSwgZmlyc3QsIGtlcnJvciwga3BvcywgbGFzdCwgcG9wdXAsIHBvc3QsIHNsYXNoLCBzdG9wRXZlbnQgfSA9IHJlcXVpcmUgJ2t4aydcblxuVGFiID0gcmVxdWlyZSAnLi90YWInXG5cbmNsYXNzIFRhYnNcblxuICAgIEA6ICh0aXRsZWJhcikgLT5cblxuICAgICAgICBAZW1wdHlpZCA9IDBcbiAgICAgICAgQHRhYnMgPSBbXVxuICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczogJ3RhYnMnXG5cbiAgICAgICAgdGl0bGViYXIuaW5zZXJ0QmVmb3JlIEBkaXYsICQgXCIubWluaW1pemVcIlxuXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snICAgICAgIEBvbkNsaWNrXG4gICAgICAgIEBkaXYuYWRkRXZlbnRMaXN0ZW5lciAnY29udGV4dG1lbnUnIEBvbkNvbnRleHRNZW51XG5cbiAgICAgICAgQGRyYWcgPSBuZXcgZHJhZ1xuICAgICAgICAgICAgdGFyZ2V0OiAgQGRpdlxuICAgICAgICAgICAgb25TdGFydDogQG9uRHJhZ1N0YXJ0XG4gICAgICAgICAgICBvbk1vdmU6ICBAb25EcmFnTW92ZVxuICAgICAgICAgICAgb25TdG9wOiAgQG9uRHJhZ1N0b3BcblxuICAgICAgICBwb3N0Lm9uICduZXdUYWJXaXRoRmlsZScgICBAb25OZXdUYWJXaXRoRmlsZVxuICAgICAgICBwb3N0Lm9uICduZXdFbXB0eVRhYicgICAgICBAb25OZXdFbXB0eVRhYlxuXG4gICAgICAgIHBvc3Qub24gJ2Nsb3NlVGFiT3JXaW5kb3cnIEBvbkNsb3NlVGFiT3JXaW5kb3dcbiAgICAgICAgcG9zdC5vbiAnY2xvc2VPdGhlclRhYnMnICAgQG9uQ2xvc2VPdGhlclRhYnNcbiAgICAgICAgcG9zdC5vbiAnc3Rhc2gnICAgICAgICAgICAgQHN0YXNoXG4gICAgICAgIHBvc3Qub24gJ2RpcnR5JyAgICAgICAgICAgIEBvbkRpcnR5XG4gICAgICAgIHBvc3Qub24gJ3Jlc3RvcmUnICAgICAgICAgIEByZXN0b3JlXG4gICAgICAgIHBvc3Qub24gJ3JldmVydEZpbGUnICAgICAgIEByZXZlcnRGaWxlXG4gICAgICAgIHBvc3Qub24gJ3NlbmRUYWJzJyAgICAgICAgIEBvblNlbmRUYWJzXG4gICAgICAgIHBvc3Qub24gJ2ZpbGVMaW5lQ2hhbmdlcycgIEBvbkZpbGVMaW5lQ2hhbmdlc1xuICAgICAgICBwb3N0Lm9uICdmaWxlU2F2ZWQnICAgICAgICBAb25GaWxlU2F2ZWRcblxuICAgIG9uU2VuZFRhYnM6ICh3aW5JRCkgPT5cblxuICAgICAgICB0ID0gJydcbiAgICAgICAgZm9yIHRhYiBpbiBAdGFic1xuICAgICAgICAgICAgdCArPSB0YWIuZGl2LmlubmVySFRNTFxuICAgICAgICBwb3N0LnRvV2luIHdpbklELCAnd2luVGFicycgd2luZG93LndpbklELCB0XG5cbiAgICBvbkZpbGVMaW5lQ2hhbmdlczogKGZpbGUsIGxpbmVDaGFuZ2VzKSA9PlxuXG4gICAgICAgIHRhYiA9IEB0YWIgZmlsZVxuICAgICAgICBpZiB0YWI/IGFuZCB0YWIgIT0gQGFjdGl2ZVRhYigpXG4gICAgICAgICAgICB0YWIuZm9yZWlnbkNoYW5nZXMgbGluZUNoYW5nZXNcblxuICAgIG9uRmlsZVNhdmVkOiAoZmlsZSwgd2luSUQpID0+XG5cbiAgICAgICAgaWYgd2luSUQgPT0gd2luZG93LndpbklEXG4gICAgICAgICAgICByZXR1cm4ga2Vycm9yIFwiZmlsZVNhdmVkIGZyb20gdGhpcyB3aW5kb3c/ICN7ZmlsZX0gI3t3aW5JRH1cIlxuICAgICAgICAgICAgXG4gICAgICAgIHRhYiA9IEB0YWIgZmlsZVxuICAgICAgICBpZiB0YWI/IGFuZCB0YWIgIT0gQGFjdGl2ZVRhYigpXG4gICAgICAgICAgICB0YWIucmV2ZXJ0KClcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMDAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAwMDAgICAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAgMDAwXG5cbiAgICBvbkNsaWNrOiAoZXZlbnQpID0+XG5cbiAgICAgICAgaWYgdGFiID0gQHRhYiBldmVudC50YXJnZXRcbiAgICAgICAgICAgIGlmIGV2ZW50LnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMgJ2RvdCdcbiAgICAgICAgICAgICAgICBAb25DbG9zZVRhYk9yV2luZG93IHRhYlxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRhYi5hY3RpdmF0ZSgpXG4gICAgICAgIHRydWVcblxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwMCAgMDAwICAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBvbkRyYWdTdGFydDogKGQsIGV2ZW50KSA9PlxuXG4gICAgICAgIEBkcmFnVGFiID0gQHRhYiBldmVudC50YXJnZXRcblxuICAgICAgICByZXR1cm4gJ3NraXAnIGlmIGVtcHR5IEBkcmFnVGFiXG4gICAgICAgIHJldHVybiAnc2tpcCcgaWYgZXZlbnQuYnV0dG9uICE9IDFcblxuICAgICAgICBAZHJhZ0RpdiA9IEBkcmFnVGFiLmRpdi5jbG9uZU5vZGUgdHJ1ZVxuICAgICAgICBAZHJhZ1RhYi5kaXYuc3R5bGUub3BhY2l0eSA9ICcwJ1xuICAgICAgICBiciA9IEBkcmFnVGFiLmRpdi5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgICAgICAgQGRyYWdEaXYuc3R5bGUudG9wICA9IFwiI3tici50b3B9cHhcIlxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5sZWZ0ID0gXCIje2JyLmxlZnR9cHhcIlxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS53aWR0aCA9IFwiI3tici53aWR0aH1weFwiXG4gICAgICAgIEBkcmFnRGl2LnN0eWxlLmhlaWdodCA9IFwiI3tici5oZWlnaHR9cHhcIlxuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5mbGV4ID0gJ3Vuc2V0J1xuICAgICAgICBAZHJhZ0Rpdi5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnXG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgQGRyYWdEaXZcblxuICAgIG9uRHJhZ01vdmU6IChkLGUpID0+XG5cbiAgICAgICAgQGRyYWdEaXYuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVYKCN7ZC5kZWx0YVN1bS54fXB4KVwiXG4gICAgICAgIGlmIHRhYiA9IEB0YWJBdFggZC5wb3MueFxuICAgICAgICAgICAgaWYgdGFiLmluZGV4KCkgIT0gQGRyYWdUYWIuaW5kZXgoKVxuICAgICAgICAgICAgICAgIEBzd2FwIHRhYiwgQGRyYWdUYWJcblxuICAgIG9uRHJhZ1N0b3A6IChkLGUpID0+XG5cbiAgICAgICAgQGRyYWdUYWIuZGl2LnN0eWxlLm9wYWNpdHkgPSAnJ1xuICAgICAgICBAZHJhZ0Rpdi5yZW1vdmUoKVxuXG4gICAgIyAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICB0YWI6IChpZCkgLT5cblxuICAgICAgICBpZiBfLmlzTnVtYmVyICBpZCB0aGVuIHJldHVybiBAdGFic1tpZF1cbiAgICAgICAgaWYgXy5pc0VsZW1lbnQgaWQgdGhlbiByZXR1cm4gXy5maW5kIEB0YWJzLCAodCkgLT4gdC5kaXYuY29udGFpbnMgaWRcbiAgICAgICAgaWYgXy5pc1N0cmluZyAgaWQgdGhlbiByZXR1cm4gXy5maW5kIEB0YWJzLCAodCkgLT4gdC5maWxlID09IGlkXG5cbiAgICBhY3RpdmVUYWI6IChjcmVhdGUpIC0+XG5cbiAgICAgICAgaWYgbm90IEB0YWJzLmxlbmd0aCBhbmQgY3JlYXRlXG4gICAgICAgICAgICB0YWIgPSBAb25OZXdFbXB0eVRhYigpXG4gICAgICAgICAgICB0YWIuc2V0QWN0aXZlKClcbiAgICAgICAgICAgIHJldHVybiB0YWJcbiAgICAgICAgICAgIFxuICAgICAgICB0YWIgPSBfLmZpbmQgQHRhYnMsICh0KSAtPiB0LmlzQWN0aXZlKClcbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCB0YWIgYW5kIGNyZWF0ZVxuICAgICAgICAgICAgdGFiID0gZmlyc3QgQHRhYnNcbiAgICAgICAgICAgIHRhYi5zZXRBY3RpdmUoKVxuICAgICAgICAgICAgXG4gICAgICAgIHRhYlxuXG4gICAgbnVtVGFiczogICAtPiBAdGFicy5sZW5ndGhcblxuICAgIHRhYkF0WDogKHgpIC0+XG5cbiAgICAgICAgXy5maW5kIEB0YWJzLCAodCkgLT5cbiAgICAgICAgICAgIGJyID0gdC5kaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgICAgICAgIGJyLmxlZnQgPD0geCA8PSBici5sZWZ0ICsgYnIud2lkdGhcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwXG5cbiAgICBjbG9zZVRhYjogKHRhYikgLT5cblxuICAgICAgICBfLnB1bGwgQHRhYnMsIHRhYi5jbG9zZSgpXG4gICAgICAgIFxuICAgICAgICBpZiBlbXB0eSBAdGFic1xuICAgICAgICAgICAgQG9uTmV3RW1wdHlUYWIoKVxuICAgICAgICBAXG5cbiAgICBvbkNsb3NlVGFiT3JXaW5kb3c6ICh0YWIpID0+XG5cbiAgICAgICAgaWYgQG51bVRhYnMoKSA8PSAxXG4gICAgICAgICAgICB3aW5kb3cud2luLmNsb3NlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGFiID89IEBhY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLm5leHRPclByZXYoKS5hY3RpdmF0ZSgpXG4gICAgICAgICAgICBAY2xvc2VUYWIgdGFiXG4gICAgICAgICAgICBAdXBkYXRlKClcblxuICAgIG9uQ2xvc2VPdGhlclRhYnM6ID0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAYWN0aXZlVGFiKCkgIyBzaG91bGQgbm90IGhhcHBlblxuICAgICAgICBrZWVwID0gXy5wdWxsQXQgQHRhYnMsIEBhY3RpdmVUYWIoKS5pbmRleCgpXG4gICAgICAgIHdoaWxlIEBudW1UYWJzKClcbiAgICAgICAgICAgIEB0YWJzLnBvcCgpLmNsb3NlKClcbiAgICAgICAgQHRhYnMgPSBrZWVwXG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgICAgMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwICAgICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAwMDAwXG5cbiAgICBhZGRUYWI6IChmaWxlKSAtPlxuXG4gICAgICAgIGlmIEB0YWJzLmxlbmd0aCA+IDRcbiAgICAgICAgICAgIGZvciBpbmRleCBpbiBbMC4uLkB0YWJzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBpZiBub3QgQHRhYnNbaW5kZXhdLmRpcnR5XG4gICAgICAgICAgICAgICAgICAgIEBjbG9zZVRhYiBAdGFic1tpbmRleF1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICBAdGFicy5wdXNoIG5ldyBUYWIgQCwgZmlsZVxuICAgICAgICBsYXN0IEB0YWJzXG5cbiAgICBvbk5ld0VtcHR5VGFiOiA9PlxuXG4gICAgICAgIEBlbXB0eWlkICs9IDFcbiAgICAgICAgdGFiID0gQGFkZFRhYihcInVudGl0bGVkLSN7QGVtcHR5aWR9XCIpLmFjdGl2YXRlKClcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIHRhYlxuXG4gICAgb25OZXdUYWJXaXRoRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgbG9nICdvbk5ld1RhYldpdGhGaWxlJyBmaWxlXG4gICAgICAgIFtmaWxlLCBsaW5lLCBjb2xdID0gc2xhc2guc3BsaXRGaWxlTGluZSBmaWxlXG5cbiAgICAgICAgaWYgdGFiID0gQHRhYiBmaWxlXG4gICAgICAgICAgICB0YWIuYWN0aXZhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYWRkVGFiKGZpbGUpLmFjdGl2YXRlKClcblxuICAgICAgICBAdXBkYXRlKClcblxuICAgICAgICBpZiBsaW5lIG9yIGNvbFxuXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3NpbmdsZUN1cnNvckF0UG9zJyBbY29sLCBsaW5lLTFdXG5cbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMDAwMDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwXG5cbiAgICBuYXZpZ2F0ZTogKGtleSkgLT5cblxuICAgICAgICBpbmRleCA9IEBhY3RpdmVUYWIoKS5pbmRleCgpXG4gICAgICAgIGluZGV4ICs9IHN3aXRjaCBrZXlcbiAgICAgICAgICAgIHdoZW4gJ2xlZnQnIHRoZW4gLTFcbiAgICAgICAgICAgIHdoZW4gJ3JpZ2h0JyB0aGVuICsxXG4gICAgICAgIGluZGV4ID0gKEBudW1UYWJzKCkgKyBpbmRleCkgJSBAbnVtVGFicygpXG4gICAgICAgIEB0YWJzW2luZGV4XS5hY3RpdmF0ZSgpXG5cbiAgICBzd2FwOiAodGEsIHRiKSAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgdGE/IG9yIG5vdCB0Yj9cbiAgICAgICAgW3RhLCB0Yl0gPSBbdGIsIHRhXSBpZiB0YS5pbmRleCgpID4gdGIuaW5kZXgoKVxuICAgICAgICBAdGFic1t0YS5pbmRleCgpXSAgID0gdGJcbiAgICAgICAgQHRhYnNbdGIuaW5kZXgoKSsxXSA9IHRhXG4gICAgICAgIEBkaXYuaW5zZXJ0QmVmb3JlIHRiLmRpdiwgdGEuZGl2XG4gICAgICAgIEB1cGRhdGUoKVxuXG4gICAgbW92ZTogKGtleSkgLT5cblxuICAgICAgICB0YWIgPSBAYWN0aXZlVGFiKClcbiAgICAgICAgc3dpdGNoIGtleVxuICAgICAgICAgICAgd2hlbiAnbGVmdCcgIHRoZW4gQHN3YXAgdGFiLCB0YWIucHJldigpXG4gICAgICAgICAgICB3aGVuICdyaWdodCcgdGhlbiBAc3dhcCB0YWIsIHRhYi5uZXh0KClcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwXG5cbiAgICBzdGFzaDogPT5cblxuICAgICAgICBmaWxlcyA9ICggdC5maWxlIGZvciB0IGluIEB0YWJzIClcbiAgICAgICAgZmlsZXMgPSBmaWxlcy5maWx0ZXIgKGZpbGUpIC0+IG5vdCBmaWxlLnN0YXJ0c1dpdGggJ3VudGl0bGVkJ1xuXG4gICAgICAgIHdpbmRvdy5zdGFzaC5zZXQgJ3RhYnMnLFxuICAgICAgICAgICAgZmlsZXM6ICBmaWxlc1xuICAgICAgICAgICAgYWN0aXZlOiBNYXRoLm1pbiBAYWN0aXZlVGFiKCk/LmluZGV4KCksIGZpbGVzLmxlbmd0aC0xXG5cbiAgICByZXN0b3JlOiA9PlxuXG4gICAgICAgIGFjdGl2ZSA9IHdpbmRvdy5zdGFzaC5nZXQgJ3RhYnN8YWN0aXZlJyAwXG4gICAgICAgIGZpbGVzICA9IHdpbmRvdy5zdGFzaC5nZXQgJ3RhYnN8ZmlsZXMnXG5cbiAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGZpbGVzICMgaGFwcGVucyB3aGVuIGZpcnN0IHdpbmRvdyBvcGVuc1xuXG4gICAgICAgIEB0YWJzID0gW11cblxuICAgICAgICB3aGlsZSBmaWxlcy5sZW5ndGhcbiAgICAgICAgICAgIEBhZGRUYWIgZmlsZXMuc2hpZnQoKVxuXG4gICAgICAgIEB0YWJzW2FjdGl2ZV0/LmFjdGl2YXRlKClcblxuICAgICAgICBAdXBkYXRlKClcblxuICAgIHJldmVydEZpbGU6IChmaWxlKSA9PiBAdGFiKGZpbGUpPy5yZXZlcnQoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMCAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDBcblxuICAgIHVwZGF0ZTogLT5cblxuICAgICAgICBAc3Rhc2goKVxuXG4gICAgICAgIHJldHVybiBpZiBlbXB0eSBAdGFic1xuXG4gICAgICAgIHBrZyA9IEB0YWJzWzBdLnBrZ1xuICAgICAgICBAdGFic1swXS5zaG93UGtnKClcbiAgICAgICAgZm9yIHRhYiBpbiBAdGFicy5zbGljZSAxXG4gICAgICAgICAgICBpZiB0YWIucGtnID09IHBrZ1xuICAgICAgICAgICAgICAgIHRhYi5oaWRlUGtnKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwa2cgPSB0YWIucGtnXG4gICAgICAgICAgICAgICAgdGFiLnNob3dQa2coKVxuICAgICAgICBAXG5cbiAgICBvbkRpcnR5OiAoZGlydHkpID0+XG5cbiAgICAgICAgQGFjdGl2ZVRhYigpPy5zZXREaXJ0eSBkaXJ0eVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAwICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgMCAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAgMDAwICAgICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwXG5cbiAgICBvbkNvbnRleHRNZW51OiAoZXZlbnQpID0+IHN0b3BFdmVudCBldmVudCwgQHNob3dDb250ZXh0TWVudSBrcG9zIGV2ZW50XG5cbiAgICBzaG93Q29udGV4dE1lbnU6IChhYnNQb3MpID0+XG5cbiAgICAgICAgaWYgdGFiID0gQHRhYiBldmVudC50YXJnZXRcbiAgICAgICAgICAgIHRhYi5hY3RpdmF0ZSgpXG5cbiAgICAgICAgaWYgbm90IGFic1Bvcz9cbiAgICAgICAgICAgIGFic1BvcyA9IGtwb3MgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkubGVmdCwgQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG5cbiAgICAgICAgb3B0ID0gaXRlbXM6IFtcbiAgICAgICAgICAgIHRleHQ6ICAgJ0Nsb3NlIE90aGVyIFRhYnMnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3NoaWZ0K3cnXG4gICAgICAgICxcbiAgICAgICAgICAgIHRleHQ6ICAgJ05ldyBXaW5kb3cnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK3NoaWZ0K24nXG4gICAgICAgIF1cblxuICAgICAgICBvcHQueCA9IGFic1Bvcy54XG4gICAgICAgIG9wdC55ID0gYWJzUG9zLnlcbiAgICAgICAgcG9wdXAubWVudSBvcHRcblxubW9kdWxlLmV4cG9ydHMgPSBUYWJzXG4iXX0=
//# sourceURL=../../coffee/win/tabs.coffee