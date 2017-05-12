
# 00     00  00000000  000000000   0000000
# 000   000  000          000     000   000
# 000000000  0000000      000     000000000
# 000 0 000  000          000     000   000
# 000   000  00000000     000     000   000

{ stopEvent, empty, elem, post, fs, error, log, $, _
}      = require 'kxk'
ranges = require '../tools/ranges'

class Meta

    constructor: (@editor) ->

        @metas = [] # [ [lineIndex, [start, end], {href: ...}], ... ]

        @elem =$ ".meta", @editor.view

        @editor.on 'changed',          @onChanged
        @editor.on 'lineAppended',     @onLineAppended
        @editor.on 'clearLines',       @onClearLines
        @editor.on 'lineInserted',     @onLineInserted
        @editor.on 'willDeleteLine',   @onWillDeleteLine

        @editor.on 'linesShown',       @onLinesShown
        @editor.on 'linesShifted',     @onLinesShifted

        if @editor.numbers?
            @editor.numbers.on 'numberAdded',   @onNumber
            @editor.numbers.on 'numberChanged', @onNumber

        @elem.addEventListener 'mousedown', @onMouseDown

    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000

    onChanged: (changeInfo) =>
        
        for change in changeInfo.changes
            li = change.oldIndex
            continue if change.change == 'deleted'
            for meta in @metasAtLineIndex li
                if meta[2].clss == "searchResult" and meta[2].href?
                    [file, line] = meta[2].href.split ':'
                    line -= 1
                    localChange = _.cloneDeep change
                    localChange.oldIndex = line
                    localChange.newIndex = line
                    localChange.doIndex  = line
                    localChange.after    = @editor.line(meta[0])
                    @editor.emit 'fileSearchResultChange', file, localChange
                    meta[2].state = 'unsaved'
                    if meta[2].span?
                        button = @saveButton li
                        if not meta[2].span.innerHTML.startsWith "<span"
                            meta[2].span.innerHTML = button

    #  0000000   0000000   000   000  00000000
    # 000       000   000  000   000  000
    # 0000000   000000000   000 000   0000000
    #      000  000   000     000     000
    # 0000000   000   000      0      00000000

    saveFileLineMetas: (file, lineMetas) ->

        fs.readFile file, encoding: 'utf8', (err, data) ->
            if err? then return error "Meta.saveFileLineMetas -- readFile err:#{err}"
            lines = data.split /\r?\n/
            for lineMeta in lineMetas
                lines[lineMeta[0]] = lineMeta[1]
            data = lines.join '\n'
            fs.writeFile file, data, encoding: 'utf8', (err) ->
                if err? then return error "Meta.saveFileLineMetas -- writeFile err:#{err}"
                for lineMeta in lineMetas
                    meta = lineMeta[2]
                    delete meta[2].state
                    meta[2].span.innerHTML = lineMeta[0]+1
                post.emit 'search-saved', file

    saveLine: (li) ->

        for meta in @metasAtLineIndex li
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                @saveFileLineMetas file, [[line-1, @editor.line(meta[0]), meta]]

    saveChanges: ->

        fileLineMetas = {}
        for meta in @metas
            if meta[2].state == 'unsaved'
                [file, line] = meta[2].href.split(':')
                fileLineMetas[file] = [] if not fileLineMetas[file]?
                fileLineMetas[file].push [line-1, @editor.line(meta[0]), meta]

        for file, lineMetas of fileLineMetas
            @saveFileLineMetas file, lineMetas

        fileLineMetas.length

    saveButton: (li) ->
        "<span class=\"saveButton\" onclick=\"window.terminal.meta.saveLine(#{li});\">&#128190;</span>"

    # 000   000  000   000  00     00  0000000    00000000  00000000
    # 0000  000  000   000  000   000  000   000  000       000   000
    # 000 0 000  000   000  000000000  0000000    0000000   0000000
    # 000  0000  000   000  000 0 000  000   000  000       000   000
    # 000   000   0000000   000   000  0000000    00000000  000   000

    onNumber: (e) =>

        metas = @metasAtLineIndex e.lineIndex
        for meta in metas
            meta[2].span = e.numberSpan
            # if meta[2].clss == 'commandlistItem'
                # console.log 'onNumber', e.lineIndex, meta[2]
            switch meta[2].clss
                when 'searchResult', 'termCommand', 'termResult', 'coffeeCommand', 'coffeeResult', 'commandlistItem'                    
                    num = meta[2].state == 'unsaved' and @saveButton(meta[0])
                    num = meta[2].line? and meta[2].line if not num
                    num = meta[2].href?.split(':')[1] if not num
                    num = '?' if not num
                    e.numberSpan.innerHTML = num
                when 'spacer'
                    e.numberSpan.innerHTML = '&nbsp;'

    #  0000000  00000000  000000000        00000000    0000000    0000000
    # 000       000          000           000   000  000   000  000
    # 0000000   0000000      000           00000000   000   000  0000000
    #      000  000          000           000        000   000       000
    # 0000000   00000000     000           000         0000000   0000000

    setMetaPos: (meta, tx, ty) ->

        if meta[2].no_x
            meta[2].div?.style.transform = "translateY(#{ty}px)"
        else
            meta[2].div?.style.transform = "translate(#{tx}px,#{ty}px)"

    #  0000000   0000000    0000000          0000000    000  000   000
    # 000   000  000   000  000   000        000   000  000  000   000
    # 000000000  000   000  000   000        000   000  000   000 000
    # 000   000  000   000  000   000        000   000  000     000
    # 000   000  0000000    0000000          0000000    000      0

    addDiv: (meta) ->

        # console.log 'addDiv', meta[0]

        size = @editor.size
        sw = size.charWidth * (meta[1][1]-meta[1][0])
        tx = size.charWidth *  meta[1][0] + size.offsetX
        ty = size.lineHeight * (meta[0] - @editor.scroll.top)
        lh = size.lineHeight

        div = elem class: "meta #{meta[2].clss ? ''}"
        div.innerHTML = meta[2].html if meta[2].html?

        meta[2].div = div
        div.meta = meta

        if not meta[2].no_h
            div.style.height = "#{lh}px"

        if meta[2].style?
            for k,v of meta[2].style
                div.style[k] = v

        @setMetaPos meta, tx, ty

        if not meta[2].no_x
            div.style.width = "#{sw}px"

        @elem.appendChild div

    # 0000000    00000000  000           0000000    000  000   000
    # 000   000  000       000           000   000  000  000   000
    # 000   000  0000000   000           000   000  000   000 000
    # 000   000  000       000           000   000  000     000
    # 0000000    00000000  0000000       0000000    000      0

    delDiv: (meta) ->

        # console.log 'delDiv', meta[0]
        meta[2].div?.remove()
        meta[2].div = null

    # 000000000  00000000  000   000  000000000
    #    000     000        000 000      000
    #    000     0000000     00000       000
    #    000     000        000 000      000
    #    000     00000000  000   000     000

    addLineMeta: (meta) ->

        lineMeta = [meta.line, [meta.start, meta.end], meta]
        @metas.push lineMeta
        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta

    # 0000000    000  00000000  00000000
    # 000   000  000  000       000
    # 000   000  000  000000    000000
    # 000   000  000  000       000
    # 0000000    000  000       000

    addDiffMeta: (meta) ->

        meta.diff = true
        @addNumberMeta meta

    # 0000000    0000000     0000000
    # 000   000  000   000  000
    # 000   000  0000000    000  0000
    # 000   000  000   000  000   000
    # 0000000    0000000     0000000

    addDbgMeta: (meta) ->

        meta.dbg  = true
        meta.no_h = true
        @addNumberMeta meta

    delDbgMeta: (line) ->

        for meta in @metasAtLineIndex line
            @delMeta meta if meta[2].dbg

    addNumberMeta: (meta) ->

        meta.no_x = true
        lineMeta = [meta.line, [0, 0], meta]
        @metas.push lineMeta
        if @editor.scroll.top <= meta.line <= @editor.scroll.bot
            @addDiv lineMeta

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    onMouseDown: (event) ->

        if event.target.meta?[2].click?
            result = event.target.meta?[2].click event.target.meta, event
            stopEvent event if result != 'unhandled'

    #  0000000   00000000   00000000   00000000  000   000  0000000
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000

    append: (meta) ->
        
        lineMeta = [@editor.numLines(), [0, 0], meta]
        @metas.push lineMeta
        lineMeta

    onLineAppended: (e) =>

        for meta in @metasAtLineIndex e.lineIndex
            meta[1][1] = e.text.length if meta[1][1] is 0

    metasAtLineIndex: (li) -> rangesAtLineIndexInRanges li, @metas
    hrefAtLineIndex:  (li) ->

        for meta in @metasAtLineIndex li
            return meta[2].href if meta[2].href?

    # 000      000  000   000  00000000   0000000         0000000  000   000   0000000   000   000  000   000
    # 000      000  0000  000  000       000             000       000   000  000   000  000 0 000  0000  000
    # 000      000  000 0 000  0000000   0000000         0000000   000000000  000   000  000000000  000 0 000
    # 000      000  000  0000  000            000             000  000   000  000   000  000   000  000  0000
    # 0000000  000  000   000  00000000  0000000         0000000   000   000   0000000   00     00  000   000

    onLinesShown: (top, bot, num) =>

        for meta in @metas
            @delDiv meta
            if top <= meta[0] <= bot
                @addDiv meta

    # 000      000  000   000  00000000   0000000         0000000  000   000  000  00000000  000000000  00000000  0000000
    # 000      000  0000  000  000       000             000       000   000  000  000          000     000       000   000
    # 000      000  000 0 000  0000000   0000000         0000000   000000000  000  000000       000     0000000   000   000
    # 000      000  000  0000  000            000             000  000   000  000  000          000     000       000   000
    # 0000000  000  000   000  00000000  0000000         0000000   000   000  000  000          000     00000000  0000000

    onLinesShifted: (top, bot, num) =>

        # log 'meta.linesShifted', top, bot, num
        if num > 0
            for meta in rangesFromTopToBotInRanges top-num, top-1, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges bot-num+1, bot, @metas
                @addDiv meta
        else

            for meta in rangesFromTopToBotInRanges bot+1, bot-num, @metas
                @delDiv meta

            for meta in rangesFromTopToBotInRanges top, top-num-1, @metas
                @addDiv meta

        @updatePositionsBelowLineIndex top

    updatePositionsBelowLineIndex: (li) ->

        size = @editor.size
        for meta in rangesFromTopToBotInRanges li, @editor.scroll.bot, @metas
            tx = size.charWidth *  meta[1][0] + size.offsetX
            ty = size.lineHeight * (meta[0] - @editor.scroll.top)
            @setMetaPos meta, tx, ty

    onLineInserted: (li) =>

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            meta[0] += 1

        @updatePositionsBelowLineIndex li

    # 000   000   0000000   000   000  000   0000000  000   000
    # 000   000  000   000  0000  000  000  000       000   000
    #  000 000   000000000  000 0 000  000  0000000   000000000
    #    000     000   000  000  0000  000       000  000   000
    #     0      000   000  000   000  000  0000000   000   000

    onWillDeleteLine: (li) =>

        for meta in @metasAtLineIndex li
            @delMeta meta

        for meta in rangesFromTopToBotInRanges li, @editor.numLines(), @metas
            meta[0] -= 1

        @updatePositionsBelowLineIndex li

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    onClearLines: =>

        for meta in @metas
            @delDiv meta
        @elem.innerHTML = ""

    clear: =>

        @elem.innerHTML = ""
        @metas = []

    delMeta: (meta) ->

        _.pull @metas, meta
        @delDiv meta

    delClass: (clss) ->

        for meta in _.clone @metas
            clsss = meta?[2].clss?.split ' '
            if not empty(clsss) and clss in clsss
                @delMeta meta

module.exports = Meta
