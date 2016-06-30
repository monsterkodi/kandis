#  0000000   000   000  000000000   0000000    0000000   0000000   00     00  00000000   000      00000000  000000000  00000000
# 000   000  000   000     000     000   000  000       000   000  000   000  000   000  000      000          000     000     
# 000000000  000   000     000     000   000  000       000   000  000000000  00000000   000      0000000      000     0000000 
# 000   000  000   000     000     000   000  000       000   000  000 0 000  000        000      000          000     000     
# 000   000   0000000      000      0000000    0000000   0000000   000   000  000        0000000  00000000     000     00000000
{
clamp,
last,
$}    = require '../tools/tools'
log   = require '../tools/log'
_     = require 'lodash'

class Autocomplete

    constructor: (@editor) -> 
        
        @wordlist = []
        @wordinfo = {}
        
        @close()
        
        specials = "_-@#"
        @especial = ("\\"+c for c in specials.split '').join ''
        @headerRegExp      = new RegExp "^[0#{@especial}]+$"
        @notSpecialRegExp  = new RegExp "[^#{@especial}]"
        @specialWordRegExp = new RegExp "(\\s+|[\\w#{@especial}]+|[^\\s])", 'g'
        @splitRegExp       = new RegExp "[^\\w\\d#{@especial}]+", 'g'        
        
    
        @editor.on 'edit',           @onEdit
        @editor.on 'linesSet',       @onLinesSet
        @editor.on 'lineInserted',   @onLineInserted
        @editor.on 'willDeleteLine', @onWillDeleteLine
        @editor.on 'lineChanged',    @onLineChanged
        @editor.on 'linesAppended',  @onLinesAppended
        @editor.on 'cursorMoved',    @close
        @editor.on 'blur',           @close

    #  0000000   000   000  00000000  0000000    000  000000000
    # 000   000  0000  000  000       000   000  000     000   
    # 000   000  000 0 000  0000000   000   000  000     000   
    # 000   000  000  0000  000       000   000  000     000   
    #  0000000   000   000  00000000  0000000    000     000   

    onEdit: (info) =>
        @close()
        @word = last info.before.split @splitRegExp
        switch info.action
            
            when 'delete'            
                if @wordinfo[@word]?.temp and @wordinfo[@word]?.count <= 0
                    _.pull @wordlist, @word
                    delete @wordinfo[@word]
                    
            when 'insert'        
                return if not @word?.length
                return if not @wordlist?.length
                
                for w in @wordlist
                    if w.startsWith(@word) and w.length > @word.length
                        if not @firstMatch
                            @firstMatch = w 
                        else
                            @matchList.push w
                            
                return if not @firstMatch?
                @completion = @firstMatch.slice @word.length
                
                @open info
        
    #  0000000   00000000   00000000  000   000
    # 000   000  000   000  000       0000  000
    # 000   000  00000000   0000000   000 0 000
    # 000   000  000        000       000  0000
    #  0000000   000        00000000  000   000
    
    open: (info) ->
        # log "autocomplete.open word: #{@word} @firstMatch: #{@firstMatch} info:", info
        cursor = $('.main', @editor.view)
        if not cursor?
            log "warning! no cursor?"
            return
        
        @span = document.createElement 'span'
        @span.className = 'autocomplete-span'
        @span.textContent = @completion
        @span.style.opacity    = 1
        @span.style.background = "#44a"
        @span.style.color      = "#fff"

        # [splitsBefore, cursorWord, splitsAfter] = @cursorWords()
        # log "splits #{splitsBefore.join '|'} --- #{cursorWord} --- #{splitsAfter.join '|'}"

        cr = cursor.getBoundingClientRect()
        spanInfo = @editor.lineSpanAtXY cr.left, cr.top  
        if spanInfo?
            sp = spanInfo.span
            # log "spanInfo", spanInfo
            inner        = sp.innerHTML                
            @cloneBefore = sp.cloneNode true
            @cloneAfter  = sp.cloneNode true
            @cloneSrc    = sp
            
            ws = @word.slice @word.search /\w/
            wi = ws.length
            
            # innerRanges = @editor.rangesWithLineIndexInTextForRegExp info.cursor[1], inner, @specialWordRegExp
            # innerSplit = (inner.slice(r[1][0], r[1][1]) for r in innerRanges)
            # if innerSplit.length
                # log "innerSplit #{innerSplit.join '|'}"
            
            # log "spanInfo.offsetChar #{spanInfo.offsetChar} wi #{wi}"
            
            @cloneBefore.innerHTML = inner.slice 0, spanInfo.offsetChar + 1 #wi
            @cloneAfter .innerHTML = inner.slice    spanInfo.offsetChar + 1 #wi
            sp.insertAdjacentElement 'afterend',    @cloneAfter
            sp.insertAdjacentElement 'beforebegin', @cloneBefore
            sp.insertAdjacentElement 'beforebegin', @span
            sp.style.display = 'none'
        else
            log "warning! no sp? #{cr.left} #{cr.top}"
        
        if @matchList.length
            @list = document.createElement 'div'
            @list.className = 'autocomplete-list'
            for m in @matchList
                item = document.createElement 'div'
                item.className = 'autocomplete-item'
                item.textContent = m
                @list.appendChild item
            cursor.appendChild @list
            
        # log "autocomplete.match #{@completion}"

    selectedCompletion: ->
        if @selected >= 0
            @matchList[@selected].slice @word.length
        else
            @completion

    # 000   000   0000000   000   000  000   0000000    0000000   000000000  00000000
    # 0000  000  000   000  000   000  000  000        000   000     000     000     
    # 000 0 000  000000000   000 000   000  000  0000  000000000     000     0000000 
    # 000  0000  000   000     000     000  000   000  000   000     000     000     
    # 000   000  000   000      0      000   0000000   000   000     000     00000000
    
    navigate: (delta) ->
        return if not @list
        @list.children[@selected]?.classList.remove 'selected'
        @selected = clamp -1, @matchList.length-1, @selected+delta
        if @selected >= 0
            @list.children[@selected]?.classList.add 'selected'
            @list.children[@selected]?.scrollIntoViewIfNeeded()
        @span.innerHTML = @selectedCompletion()
        @span.classList.remove 'selected' if @selected < 0
        @span.classList.add    'selected' if @selected >= 0
        @navigating = true
        
    prev: -> @navigate -1    
    next: -> @navigate 1
        
    # 00000000    0000000   00000000    0000000  00000000
    # 000   000  000   000  000   000  000       000     
    # 00000000   000000000  0000000    0000000   0000000 
    # 000        000   000  000   000       000  000     
    # 000        000   000  000   000  0000000   00000000
    
    parseLines:(lines, opt) ->
        @close()
        cursorWord = @cursorWord()
        for l in lines
            if not l?.split?
                log "warning! no split?", lines
                alert 'wtf?'            
            words = l.split @splitRegExp
            words = words.filter (w) => 
                return false if w.length < 2
                return false if w[0] in ['-', "#", '_'] and w.length < 3
                return false if @word == w.slice 0, w.length-1
                return false if w == cursorWord
                return false if @headerRegExp.test w
                true
                
            for w in words
                i = w.search @notSpecialRegExp
                words.push w.slice i if i > 0 
            
            for w in words
                info  = @wordinfo[w] ? {}
                count = info.count ? 0
                count += opt?.count ? 1
                info.count = count
                info.temp = true if opt.action is 'change'
                @wordinfo[w] = info                
                
        weight = (wi) -> wi[1].count
            
        sorted = ([w,i] for w,i of @wordinfo).sort (a,b) -> weight(b) - weight(a)
        
        @wordlist = (s[0] for s in sorted)
        
        # log "Completion.parseLines -- #{@editor.name} @wordlist:", @wordlist.slice 0, 40
                
    #  0000000  000   000  00000000    0000000   0000000   00000000   000   000   0000000   00000000   0000000  
    # 000       000   000  000   000  000       000   000  000   000  000 0 000  000   000  000   000  000   000
    # 000       000   000  0000000    0000000   000   000  0000000    000000000  000   000  0000000    000   000
    # 000       000   000  000   000       000  000   000  000   000  000   000  000   000  000   000  000   000
    #  0000000   0000000   000   000  0000000    0000000   000   000  00     00   0000000   000   000  0000000  
    
    cursorWords: -> 
        cp = @editor.cursorPos()
        words = @editor.wordRangesInLineAtIndex cp[1], @specialWordRegExp        
        [befor, cursr, after] = @editor.rangesSplitAtPosInRanges cp, words
        [@editor.textsInRanges(befor), @editor.textInRange(cursr), @editor.textsInRanges(after)]
        
    cursorWord: -> @cursorWords()[1]
                
    #  0000000  000       0000000    0000000  00000000
    # 000       000      000   000  000       000     
    # 000       000      000   000  0000000   0000000 
    # 000       000      000   000       000  000     
    #  0000000  0000000   0000000   0000000   00000000

    close: =>
        @list?.remove()
        @span?.remove()
        @navigating = false
        @selected   = -1
        @list       = null
        @span       = null
        @completion = null
        @firstMatch = null
        
        @cloneBefore?.remove()
        @cloneAfter?.remove()
        @cloneSrc?.style.display = 'initial'
        
        @matchList  = []

    #  0000000   000   000
    # 000   000  0000  000
    # 000   000  000 0 000
    # 000   000  000  0000
    #  0000000   000   000
            
    onLinesAppended:  (lines)    => @parseLines lines, action: 'append'
    onLineInserted:   (li)       => @parseLines [@editor.lines[li]], action: 'insert'
    onLineChanged:    (li)       => @parseLines [@editor.lines[li]], action: 'change', count: 0
    onWillDeleteLine: (li, line) => @parseLines [line], action: 'delete', count: -1
    onLinesSet:      (lines)  => 
        if lines.length
            @parseLines lines, action: 'set' 
        else @wordinfo = {}

    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   

    handleModKeyComboEvent: (mod, key, combo, event) ->
        # log "autocomplete.handleModKeyComboEvent combo #{combo}"
        return 'unhandled' if not @span?
        
        switch combo
            when 'enter'                
                @editor.paste @selectedCompletion()
                @close()
                return
            
        if @list? 
            switch combo
                when 'down'
                    @next()
                    return
                when 'up'
                    if @selected >= 0
                        @prev()
                        return
                    else if @navigating
                        return
        @close()   
        return 'unhandled'
        
module.exports = Autocomplete