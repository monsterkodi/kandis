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

    sw: () -> parseInt window.getComputedStyle(document.body).width
    sh: () -> parseInt window.getComputedStyle(document.body).height

    last: (a) -> a[a.length-1] if a?.length
    first: (a) -> a[0] if a?.length

    clamp: (r1, r2, v) ->
        if r1 > r2
            [r1,r2] = [r2,r1]
        v = Math.max(v, r1) if r1?
        v = Math.min(v, r2) if r2?
        v
        
    $: (idOrClass,e=document) -> 
        if idOrClass.startsWith '.'
            e.getElementsByClassName(idOrClass.substr(1).split('.').join " ")[0]
        else
            e.getElementById idOrClass
    
if not String.prototype.splice
    String.prototype.splice = (start, delCount, newSubStr='') ->
        @slice(0, start) + newSubStr + @slice(start + Math.abs(delCount))
