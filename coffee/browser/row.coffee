###
00000000    0000000   000   000
000   000  000   000  000 0 000
0000000    000   000  000000000
000   000  000   000  000   000
000   000   0000000   00     00
###

{ elem, keyinfo, drag, clamp, stopEvent, keyinfo, empty, post, slash, error, log, fs, $, _ } = require 'kxk' 

Syntax      = require '../editor/syntax'
fileIcons   = require 'file-icons-js'
electron    = require 'electron'

app = electron.remote.app

class Row
    
    constructor: (@column, @item) ->

        @browser = @column.browser
        text = @item.text ? @item.name
        if empty(text) or empty text.trim()
            html = '<span> </span>'
        else
            html = Syntax.spanForTextAndSyntax text, 'browser'
        @div = elem class: 'browserRow', html: html
        @div.classList.add @item.type
        @column.table.appendChild @div

        if @item.type in ['file', 'dir'] or @item.icon
            @setIcon()
        
        @drag = new drag
            target: @div
            onStart: @onDragStart
            onMove:  @onDragMove
            onStop:  @onDragStop
   
    next:        -> @index() < @column.numRows()-1 and @column.rows[@index()+1] or null
    prev:        -> @index() > 0 and @column.rows[@index()-1] or null
    index:       -> @column.rows.indexOf @    
    onMouseOut:  -> @div.classList.remove 'hover'
    onMouseOver: -> @div.classList.add 'hover'

    path: -> 
        if @item.file? and _.isString @item.file
            return @item.file
        if @item.obj?.file? and _.isString @item.obj.file
            return @item.obj.file

    setIcon: ->

        if @item.icon
            className = @item.icon
        else
            className = fileIcons.getClass slash.removeLinePos @item.file
            if empty className
                if @item.type == 'dir'
                    className = 'folder-icon'
                else
                    if slash.ext(@item.file) == 'noon'
                        className = 'noon-icon'
                    else
                        className = 'file-icon'
            
        icon = elem('span', class:className + ' browserFileIcon')
            
        @div.firstChild.insertBefore icon, @div.firstChild.firstChild
        # if @item.text ? @item.name
        # else
            # @div.appendChild icon
                    
    #  0000000    0000000  000000000  000  000   000   0000000   000000000  00000000  
    # 000   000  000          000     000  000   000  000   000     000     000       
    # 000000000  000          000     000   000 000   000000000     000     0000000   
    # 000   000  000          000     000     000     000   000     000     000       
    # 000   000   0000000     000     000      0      000   000     000     00000000  
    
    activate: (event) =>

        if @column.index < 0 # shelf handles row activation
            @column.activateRow @
            return
        
        opt = file: @item.file
                        
        if event?
            { mod } = keyinfo.forEvent event
            switch mod
                when 'alt', 'command', 'command+alt', 'ctrl', 'ctrl+alt'
                    if @item.type == 'file' and @item.textFile
                        if mod in ['command+alt', 'ctrl+alt']
                            opt.newWindow = true
                        else
                            opt.newTab = true 
                        post.emit 'jumpTo', opt
                    else
                        post.emit 'jumpTo', word:@item.name
                    return
            if event.button == 1
                opt.newTab = true
            
        $('.hover')?.classList.remove 'hover'
        
        @setActive emit:true
        
        @browser.skipJump = true if not event? and @item.type == 'file'
        
        switch @item.type
            when 'dir', 'file' 
                post.emit 'filebrowser', 'activateItem', @item, @column.index
                post.emit 'jumpToFile', opt if @item.type == 'file'
            else    
                log 'row.activate', @item.type
                if @item.file? and _.isString @item.file
                    opt.line = @item.line
                    opt.col  = @item.column
                    post.emit 'jumpToFile', opt
                else if @column.parent.obj? and @column.parent.type == 'obj'
                    @browser.loadObjectItem  @item, column:@column.index+1
                    if @item.type == 'obj'
                        @browser.previewObjectItem  @item, column:@column.index+2
                        if @item.obj?.file? and _.isString @item.obj.file
                            opt.line = @item.obj.line
                            opt.col  = @item.obj.column
                            post.emit 'jumpToFile', opt
                else if @item.obj?.file? and _.isString @item.obj.file
                    post.emit 'jumpToFile', file:@item.obj.file, line:@item.obj.line, col:@item.obj.column, newTab:opt.newTab
                else
                    @browser.clearColumnsFrom @column.index+1
        @
    
    isActive: -> @div.classList.contains 'active'
    
    setActive: (opt = {}) ->
        
        @column.activeRow()?.clearActive()
        @div.classList.add 'active'
        if opt?.scroll != false
            @column.scroll.toIndex @index()
        window.setLastFocus @column.name()
        if opt?.emit 
            @browser.emit 'itemActivated', @item
            if @item.type == 'dir'
                post.emit 'setCWD', @item.file
            else if @item.type == 'file'
                post.emit 'setCWD', slash.dir @item.file
        @
                
    clearActive: ->
        @div.classList.remove 'active'
        @

    # 000   000   0000000   00     00  00000000  
    # 0000  000  000   000  000   000  000       
    # 000 0 000  000000000  000000000  0000000   
    # 000  0000  000   000  000 0 000  000       
    # 000   000  000   000  000   000  00000000  
            
    editName: =>
        
        return if @input? 
        @input = elem 'input', class: 'rowNameInput'
        @input.value = slash.file @item.file
        
        @div.appendChild @input
        @input.addEventListener 'change',   @onNameChange
        @input.addEventListener 'keydown',  @onNameKeyDown
        @input.addEventListener 'focusout', @onNameFocusOut
        @input.focus()
        
        @input.setSelectionRange 0, slash.base(@item.file).length

    onNameKeyDown: (event) =>
        
        {mod, key, combo} = keyinfo.forEvent event
        switch combo
            when 'enter', 'esc'
                if @input.value == @file or combo != 'enter'
                    @input.value = @file
                    event.preventDefault()
                    event.stopImmediatePropagation()
                    @onNameFocusOut()
        event.stopPropagation()
        
    removeInput: ->
        
        return if not @input?
        @input.removeEventListener 'focusout', @onNameFocusOut
        @input.removeEventListener 'change',   @onNameChange
        @input.removeEventListener 'keydown',  @onNameKeyDown
        @input.remove()
        delete @input
        @input = null
        if not document.activeElement? or document.activeElement == document.body
            @column.focus activate:false
    
    onNameFocusOut: (event) => @removeInput()
    
    onNameChange: (event) =>
        
        trimmed = @input.value.trim()
        if trimmed.length
            newFile = slash.join slash.dir(@item.file), trimmed
            unusedFilename = require 'unused-filename'
            unusedFilename(newFile).then (newFile) =>
                fs.rename @item.file, newFile, (err) =>
                    return error 'rename failed', err if err
                    post.emit 'loadFile', newFile
        @removeInput()
        
    # 0000000    00000000    0000000    0000000   
    # 000   000  000   000  000   000  000        
    # 000   000  0000000    000000000  000  0000  
    # 000   000  000   000  000   000  000   000  
    # 0000000    000   000  000   000   0000000   
    
    onDragStart: (d, e) =>
        
        @column.focus activate:false
        @setActive scroll:false

    onDragMove: (d,e) =>
        
        if not @column.dragDiv
            
            return if Math.abs(d.deltaSum.x) < 20 and Math.abs(d.deltaSum.y) < 10
            
            @column.dragDiv = @div.cloneNode true
            br = @div.getBoundingClientRect()
            @column.dragDiv.style.position = 'absolute'
            @column.dragDiv.style.top  = "#{br.top}px"
            @column.dragDiv.style.left = "#{br.left}px"
            @column.dragDiv.style.width = "#{br.width-12}px"
            @column.dragDiv.style.height = "#{br.height-3}px"
            @column.dragDiv.style.flex = 'unset'
            @column.dragDiv.style.pointerEvents = 'none'
            document.body.appendChild @column.dragDiv
        
        @column.dragDiv.style.transform = "translateX(#{d.deltaSum.x}px) translateY(#{d.deltaSum.y}px)"

    onDragStop: (d,e) =>
        
        if @column.dragDiv?
            
            @column.dragDiv.remove()
            delete @column.dragDiv
            
            if column = @browser.columnAtPos d.pos
                column.dropRow? @, d.pos
        
module.exports = Row
