###
0000000    000  00000000  00000000  0000000     0000000   00000000
000   000  000  000       000       000   000  000   000  000   000
000   000  000  000000    000000    0000000    000000000  0000000
000   000  000  000       000       000   000  000   000  000   000
0000000    000  000       000       0000000    000   000  000   000
###

{ elem, empty, post, fs } = require 'kxk'

lineDiff = require '../tools/linediff'
hub      = require '../git/hub'

class Diffbar

    @: (@editor) ->

        @elem = elem 'canvas', class: 'diffbar'
        @elem.style.position = 'absolute'
        @elem.style.left = '0'
        @elem.style.top  = '0'

        @editor.view.appendChild @elem

        @editor.on 'file'       @onEditorFile
        @editor.on 'undone'     @update
        @editor.on 'redone'     @update
        @editor.on 'linesShown' @updateScroll
        
        post.on 'gitStatus'     @update
        post.on 'gitDiff'       @update

    #  0000000  000      000   0000000  000   000
    # 000       000      000  000       000  000
    # 000       000      000  000       0000000
    # 000       000      000  000       000  000
    #  0000000  0000000  000   0000000  000   000

    onMetaClick: (meta, event) =>

        return 'unhandled' if event.metaKey

        if event.ctrlKey
            @editor.singleCursorAtPos rangeStartPos meta
            @editor.toggleGitChangesInLines [meta[0]]
        else
            if meta[2].boring then @editor.invisibles?.activate()
            blockIndices = @lineIndicesForBlockAtLine meta[0]
            @editor.do.start()
            @editor.do.setCursors blockIndices.map (i) -> [0,i]
            @editor.do.end()
            @editor.toggleGitChangesInLines blockIndices
        @

    gitMetasAtLineIndex: (li) ->

        @editor.meta.metasAtLineIndex(li).filter (m) -> m[2].clss.startsWith 'git'

    # 000  000   000  0000000    000   0000000  00000000   0000000
    # 000  0000  000  000   000  000  000       000       000
    # 000  000 0 000  000   000  000  000       0000000   0000000
    # 000  000  0000  000   000  000  000       000            000
    # 000  000   000  0000000    000   0000000  00000000  0000000

    lineIndicesForBlockAtLine: (li) ->

        lines = []
        if not empty metas = @gitMetasAtLineIndex li

            toggled = metas[0][2].toggled
            lines.push li

            bi = li-1
            while not empty metas = @gitMetasAtLineIndex bi
                break if metas[0][2].toggled != toggled
                lines.unshift bi
                bi--

            ai = li+1
            while not empty metas = @gitMetasAtLineIndex ai
                break if metas[0][2].toggled != toggled
                lines.push ai
                ai++
        lines

    # 00     00  00000000  000000000   0000000    0000000
    # 000   000  000          000     000   000  000
    # 000000000  0000000      000     000000000  0000000
    # 000 0 000  000          000     000   000       000
    # 000   000  00000000     000     000   000  0000000

    updateMetas: ->

        @clearMetas()

        return if not @changes?.changes?.length

        for change in @changes.changes

            boring = @isBoring change

            if change.mod?

                li = change.line-1

                for mod in change.mod

                    meta =
                        line: li
                        clss: 'git mod' + (boring and ' boring' or '')
                        git:  'mod'
                        change: mod
                        boring: boring
                        length: change.mod.length
                        click: @onMetaClick
                    @editor.meta.addDiffMeta meta
                    li++

            if change.add?

                mods = change.mod? and change.mod.length or 0
                li = change.line - 1 + mods

                for add in change.add
                    meta =
                        line: li
                        clss: 'git add' + (boring and ' boring' or '')
                        git:  'add'
                        change: add
                        length: change.add.length
                        boring: boring
                        click: @onMetaClick

                    @editor.meta.addDiffMeta meta
                    li++

            else if change.del?

                mods = change.mod? and change.mod.length or 1
                li = change.line - 1 + mods

                meta =
                    line: li
                    clss: 'git del' + (boring and ' boring' or '')
                    git:  'del'
                    change: change.del
                    length: 1
                    boring: boring
                    click: @onMetaClick

                @editor.meta.addDiffMeta meta

    # 0000000     0000000   00000000   000  000   000   0000000
    # 000   000  000   000  000   000  000  0000  000  000
    # 0000000    000   000  0000000    000  000 0 000  000  0000
    # 000   000  000   000  000   000  000  000  0000  000   000
    # 0000000     0000000   000   000  000  000   000   0000000

    isBoring: (change) ->

        if change.mod?
            for c in change.mod
                return false if not lineDiff.isBoring c.old, c.new

        if change.add?
            for c in change.add
                return false if not empty c.new.trim()

        if change.del?
            for c in change.del
                return false if not empty c.old.trim()

        true

    # 00000000  000  000      00000000
    # 000       000  000      000
    # 000000    000  000      0000000
    # 000       000  000      000
    # 000       000  0000000  00000000

    onEditorFile: => @update()

    # 000   000  00000000   0000000     0000000   000000000  00000000
    # 000   000  000   000  000   000  000   000     000     000
    # 000   000  00000000   000   000  000000000     000     0000000
    # 000   000  000        000   000  000   000     000     000
    #  0000000   000        0000000    000   000     000     00000000

    update: =>

        if @editor.currentFile

            @changes = file:@editor.currentFile

            hub.diff @editor.currentFile, (changes) =>

                if changes.file != @editor.currentFile then return {}

                @changes = changes

                @updateMetas()
                @updateScroll()
                @editor.emit 'diffbarUpdated', @changes # only used in tests
        else
            @changes = null
            @updateMetas()
            @updateScroll()
            @editor.emit 'diffbarUpdated', @changes # only used in tests

    #  0000000   0000000  00000000    0000000   000      000
    # 000       000       000   000  000   000  000      000
    # 0000000   000       0000000    000   000  000      000
    #      000  000       000   000  000   000  000      000
    # 0000000    0000000  000   000   0000000   0000000  0000000

    updateScroll: =>

        w  = 2
        h  = @editor.view.clientHeight
        lh = h / @editor.numLines()

        ctx = @elem.getContext '2d'
        @elem.width  = w
        @elem.height = h

        alpha = (o) -> 0.5 + Math.max 0, (16-o*lh)*(0.5/16)

        if @changes

            for meta in @editor.meta.metas

                continue if not meta?[2]?.git?

                li     = meta[0]
                length = meta[2].length
                boring = meta[2].boring

                ctx.fillStyle = switch meta[2].git

                    when 'mod'
                        if boring then "rgba(50, 50,50,#{alpha length})"
                        else           "rgba( 0,255, 0,#{alpha length})"

                    when 'del'
                        if boring then "rgba(50,50,50,#{alpha length})"
                        else           "rgba(255,0,0,#{alpha length})"

                    when 'add'
                        if boring then "rgba(50,50,50,#{alpha length})"
                        else           "rgba(160,160,255,#{alpha length})"

                ctx.fillRect 0, li * lh, w, lh

    #  0000000  000      00000000   0000000   00000000
    # 000       000      000       000   000  000   000
    # 000       000      0000000   000000000  0000000
    # 000       000      000       000   000  000   000
    #  0000000  0000000  00000000  000   000  000   000

    clear: ->

        @clearMetas()
        @elem.width = 2

    clearMetas: -> @editor.meta.delClass 'git'

module.exports = Diffbar
