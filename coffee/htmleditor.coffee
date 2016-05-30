# 000   000  000000000  00     00  000      00000000  0000000    000  000000000   0000000   00000000 
# 000   000     000     000   000  000      000       000   000  000     000     000   000  000   000
# 000000000     000     000000000  000      0000000   000   000  000     000     000   000  0000000  
# 000   000     000     000 0 000  000      000       000   000  000     000     000   000  000   000
# 000   000     000     000   000  0000000  00000000  0000000    000     000      0000000   000   000

Editor    = require './editor'
html      = require './html'
log       = require './tools/log'
drag      = require './tools/drag'
keyinfo   = require './tools/keyinfo'
{clamp,$} = require './tools/tools'
electron  = require('electron')
clipboard = electron.clipboard
webframe  = electron.webFrame

class HtmlEditor extends Editor

    constructor: (elem, className) ->
        super

        @elem = elem
        @clss = className
        @divs = []
        
        @topIndex = 0
        @botIndex = 0
        @scroll   = 0
        @scrollRight = $('.scroll.right', @elem.parentElement)
        @scrollDrag = new drag 
            target: $('.scrollbar.right', @elem.parentElement)
            onMove: @onScrollDrag 
            cursor: 'ns-resize'
    
        @initCharSize()
        
        @elem.onkeydown = @onKeyDown
        @elem.addEventListener 'wheel',   @onWheel

        while @elem.children.length < 170
            @addLine()

        @scrollBy 0

        # 00     00   0000000   000   000   0000000  00000000
        # 000   000  000   000  000   000  000       000     
        # 000000000  000   000  000   000  0000000   0000000 
        # 000 0 000  000   000  000   000       000  000     
        # 000   000   0000000    0000000   0000000   00000000
             
        @drag = new drag
            target:  @elem
            cursor:  'default'
            onStart: (drag, event) =>
                
                if @doubleClicked
                    clearTimeout @tripleClickTimer
                    if @posForEvent(event)[1] == @tripleClickLineIndex
                        return if @tripleClicked
                        @doubleClicked = true
                        @tripleClicked = true
                        @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
                        @startSelection event.shiftKey
                        @selectRanges @rangesForCursorLine()
                        @endSelection true
                        return
                    else
                        @doubleClicked = false
                        @tripleClicked = false
                        @tripleClickTimer = null
                        
                @startSelection event.shiftKey
                @elem.focus()
                @moveCursorToPos @posForEvent event
                @endSelection event.shiftKey
            
            onMove: (drag, event) => 
                @startSelection true
                @moveCursorToPos @posForEvent event
                @endSelection true
                
        @elem.ondblclick = (event) =>
            @startSelection event.shiftKey
            ranges = @rangesForWordAtPos @posForEvent event
            @selectRanges ranges
            @doubleClicked = true
            @tripleClickTimer = setTimeout @onTripleClickDelay, 1500
            @tripleClickLineIndex = ranges[0][1]
            @endSelection true
            
    onTripleClickDelay: => @doubleClicked = @tripleClicked = false

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000   
    #    000     0000000     00000       000   
    #    000     000        000 000      000   
    #    000     00000000  000   000     000   

    setText: (text) -> @setLines text.split /\n/
        
    setLines: (lines) ->
        @lines = lines
        @updateSizeValues()
        # log 'setLines'
        @displayLines 0

    displayLines: (top) ->
        # log 'displayLines', top, @numViewLines(), @elem.clientHeight, @elem.offsetHeight
        @topIndex = top
        @botIndex = top+@numViewLines()
        @updateScrollbar()
        @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000     
    # 000   000  00000000   000   000  000000000     000     0000000 
    # 000   000  000        000   000  000   000     000     000     
    #  0000000   000        0000000    000   000     000     00000000

    done: => @linesChanged @do.changedLineIndices

    updateSizeValues: ->
        @bufferHeight = @numVisibleLines() * @lineHeight
        @editorHeight = @numViewLines() * @lineHeight
        @scrollMax    = @bufferHeight - @editorHeight + @lineHeight
        # log "updateSizeValues", @viewHeight(), @editorHeight
    
    resized: -> 
        oldHeight = @editorHeight
        @updateSizeValues()
        if @editorHeight > oldHeight
            @displayLines @topIndex
    
    deltaToEnsureCursorIsVisible: ->
        delta = 0
        cl = @cursor[1]
        if cl < @topIndex + 2
            newTop = Math.max 0, cl - 2
            delta = newTop - @topIndex
        else if cl > @botIndex - 2
            newBot = Math.min @lines.length+1, cl + 4
            delta = newBot - @botIndex
        return delta
    
    linesChanged: (lineIndices) ->
        # log 'linesChanged', lineIndices
        
        if delta = @deltaToEnsureCursorIsVisible() 
            # log "delta", delta, delta * @lineHeight
            @scrollBy delta * @lineHeight #todo: slow down when using mouse
            return
        
        indices = []
        for change in lineIndices
            continue if change[0] > @botIndex
            top = Math.max @topIndex, change[0]
            if change[1] < 0
                bot = 1+Math.min @botIndex, @lines.length-1
            else
                bot = 1+Math.min @botIndex, change[1]
            for i in [top...bot]
                indices.push i
                    
        indices.sort (a,b) -> a - b
        indices = _.sortedUniq indices
        # log 'cl:', @cursor[1], 't:', @topIndex, 'b:', @botIndex, 'changed:', indices.join ','
        for i in indices
            @updateLine i
            
        @updateSizeValues()
        @updateScrollbar()

    updateLine: (lineIndex) ->
        if @topIndex <= lineIndex <= @botIndex
            relIndex = lineIndex - @topIndex
            # log 'updateLine', lineIndex, 'rel', relIndex, @topIndex, @botIndex
            span = html.renderLine lineIndex, @lines, @cursor, @selectionRanges(), @charSize
            @divs[relIndex] = span
            @elem.children[relIndex].innerHTML = span

    addLine: ->
        div = document.createElement 'div'
        div.className = 'line'
        @elem.appendChild div

    update: =>
        # log 'update'
        @divs = []
        for c in [0...@elem.children.length]
            i = c + @topIndex
            @elem.children[c].id = "line-#{i}"
            if i < @lines.length
                span = html.renderLine i, @lines, @cursor, @selectionRanges(), @charSize
                @divs.push span
                @elem.children[c].innerHTML = span
            else
                @divs.push ""
                @elem.children[c].innerHTML = ""

    # 00000000    0000000    0000000
    # 000   000  000   000  000     
    # 00000000   000   000  0000000 
    # 000        000   000       000
    # 000         0000000   0000000 
    
    posForEvent: (event) ->
        sl = @elem.scrollLeft
        st = @elem.scrollTop
        br = @elem.getBoundingClientRect()
        lx = clamp 0, @elem.offsetWidth,  event.clientX - br.left
        ly = clamp 0, @elem.offsetHeight, event.clientY - br.top
        [parseInt(Math.floor((Math.max(0, sl + lx-10))/@charSize[0])),
         parseInt(Math.floor((Math.max(0, st + ly))/@charSize[1])) + @topIndex]

    # 000      000  000   000  00000000   0000000
    # 000      000  0000  000  000       000     
    # 000      000  000 0 000  0000000   0000000 
    # 000      000  000  0000  000            000
    # 0000000  000  000   000  00000000  0000000 
    
    viewHeight:      -> @elem.getBoundingClientRect().height #@elem.parentElement.offsetHeight
    numViewLines:    -> Math.ceil(@viewHeight() / @lineHeight)
    numFullLines:    -> Math.floor(@viewHeight() / @lineHeight)
    numVisibleLines: -> @lines.length

    #  0000000   0000000  00000000    0000000   000      000    
    # 000       000       000   000  000   000  000      000    
    # 0000000   000       0000000    000   000  000      000    
    #      000  000       000   000  000   000  000      000    
    # 0000000    0000000  000   000   0000000   0000000  0000000
        
    updateScrollbar: ->
        if @bufferHeight < @viewHeight()
            @scrollRight.style.top    = "0"
            @scrollRight.style.height = "0"
        else
            vh           = Math.min @editorHeight, @viewHeight()
            scrollTop    = parseInt (@scroll / @bufferHeight) * vh
            scrollHeight = parseInt (@editorHeight / @bufferHeight) * vh
            scrollHeight = Math.max scrollHeight, parseInt @lineHeight/4
            scrollTop    = Math.min scrollTop, @viewHeight()-scrollHeight
            scrollTop    = Math.max 0, scrollTop
                    
            @scrollRight.style.top    = "#{scrollTop}.px"
            @scrollRight.style.height = "#{scrollHeight}.px"
                
    scrollLines: (lineDelta) -> @scrollBy lineDelta * @lineHeight

    scrollFactor: (event) ->
        f  = 1 
        f *= 1 + 1 * event.shiftKey
        f *= 1 + 3 * event.metaKey        
        f *= 1 + 7 * event.altKey

    scrollBy: (delta) -> 
                
        @updateSizeValues()
        
        @scroll += delta
        @scroll = Math.min @scroll, @scrollMax
        @scroll = Math.max @scroll, 0
        
        top = parseInt @scroll / @lineHeight

        if @topIndex != top
            @displayLines top
        else
            @updateScrollbar()
            
    onWheel: (event) => 
        @scrollBy event.deltaY * @scrollFactor event
        
    onScrollDrag: (drag) =>
        delta = (drag.delta.y / @editorHeight) * @bufferHeight
        @scrollBy delta
    
    #  0000000  000   000   0000000   00000000    0000000  000  0000000  00000000
    # 000       000   000  000   000  000   000  000       000     000   000     
    # 000       000000000  000000000  0000000    0000000   000    000    0000000 
    # 000       000   000  000   000  000   000       000  000   000     000     
    #  0000000  000   000  000   000  000   000  0000000   000  0000000  00000000

    initCharSize: () ->
        o = document.createElement 'div'
        o.className = @clss
        o.innerHTML = 'XXXXXXXXXX'
        o.style = 
          float:      'left'
          visibility: 'hidden'
        document.body.appendChild o
        @charSize = [o.clientWidth/o.innerHTML.length, o.clientHeight]
        @lineHeight = @charSize[1]
        # log '@charSize', @charSize, '@lineHeight', @lineHeight
        o.remove()
    
    # 0000000   0000000    0000000   00     00
    #    000   000   000  000   000  000   000
    #   000    000   000  000   000  000000000
    #  000     000   000  000   000  000 0 000
    # 0000000   0000000    0000000   000   000
        
    resetZoom: -> 
        webframe.setZoomFactor 1
        @initCharSize()
        
    changeZoom: (d) -> 
        z = webframe.getZoomFactor() 
        z *= 1+d/20
        z = clamp 0.36, 5.23, z
        webframe.setZoomFactor z
        @initCharSize()
            
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    onKeyDown: (event) =>
        {mod, key, combo} = keyinfo.forEvent event
        # log "editor key:", key, "mod:", mod, "combo:", combo
        return if not combo
        return if key == 'right click' # weird right command key
        
        switch combo
            when 'command+k'              then return @selectAll() + @deleteSelection()
            when 'command+d'              then return @selectNone()
            when 'command+a'              then return @selectAll()
            when 'command+c'              then return clipboard.writeText @selectedText()
            when 'tab', 'command+]'       then return @insertTab() + event.preventDefault() 
            when 'shift+tab', 'command+[' then return @deIndent()  + event.preventDefault()
            when 'command+z'              then return @do.undo @
            when 'command+shift+z'        then return @do.redo @
            when 'command+='              then return @changeZoom +1
            when 'command+-'              then return @changeZoom -1
            when 'command+0'              then return @resetZoom()
        
        # commands that might change the selection ...
        
        @startSelection event.shiftKey # ... starts or extend selection if shift is pressed
        
        scroll = false
        switch key
            
            when 'down', 'right', 'up', 'left' 
                
                if event.metaKey
                    if key == 'left'
                        @moveCursorToStartOfLine()
                    else if key == 'right'
                        @moveCursorToEndOfLine()
                else if event.altKey
                    if key == 'left'
                        @moveCursorToStartOfWord()
                    else if key == 'right'
                        @moveCursorToEndOfWord()                    
                else
                    @moveCursor key
                    scroll = true
                    
                event.preventDefault() # prevent view from scrolling
                
            when 'home'         then @moveCursorToLineIndex 0
            when 'end'          then @moveCursorToLineIndex @lines.length-1
            when 'page up'      
                @moveCursorByLines -(@numFullLines()-3)
                event.preventDefault() # prevent view from scrolling
            when 'page down'    
                @moveCursorByLines   @numFullLines()-3
                event.preventDefault() # prevent view from scrolling
                
            else
                switch combo
                    when 'enter'                     then @insertNewline()
                    when 'delete', 'ctrl+backspace'  then @deleteForward()     
                    when 'backspace'                 then @deleteBackward()     
                    when 'command+j'                 then @joinLine()
                    when 'ctrl+a', 'ctrl+shift+a'    then @moveCursorToStartOfLine()
                    when 'ctrl+e', 'ctrl+shift+e'    then @moveCursorToEndOfLine()
                    when 'command+v'                 then @insertText clipboard.readText()
                    when 'command+x'                 
                        clipboard.writeText @selectedText()
                        @deleteSelection()
                    else
                        ansiKeycode = require 'ansi-keycode'
                        if ansiKeycode(event)?.length == 1 and mod in ["shift", ""]
                            @insertCharacter ansiKeycode event
                        else
                            log "ignoring", combo
                            
        @endSelection event.shiftKey # ... reset selection 
        
        # if scroll
        #     $('cursor')?.scrollIntoViewIfNeeded()

module.exports = HtmlEditor