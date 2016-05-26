# 000   000  000000000  00     00  000    
# 000   000     000     000   000  000    
# 000000000     000     000000000  000    
# 000   000     000     000 0 000  000    
# 000   000     000     000   000  0000000

encode = require './tools/encode'
log    = require './tools/log'

class html 
    
    @cursorSpan: (charSize) => "<span id=\"cursor\" style=\"height: #{charSize[1]}px\"></span>"
    
    @render: (lines, cursor, selectionRanges, charSize) =>
        h = []
        if selectionRanges.length
            lineRange = [selectionRanges[0][0], selectionRanges[selectionRanges.length-1][0]]
        selectedCharacters = (i) -> 
            selectionRanges[i-selectionRanges[0][0]][1]
        curSpan = @cursorSpan charSize
        for i in [0...lines.length]
            l = lines[i]
            if lineRange and (lineRange[0] <= i <= lineRange[1])
                range = selectedCharacters i
            else
                range = null
            if range
                selEnd = "</span>"
                left  = l.substr  0, range[0]
                mid   = l.substr  range[0], range[1]-range[0] 
                right = l.substr  range[1]
                border = ""
                if i == lineRange[0]
                    border += " tl tr"
                else # if i > lineRange[0]
                    prevRange = selectedCharacters i-1
                    if range[1] > prevRange[1] or range[1] <= prevRange[0]
                        border += " tr"
                    if range[0] < prevRange[0] or range[0] >= prevRange[1]
                        border += " tl"
                    
                if i == lineRange[1]
                    border += " bl br"
                else # if i < lineRange[1]
                    nextRange = selectedCharacters i+1
                    if range[1] > nextRange[1]
                        border += " br"
                    if range[0] < nextRange[0] or range[0] >= nextRange[1]
                        border += " bl"
                selStart = "<span class=\"selection#{border}\">"
                if i == cursor[1]
                    if cursor[0] == range[0]
                        h.push encode(left) + curSpan + selStart + encode(mid) + selEnd + encode(right)
                    else
                        h.push encode(left) + selStart + encode(mid) + selEnd + curSpan + encode(right)
                else
                    h.push encode(left) + selStart + encode(mid) + selEnd + encode(right)
            else if i == cursor[1]
                left  = l.substr  0, cursor[0]
                right = l.substr  cursor[0]
                h.push encode(left) + curSpan + encode(right)
            else
                h.push encode(l)
        h.join '<br>'

module.exports = html