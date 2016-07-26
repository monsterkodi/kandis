# 00000000  0000000    000  000000000   0000000   00000000 
# 000       000   000  000     000     000   000  000   000
# 0000000   000   000  000     000     000   000  0000000  
# 000       000   000  000     000     000   000  000   000
# 00000000  0000000    000     000      0000000   000   000
{
extName,
clamp,
first,
last,
$}      = require '../tools/tools'
log     = require '../tools/log'
salt    = require '../tools/salt'
watcher = require './watcher'
Buffer  = require './buffer'
Syntax  = require './syntax'
undo    = require './undo'
path    = require 'path'
fs      = require 'fs'
_       = require 'lodash'

class Editor extends Buffer

    constructor: () ->
        @surroundStack      = []
        @surroundCharacters = []
        @surroundPairs      = Object.create null
        @currentFile        = null
        @fileType           = 'txt'
        @indentString       = _.padStart "", 4
        @stickySelection    = false
        @mainCursorMove     = 0
        @watch              = null
        @do                 = new undo @
        @dbg                = false
        super

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000 
    # 000000000  00000000   00000000   000        00000  
    # 000   000  000        000        000         000   
    # 000   000  000        000        0000000     000   
    
    applyForeignLineChanges: (lineChanges) =>
        @do.start()
        for change in lineChanges
            if change.before? and change.after?
                @do.change change.index, change.after
            else if change.before?
                @do.delete change.index
            else if change.after?
                @do.insert change.index, change.after
            else
                log "editor.applyForeignLineChanges wtf?"
        @do.end foreign: true

    # 00000000  000  000      00000000
    # 000       000  000      000     
    # 000000    000  000      0000000 
    # 000       000  000      000     
    # 000       000  0000000  00000000

    stopWatcher: ->
        if @watch?
            @watch?.stop()
            @watch = null

    setCurrentFile: (file, opt) ->
        @stopWatcher()
        @currentFile = file
        if not opt?.keepUndo? or opt.keepUndo == false
            @do.reset()
        @updateTitlebar()
        if file?
            @watch = new watcher @
            @setText fs.readFileSync file, encoding: 'utf8'
            @setupFileType()
        else
            @fileType = ''
            @watch = null
            @setLines []

    # 000000000  000   000  00000000   00000000
    #    000      000 000   000   000  000     
    #    000       00000    00000000   0000000 
    #    000        000     000        000     
    #    000        000     000        00000000
    
    setupFileType: ->
        @fileType = Syntax.shebang @lines[0]
        if @fileType == 'txt'
            ext = extName @currentFile
            if ext in Syntax.syntaxNames
                @fileType = ext
                
        # log "setupFileType @fileType:#{@fileType}"

        @surroundPairs = 
            '[': ['[', ']']
            ']': ['[', ']']
            '{': ['{', '}']
            '}': ['{', '}']
            '(': ['(', ')']
            ')': ['(', ')']
            '<': ['<', '>']
            '>': ['<', '>']
            '#': ['#{', '}']
            "'": ["'", "'"]
            '"': ['"', '"']
            '*': ['*', '*']                    
        
        @surroundCharacters = "{}[]()\"'".split ''
        switch @fileType
            when 'md'     then @surroundCharacters = @surroundCharacters.concat '*'.split ''
            when 'html'   then @surroundCharacters = @surroundCharacters.concat '<>'.split ''
            when 'coffee' then @surroundCharacters = @surroundCharacters.concat '#'.split ''
                
        @lineComment = switch @fileType
            when 'cpp', 'hpp', 'styl', '.pug' then '//'
            when 'txt' then '--'
            else '#'        
                
    #  0000000  00000000  000000000         000      000  000   000  00000000   0000000
    # 000       000          000            000      000  0000  000  000       000     
    # 0000000   0000000      000            000      000  000 0 000  0000000   0000000 
    #      000  000          000            000      000  000  0000  000            000
    # 0000000   00000000     000            0000000  000  000   000  00000000  0000000 

    setText: (text="") -> 
        rgx = new RegExp '\t', 'g'
        indent = @indentString
        @setLines text.split(/\n/).map (l) -> l.replace rgx, indent

    setLines: (lines) ->
        super lines
        @emit 'linesSet', @lines
        
    #  0000000   0000000   000      000000000  00000000  00000000 
    # 000       000   000  000         000     000       000   000
    # 0000000   000000000  000         000     0000000   0000000  
    #      000  000   000  000         000     000       000   000
    # 0000000   000   000  0000000     000     00000000  000   000
                                
    startSalter: ->
        cp = @cursorPos()
        if rgs = @salterRangesAtPos()
            cols = @columnsInSalt (@textInRange r for r in rgs)
            ci = 0
            while ci < cols.length and cp[0] > cols[ci]
                ci += 1
            col = cols[ci]
            @do.start()
            newCursors = ([col, r[0]] for r in rgs)
            @mainCursor = last newCursors
            @do.cursors newCursors
            @do.end()
        else
            word = @wordAtCursor().trim()
            indt = _.padStart '', @indentationAtLineIndex cp[1]
            stxt = word.length and salt(word).split('\n') or ['', '', '', '', '']
            stxt = ("#{indt}#{@lineComment} #{s}" for s in stxt)
            @do.start()
            newCursors = []
            li = cp[1]+5
            for s in stxt.reversed()
                @do.insert cp[1], s
                newCursors.push [s.length, li]
                li -= 1
            @do.insert cp[1], indt
            @mainCursor = first newCursors
            @do.cursors newCursors
            @do.end()
        @setSalterMode true
        
    insertSalterCharacter: (ch) ->
        if ch == ' '
            char = ['    ', '    ', '    ', '    ', '    ']
        else
            char = salt(ch).split '\n'
        if char.length == 5
            @paste ("  #{s}" for s in char).join '\n'
        else
            @setSalterMode false
        true

    deleteSalterCharacter: ->
        return if not @salterMode
        cp = @cursorPos()
        if rgs = @salterRangesAtPos()
            cols = @columnsInSalt (@textInRange r for r in rgs)
            ci = cols.length-1
            while ci > 0 and cols[ci-1] >= cp[0]
                ci -= 1
            if ci > 0
                length = cols[ci]-cols[ci-1]
                for r in rgs
                    @do.change r[0], @lines[r[0]].splice cols[ci-1], length
                @do.cursors ([cols[ci-1], r[0]] for r in rgs)
                
    checkSalterMode: ->        
        return if not @salterMode
        # log 'salterMode?'
        @setSalterMode false
        return if @cursors.length != 5
        cp = @cursors[0]
        for c in @cursors.slice 1
            return if c[0] != cp[0]
            return if c[1] != cp[1]+1
            cp = c
        rgs = @salterRangesAtPos()
        return if not rgs? or rgs[0][0] != @cursors[0][1]
        cols = @columnsInSalt (@textInRange r for r in rgs)
        return if @cursors[0][0] < cols[0]
        # log "salterMode still active!"
        @setSalterMode true
                                    
    columnsInSalt: (salt) ->
        max = _.max (s.length for s in salt)
        min = _.min (s.search /0/ for s in salt)
        cols = [min]
        for col in [min..max]
            s = 0
            for i in [0...5]
                s += 1 if salt[i].slice(col, col+2) == '  '
            cols.push col if s == 5
        cols.push max
        cols
    
    salterRangesAtPos: (p=@cursorPos()) ->
        salterRegExp = new RegExp("^\\s*#{@lineComment}[0\\s]+$")
        rgs = []
        li = p[1]
        while rgs.length < 5 and li < @lines.length and salterRegExp.test @lines[li]
            rgs.push @rangeForLineAtIndex li
            li += 1
        return if not rgs.length
        li = p[1]-1
        while rgs.length < 5 and li >= 0 and salterRegExp.test @lines[li]
            rgs.unshift @rangeForLineAtIndex li
            li -= 1
        return rgs if rgs.length == 5
      
    setSalterMode: (active=true) ->
        @salterMode = active
        @layerDict?['cursors']?.classList.toggle "salterMode", active
                            
    #  0000000  000  000   000   0000000   000      00000000
    # 000       000  0000  000  000        000      000     
    # 0000000   000  000 0 000  000  0000  000      0000000 
    #      000  000  000  0000  000   000  000      000     
    # 0000000   000  000   000   0000000   0000000  00000000
    
    singleCursorAtPos: (p, e) ->
        p = @clampPos p
        if e and @initialCursors?.length > 1
            @initialCursors = _.cloneDeep [@initialCursors[0]]
        else if not e
            @initialCursors = _.cloneDeep [p]
        @startSelection e
        @mainCursor = [p[0], p[1]]
        @do.cursors [@mainCursor], keepInitial: true
        @endSelection e
        
    selectSingleRange: (r) ->
        if not r?
            log "editor.#{name}.selectSingleRange warning! undefined range #{r}"
            return
        @cursors = [[r[1][0], r[0]]]
        @initialCursors = null
        @startSelection true
        @mainCursor = [r[1][1], r[0]]
        @do.cursors [@mainCursor], keepInitial: true     
        @endSelection true
            
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000

    startStickySelection: () -> 
        @stickySelection = true
        @updateTitlebar?()
        @emit 'selection'

    endStickySelection: () ->
        @stickySelection = false
        @updateTitlebar?()
        @emit 'selection'
        
    startSelection: (e) ->
        if e and not @initialCursors
            @initialCursors = _.cloneDeep @cursors
            if not @stickySelection
                @do.selections @rangesForCursors @initialCursors
        if not e and @do.actions.length
            if not @stickySelection
                @do.selections []
            
    endSelection: (e) ->
        
        if not e
            if @selections.length and not @stickySelection
                @selectNone()
            @initialCursors = _.cloneDeep @cursors
            
        if e and @initialCursors
            newSelection = @stickySelection and _.cloneDeep(@selections) or []
            if @initialCursors.length != @cursors.length
                log 'editor.endSelection warning! @initialCursors.length != @cursors.length', @initialCursors.length, @cursors.length
            
            for ci in [0...@initialCursors.length]
                ic = @initialCursors[ci]
                cc = @cursors[ci]
                ranges = @rangesBetweenPositions ic, cc, true #< extend to full lines if cursor at start of line                
                newSelection = newSelection.concat ranges
                    
            @do.selections newSelection
            
        @checkSalterMode()

    textOfSelectionForClipboard: -> 
        @selectMoreLines() if @selections.length == 0
        t = []
        for s in @selections
            t.push @textInRange s
        t.join '\n'

    #  0000000   0000000    0000000         00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000       000   000  000   000  0000  000  000        000     
    # 000000000  000   000  000   000       0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000       000   000  000   000  000  0000  000   000  000     
    # 000   000  0000000    0000000         000   000  000   000  000   000   0000000   00000000
    
    addRangeToSelection: (range) ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newSelections.push range
        newCursors = (@rangeEndPos(r) for r in newSelections)
        @mainCursor = last newCursors
        @do.cursors newCursors
        @do.selections newSelections
        @do.end()

    removeFromSelection: (sel) ->
        @do.start()
        si = @selections.indexOf sel
        newSelections = _.cloneDeep @selections
        newSelections.splice si, 1
        if newSelections.length
            newCursors = (@rangeEndPos(r) for r in newSelections)
            @mainCursor = newCursors[(newCursors.length+si-1) % newCursors.length]
            @do.cursors newCursors
        @do.selections newSelections
        @do.end()        

    selectNone:     => @do.selections []
    selectAll:      => @do.selections @rangesForAllLines()
    selectInverted: => 
        invertedRanges = []        
        sc = @selectedAndCursorLineIndices()
        for li in [0...@lines.length]
            if li not in sc
                invertedRanges.push @rangeForLineAtIndex li
        @do.selections invertedRanges

    # 00000000  000   000  000      000            000      000  000   000  00000000   0000000
    # 000       000   000  000      000            000      000  0000  000  000       000     
    # 000000    000   000  000      000            000      000  000 0 000  0000000   0000000 
    # 000       000   000  000      000            000      000  000  0000  000            000
    # 000        0000000   0000000  0000000        0000000  000  000   000  00000000  0000000 

    selectMoreLines: ->
        @do.start()
        newCursors = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        selectCursorLineAtIndex = (c,i) =>
            range = @rangeForLineAtIndex i
            newSelections.push range
            @oldCursorSet newCursors, c, range[1][1], range[0]
            
        start = false
        for c in @cursors
            if not @isSelectedLineAtIndex c[1]
                selectCursorLineAtIndex c, c[1]
                start = true
                
        if not start
            for c in @cursors
                selectCursorLineAtIndex c, c[1]+1 if c[1] < @lines.length-1
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    selectLessLines: -> 
        @do.start()
        newCursors    = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        for c in @reversedCursors()
            thisSel = @selectionsInLineAtIndex(c[1])
            if thisSel.length
                if @isSelectedLineAtIndex c[1]-1
                    s = @selectionsInLineAtIndex(c[1]-1)[0]
                    @oldCursorSet newCursors, c, s[1][1], s[0]
                newSelections.splice @indexOfSelection(thisSel[0]), 1

        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       

    moveLines: (dir='down') ->
        
        csr = @continuousCursorAndSelectedLineIndexRanges()
        
        return if not csr.length
        return if dir == 'up' and first(csr)[0] == 0
        return if dir == 'down' and last(csr)[1] == @lines.length-1
        
        d = dir == 'up' and -1 or 1
        
        @do.start()
        newCursors    = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections

        for r in csr.reversed()
            ls = []
            for li in [r[0]..r[1]]
                ls.push _.cloneDeep @lines[li]
            
            switch dir 
                when 'up'   then (si = r[0]-1) ; ls.push @lines[si]
                when 'down' then (si = r[0])   ; ls.unshift @lines[r[1]+1]

            for i in [0...ls.length]    
                @do.change si+i, ls[i]

        for s in @selections
            newSelections[@indexOfSelection s][0] += d
            
        for c in @cursors
            @oldCursorDelta newCursors, c, 0, d
                
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()       
            
    # 000   000  000   0000000   000   000  000      000   0000000   000   000  000000000
    # 000   000  000  000        000   000  000      000  000        000   000     000   
    # 000000000  000  000  0000  000000000  000      000  000  0000  000000000     000   
    # 000   000  000  000   000  000   000  000      000  000   000  000   000     000   
    # 000   000  000   0000000   000   000  0000000  000   0000000   000   000     000   

    highlightText: (text, opt) -> # called from find command
        @highlights = @rangesForText text, opt
        if @highlights.length
            switch opt?.select
                when 'after' then @selectSingleRange @rangeAfterPosInRanges(@cursorPos(), @highlights) ? first @highlights
                when 'first' then @selectSingleRange first @highlights            
            @scrollCursorToTop() if not opt?.noScroll            
        @renderHighlights()
        @emit 'highlight'

    highlightTextOfSelectionOrWordAtCursor: -> # command+e       
            
        if @selections.length == 0 
            srange = @rangeForWordAtPos @cursorPos()
            @selectSingleRange srange
            
        text = @textInRange @selections[0]
        if text.length
            
            if @highlights.length
                if text == @textInRange first @highlights # see if we can grow the current selection
                    largerRange = [@selections[0][0], [@selections[0][1][0]-1, @selections[0][1][1]]]
                    largerText = @textInRange largerRange
                    if largerText[0] in "@#$%&*+-!?:.'\"/" or /[A-Za-z]/.test largerText[0]
                        if largerText[0] in "'\"" # grow strings in both directions
                            nr = [@selections[0][0], [@selections[0][1][0]-1, @selections[0][1][1]+1]] 
                            nt = @textInRange nr
                            if nt[nt.length-1] == largerText[0]
                                largerText = nt
                                largerRange = nr
                        else if /[A-Za-z]/.test largerText[0] # grow whole words
                            while largerRange[1][0] > 0 and /[A-Za-z]/.test @lines[largerRange[0]][largerRange[1][0]-1]
                                largerRange[1][0] -= 1
                                largerText = @textInRange largerRange
                        text = largerText                        
                        @selectSingleRange largerRange if @selections.length == 1
            
            @highlights = @rangesForText text, max:9999
            @renderHighlights()
            @emit 'highlight'
            window.commandline.startCommand 'find' if window.commandline.command?.prefsID not in ['search', 'find']
            window.commandline.setText text
            @focus()

    clearHighlights: ->
        @highlights = []
        @renderHighlights()
        @emit 'highlight'

    selectAllHighlights: ->
        @do.start()
        if not @posInHighlights @cursorPos()
            @highlightTextOfSelectionOrWordAtCursor()
        @do.selections _.cloneDeep @highlights
        if @selections.length
            @do.cursors (@rangeEndPos(r) for r in @selections), closestMain: true
        @do.end()
    
    selectNextHighlight: -> # command+g
        if not @highlights.length
            searchText = window.commandline.commands.find?.current()
            @highlightText searchText if searchText?
        r = @rangeAfterPosInRanges @cursorPos(), @highlights
        r ?= first @highlights
        @selectSingleRange r
        @scrollCursorToTop()

    selectPrevHighlight: -> # command+shift+g
        if not @highlights.length
            @highlightText window.commandline.commands.find?.current()
        r = @rangeBeforePosInRanges @cursorPos(), @highlights
        r ?= last @highlights
        @selectSingleRange r

    highlightWordAndAddToSelection: -> # command+d
        cp = @cursorPos()
        if not @posInHighlights cp
            @highlightTextOfSelectionOrWordAtCursor() # this also selects
        else
            @do.start()
            sr = @rangeAtPosInRanges cp, @selections
            if sr # cursor in selection -> select next highlight
                r = @rangeAfterPosInRanges cp, @highlights
            else # select current highlight first
                r = @rangeAtPosInRanges cp, @highlights
            r ?= first @highlights
            @addRangeToSelection r
            @scrollCursorToTop()
            @do.end()
            
    removeSelectedHighlight: -> # command+shift+d
        cp = @cursorPos()
        sr = @rangeAtPosInRanges cp, @selections
        hr = @rangeAtPosInRanges cp, @highlights        
        @removeFromSelection sr if sr and hr

    # 00000000  00     00  000  000000000       00000000  0000000    000  000000000
    # 000       000   000  000     000          000       000   000  000     000   
    # 0000000   000000000  000     000          0000000   000   000  000     000   
    # 000       000 0 000  000     000          000       000   000  000     000   
    # 00000000  000   000  000     000          00000000  0000000    000     000   

    emitEdit: (action) ->
        @emit 'edit',
            action: action
            line:   @lines[@mainCursor[1]]
            before: @lines[@mainCursor[1]].slice 0, @mainCursor[0]
            after:  @lines[@mainCursor[1]].slice @mainCursor[0]
            cursor: @mainCursor
                    
    #  0000000  000   000  00000000    0000000   0000000   00000000 
    # 000       000   000  000   000  000       000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000  
    # 000       000   000  000   000       000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000
    
    setCursor: (c,l) ->
        @mainCursorMove = 0
        l = clamp 0, @lines.length-1, l
        c = clamp 0, @lines[l].length, c
        @do.cursors [[c,l]]
        
    toggleCursorAtPos: (p) ->
        if @cursorAtPos p
            @delCursorAtPos p
        else
            @addCursorAtPos p
        
    addCursorAtPos: (p) ->
        @mainCursorMove = 0
        newCursors = _.cloneDeep @cursors
        newCursors.push p
        @mainCursor = p
        @do.cursors newCursors        
        
    delCursorAtPos: (p) ->
        @mainCursorMove = 0
        c = @cursorAtPos p
        if c and @cursors.length > 1
            newCursors = _.cloneDeep @cursors
            newCursors.splice @indexOfCursor(c), 1
            @do.cursors newCursors, closestMain: true        
           
    addMainCursor: (dir='down') ->
        @mainCursorMove = 0
        d = switch dir
            when 'up'    then -1
            when 'down'  then +1
        newCursors = _.cloneDeep @cursors
        if not @cursorAtPos [@mainCursor[0], @mainCursor[1]+d]
            newCursors.push [@mainCursor[0], @mainCursor[1]+d]
            @mainCursor = last newCursors
        else
            @mainCursor = @cursorAtPos [@mainCursor[0], @mainCursor[1]+d]
        @do.cursors newCursors
                    
    addCursors: (dir='down') ->
        @mainCursorMove = 0
        return if @cursors.length >= 999
        d = switch dir
            when 'up'    then -1
            when 'down'  then +1
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            if not @cursorAtPos [c[0], c[1]+d]                
                newCursors.push [c[0], c[1]+d]
                break if newCursors.length >= 999
        @sortPositions newCursors
        switch dir
            when 'up'    then @mainCursor = first newCursors
            when 'down'  then @mainCursor = last  newCursors
        @do.cursors newCursors

    alignCursorsAndText: ->
        @do.start()
        @mainCursorMove = 0
        @clearHighlights()
        newCursors = _.cloneDeep @cursors
        newX = _.max (c[0] for c in @cursors)
        lines = {}
        for c in @cursors
            lines[c[1]] = c[0]
            @oldCursorSet newCursors, c, newX, c[1]
        for li, cx of lines
            @do.change li, @lines[li].slice(0, cx) + _.padStart('', newX-cx) + @lines[li].slice(cx)
        @do.cursors newCursors
        @do.end()

    alignCursors: (dir='down') ->
        @do.start()
        @mainCursorMove = 0
        charPos = switch dir
            when 'up'    then first(@cursors)[0]
            when 'down'  then last( @cursors)[0]
            when 'left'  then _.min (c[0] for c in @cursors)
            when 'right' then _.max (c[0] for c in @cursors)
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @oldCursorSet newCursors, c, charPos, c[1]
        switch dir
            when 'up'    then @mainCursor = first newCursors
            when 'down'  then @mainCursor = last  newCursors
        @do.cursors newCursors
        @do.end()
        
    clampCursors: ->
        newCursors = _.cloneDeep @cursors
        for c in @cursors
            @oldCursorSet newCursors, c, @clampPos c
        @do.cursors newCursors
    
    setCursorsAtSelectionBoundary: (leftOrRight='right') ->
        @mainCursorMove = 0
        i = leftOrRight == 'right' and 1 or 0
        @do.start()
        newCursors = []
        main = false
        for s in @selections
            p = @rangeIndexPos s,i
            if @isCursorInRange s
                @mainCursor = p
                main = true
            newCursors.push p
        @mainCursor = last newCursors if not main
        @do.cursors newCursors
        @do.end()       

    delCursors: (dir='up') ->
        @mainCursorMove = 0
        newCursors = _.cloneDeep @cursors
        @mainCursor = newCursors[@indexOfCursor @mainCursor]
        d = switch dir
            when 'up' 
                for c in @reversedCursors()                    
                    if @cursorAtPos([c[0], c[1]-1]) and not @cursorAtPos [c[0], c[1]+1]
                        ci = @indexOfCursor c
                        @mainCursor = @cursorAtPos([c[0], c[1]-1], newCursors) if newCursors[ci] == @mainCursor
                        newCursors.splice ci, 1
            when 'down' 
                for c in @reversedCursors()
                    if @cursorAtPos([c[0], c[1]+1]) and not @cursorAtPos [c[0], c[1]-1]
                        ci = @indexOfCursor c
                        @mainCursor = @cursorAtPos([c[0], c[1]+1], newCursors) if newCursors[ci] == @mainCursor
                        newCursors.splice ci, 1
        @do.cursors newCursors 
        
    clearCursors: () -> 
        @mainCursorMove = 0
        @do.cursors [@mainCursor] 

    clearCursorsAndHighlights: () ->
        @clearCursors()
        @highlights = []
        @renderHighlights()
        @emit 'highlight'
        
    clearSelections: () ->
        @do.selections []

    # 000   000  00000000  000   000          0000000  000   000  00000000    0000000   0000000   00000000 
    # 0000  000  000       000 0 000         000       000   000  000   000  000       000   000  000   000
    # 000 0 000  0000000   000000000         000       000   000  0000000    0000000   000   000  0000000  
    # 000  0000  000       000   000         000       000   000  000   000       000  000   000  000   000
    # 000   000  00000000  00     00          0000000   0000000   000   000  0000000    0000000   000   000
    
    oldCursorDelta: (newCursors, oc, dx, dy=0) ->
        nc = newCursors[@indexOfCursor oc]
        @mainCursor = nc if oc == @mainCursor
        @newCursorDelta newCursors, nc, dx, dy

    oldCursorSet: (newCursors, oc, x, y) ->
        nc = newCursors[@indexOfCursor oc]
        @mainCursor = nc if oc == @mainCursor
        @newCursorSet newCursors, nc, x, y
        
    newCursorDelta: (newCursors, nc, dx, dy=0) ->
        nc[0] += dx
        nc[1] += dy
        
    newCursorSet: (newCursors, nc, x, y) ->    
        [x,y] = x if not y? and x.length >=2
        nc[0] = x
        nc[1] = y

    # 00     00   0000000   000   000  00000000
    # 000   000  000   000  000   000  000     
    # 000000000  000   000   000 000   0000000 
    # 000 0 000  000   000     000     000     
    # 000   000   0000000       0      00000000

    moveAllCursors: (f, opt={}) ->        
        @mainCursorMove = 0
        @startSelection opt.extend
        newCursors = _.cloneDeep @cursors
        mainLine = @mainCursor[1]
        if @cursors.length > 1
            for c in @cursors
                newPos = f(c)
                if newPos[1] == c[1] or not opt.keepLine
                    mainLine = newPos[1] if c == @mainCursor
                    @oldCursorSet newCursors, c, newPos
        else
            @oldCursorSet newCursors, @cursors[0], f(@cursors[0])
            mainLine = newCursors[0][1]
        @mainCursor = first newCursors if opt.main == 'top'
        @mainCursor = last  newCursors if opt.main == 'bot'
        @mainCursor = first @positionsInLineAtIndexInPositions mainLine, newCursors if opt.main == 'left'
        @mainCursor = last  @positionsInLineAtIndexInPositions mainLine, newCursors if opt.main == 'right'
        @do.cursors newCursors, keepInitial: opt.extend
        @endSelection opt.extend
        true

    moveMainCursor: (dir='down') ->
        @mainCursorMove += 1
        [dx, dy] = switch dir
            when 'up'    then [0,-1]
            when 'down'  then [0,+1]
            when 'left'  then [-1,0]
            when 'right' then [+1,0]
        newCursors = _.cloneDeep @cursors
        if @mainCursorMove > 1
            _.remove newCursors, (c) => @isSamePos c, @mainCursor
        if not @cursorAtPos [@mainCursor[0]+dx, @mainCursor[1]+dy]
            newCursors.push [@mainCursor[0]+dx, @mainCursor[1]+dy]
            @mainCursor = last newCursors
        else
            @mainCursor = @cursorAtPos [@mainCursor[0]+dx, @mainCursor[1]+dy], newCursors
        @do.cursors newCursors
        
    moveCursorsToLineBoundary: (leftOrRight, e) ->
        @mainCursorMove = 0
        f = switch leftOrRight
            when 'right' then (c) => [@lines[c[1]].length, c[1]]
            when 'left'  then (c) => 
                if @lines[c[1]].slice(0,c[0]).trim().length == 0
                    [0, c[1]]
                else
                    d = @lines[c[1]].length - @lines[c[1]].trimLeft().length
                    [d, c[1]]
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsToWordBoundary: (leftOrRight, e) ->
        @mainCursorMove = 0
        f = switch leftOrRight
            when 'right' then @endOfWordAtCursor
            when 'left'  then @startOfWordAtCursor
        @moveAllCursors f, extend:e, keepLine:true
        true
    
    moveCursorsUp:   (e, n=1) ->                 
        @moveAllCursors ((n)->(c)->[c[0],c[1]-n])(n), extend:e, main: 'top'
                        
    moveCursorsRight: (e, n=1) ->
        moveRight = (n) -> (c) -> [c[0]+n, c[1]]
        @moveAllCursors moveRight(n), extend:e, keepLine:true, main: 'right'
    
    moveCursorsLeft: (e, n=1) ->
        moveLeft = (n) -> (c) -> [Math.max(0,c[0]-n), c[1]]
        @moveAllCursors moveLeft(n), extend:e, keepLine:true, main: 'left'
        
    moveCursorsDown: (e, n=1) ->
        if e and @selections.length == 0 # selecting lines down
            if 0 == _.max (c[0] for c in @cursors) # all cursors in first column
                @do.selections @rangesForCursorLines() # select lines without moving cursors
                return
        else if e and @stickySelection and @cursors.length == 1
            if @mainCursor[0] == 0 and not @isSelectedLineAtIndex @mainCursor[1]
                @do.start()
                newSelections = _.cloneDeep @selections
                newSelections.push @rangeForLineAtIndex @mainCursor[1]
                @do.selections newSelections
                @do.end()
                return
            
        @moveAllCursors ((n)->(c)->[c[0],c[1]+n])(n), extend:e, main: 'bot'
        
    moveCursors: (direction, e) ->
        switch direction
            when 'left'  then @moveCursorsLeft  e
            when 'right' then @moveCursorsRight e
            when 'up'    then @moveCursorsUp    e
            when 'down'  then @moveCursorsDown  e

    # 000  000   000  0000000    00000000  000   000  000000000
    # 000  0000  000  000   000  000       0000  000     000   
    # 000  000 0 000  000   000  0000000   000 0 000     000   
    # 000  000  0000  000   000  000       000  0000     000   
    # 000  000   000  0000000    00000000  000   000     000   

    deIndent: -> 
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors    = _.cloneDeep @cursors
        for i in @selectedAndCursorLineIndices()
            if @lines[i].startsWith @indentString
                @do.change i, @lines[i].substr @indentString.length
                for c in @cursorsInLineAtIndex i
                    @oldCursorDelta newCursors, c, -@indentString.length
                for s in @selectionsInLineAtIndex i
                    ns = newSelections[@indexOfSelection s]
                    ns[1][0] -= @indentString.length
                    ns[1][1] -= @indentString.length
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        @clearHighlights()
        
    indent: ->
        @do.start()
        newSelections = _.cloneDeep @selections
        newCursors    = _.cloneDeep @cursors
        for i in @selectedAndCursorLineIndices()
            @do.change i, @indentString + @lines[i]
            for c in @cursorsInLineAtIndex i
                @oldCursorDelta newCursors, c, @indentString.length
            for s in @selectionsInLineAtIndex i
                ns = newSelections[@indexOfSelection s]
                ns[1][0] += @indentString.length
                ns[1][1] += @indentString.length
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
        @clearHighlights()

    indentStringForLineAtIndex: (li) -> _.padStart "", @indentationAtLineIndex li
           
    #  0000000   0000000   00     00  00     00  00000000  000   000  000000000
    # 000       000   000  000   000  000   000  000       0000  000     000   
    # 000       000   000  000000000  000000000  0000000   000 0 000     000   
    # 000       000   000  000 0 000  000 0 000  000       000  0000     000   
    #  0000000   0000000   000   000  000   000  00000000  000   000     000   

    toggleComment: ->
        
        @do.start()
        newCursors    = _.cloneDeep @cursors
        newSelections = _.cloneDeep @selections
        
        moveInLine = (i, d) => 
            for s in @selectionsInLineAtIndex i
                newSelections[@selections.indexOf s][1][0] += d
                newSelections[@selections.indexOf s][1][1] += d
            for c in @cursorsInLineAtIndex i
                @oldCursorDelta newCursors, c, d
                
        for i in @selectedAndCursorLineIndices()
            cs = @lines[i].indexOf @lineComment
            if cs >= 0 and @lines[i].substr(0,cs).trim().length == 0
                # remove comment
                @do.change i, @lines[i].splice cs, @lineComment.length
                moveInLine i, -@lineComment.length
                si = @indentationAtLineIndex i
                if si % @indentString.length == 1 # remove space after indent
                    @do.change i, @lines[i].splice si-1, 1
                    moveInLine i, -1
            else # insert comment
                si = @indentationAtLineIndex i
                if @lines[i].length > si
                    l = (@lineComment + " ").length
                    @do.change i, @lines[i].splice si, 0, @lineComment + " "
                    moveInLine i, l
        @do.selections newSelections
        @do.cursors newCursors
        @do.end()
 
    # 000  000   000   0000000  00000000  00000000   000000000
    # 000  0000  000  000       000       000   000     000   
    # 000  000 0 000  0000000   0000000   0000000       000   
    # 000  000  0000       000  000       000   000     000   
    # 000  000   000  0000000   00000000  000   000     000   
    
    insertUserCharacter: (ch) ->
        
        return if @salterMode and @insertSalterCharacter ch
        
        @do.start()
        @clearHighlights()
        if @cursors.length == 1
            @clampCursors()
        else
            @fillVirtualSpaces()
                
        if ch in @surroundCharacters
            if @insertSurroundCharacter ch
                @do.end()
                return

        if ch == '\n'
            @insertNewline indent:true
            @do.end()
            return
    
        if ch == '<' and @cursors.length == 1 and @lineComment?
            cp = @cursorPos()
            cl = @lineComment.length
            if cp[0] >= cl and @lines[cp[1]][cp[0]-cl] == @lineComment
                ws = @wordStartPosAfterPos()
                if ws?
                    wd = @textInRange @rangeForWordAtPos ws
                    wd += @textInRange @rangeForWordAtPos [ws[0]+1, ws[1]] if wd == '@'
                    @do.change cp[1], @lines[cp[1]].splice cp[0], 0, '>' + wd
                    @do.end()
                    return
        
        @deleteSelection()
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors # this looks weird
            oc = newCursors[@indexOfCursor c]
            if oc.length < 2 or oc[1] >= @lines.length
                alert "wtf?"
                throw new Error
            @do.change oc[1], @lines[oc[1]].splice oc[0], 0, ch
            for nc in @positionsInLineAtIndexInPositions oc[1], newCursors
                if nc[0] >= oc[0]
                    nc[0] += 1
                    if @isMainCursor nc
                        nc[0] += 1

        @do.cursors newCursors
            
        @do.end()
        @emitEdit 'insert'
    
    fillVirtualSpaces: () -> # fill spaces between line ends and cursors
        for c in @cursors 
            if c[0] > @lines[c[1]].length
                @do.change c[1], @lines[c[1]].splice c[0], 0, _.padStart '', c[0]-@lines[c[1]].length

    insertTab: ->
        if @selections.length
            @indent()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            il = @indentString.length
            for c in @cursors
                n = 4-(c[0]%il)
                @do.change c[1], @lines[c[1]].splice c[0], 0, _.padStart "", n
                @oldCursorDelta newCursors, c, n
            @do.cursors newCursors
            @do.end()   
        
    # 000   000  00000000  000   000  000      000  000   000  00000000
    # 0000  000  000       000 0 000  000      000  0000  000  000     
    # 000 0 000  0000000   000000000  000      000  000 0 000  0000000 
    # 000  0000  000       000   000  000      000  000  0000  000     
    # 000   000  00000000  00     00  0000000  000  000   000  00000000
        
    insertNewline: (opt) ->
        
        if @salterMode?
            @mainCursor = @rangeEndPos @rangeForLineAtIndex @mainCursor[1]
            @cursors = [@mainCursor]
            @setSalterMode false
            
        @surroundStack = []
        @deleteSelection()
        @do.start()
        
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors.reversed()
        
            after  = @lines[c[1]].substr c[0]
            after  = after.trimLeft() if opt?.indent
            before = @lines[c[1]].substr 0, c[0]
        
            if opt?.indent
                line = before.trimRight()
                il = 0
                thisIndent = @indentationAtLineIndex c[1]
                indentLength = @indentString.length
                for e in ['->', '=>', ':', ',', '=']
                    if line.endsWith e
                        il = thisIndent + indentLength
                        break
                if il == 0
                    if /(^|\s)(else\s*$|switch\s|for\s|while\s|class\s)/.test before
                        il = thisIndent + indentLength
                    else if /^(\s+when|\s*if|\s*else\s+if\s+)(?!.*\sthen\s)/.test line
                        il = thisIndent + indentLength
                    else il = thisIndent
                
                if /(when|if)/.test before 
                    if after.startsWith 'then '
                        after = after.slice(4).trimLeft() # remove then
                    else if before.trim().endsWith 'then'
                        before = before.trimRight()
                        before = before.slice 0, before.length-4 # remove then
                        
                else if before.trim().startsWith 'return' # indent less after return
                    il = -indentLength
                
                nextIndent = @indentationAtLineIndex c[1]+1
                il = nextIndent if nextIndent > il
                indent = _.padStart "", il
            else
                indent = ''

            bl = c[0]
            
            if @isCursorAtEndOfLine c
                @do.insert c[1]+1, indent
            else
                @do.insert c[1]+1, indent + after
                @do.change c[1],   before

            # move cursors in and below deleted line down
            for nc in @positionsFromPosInPositions c, newCursors
                @newCursorDelta newCursors, nc, nc[1] == c[1] and indent.length - bl or 0, 1
        
        @do.cursors newCursors    
        @do.end()
        
    # 00000000    0000000    0000000  000000000  00000000
    # 000   000  000   000  000          000     000     
    # 00000000   000000000  0000000      000     0000000 
    # 000        000   000       000     000     000     
    # 000        000   000  0000000      000     00000000
        
    paste: (text) -> 
        
        @deleteSelection()
        @do.start()        
        @fillVirtualSpaces()
        
        l = text.split '\n'
        if @cursors.length > 1 and l.length == 1
            l = (l[0] for c in @cursors)
        
        if @cursors.length > 1 or l.length == 1 and not @isCursorAtStartOfLine()
            newCursors = _.cloneDeep @cursors
            # log "insert.paste: paste #{l.length} lines into #{@cursors.length} cursors"
            for ci in [@cursors.length-1..0]
                c = @cursors[ci]
                insert = l[ci % l.length]
                @do.change c[1], @lines[c[1]].splice c[0], 0, insert
                for c in @positionsAfterLineColInPositions c[1], c[0], @cursors
                    @oldCursorDelta newCursors, c, insert.length
        else
            # log "insert.paste: paste #{l.length} lines into single cursor"
            cp = @cursorPos()
            li = cp[1]
            if not @isCursorAtStartOfLine()
                rest   = @lines[li].substr(@cursorPos()[0]).trimLeft()
                indt   = _.padStart "", @indentationAtLineIndex cp[1] 
                before = @lines[cp[1]].substr 0, cp[0]
                if before.trim().length
                    @do.change li, before
                    li += 1
                    if (indt + rest).trim().length
                        l.push indt + rest
                        @mainCursor = [0,li+l.length-1]
                    else
                        @mainCursor = null
            else 
                @mainCursor = null
            for line in l
                @do.insert li, line
                li += 1
            @mainCursor = [0, li] if not @mainCursor?           
            newCursors = [@mainCursor]
                
        @do.cursors newCursors
        @do.end()
    
    #  0000000  000   000  00000000   00000000    0000000   000   000  000   000  0000000  
    # 000       000   000  000   000  000   000  000   000  000   000  0000  000  000   000
    # 0000000   000   000  0000000    0000000    000   000  000   000  000 0 000  000   000
    #      000  000   000  000   000  000   000  000   000  000   000  000  0000  000   000
    # 0000000    0000000   000   000  000   000   0000000    0000000   000   000  0000000  
        
    insertSurroundCharacter: (ch) ->        
        
        if @surroundStack.length
            if last(@surroundStack)[1] == ch
                for c in @cursors 
                    if @lines[c[1]][c[0]] != ch
                        @surroundStack = []
                        break
                if @surroundStack.length and last(@surroundStack)[1] == ch
                    @do.start()
                    @selectNone()
                    @deleteForward()
                    @do.end()
                    @surroundStack.pop()
                    return false
        
        if ch == '#' and @fileType == 'coffee' # check if any cursor or selection is inside a string
            found = false
            for s in @selections
                if @isRangeInString s
                    found = true
                    break
                    
            if not found
                for c in @cursors
                    if @isRangeInString @rangeForPos c
                        found = true
                        break
            return false if not found
            
        if ch == "'" and not @selections.length # check if any alpabetical character is before any cursor
            for c in @cursors
                if c[0] > 0 and /[A-Za-z]/.test @lines[c[1]][c[0]-1] 
                    return false
        
        @do.start()
        if @selections.length == 0
            newSelections = @rangesForCursors()
        else
            newSelections = _.cloneDeep @selections
            
        newCursors = _.cloneDeep @cursors

        [cl,cr] = @surroundPairs[ch]
            
        @surroundStack.push [cl,cr]
        
        for ns in newSelections
            leftdelta = cl.length
            for c in @cursorsInRange ns
                @oldCursorDelta newCursors, c, leftdelta
            
            if cl == '#{' # convert single string to double string
                if sr = @rangeOfStringSurroundingRange ns
                    if @lines[sr[0]][sr[1][0]] == "'"
                        @do.change ns[0], @lines[ns[0]].splice sr[1][0], 1, '"'
                    if @lines[sr[0]][sr[1][1]-1] == "'"
                        @do.change ns[0], @lines[ns[0]].splice sr[1][1]-1, 1, '"'
                        
            else if @fileType == 'coffee' and cl == '(' and @lengthOfRange(ns) > 0 # remove space after callee
                before = @lines[ns[0]].slice 0, ns[1][0]
                after  = @lines[ns[0]].slice ns[1][0]
                trimmed = before.trimRight()
                beforeGood = /\w$/.test(trimmed) and not /(if|when|in|and|or|is|not|else|return)$/.test trimmed
                afterGood = after.trim().length and not after.startsWith ' '
                if beforeGood and afterGood
                    spaces = before.length-trimmed.length
                    @do.change ns[0], @lines[ns[0]].splice trimmed.length, spaces
                    ns[1][0] -= spaces
                    ns[1][1] -= spaces
                    leftdelta -= spaces

            @do.change ns[0], @lines[ns[0]].splice ns[1][1], 0, cr
            @do.change ns[0], @lines[ns[0]].splice ns[1][0], 0, cl
                            
            ns[1][0] += cl.length
            ns[1][1] += cl.length
            
        @do.selections @rangesNotEmptyInRanges newSelections
        @do.cursors newCursors
        @do.end()
        return true

    # 0000000    00000000  000      00000000  000000000  00000000
    # 000   000  000       000      000          000     000     
    # 000   000  0000000   000      0000000      000     0000000 
    # 000   000  000       000      000          000     000     
    # 0000000    00000000  0000000  00000000     000     00000000
    
    joinLines: ->
        @do.start()
        newCursors = []
        for c in @cursors.reversed()
            if not @isCursorInLastLine c
                before = @lines[c[1]].trimRight() + " "
                after  = @lines[c[1]+1].trimLeft()
                @do.change c[1], before + after
                @do.delete c[1]+1
                newCursors.push [before.length, c[1]]
                for nc in @positionsInLineAtIndexInPositions c[1]+1, newCursors 
                    @newCursorDelta newCursors, nc, before.length, -1 
                for nc in @positionsBelowLineIndexInPositions c[1], newCursors 
                    @newCursorDelta newCursors, nc, 0, -1
        @do.cursors newCursors
        @mainCursor = first @cursors
        @do.end()
            
    deleteLineAtIndex: (i) -> @do.delete i
    
    #  0000000  00000000  000      00000000   0000000  000000000  000   0000000   000   000
    # 000       000       000      000       000          000     000  000   000  0000  000
    # 0000000   0000000   000      0000000   000          000     000  000   000  000 0 000
    #      000  000       000      000       000          000     000  000   000  000  0000
    # 0000000   00000000  0000000  00000000   0000000     000     000   0000000   000   000
    
    deleteSelection: ->
        return if not @selections.length
        @do.start()
        newCursors = _.cloneDeep @cursors
        
        for c in @cursors
            sp = @startPosOfContinuousSelectionAtPos c            
            @oldCursorSet newCursors, c, sp[0], sp[1] if sp?

        for s in @reversedSelections()
            continue if s[0] >= @lines.length
            lineSelected = s[1][0] == 0 and s[1][1] == @lines[s[0]].length
            if lineSelected and @lines.length > 1
                @do.delete s[0]
                # move cursors below deleted line up
                for nc in @positionsBelowLineIndexInPositions s[0], newCursors
                    @newCursorSet newCursors, nc, 0, -1
            else
                continue if s[0] >= @lines.length
                if not @lines[s[0]].splice?
                    log "wtf? #{@lines.length} #{@lines[0]} lines:", @lines
                    break
                @do.change s[0], @lines[s[0]].splice s[1][0], s[1][1]-s[1][0]
                for nc in @positionsFromPosInPositions [s[1][1], s[0]], @positionsInLineAtIndexInPositions s[0], newCursors
                    @newCursorDelta newCursors, nc, -(s[1][1]-s[1][0])
                    
        @do.selections []
        @do.cursors newCursors
        @do.end()
        @clearHighlights()        
        @checkSalterMode()
        
    deleteTab: ->
        if @selections.length
            @deIndent()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @cursors
                if c[0]
                    n = (c[0] % @indentString.length) or @indentString.length
                    t = @textInRange [c[1], [c[0]-n, c[0]]]
                    if t.trim().length == 0
                        @do.change c[1], @lines[c[1]].splice c[0]-n, n
                        @oldCursorDelta newCursors, c, -n
            @do.cursors newCursors
            @do.end()
            @clearHighlights()
    
    # 00000000   0000000   00000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000 0 000  000   000  000   000  000   000
    # 000000    000   000  0000000    000000000  000000000  0000000    000   000
    # 000       000   000  000   000  000   000  000   000  000   000  000   000
    # 000        0000000   000   000  00     00  000   000  000   000  0000000  
    
    deleteForward: ->
        if @selections.length
            @deleteSelection()
        else
            @do.start()
            newCursors = _.cloneDeep @cursors
            for c in @reversedCursors()
            
                if @isCursorAtEndOfLine c # cursor at end of line
                    if not @isCursorInLastLine c # cursor not in first line
                    
                        ll = @lines[c[1]].length
                    
                        @do.change c[1], @lines[c[1]] + @lines[c[1]+1]
                        @do.delete c[1]+1
                                    
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1]+1, newCursors
                            @newCursorDelta newCursors, nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1]+1, newCursors
                            @newCursorDelta newCursors, nc, 0, -1
                else
                    @do.change c[1], @lines[c[1]].splice c[0], 1
                    for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                        if nc[0] > c[0]
                            @newCursorDelta newCursors, nc, -1

            @do.cursors newCursors
            @do.end()
            @clearHighlights()
     
    # 0000000     0000000    0000000  000   000  000   000   0000000   00000000   0000000  
    # 000   000  000   000  000       000  000   000 0 000  000   000  000   000  000   000
    # 0000000    000000000  000       0000000    000000000  000000000  0000000    000   000
    # 000   000  000   000  000       000  000   000   000  000   000  000   000  000   000
    # 0000000    000   000   0000000  000   000  00     00  000   000  000   000  0000000  
    
    deleteBackward: (opt) ->
                
        @do.start()
        if @selections.length
            @deleteSelection()
        else if @cursors.length == 1 and not @isSamePos @mainCursor, @cursorPos()
            @mainCursor = @cursorPos()
            @do.cursors [@mainCursor]
        else if @salterMode
            @deleteSalterCharacter()
        else            
            if @surroundStack.length
                so = last(@surroundStack)[0]
                sc = last(@surroundStack)[1]
                for c in @cursors
                    prv = ''
                    prv = @lines[c[1]].slice c[0]-so.length, c[0] if c[0] >= so.length
                    nxt = @lines[c[1]].slice c[0], c[0]+sc.length
                    if prv != so or nxt != sc
                        @surroundStack = []
                        break
                if @surroundStack.length
                    for i in [0...so.length]
                        @deleteCharacterBackward opt
                    for i in [0...sc.length]
                        @deleteForward()
                    @surroundStack.pop()
                    @clearHighlights()
                    @do.end()
                    return
            
            @deleteCharacterBackward opt
            @clearHighlights()
        @do.end()

    deleteCharacterBackward: (opt) ->
        newCursors = _.cloneDeep @cursors        
        for c in @reversedCursors()
            if c[0] == 0        # cursor at start of line
                if opt?.ignoreLineBoundary or @cursors.length == 1
                    if c[1] > 0 # cursor not in first line
                        ll = @lines[c[1]-1].length
                        @do.change c[1]-1, @lines[c[1]-1] + @lines[c[1]]
                        @do.delete c[1]
                        # move cursors in joined line
                        for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                            @newCursorDelta newCursors, nc, ll, -1
                        # move cursors below deleted line up
                        for nc in @positionsBelowLineIndexInPositions c[1], newCursors
                            @newCursorDelta newCursors, nc, 0, -1
            else
                n = (c[0] % @indentString.length) or @indentString.length
                t = @textInRange [c[1], [Math.max(0, c[0]-n-1), c[0]]]
                if t.trim().length != 0
                    n = 1
                @do.change c[1], @lines[c[1]].splice c[0]-n, n
                for nc in @positionsInLineAtIndexInPositions c[1], newCursors
                    if nc[0] >= c[0]
                        @newCursorDelta newCursors, nc, -n
        @do.cursors newCursors
        
module.exports = Editor
