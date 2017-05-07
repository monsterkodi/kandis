
# 000000000   0000000    0000000    0000000   000      00000000         0000000   000  000000000
#    000     000   000  000        000        000      000             000        000     000
#    000     000   000  000  0000  000  0000  000      0000000         000  0000  000     000
#    000     000   000  000   000  000   000  000      000             000   000  000     000
#    000      0000000    0000000    0000000   0000000  00000000         0000000   000     000

{ reversed, empty, log, _
} = require 'kxk'

module.exports =

    actions:
        toggleGitChange:
            name:  'toggle git changes at cursors'
            combo: 'command+u'

    toggleGitChange: (key, info) ->

        @toggleGitChangesInLines @selectedAndCursorLineIndices()

    toggleGitChangesInLines: (lineIndices) ->

        metas = []
        untoggled = false

        for li in lineIndices.reverse()

            for lineMeta in @meta.metasAtLineIndex(li).reverse()

                lineMeta[2].li = li
                lineMeta[0] = -1

                if lineMeta[2].clss.startsWith('git') and not lineMeta[2].toggled
                    untoggled = true

                metas.push lineMeta

        for lineMeta in metas

            if lineMeta[2].clss.startsWith 'git'

                if untoggled
                    if not lineMeta[2].toggled
                        @reverseGitChange lineMeta
                else
                    if lineMeta[2].toggled
                        @applyGitChange lineMeta
                    else
                        @reverseGitChange lineMeta

            lineMeta[0] = lineMeta[2].li

            delete lineMeta[2].li

    # 00000000   00000000  000   000  00000000  00000000    0000000  00000000
    # 000   000  000       000   000  000       000   000  000       000
    # 0000000    0000000    000 000   0000000   0000000    0000000   0000000
    # 000   000  000          000     000       000   000       000  000
    # 000   000  00000000      0      00000000  000   000  0000000   00000000

    reverseGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = meta.li

        @do.start()
        cursors = @do.cursors()
        selections = @do.selections()

        switch meta.clss

            when 'git mod', 'git mod boring'
                @do.change li, meta.change.old

            when 'git add', 'git add boring'
                if not empty lc = positionsAtLineIndexInPositions li, cursors
                    meta.cursors = lc
                @do.delete li
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, -1

            when 'git del'
                for line in reversed meta.change
                    @do.insert li+1, line.old
                    for nc in positionsBelowLineIndexInPositions li+1, cursors
                        cursorDelta nc, 0, +1

        @do.setCursors cursors, main:'closest'
        @do.select selections
        @do.end()

        meta.div?.classList.add 'toggled'
        meta.toggled = true

    #  0000000   00000000   00000000   000      000   000
    # 000   000  000   000  000   000  000       000 000
    # 000000000  00000000   00000000   000        00000
    # 000   000  000        000        000         000
    # 000   000  000        000        0000000     000

    applyGitChange: (lineMeta) ->

        meta = lineMeta[2]
        li   = meta.li

        @do.start()
        cursors = @do.cursors()
        selections = @do.selections()

        switch meta.clss

            when 'git mod', 'git mod boring'
                @do.change li, meta.change.new

            when 'git add', 'git add boring'
                @do.insert li, meta.change.new
                for nc in positionsBelowLineIndexInPositions li, cursors
                    cursorDelta nc, 0, +1
                if meta.cursors
                    cursors = cursors.concat meta.cursors.map (c) -> [c[0], li]
                    delete meta.cursors

            when 'git del'
                for line in reversed meta.change
                    @do.delete li+1
                    for nc in positionsBelowLineIndexInPositions li, cursors
                        cursorDelta nc, 0, -1

        @do.setCursors cursors, main:'closest'
        @do.select selections
        @do.end()

        meta.div?.classList.remove 'toggled'
        delete meta.toggled
