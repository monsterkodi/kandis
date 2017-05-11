
#  0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000  000   000  00000000
# 000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  0000  000  000
# 000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  000 0 000  0000000
# 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000  000  0000  000
#  0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  000   000  00000000

{ fileList, stopEvent, elem, keyinfo, clamp, post, path, error, log, str, $, _
}          = require 'kxk'
TextEditor = require '../editor/texteditor'
render     = require '../editor/render'
syntax     = require '../editor/syntax'

class Commandline extends TextEditor

    constructor: (viewElem) ->

        @fontSizeDefault = 24
        @mainCommands = ['open', 'search', 'find', 'coffee', 'goto', 'term', 'browse', 'debug', 'build', 'macro']
        @hideCommands = ['selecto', 'Term', 'Build', 'Browse']

        super viewElem, features: []

        @size.lineHeight = 30
        @scroll.setLineHeight @size.lineHeight

        @button =$ 'commandline-button'
        @button.classList.add 'empty'
        @button.addEventListener 'mousedown', @onCmmdClick

        @commands = {}
        @command = null

        @loadCommands()

        window.split.on 'split', @onSplit

        post.on 'restore', @restore
        post.on 'stash',   @stash

        @view.onblur = () =>
            @button.classList.remove 'active'
            @list?.remove()
            @list = null
            @command?.onBlur()

        @view.onfocus = () =>
            @button.className = "commandline-button active #{@command?.prefsID}"

    #  0000000  000000000   0000000   000000000  00000000
    # 000          000     000   000     000     000
    # 0000000      000     000000000     000     0000000
    #      000     000     000   000     000     000
    # 0000000      000     000   000     000     00000000

    stash: => if @command? then window.stash.set 'commandline', @command.state()

    restore: =>

        state = window.stash.get 'commandline'
        # log 'commandline restore', state
        @setText state?.text ? ""
        if state?.name
            name = state.name
            @command = @commands[name]
            activeID = document.activeElement.id
            if activeID.startsWith 'column' then activeID = 'editor'
            @command.setFocus activeID != 'commandline-editor' and activeID or null
            @setName name
            @button.className = "commandline-button active #{@command.prefsID}"
            @commands[name]?.restoreState? state

    # 000       0000000    0000000   0000000
    # 000      000   000  000   000  000   000
    # 000      000   000  000000000  000   000
    # 000      000   000  000   000  000   000
    # 0000000   0000000   000   000  0000000

    loadCommands: ->

        files = fileList "#{__dirname}/../commands"
        for file in files
            continue if path.extname(file) != '.js'
            try
                commandClass = require file
                command = new commandClass @
                command.setPrefsID commandClass.name.toLowerCase()
                @commands[command.prefsID] = command
            catch err
                if err then error "can't load command from file '#{file}': #{err}"

    setName: (name) ->

        @button.innerHTML = name
        @layers.style.width = @view.style.width

    setLines: (l) ->

        @scroll.reset()
        super l

    setAndSelectText: (t) ->

        @setLines [t ? '']
        @selectAll()
        @selectSingleRange @rangeForLineAtIndex 0

    setText: (t) ->

        @setLines [t ? '']
        @singleCursorAtPos [@line(0).length, 0]

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    changed: (changeInfo) ->

        @hideList()
        super changeInfo
        if changeInfo.changes.length
            @button.className = "commandline-button active #{@command?.prefsID}"
            @command?.changed @line(0)

    onSplit: (s) =>

        @command?.onBot? s[1]
        @positionList()

    # 00000000  000  000      00000000        000       0000000    0000000   0000000    00000000  0000000
    # 000       000  000      000             000      000   000  000   000  000   000  000       000   000
    # 000000    000  000      0000000         000      000   000  000000000  000   000  0000000   000   000
    # 000       000  000      000             000      000   000  000   000  000   000  000       000   000
    # 000       000  0000000  00000000        0000000   0000000   000   000  0000000    00000000  0000000

    fileLoaded: (file) ->

        if not @command?
            @command = @commands['open']
            @command.loadState()
            @setText path.basename file

    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000
    # 0000000      000     000000000  0000000       000
    #      000     000     000   000  000   000     000
    # 0000000      000     000   000  000   000     000

    startCommand: (name, combo, event) ->

        stopEvent event

        r = @command?.cancel combo
        if r?.status == 'ok'
            @results r
            return

        window.split.showCommandline()

        @command = @commands[name]
        activeID = document.activeElement.id
        if activeID.startsWith 'column' then activeID = 'editor'
        @command.setFocus activeID != 'commandline-editor' and activeID or null
        @view.focus()
        @setName name
        combo = @command.shortcuts[0] if not combo?

        @results @command.start combo # <-- command start

        @button.className = "commandline-button active #{@command.prefsID}"

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000
    # 0000000     00000    0000000   000       000   000     000     0000000
    # 000        000 000   000       000       000   000     000     000
    # 00000000  000   000  00000000   0000000   0000000      000     00000000

    execute: -> @results @command?.execute @line 0

    # 00000000   00000000   0000000  000   000  000      000000000   0000000
    # 000   000  000       000       000   000  000         000     000
    # 0000000    0000000   0000000   000   000  000         000     0000000
    # 000   000  000            000  000   000  000         000          000
    # 000   000  00000000  0000000    0000000   0000000     000     0000000

    results: (r) ->

        @setName r.name if r?.name?
        @setText r.text if r?.text?
        if r?.select then @selectAll() else @selectNone()
        window.split.show   r.show   if r?.show?
        window.split.focus  r.focus  if r?.focus?
        window.split.do     r.do     if r?.do?
        @

    cancel: -> @results @command?.cancel()
    clear:  -> @results @command?.clear()

    # 000      000   0000000  000000000
    # 000      000  000          000
    # 000      000  0000000      000
    # 000      000       000     000
    # 0000000  000  0000000      000

    onCmmdClick: (event) =>

        if not @list?
            @list = elem class: 'list commands'
            @positionList()
            window.split.elem.appendChild @list
        @command?.hideList?()
        @listCommands()
        @focus()
        @positionList()
        stopEvent event

    listCommands: ->

        @list.innerHTML = ""
        @list.style.display = 'unset'
        for name in @mainCommands
            cmmd = @commands[name]
            for ci in [0...cmmd.shortcuts.length]
                combo = cmmd.shortcuts[ci]
                cname = cmmd.names[ci]
                continue if cname in @hideCommands
                div = elem class: "list-item"
                namespan = "<span class=\"ko command #{cmmd.prefsID}\" style=\"position:absolute; left: #{ci > 0 and 40 or 6}px\">#{cname}</span>"
                shortcut = "<span class=\"ko shortcut #{cmmd.prefsID}\"style=\"position:absolute; right: 6px;\">#{keyinfo.short combo}</span>"
                div.innerHTML = namespan + shortcut
                start = (name,combo) => (event) =>
                    @hideList()
                    @startCommand name, combo
                    stopEvent event
                div.addEventListener 'mousedown', start name, combo
                @list.appendChild div

    hideList: ->

        @list?.remove()
        @list = null

    # 00000000    0000000    0000000  000  000000000  000   0000000   000   000
    # 000   000  000   000  000       000     000     000  000   000  0000  000
    # 00000000   000   000  0000000   000     000     000  000   000  000 0 000
    # 000        000   000       000  000     000     000  000   000  000  0000
    # 000         0000000   0000000   000     000     000   0000000   000   000

    positionList: ->

        return if not @list?
        listHeight = @list.getBoundingClientRect().height
        flex = window.split.flex
        listTop = flex.posOfPane 2
        spaceBelow = flex.size() - listTop
        spaceAbove = flex.sizeOfPane 0
        if spaceBelow < listHeight and spaceAbove > spaceBelow
            listTop = spaceAbove - listHeight
        @list?.style.top = "#{listTop}px"

    resized: ->

        @list?.resized?()
        @command?.commandList?.resized()
        super

    focusTerminal: ->

        if window.terminal.numLines() == 0
            window.terminal.singleCursorAtPos [0,0]
        window.split.do "focus terminal"

    # 000   000  00000000  000   000
    # 000  000   000        000 000
    # 0000000    0000000     00000
    # 000  000   000          000
    # 000   000  00000000     000

    globalModKeyComboEvent: (mod, key, combo, event) ->

        if combo == 'esc'
            if document.activeElement == @view then return @cancel()

        for n,c of @commands

            for sc in c.shortcuts
                if sc == combo then return @startCommand n, combo, event

        if @command?
            return @command.globalModKeyComboEvent mod, key, combo, event
        'unhandled'

    handleModKeyComboCharEvent: (mod, key, combo, char, event) ->

        if @command?
            return if 'unhandled' != @command.handleModKeyComboEvent mod, key, combo, event

        split = window.split
        switch combo
            when 'enter'                then return @execute()
            when 'command+enter'        then return @execute() + window.split.do "focus #{@command?.focus}"
            when 'command+shift+enter'  then return @focusTerminal()
            when 'up'                   then return @setAndSelectText @command?.prev()
            when 'down'                 then return @setAndSelectText @command?.next()
            when 'esc'                  then return @cancel()
            when 'command+k'            then return @clear()
            when 'shift+tab'            then return
            when 'home', 'command+up'   then return split.do 'maximize editor'
            when 'end', 'command+down'  then return split.do 'minimize editor'
            when 'alt+up'               then return split.do 'enlarge editor'
            when 'ctrl+up'              then return split.do 'enlarge editor by 20'
            when 'alt+down'             then return split.do 'reduce editor'
            when 'ctrl+down'            then return split.do 'reduce editor by 20'
            when 'right', 'tab'
                if @isCursorAtEndOfLine()
                    if @command?.complete()
                        return
                    if @numSelections()
                        @do.start()
                        @do.select []
                        @do.end()
                    return
                else if combo == 'tab'
                    return

        return super mod, key, combo, char, event

module.exports = Commandline
