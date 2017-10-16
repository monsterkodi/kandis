###
 0000000   00000000   00000000  000   000
000   000  000   000  000       0000  000
000   000  00000000   0000000   000 0 000
000   000  000        000       000  0000
 0000000   000        00000000  000   000
###

{ packagePath, splitFilePos, joinFilePos, fileExists, fileName, dirExists, valid, empty,
  unresolve, relative, resolve, prefs, clamp, post, path, fs, error, log, _ } = require 'kxk'
  
profile  = require '../tools/profile'
Walker   = require '../tools/walker'
Command  = require '../commandline/command'
render   = require '../editor/render'
syntax   = require '../editor/syntax'
fuzzy    = require 'fuzzy'
    
class Open extends Command

    constructor: (@commandline) ->
        
        @shortcuts  = ['command+p', 'command+shift+p', 'command+alt+p']
        @names      = ["open", "new tab", "new window"]
        @files      = null
        @file       = null
        @dir        = null
        @pkg        = null
        @combo      = null
        @selected   = 0
        @navigating = false
                
        super @commandline
                    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
        
        command = command.trim()

        if command == '.' and @navigating == false
            @setText ''
            @navigating = true
            @showItems @listItems includeThis: false
            @select 0
            @positionList()            
            @setAndSelectText @dir  
            return
        
        if command in ['.', '/', '~'] or command.endsWith '/'
            return @navigateDir command

        [file, pos] = splitFilePos command ? @getText().trim()
        items = @listItems flat: true, navigating: @navigating, currentText: file    
        if command.length
            fuzzied = fuzzy.filter path.basename(file), items, extract: (o) -> o.text            
            items = (f.original for f in fuzzied)
                    
        if items.length
            @showItems items
            @select 0
            @positionList()
        else
            if path.dirname(resolve(command)) == @dir
                base = path.basename command
                items = @listItems flat: false, excludeUp: true
                items = _.filter items, (i) -> i.file.startsWith resolve(command)
                if items.length
                    @showItems items
                    @select 0
                    @positionList()
                    return
            @navigateDir command

    #  0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
    # 000       000   000  000   000  000   000  000      000          000     000     
    # 000       000   000  000000000  00000000   000      0000000      000     0000000 
    # 000       000   000  000 0 000  000        000      000          000     000     
    #  0000000   0000000   000   000  000        0000000  00000000     000     00000000

    complete: -> 
        
        return if not @commandList? 
        if @commandList.line(@selected).startsWith(path.basename @getText()) and not @getText().trim().endsWith('/')
            @setText path.join(path.dirname(@getText()), @commandList.line(@selected))
            if dirExists @getText()
                @setText @getText() + '/'
                @changed @getText()
            true
        else if not @getText().trim().endsWith('/') and dirExists @getText()
            @setText @getText() + '/'
            @changed @getText()
            true            
        else
            projects = post.get 'indexer', 'projects'
            for p in Object.keys(projects).sort()
                if p.startsWith @getText()
                    pdir = projects[p].dir
                    pdir = path.join(pdir, 'coffee') if dirExists path.join pdir, 'coffee'
                    @setText pdir + '/'
                    @changed @getText()
                    return true
            super
    
    # 000   000  00000000  000   0000000   000   000  000000000
    # 000 0 000  000       000  000        000   000     000   
    # 000000000  0000000   000  000  0000  000000000     000   
    # 000   000  000       000  000   000  000   000     000   
    # 00     00  00000000  000   0000000   000   000     000   

    weight: (item, opt) =>            
                
        return item.bonus if item.bonus?
        
        f = item.file
        r = item.text
        b = path.basename f
        n = fileName f
                
        relBonus = 0
        nameBonus = 0
        if opt?.currentText?.length
            relBonus  = r.startsWith(opt.currentText) and 65535 * (opt.currentText.length/r.length) or 0 
            nameBonus = n.startsWith(opt.currentText) and 2184  * (opt.currentText.length/n.length) or 0
           
        extensionBonus = switch path.extname b
            when '.coffee'               then 100
            when '.cpp', '.hpp', '.h'    then 90
            when '.md', '.styl', '.pug'  then 50
            when '.noon'                 then 25
            when '.js', '.json', '.html' then -10
            else 0 
        extensionBonus -= 400 if b[0] == '.'
        extensionBonus += 16777215 if item.text == '..' if @navigating
        
        lengthPenalty = path.dirname(f).length
                
        if opt?.flat
            
            updirPenalty = r.split('../').length * 819
            
            w = relBonus + nameBonus + extensionBonus - lengthPenalty - updirPenalty
            
        else
            
            directoryBonus = item.line == '▸' and 500 or 0
            
            if f.startsWith @dir
                localBonus = Math.max 0, (5-r.split('/').length) * 4095
            else
                localBonus = Math.max 0, (5-r.split('../').length) * 819
            
            w = localBonus + directoryBonus + relBonus + nameBonus + extensionBonus - lengthPenalty
                        
        w

    weightedItems: (items, opt) -> 
        # log 'weightedItems', items.length, opt
        items.sort (a,b) => @weight(b, opt) - @weight(a, opt)
        # for item in items.slice 0, 10
            # log @weight(item, opt), item.file, item.text, item.bonus ? ''
        items
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   

    listItems: (opt) ->
        
        items = []
        
        @lastFileIndex = 0
        @dir = resolve '~' if not @dir?

        if @history? and not @navigating and not opt?.currentText and @history.length > 1
            f = @history[@history.length-2]
            item = Object.create null
            item.text = relative f, @dir
            item.line = ' '
            item.file = f
            item.bonus = 1048575
            items.push item
            @lastFileIndex = 0

        if @navigating and opt?.includeThis
            item = Object.create null
            item.line = '▸'
            item.clss = 'directory'
            item.text = '.'
            item.file = @dir
            items.push item            
        
        if @dir != '/' and not opt?.excludeUp
            item = Object.create null
            item.line = '▸'
            item.clss = 'directory'
            item.text = '..'
            item.file = path.dirname @dir
            items.push item
                
        for file in @files
            rel = relative file[0], @dir
            if rel.length
                item = Object.create null
                if file[1].isDirectory()
                    item.line = '▸'
                    item.clss = 'directory'
                else
                    item.line = ' '
                item.text = rel
                item.file = file[0]
                items.push item

        items = @weightedItems items, opt
        items = _.uniqBy items, (o) -> o.text
        items
    
    # 000   000  000   0000000  000000000   0000000   00000000   000   000  
    # 000   000  000  000          000     000   000  000   000   000 000   
    # 000000000  000  0000000      000     000   000  0000000      00000    
    # 000   000  000       000     000     000   000  000   000     000     
    # 000   000  000  0000000      000      0000000   000   000     000     
    
    showHistory: () ->

        if @history.length > 1 and (@selected < 0 or not @navigating and @selected == 0)
            items = []
            bonus = 1048575
            for f in @history
                item = Object.create null
                item.text = relative f, @dir
                item.file = f
                item.bonus = bonus
                items.push item
                bonus -= 1 
            items.pop()
            @stopWalkers()
            @showItems items
            @select items.length-1
            @setAndSelectText items[@selected].text
        else
            'unhandled'

    showFirst: () ->
        
        if @commandList and @selected == @commandList.meta.metas.length - 1
            @showItems @listItems includeThis: false
            @select 0
        else
            'unhandled'
                
    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: (combo) ->
        
        if combo == @shortcuts[0]
            if not @navigating and @commandList? and @lastFileIndex == @selected
                @stopWalkers()
                return @execute()                
        super combo
    
    cancelList: ->
        
        @stopWalkers()
        super

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (@combo) -> 
        
        opt = reload: true
            
        if window.editor.currentFile?
            opt.file = window.editor.currentFile 
            opt.dir  = path.dirname opt.file
        else 
            @dir ?= process.cwd()
            opt.dir = @dir
            
        @loadDir opt

        super @combo
        
        @selected = null
        
        text: ''
       
    navigateDir: (dir) ->
        
        r = @loadDir 
            dir: dir
            noPkg: true
            navigating: true
            
        if r
            @hideList()
            @select -1                
    
    # 000       0000000    0000000   0000000          0000000    000  00000000 
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 000      000   000  000000000  000   000        000   000  000  0000000  
    # 000      000   000  000   000  000   000        000   000  000  000   000
    # 0000000   0000000   000   000  0000000          0000000    000  000   000
        
    loadDir: (opt) ->
                
        opt.dir = path.dirname opt.file if not opt.dir? and opt.file?
        if not dirExists opt.dir
            opt.dir = resolve opt.dir
            if not dirExists opt.dir
                return false

        @dir ?= resolve '.'
        newdir = @resolvedPath(opt.dir) ? @dir
        return false if newdir == @dir and not opt.reload
        
        @dir = newdir
        
        @pkg        = opt.noPkg and @dir or packagePath(@dir) or @dir
        @file       = opt.file
        @files      = []
        @selected   = null
        @navigating = opt.navigating ? false

        if @walker and not @walker.running and @walker.cfg.root == @pkg and valid @walker.cfg.files
            setImmediate => @walkerDone @walker
            return true
        
        @stopWalkers()
                
        topt = 
            done:        @walkerDone
            root:        @dir
            includeDir:  @dir
            includeDirs: true
            maxFiles:    100
            maxDepth:    1
        
        @thisWalker = new Walker topt
        @thisWalker.start()
        
        fopt = 
            done:        @walkerDone
            root:        @dir
            includeDir:  @dir
            includeDirs: true
            maxFiles:    300
            maxDepth:    2
         
        @fastWalker = new Walker fopt
        @fastWalker.start()

        wopt = 
            done:        @walkerDone
            root:        @pkg
            includeDir:  @dir
            includeDirs: true
            maxFiles:    2000
            maxDepth:    5
            slowdown:    true
         
        @walker = new Walker wopt
        @walker.start()
                    
        true
        
    # 000   000   0000000   000      000   000  00000000  00000000 
    # 000 0 000  000   000  000      000  000   000       000   000
    # 000000000  000000000  000      0000000    0000000   0000000  
    # 000   000  000   000  000      000  000   000       000   000
    # 00     00  000   000  0000000  000   000  00000000  000   000
            
    walkerDone: (walker) =>

        for i in [0...walker.cfg.files.length]
            @files.push [walker.cfg.files[i], walker.cfg.stats[i]]
            
        # @files = _.sortBy @files, (o) => relative(o[0], @dir).replace(/\./g, 'z')
        
        @showList()
        @showItems @listItems includeThis: false
        @grabFocus()
        @select @selected ? @lastFileIndex
        
        if not @navigating
            
            if @getText() == ''
                @setAndSelectText @commandList.line @selected
            else if @getText() != @commandList.line @selected
                @changed @getText()
                
        else if @getText() == '.'
            
            @setText @dir
            
    stopWalkers: ->

        @thisWalker?.stop()
        @fastWalker?.stop()
        @walker?.stop()

    hideList: ->

        @stopWalkers()
        super
        
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->
        
        listValue = @commandList?.line(@selected) if @selected >= 0

        if command in ['.', '..', '/', '~']
            @loadDir
                navigating: true
                dir:        @resolvedPath command
            return text: @dir, select: true
        else
            if @selected >= 0 and listValue? 
                if dirExists @resolvedPath listValue
                    resolved = @resolvedPath listValue
            else if dirExists @resolvedPath command
                resolved = @resolvedPath command
                
            if resolved? 
                @loadDir
                    navigating: true
                    dir:        resolved
                return text: @dir+'/', select: false
        
        @hideList()

        if listValue
            [file, pos] = splitFilePos listValue
            file = @resolvedPath listValue
            file = joinFilePos file, pos
            files = [file]
        else
            files = _.words command, new RegExp "[^, ]+", 'g'
            for i in [0...files.length]
                file = files[i]
                [file, pos] = splitFilePos file
                file = @resolvedPath file
                if not fileExists file
                    if '' == path.extname file
                        if fileExists file + '.coffee'
                            file += '.coffee'
                file = joinFilePos file, pos
                files.splice i, 1, file
            
        options = {}
        options.newWindow = true if @name == "new window"
        options.newTab    = true if @name == "new tab"
        
        opened = window.openFiles files, options
        
        if opened?.length
            
            @stopWalkers()
            
            if opened.length == 1
                super opened[0]
            else
                super selected
                
            text:  (path.basename(f) for f in opened).join ' '
            focus:  'editor'
            show:   'editor'
            status: 'ok'
        else
            status: 'failed'

    # 00000000   00000000   0000000   0000000   000      000   000  00000000  0000000  
    # 000   000  000       000       000   000  000      000   000  000       000   000
    # 0000000    0000000   0000000   000   000  000       000 000   0000000   000   000
    # 000   000  000            000  000   000  000         000     000       000   000
    # 000   000  00000000  0000000    0000000   0000000      0      00000000  0000000  
    
    resolvedPath: (p, parent=@dir) ->
        
        return (parent ? resolve '~') if not p?
        if p[0] in ['~', '/']
            resolve p
        else
            resolve path.join parent, p

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        
        switch combo
            when 'up'   then return @showHistory()
            when 'down' then return @showFirst()
            when 'backspace'
                if not @getText().length and @commandList?.line(@selected) == '..'
                    @loadDir
                        navigating: true
                        dir:        path.dirname @dir
                    return @commandline.results text: @dir, select: true
                else if @commandline.isSelectedLineAtIndex 0
                    @navigating = true
        super mod, key, combo, event

module.exports = Open
