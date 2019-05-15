###
00000000  000  000   000  0000000  
000       000  0000  000  000   000
000000    000  000 0 000  000   000
000       000  000  0000  000   000
000       000  000   000  0000000  
###

{ empty, os } = require 'kxk'

Command = require '../commandline/command'

class Find extends Command

    constructor: (commandline) ->
        
        super commandline
        
        @types = ['str',  'Str',   'reg',    'Reg',    'fuzzy', 'glob']
        @names = ['find', 'Find',  '/find/', '/Find/', 'fiZd',  'f*nd']
       
    historyKey: -> @name
        
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: (name) ->
        
        if name == 'find'
            editor = @receivingEditor()
            editor.highlightForFind()
            window.split.focus 'commandline'
            if @getText() != editor.textOfHighlight() and not empty editor.textOfHighlight()
                @setText editor.textOfHighlight()
            
        @type = @types[@names.indexOf name]
        
        super name

    #  0000000   0000000   000   000   0000000  00000000  000    
    # 000       000   000  0000  000  000       000       000    
    # 000       000000000  000 0 000  000       0000000   000    
    # 000       000   000  000  0000  000       000       000    
    #  0000000  000   000  000   000   0000000  00000000  0000000
    
    cancel: ->
        
        @hideList()  
        focus: @receiver
        show: 'editor'
        
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
        
        super command
        
        if command.length
            if @type in ['reg', 'Reg'] and command.trim() in ['^', '$', '^$', '.', '?', '\\', '\\b']
                window.textEditor.clearHighlights()
            else if not command.trim().startsWith('|') and not command.trim().endsWith('|')
                window.textEditor.highlightText command, 
                    type:   @type
                    select: 'keep'
        else
            window.textEditor.clearHighlights()
    
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
    
    execute: (command) ->
        
        command = super command
        
        window.textEditor.highlightText command, 
            type: @type
            select: 'after'
                
        text:   command
        select: true
        
    # 000   000  00000000  000   000
    # 000  000   000        000 000 
    # 0000000    0000000     00000  
    # 000  000   000          000   
    # 000   000  00000000     000   
    
    handleModKeyComboEvent: (mod, key, combo, event) -> 
        
        switch combo
            
            when 'shift+enter', 'command+shift+g'
                
                window.textEditor.highlightText @getText(),
                    type: @type
                    select: 'before'
                return
                    
            when 'command+g' 
                
                @execute @getText()    
                return
                    
            when 'tab'
                
                window.textEditor.focus()
                return
                    
        super mod, key, combo, event
      
module.exports = Find
