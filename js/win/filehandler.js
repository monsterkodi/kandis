// koffee 1.11.0

/*
00000000  000  000      00000000  000   000   0000000   000   000  0000000    000      00000000  00000000 
000       000  000      000       000   000  000   000  0000  000  000   000  000      000       000   000
000000    000  000      0000000   000000000  000000000  000 0 000  000   000  000      0000000   0000000  
000       000  000      000       000   000  000   000  000  0000  000   000  000      000       000   000
000       000  0000000  00000000  000   000  000   000  000   000  0000000    0000000  00000000  000   000
 */
var File, FileHandler, _, dialog, electron, empty, filelist, first, kerror, post, prefs, ref, remote, reversed, slash, valid,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), _ = ref._, empty = ref.empty, filelist = ref.filelist, first = ref.first, kerror = ref.kerror, post = ref.post, prefs = ref.prefs, reversed = ref.reversed, slash = ref.slash, valid = ref.valid;

File = require('../tools/file');

electron = require('electron');

remote = electron.remote;

dialog = remote.dialog;

FileHandler = (function() {
    function FileHandler() {
        this.saveFileAs = bind(this.saveFileAs, this);
        this.openFile = bind(this.openFile, this);
        this.saveChanges = bind(this.saveChanges, this);
        this.saveFile = bind(this.saveFile, this);
        this.saveAll = bind(this.saveAll, this);
        this.removeFile = bind(this.removeFile, this);
        this.reloadFile = bind(this.reloadFile, this);
        this.reloadTab = bind(this.reloadTab, this);
        this.openFiles = bind(this.openFiles, this);
        this.loadFile = bind(this.loadFile, this);
        post.on('reloadFile', this.reloadFile);
        post.on('removeFile', this.removeFile);
        post.on('saveFileAs', this.saveFileAs);
        post.on('saveFile', this.saveFile);
        post.on('saveAll', this.saveAll);
        post.on('saveChanges', this.saveChanges);
        post.on('reloadTab', this.reloadTab);
        post.on('loadFile', this.loadFile);
        post.on('openFile', this.openFile);
        post.on('openFiles', this.openFiles);
    }

    FileHandler.prototype.loadFile = function(file, opt) {
        var activeTab, err, fileExists, filePos, ref1, tab;
        if (opt == null) {
            opt = {};
        }
        if ((file != null) && file.length <= 0) {
            file = null;
        }
        editor.saveScrollCursorsAndSelections();
        if (file != null) {
            ref1 = slash.splitFilePos(file), file = ref1[0], filePos = ref1[1];
            if (!file.startsWith('untitled')) {
                file = slash.resolve(file);
                try {
                    process.chdir(slash.dir(file));
                } catch (error) {
                    err = error;
                    kerror(err);
                }
            }
        }
        if (file !== (typeof editor !== "undefined" && editor !== null ? editor.currentFile : void 0) || (opt != null ? opt.reload : void 0)) {
            if (fileExists = slash.fileExists(file)) {
                this.addToRecent(file);
            }
            tab = tabs.tab(file);
            if (empty(tab)) {
                tab = tabs.addTab(file);
            }
            if (activeTab = tabs.activeTab()) {
                if (tab !== activeTab) {
                    activeTab.clearActive();
                    if (activeTab.dirty) {
                        activeTab.storeState();
                    }
                }
            }
            editor.setCurrentFile(file);
            tab.finishActivation();
            editor.restoreScrollCursorsAndSelections();
            if (fileExists) {
                post.toOthers('fileLoaded', file, winID);
                post.emit('cwdSet', slash.dir(file));
            }
        }
        split.raise('editor');
        if ((filePos != null) && (filePos[0] || filePos[1])) {
            editor.singleCursorAtPos(filePos);
            return editor.scroll.cursorToTop();
        }
    };

    FileHandler.prototype.openFiles = function(ofiles, options) {
        var answer, file, files, i, len;
        if (ofiles != null ? ofiles.length : void 0) {
            files = filelist(ofiles, {
                ignoreHidden: false
            });
            if (files.length >= 10) {
                answer = dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['Cancel', 'Open All'],
                    defaultId: 0,
                    cancelId: 0,
                    title: 'A Lot of Files Warning',
                    message: "You have selected " + files.length + " files.",
                    detail: 'Are you sure you want to open that many files?'
                });
                if (answer !== 1) {
                    return;
                }
            }
            if (files.length === 0) {
                return [];
            }
            window.stash.set('openFilePath', slash.dir(files[0]));
            if (!(options != null ? options.newWindow : void 0) && !(options != null ? options.newTab : void 0)) {
                file = slash.resolve(files.shift());
                this.loadFile(file);
            }
            for (i = 0, len = files.length; i < len; i++) {
                file = files[i];
                if (options != null ? options.newWindow : void 0) {
                    post.toMain('newWindowWithFile', file);
                } else {
                    post.emit('newTabWithFile', file);
                }
            }
            return ofiles;
        }
    };

    FileHandler.prototype.reloadTab = function(file) {
        if (file === (typeof editor !== "undefined" && editor !== null ? editor.currentFile : void 0)) {
            return this.loadFile(typeof editor !== "undefined" && editor !== null ? editor.currentFile : void 0, {
                reload: true
            });
        } else {
            return post.emit('revertFile', file);
        }
    };

    FileHandler.prototype.reloadFile = function(file) {
        var tab;
        if (!file) {
            return this.reloadActiveTab();
        } else if (tab = tabs.tab(file)) {
            if (tab === tabs.activeTab()) {
                return this.reloadActiveTab();
            } else {
                return tab.reload();
            }
        }
    };

    FileHandler.prototype.reloadActiveTab = function() {
        var tab;
        if (tab = tabs.activeTab()) {
            tab.reload();
        }
        this.loadFile(editor.currentFile, {
            reload: true
        });
        if (editor.currentFile != null) {
            return post.toOtherWins('reloadTab', editor.currentFile);
        }
    };

    FileHandler.prototype.removeFile = function(file) {
        var neighborTab, tab;
        if (tab = tabs.tab(file)) {
            if (tab === tabs.activeTab()) {
                if (neighborTab = tab.nextOrPrev()) {
                    neighborTab.activate();
                }
            }
            return tabs.closeTab(tab);
        }
    };

    FileHandler.prototype.saveAll = function() {
        var i, len, ref1, results, tab;
        ref1 = tabs.tabs;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            tab = ref1[i];
            if (tab.dirty) {
                if (tab === tabs.activeTab()) {
                    results.push(this.saveFile(tab.file));
                } else {
                    if (!tab.file.startsWith('untitled')) {
                        results.push(tab.saveChanges());
                    } else {
                        results.push(void 0);
                    }
                }
            } else {
                results.push(void 0);
            }
        }
        return results;
    };

    FileHandler.prototype.saveFile = function(file) {
        var err, tabState;
        if (file != null) {
            file;
        } else {
            file = editor.currentFile;
        }
        if ((file == null) || file.startsWith('untitled')) {
            this.saveFileAs();
            return;
        }
        post.emit('unwatch', file);
        tabState = editor["do"].tabState();
        try {
            post.emit('menuAction', 'doMacro', {
                actarg: 'req'
            });
        } catch (error) {
            err = error;
            kerror("macro req failed " + err);
        }
        return File.save(file, editor.text(), function(err, saved) {
            editor.saveScrollCursorsAndSelections();
            if (valid(err)) {
                kerror("saving '" + file + "' failed:", err);
            } else {
                editor.setCurrentFile(saved);
                editor["do"].history = tabState.history;
                editor["do"].saveIndex = tabState.history.length;
                post.toOthers('fileSaved', saved, window.winID);
                post.emit('saved', saved);
                post.emit('watch', saved);
            }
            return editor.restoreScrollCursorsAndSelections();
        });
    };

    FileHandler.prototype.addToRecent = function(file) {
        var recent;
        recent = window.state.get('recentFiles', []);
        if (file === first(recent)) {
            return;
        }
        _.pull(recent, file);
        recent.unshift(file);
        while (recent.length > prefs.get('recentFilesLength', 15)) {
            recent.pop();
        }
        window.state.set('recentFiles', recent);
        return commandline.commands.open.setHistory(reversed(recent));
    };

    FileHandler.prototype.saveChanges = function() {
        if ((editor.currentFile != null) && editor["do"].hasChanges() && slash.fileExists(editor.currentFile)) {
            return File.save(editor.currentFile, editor.text(), function(err) {
                if (err) {
                    return kerror("FileHandler.saveChanges failed " + err);
                }
            });
        }
    };

    FileHandler.prototype.openFile = function(opt) {
        var dir;
        if (typeof editor !== "undefined" && editor !== null ? editor.currentFile : void 0) {
            dir = slash.dir(editor.currentFile);
        }
        if (dir != null) {
            dir;
        } else {
            dir = slash.resolve('.');
        }
        return dialog.showOpenDialog({
            title: "Open File",
            defaultPath: window.stash.get('openFilePath', dir),
            properties: ['openFile', 'multiSelections']
        }).then((function(_this) {
            return function(result) {
                if (!result.cancelled && valid(result.filePaths)) {
                    return post.emit('openFiles', result.filePaths, opt);
                }
            };
        })(this));
    };

    FileHandler.prototype.saveFileAs = function() {
        var defaultPath;
        defaultPath = slash.unslash(typeof editor !== "undefined" && editor !== null ? editor.currentDir() : void 0);
        return dialog.showSaveDialog({
            title: 'Save File As',
            defaultPath: defaultPath
        }).then((function(_this) {
            return function(result) {
                if (!result.cancelled && result.filePath) {
                    _this.addToRecent(result.filePath);
                    return _this.saveFile(result.filePath);
                }
            };
        })(this));
    };

    return FileHandler;

})();

module.exports = FileHandler;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vY29mZmVlL3dpbiIsInNvdXJjZXMiOlsiZmlsZWhhbmRsZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLHdIQUFBO0lBQUE7O0FBUUEsTUFBNkUsT0FBQSxDQUFRLEtBQVIsQ0FBN0UsRUFBRSxTQUFGLEVBQUssaUJBQUwsRUFBWSx1QkFBWixFQUFzQixpQkFBdEIsRUFBNkIsbUJBQTdCLEVBQXFDLGVBQXJDLEVBQTJDLGlCQUEzQyxFQUFrRCx1QkFBbEQsRUFBNEQsaUJBQTVELEVBQW1FOztBQUVuRSxJQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0FBQ1gsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztBQUNYLE1BQUEsR0FBVyxRQUFRLENBQUM7O0FBQ3BCLE1BQUEsR0FBVyxNQUFNLENBQUM7O0FBRVo7SUFFQyxxQkFBQTs7Ozs7Ozs7Ozs7UUFFQyxJQUFJLENBQUMsRUFBTCxDQUFRLFlBQVIsRUFBc0IsSUFBQyxDQUFBLFVBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxZQUFSLEVBQXNCLElBQUMsQ0FBQSxVQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsWUFBUixFQUFzQixJQUFDLENBQUEsVUFBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFVBQVIsRUFBc0IsSUFBQyxDQUFBLFFBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxTQUFSLEVBQXNCLElBQUMsQ0FBQSxPQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsYUFBUixFQUFzQixJQUFDLENBQUEsV0FBdkI7UUFDQSxJQUFJLENBQUMsRUFBTCxDQUFRLFdBQVIsRUFBc0IsSUFBQyxDQUFBLFNBQXZCO1FBQ0EsSUFBSSxDQUFDLEVBQUwsQ0FBUSxVQUFSLEVBQXNCLElBQUMsQ0FBQSxRQUF2QjtRQUNBLElBQUksQ0FBQyxFQUFMLENBQVEsVUFBUixFQUFz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QWpCLEVBRko7O1lBRHFFO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6RTtJQUhROzs7Ozs7QUFRaEIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwICBcbjAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDBcbjAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IF8sIGVtcHR5LCBmaWxlbGlzdCwgZmlyc3QsIGtlcnJvciwgcG9zdCwgcHJlZnMsIHJldmVyc2VkLCBzbGFzaCwgdmFsaWQgfSA9IHJlcXVpcmUgJ2t4aydcblxuRmlsZSAgICAgPSByZXF1aXJlICcuLi90b29scy9maWxlJ1xuZWxlY3Ryb24gPSByZXF1aXJlICdlbGVjdHJvbidcbnJlbW90ZSAgID0gZWxlY3Ryb24ucmVtb3RlXG5kaWFsb2cgICA9IHJlbW90ZS5kaWFsb2dcblxuY2xhc3MgRmlsZUhhbmRsZXJcblxuICAgIEA6IC0+XG5cbiAgICAgICAgcG9zdC5vbiAncmVsb2FkRmlsZScgIEByZWxvYWRGaWxlXG4gICAgICAgIHBvc3Qub24gJ3JlbW92ZUZpbGUnICBAcmVtb3ZlRmlsZVxuICAgICAgICBwb3N0Lm9uICdzYXZlRmlsZUFzJyAgQHNhdmVGaWxlQXNcbiAgICAgICAgcG9zdC5vbiAnc2F2ZUZpbGUnICAgIEBzYXZlRmlsZVxuICAgICAgICBwb3N0Lm9uICdzYXZlQWxsJyAgICAgQHNhdmVBbGxcbiAgICAgICAgcG9zdC5vbiAnc2F2ZUNoYW5nZXMnIEBzYXZlQ2hhbmdlc1xuICAgICAgICBwb3N0Lm9uICdyZWxvYWRUYWInICAgQHJlbG9hZFRhYlxuICAgICAgICBwb3N0Lm9uICdsb2FkRmlsZScgICAgQGxvYWRGaWxlXG4gICAgICAgIHBvc3Qub24gJ29wZW5GaWxlJyAgICBAb3BlbkZpbGVcbiAgICAgICAgcG9zdC5vbiAnb3BlbkZpbGVzJyAgIEBvcGVuRmlsZXNcbiAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgbG9hZEZpbGU6IChmaWxlLCBvcHQ9e30pID0+XG4gICAgXG4gICAgICAgIGZpbGUgPSBudWxsIGlmIGZpbGU/IGFuZCBmaWxlLmxlbmd0aCA8PSAwXG4gICAgXG4gICAgICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgIFxuICAgICAgICBpZiBmaWxlP1xuICAgICAgICAgICAgW2ZpbGUsIGZpbGVQb3NdID0gc2xhc2guc3BsaXRGaWxlUG9zIGZpbGVcbiAgICAgICAgICAgIGlmIG5vdCBmaWxlLnN0YXJ0c1dpdGggJ3VudGl0bGVkJ1xuICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGVcbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5jaGRpciBzbGFzaC5kaXIgZmlsZVxuICAgICAgICAgICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgICAgICAgICBrZXJyb3IgZXJyXG4gICAgXG4gICAgICAgIGlmIGZpbGUgIT0gZWRpdG9yPy5jdXJyZW50RmlsZSBvciBvcHQ/LnJlbG9hZFxuICAgIFxuICAgICAgICAgICAgaWYgZmlsZUV4aXN0cyA9IHNsYXNoLmZpbGVFeGlzdHMgZmlsZVxuICAgICAgICAgICAgICAgIEBhZGRUb1JlY2VudCBmaWxlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRhYiA9IHRhYnMudGFiIGZpbGVcbiAgICAgICAgICAgIGlmIGVtcHR5IHRhYlxuICAgICAgICAgICAgICAgIHRhYiA9IHRhYnMuYWRkVGFiIGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYWN0aXZlVGFiID0gdGFicy5hY3RpdmVUYWIoKVxuICAgICAgICAgICAgICAgIGlmIHRhYiAhPSBhY3RpdmVUYWJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlVGFiLmNsZWFyQWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgaWYgYWN0aXZlVGFiLmRpcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUYWIuc3RvcmVTdGF0ZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBlZGl0b3Iuc2V0Q3VycmVudEZpbGUgZmlsZVxuICAgIFxuICAgICAgICAgICAgdGFiLmZpbmlzaEFjdGl2YXRpb24oKSAjIHNldEFjdGl2ZSwgcmVzdG9yZSBzdGF0ZSwgdXBkYXRlIHRhYnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZWRpdG9yLnJlc3RvcmVTY3JvbGxDdXJzb3JzQW5kU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGZpbGVFeGlzdHNcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJzICdmaWxlTG9hZGVkJyBmaWxlLCB3aW5JRCAjIGluZGV4ZXJcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ2N3ZFNldCcgc2xhc2guZGlyIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3BsaXQucmFpc2UgJ2VkaXRvcidcbiAgICBcbiAgICAgICAgaWYgZmlsZVBvcz8gYW5kIChmaWxlUG9zWzBdIG9yIGZpbGVQb3NbMV0pXG4gICAgICAgICAgICBlZGl0b3Iuc2luZ2xlQ3Vyc29yQXRQb3MgZmlsZVBvc1xuICAgICAgICAgICAgZWRpdG9yLnNjcm9sbC5jdXJzb3JUb1RvcCgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAwIDAwMCAgICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgICAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMFxuICAgIFxuICAgIG9wZW5GaWxlczogKG9maWxlcywgb3B0aW9ucykgPT4gIyBjYWxsZWQgZnJvbSBmaWxlIGRpYWxvZywgb3BlbiBjb21tYW5kIGFuZCBicm93c2VyXG4gICAgXG4gICAgICAgIGlmIG9maWxlcz8ubGVuZ3RoXG4gICAgXG4gICAgICAgICAgICBmaWxlcyA9IGZpbGVsaXN0IG9maWxlcywgaWdub3JlSGlkZGVuOiBmYWxzZVxuICAgIFxuICAgICAgICAgICAgaWYgZmlsZXMubGVuZ3RoID49IDEwXG4gICAgICAgICAgICAgICAgYW5zd2VyID0gZGlhbG9nLnNob3dNZXNzYWdlQm94XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICAgICAgICd3YXJuaW5nJ1xuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiAgICBbJ0NhbmNlbCcgJ09wZW4gQWxsJ11cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdElkOiAgMFxuICAgICAgICAgICAgICAgICAgICBjYW5jZWxJZDogICAwXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAgICAgICdBIExvdCBvZiBGaWxlcyBXYXJuaW5nJ1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAgICBcIllvdSBoYXZlIHNlbGVjdGVkICN7ZmlsZXMubGVuZ3RofSBmaWxlcy5cIlxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6ICAgICAnQXJlIHlvdSBzdXJlIHlvdSB3YW50IHRvIG9wZW4gdGhhdCBtYW55IGZpbGVzPydcbiAgICAgICAgICAgICAgICByZXR1cm4gaWYgYW5zd2VyICE9IDFcbiAgICBcbiAgICAgICAgICAgIGlmIGZpbGVzLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdXG4gICAgXG4gICAgICAgICAgICB3aW5kb3cuc3Rhc2guc2V0ICdvcGVuRmlsZVBhdGgnIHNsYXNoLmRpciBmaWxlc1swXVxuICAgIFxuICAgICAgICAgICAgaWYgbm90IG9wdGlvbnM/Lm5ld1dpbmRvdyBhbmQgbm90IG9wdGlvbnM/Lm5ld1RhYlxuICAgICAgICAgICAgICAgIGZpbGUgPSBzbGFzaC5yZXNvbHZlIGZpbGVzLnNoaWZ0KClcbiAgICAgICAgICAgICAgICBAbG9hZEZpbGUgZmlsZVxuICAgIFxuICAgICAgICAgICAgZm9yIGZpbGUgaW4gZmlsZXNcbiAgICAgICAgICAgICAgICBpZiBvcHRpb25zPy5uZXdXaW5kb3dcbiAgICAgICAgICAgICAgICAgICAgcG9zdC50b01haW4gJ25ld1dpbmRvd1dpdGhGaWxlJyBmaWxlXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBwb3N0LmVtaXQgJ25ld1RhYldpdGhGaWxlJyBmaWxlXG4gICAgXG4gICAgICAgICAgICByZXR1cm4gb2ZpbGVzXG4gICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgIFxuICAgIFxuICAgIHJlbG9hZFRhYjogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiBmaWxlID09IGVkaXRvcj8uY3VycmVudEZpbGVcbiAgICAgICAgICAgIEBsb2FkRmlsZSBlZGl0b3I/LmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwb3N0LmVtaXQgJ3JldmVydEZpbGUnIGZpbGVcbiAgICAgICAgICAgICAgICBcbiAgICAjIDAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgICAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICByZWxvYWRGaWxlOiAoZmlsZSkgPT5cbiAgICAgICAgXG4gICAgICAgIGlmIG5vdCBmaWxlXG4gICAgICAgICAgICBAcmVsb2FkQWN0aXZlVGFiKClcbiAgICAgICAgZWxzZSBpZiB0YWIgPSB0YWJzLnRhYiBmaWxlXG4gICAgICAgICAgICBpZiB0YWIgPT0gdGFicy5hY3RpdmVUYWIoKVxuICAgICAgICAgICAgICAgIEByZWxvYWRBY3RpdmVUYWIoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRhYi5yZWxvYWQoKVxuICAgICAgICAgICAgXG4gICAgcmVsb2FkQWN0aXZlVGFiOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgdGFiID0gdGFicy5hY3RpdmVUYWIoKVxuICAgICAgICAgICAgdGFiLnJlbG9hZCgpXG4gICAgICAgIFxuICAgICAgICBAbG9hZEZpbGUgZWRpdG9yLmN1cnJlbnRGaWxlLCByZWxvYWQ6dHJ1ZVxuICAgIFxuICAgICAgICBpZiBlZGl0b3IuY3VycmVudEZpbGU/XG4gICAgICAgICAgICBwb3N0LnRvT3RoZXJXaW5zICdyZWxvYWRUYWInLCBlZGl0b3IuY3VycmVudEZpbGVcblxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgICAgICAgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgICAgMCAgICAgIDAwMDAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgXG4gICAgcmVtb3ZlRmlsZTogKGZpbGUpID0+XG4gICAgICAgIFxuICAgICAgICBpZiB0YWIgPSB0YWJzLnRhYiBmaWxlXG4gICAgICAgICAgICBpZiB0YWIgPT0gdGFicy5hY3RpdmVUYWIoKVxuICAgICAgICAgICAgICAgIGlmIG5laWdoYm9yVGFiID0gdGFiLm5leHRPclByZXYoKVxuICAgICAgICAgICAgICAgICAgICBuZWlnaGJvclRhYi5hY3RpdmF0ZSgpXG4gICAgICAgICAgICB0YWJzLmNsb3NlVGFiIHRhYlxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMDAwMCAgMDAwICAgICAgMDAwICAgICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwICBcbiAgICBcbiAgICBzYXZlQWxsOiA9PlxuICAgICAgICBcbiAgICAgICAgZm9yIHRhYiBpbiB0YWJzLnRhYnNcbiAgICAgICAgICAgIGlmIHRhYi5kaXJ0eSBcbiAgICAgICAgICAgICAgICBpZiB0YWIgPT0gdGFicy5hY3RpdmVUYWIoKVxuICAgICAgICAgICAgICAgICAgICBAc2F2ZUZpbGUgdGFiLmZpbGVcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCB0YWIuZmlsZS5zdGFydHNXaXRoICd1bnRpdGxlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhYi5zYXZlQ2hhbmdlcygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBzYXZlRmlsZTogKGZpbGUpID0+XG4gICAgXG4gICAgICAgIGZpbGUgPz0gZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgZmlsZT8gb3IgZmlsZS5zdGFydHNXaXRoICd1bnRpdGxlZCdcbiAgICAgICAgICAgIEBzYXZlRmlsZUFzKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICBcbiAgICAgICAgcG9zdC5lbWl0ICd1bndhdGNoJyBmaWxlXG4gICAgICAgIFxuICAgICAgICB0YWJTdGF0ZSA9IGVkaXRvci5kby50YWJTdGF0ZSgpXG4gICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIHBvc3QuZW1pdCAnbWVudUFjdGlvbicgJ2RvTWFjcm8nIGFjdGFyZzoncmVxJyAjICEhISEhISFcbiAgICAgICAgY2F0Y2ggZXJyXG4gICAgICAgICAgICBrZXJyb3IgXCJtYWNybyByZXEgZmFpbGVkICN7ZXJyfVwiXG4gICAgICAgIFxuICAgICAgICBGaWxlLnNhdmUgZmlsZSwgZWRpdG9yLnRleHQoKSwgKGVyciwgc2F2ZWQpIC0+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVkaXRvci5zYXZlU2Nyb2xsQ3Vyc29yc0FuZFNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiB2YWxpZCBlcnJcbiAgICAgICAgICAgICAgICBrZXJyb3IgXCJzYXZpbmcgJyN7ZmlsZX0nIGZhaWxlZDpcIiBlcnJcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0Q3VycmVudEZpbGUgICAgIHNhdmVkXG4gICAgICAgICAgICAgICAgZWRpdG9yLmRvLmhpc3RvcnkgICA9IHRhYlN0YXRlLmhpc3RvcnlcbiAgICAgICAgICAgICAgICBlZGl0b3IuZG8uc2F2ZUluZGV4ID0gdGFiU3RhdGUuaGlzdG9yeS5sZW5ndGhcbiAgICAgICAgICAgICAgICBwb3N0LnRvT3RoZXJzICdmaWxlU2F2ZWQnIHNhdmVkLCB3aW5kb3cud2luSURcbiAgICAgICAgICAgICAgICBwb3N0LmVtaXQgICAgICdzYXZlZCcgICAgIHNhdmVkXG4gICAgICAgICAgICAgICAgcG9zdC5lbWl0ICAgICAnd2F0Y2gnICAgICBzYXZlZFxuXG4gICAgICAgICAgICBlZGl0b3IucmVzdG9yZVNjcm9sbEN1cnNvcnNBbmRTZWxlY3Rpb25zKClcbiAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgICAgICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgIDAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICAgICAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBhZGRUb1JlY2VudDogKGZpbGUpIC0+XG4gICAgXG4gICAgICAgIHJlY2VudCA9IHdpbmRvdy5zdGF0ZS5nZXQgJ3JlY2VudEZpbGVzJyBbXVxuICAgICAgICByZXR1cm4gaWYgZmlsZSA9PSBmaXJzdCByZWNlbnRcbiAgICAgICAgXy5wdWxsIHJlY2VudCwgZmlsZVxuICAgICAgICByZWNlbnQudW5zaGlmdCBmaWxlXG4gICAgICAgIHdoaWxlIHJlY2VudC5sZW5ndGggPiBwcmVmcy5nZXQgJ3JlY2VudEZpbGVzTGVuZ3RoJyAxNVxuICAgICAgICAgICAgcmVjZW50LnBvcCgpXG4gICAgXG4gICAgICAgIHdpbmRvdy5zdGF0ZS5zZXQgJ3JlY2VudEZpbGVzJyByZWNlbnRcbiAgICAgICAgIyB3aW5kb3cudGl0bGViYXIucmVmcmVzaE1lbnUoKVxuICAgICAgICBjb21tYW5kbGluZS5jb21tYW5kcy5vcGVuLnNldEhpc3RvcnkgcmV2ZXJzZWQgcmVjZW50XG4gICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAgICAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgICAgICAgIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwIDAgMDAwICAwMDAgIDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzYXZlQ2hhbmdlczogPT5cbiAgICAgICAgXG4gICAgICAgIGlmIGVkaXRvci5jdXJyZW50RmlsZT8gYW5kIGVkaXRvci5kby5oYXNDaGFuZ2VzKCkgYW5kIHNsYXNoLmZpbGVFeGlzdHMgZWRpdG9yLmN1cnJlbnRGaWxlXG4gICAgICAgICAgICBGaWxlLnNhdmUgZWRpdG9yLmN1cnJlbnRGaWxlLCBlZGl0b3IudGV4dCgpLCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGtlcnJvciBcIkZpbGVIYW5kbGVyLnNhdmVDaGFuZ2VzIGZhaWxlZCAje2Vycn1cIiBpZiBlcnJcbiAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAgICAwMDAwMDAwMCAgMDAwICAwMDAgICAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgMCAwMDAgICAgICAgIDAwMDAwMCAgICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAwICAgICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMCAgICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9wZW5GaWxlOiAob3B0KSA9PlxuICAgIFxuICAgICAgICBkaXIgPSBzbGFzaC5kaXIgZWRpdG9yLmN1cnJlbnRGaWxlIGlmIGVkaXRvcj8uY3VycmVudEZpbGVcbiAgICAgICAgZGlyID89IHNsYXNoLnJlc29sdmUgJy4nXG4gICAgICAgIGRpYWxvZy5zaG93T3BlbkRpYWxvZyhcbiAgICAgICAgICAgIHRpdGxlOiBcIk9wZW4gRmlsZVwiXG4gICAgICAgICAgICBkZWZhdWx0UGF0aDogd2luZG93LnN0YXNoLmdldCAnb3BlbkZpbGVQYXRoJyBkaXJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFsnb3BlbkZpbGUnICdtdWx0aVNlbGVjdGlvbnMnXSkudGhlbiAocmVzdWx0KSA9PlxuICAgICAgICAgICAgICAgIGlmIG5vdCByZXN1bHQuY2FuY2VsbGVkIGFuZCB2YWxpZCByZXN1bHQuZmlsZVBhdGhzXG4gICAgICAgICAgICAgICAgICAgIHBvc3QuZW1pdCAnb3BlbkZpbGVzJyByZXN1bHQuZmlsZVBhdGhzLCBvcHRcbiAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAgICAgIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAgICAwMDAwMDAwICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAgMDAwIDAwMCAgIDAwMDAwMDAgICAgICAgICAwMDAwMDAgICAgMDAwICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgICAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAwMDAwMCAgICAgICAgMDAwICAgICAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgXG4gICAgXG4gICAgc2F2ZUZpbGVBczogPT5cbiAgICBcbiAgICAgICAgZGVmYXVsdFBhdGggPSBzbGFzaC51bnNsYXNoIGVkaXRvcj8uY3VycmVudERpcigpXG4gICAgICAgIGRpYWxvZy5zaG93U2F2ZURpYWxvZyh0aXRsZTonU2F2ZSBGaWxlIEFzJyBkZWZhdWx0UGF0aDpkZWZhdWx0UGF0aCkudGhlbiAocmVzdWx0KSA9PlxuICAgICAgICAgICAgaWYgbm90IHJlc3VsdC5jYW5jZWxsZWQgYW5kIHJlc3VsdC5maWxlUGF0aFxuICAgICAgICAgICAgICAgIEBhZGRUb1JlY2VudCByZXN1bHQuZmlsZVBhdGhcbiAgICAgICAgICAgICAgICBAc2F2ZUZpbGUgcmVzdWx0LmZpbGVQYXRoXG4gICAgICAgICAgICBcbm1vZHVsZS5leHBvcnRzID0gRmlsZUhhbmRsZXJcbiJdfQ==
//# sourceURL=../../coffee/win/filehandler.coffee