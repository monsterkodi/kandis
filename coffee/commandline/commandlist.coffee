#    0000000   0000000   00     00  00     00   0000000   000   000  0000000    000      000   0000000  000000000
#   000       000   000  000   000  000   000  000   000  0000  000  000   000  000      000  000          000   
#   000       000   000  000000000  000000000  000000000  000 0 000  000   000  000      000  0000000      000   
#   000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  000      000       000     000   
#    0000000   0000000   000   000  000   000  000   000  000   000  0000000    0000000  000  0000000      000   

ViewBase = require '../editor/viewbase'
Syntax   = require '../editor/syntax'
matchr   = require '../tools/matchr'
salt     = require '../tools/salt'
log      = require '../tools/log'

class CommandList extends ViewBase

    constructor: (viewElem, opt) ->
        
        @fontSizeDefault = 19
        @maxLines        = 17
        @metaQueue       = []
        @syntaxName      = opt.syntax ? 'ko'
        
        super viewElem, 
            features: ['Scrollbar', 'Numbers', 'Meta']
            lineHeight: 1.4

        @numbers.elem.style.fontSize = "#{@fontSizeDefault}px"        
        @setLines @lines
        @numbers.opacity = 0.1
        @numbers.setOpacity 0.1
    
    #  0000000   0000000    0000000    000  000000000  00000000  00     00   0000000
    # 000   000  000   000  000   000  000     000     000       000   000  000     
    # 000000000  000   000  000   000  000     000     0000000   000000000  0000000 
    # 000   000  000   000  000   000  000     000     000       000 0 000       000
    # 000   000  0000000    0000000    000     000     00000000  000   000  0000000 
    
    addItems: (items) ->
        @setLines ['']
        index = 0
        for item in items
            continue if not item? 
            text = (item.text ? item).trim()
            continue if not text.length
            rngs = item.rngs ? []
            if item.clss?
                rngs.push 
                    match: text
                    start: 0
                    value: item.clss
                    index: 0
            @appendMeta 
                line: item.line ? ' '
                text: text
                rngs: rngs
                type: item.type ? @syntaxName
                clss: 'searchResult'
                list: index
            index += 1
        @view.style.height = "#{@size.lineHeight * Math.min @maxLines, items.length}px"
        @resized()  
    
    #  0000000   00000000   00000000   00000000  000   000  0000000  
    # 000   000  000   000  000   000  000       0000  000  000   000
    # 000000000  00000000   00000000   0000000   000 0 000  000   000
    # 000   000  000        000        000       000  0000  000   000
    # 000   000  000        000        00000000  000   000  0000000  
                
    appendLineDiss: (text, diss=[]) ->
        @syntax.setDiss @lines.length, diss if diss?.length
        @appendText text
            
    # 00     00  00000000  000000000   0000000 
    # 000   000  000          000     000   000
    # 000000000  0000000      000     000000000
    # 000 0 000  000          000     000   000
    # 000   000  00000000     000     000   000
    
    appendMeta: (meta) ->
        if not meta?
            alert('no meta?')
            throw new Error
        @meta.append meta
        del1st = @lines.length == 1 and @lines[0].length == 0
        if meta.diss?
            @appendLineDiss Syntax.lineForDiss(meta.diss), meta.diss 
        else if meta.text? and meta.text.trim().length
            r = meta.rngs ? []
            text = meta.text.trim()
            rngs = r.concat Syntax.rangesForTextAndSyntax text, meta.type or 'ko'
            matchr.sortRanges rngs
            diss = matchr.dissect rngs, join:true
            @appendLineDiss text, diss 
        else    
            @appendLineDiss ''
        if del1st
            @do.start()
            @do.delete 0 
            @do.end()
        
    queueMeta: (meta) ->
        @metaQueue.push meta
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0
        
    dequeueMeta: =>
        count = 0
        while meta = @metaQueue.shift()
            @appendMeta meta
            count += 1
            break if count > 20
        clearTimeout @metaTimer
        @metaTimer = setTimeout @dequeueMeta, 0 if @metaQueue.length
           
    clear: ->
        @meta.clear()
        super
            
module.exports = CommandList
