# 0000000    00000000    0000000   000   000   0000000  00000000  
# 000   000  000   000  000   000  000 0 000  000       000       
# 0000000    0000000    000   000  000000000  0000000   0000000   
# 000   000  000   000  000   000  000   000       000  000       
# 0000000    000   000   0000000   00     00  0000000   00000000  

{ dirExists, process, unresolve, resolve, post, log, str
}        = require 'kxk'
Command  = require '../commandline/command'
Browser  = require '../browser/browser'

class Browse extends Command
    
    constructor: (@commandline) ->
        
        @cmdID      = 0
        @area       = window.area
        @browser    = new Browser @area.view
        @commands   = Object.create null
        @shortcuts  = ['command+.', 'command+shift+.']
        @names      = ["browse", "Browse"]
        
        @area.on 'resized', @onAreaResized
        
        post.on 'browser-item-activated', @onItemActivated
        post.on 'browser-match',          @onBrowserMatch
        
        super @commandline

    restoreState: (state) -> 
        super state
        @execute()
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: (@combo) ->
        
        @browser.start()
        
        if window.editor.currentFile?
            @browser.loadFile window.editor.currentFile 
        else 
            @browser.loadDir process.cwd()

        super @combo
        
        text:   @last()
        select: true
        do:     @name == 'Browse' and 'half area' or 'quart area'

    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000  
    # 000        000 000   000       000       000   000     000     000       
    # 0000000     00000    0000000   000       000   000     000     0000000   
    # 000        000 000   000       000       000   000     000     000       
    # 00000000  000   000  00000000   0000000   0000000      000     00000000  
    
    execute: (command) ->
        @cmdID += 1
        cmd = command.trim()
        if cmd.length 
            if dirExists cmd
                @browser.browse cmd
    
    onItemActivated: (item) =>
        if item.abs 
            pth = unresolve item.abs 
            if item.type == 'dir' then pth += '/'
            @commandline.setText pth

    onBrowserMatch: (match) =>
        log match
            
    onAreaResized: (w, h) => @browser.resized? w,h
                
module.exports = Browse
