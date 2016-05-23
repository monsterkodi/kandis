#000000000   0000000    0000000   000       0000000
#   000     000   000  000   000  000      000     
#   000     000   000  000   000  000      0000000 
#   000     000   000  000   000  000           000
#   000      0000000    0000000   0000000  0000000 

_   = require 'lodash'
pos = require './pos'

module.exports = 

    def: (c,d) ->
        if c?
            _.defaults(_.clone(c), d)
        else if d?
            _.clone(d)
        else
            {}

    del: (l,e) -> _.remove l, (n) -> n == e

    absPos: (event) ->
        event = if event? then event else window.event
        if isNaN window.scrollX
            return pos(event.clientX + document.documentElement.scrollLeft + document.body.scrollLeft,
                       event.clientY + document.documentElement.scrollTop + document.body.scrollTop)
        else
            return pos(event.clientX + window.scrollX, event.clientY + window.scrollY)

    sw: () -> window.innerWidth
    # sh: () -> window.innerHeight
    
    # window.getComputedStyle $('stage_content')
    sh: () -> parseInt window.getComputedStyle(document.body).height

    clamp: (r1, r2, v) ->
        if r1 > r2
            [r1,r2] = [r2,r1]
        v = Math.max(v, r1) if r1?
        v = Math.min(v, r2) if r2?
        v
