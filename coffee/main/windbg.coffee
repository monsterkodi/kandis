
# 000   000  000  000   000  0000000    0000000     0000000   
# 000 0 000  000  0000  000  000   000  000   000  000        
# 000000000  000  000 0 000  000   000  0000000    000  0000  
# 000   000  000  000  0000  000   000  000   000  000   000  
# 00     00  000  000   000  0000000    0000000     0000000   

{ joinFileLine, samePath, splitFileLine, unresolve, post, path, empty, log, _
}        = require 'kxk'
electron = require 'electron'
srcmap   = require '../tools/srcmap'

class WinDbg 
    
    constructor: (@debugger, @wid) ->
        
        @status      = 'running'
        @scripts     = {}
        @scriptMap   = {}
        @breakpoints = {}
        @stacktrace  = []
        
        @dbg = electron.BrowserWindow.fromId(@wid).webContents.debugger

        if not @dbg.isAttached()
            try
                @dbg.attach '1.2'
            catch err
                error "can't attach!", err

        @dbg.on 'message', @onMessage

        @dbg.sendCommand 'Debugger.enable', (err,result) => 
            return error "unable to enable debugger" if not empty err # or not result
            log "winDbg #{@wid}"
            
            @enabled = true
            
            if @breakdelay
                while bp = @breakdelay.shift()
                    @setBreakpoint.apply @, bp
                delete @breakdelay
            
            for k,s of @scriptMap
                s.file = unresolve s.url
                if s.sourceMapURL and s.sourceMapURL.length
                    coffeeSrc = srcmap.toCoffee s.url
                    if not empty coffeeSrc
                        s.file = unresolve coffeeSrc
                @scripts[s.file] = s
    
    # 0000000    00000000  000      
    # 000   000  000       000      
    # 000   000  0000000   000      
    # 000   000  000       000      
    # 0000000    00000000  0000000  
    
    del: ->
        
        if @dbg
            @dbg.removeListener 'message', @onMessage
            @dbg.detach()
            delete @dbg
            
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    info: ->
                    
        info =
            breakpoints: @breakpoints
            # scripts:     @scripts 
            # scriptMap:   @scriptMap
        
        info.stacktrace = @stacktrace if @status == 'paused'
        # info.file = unresolve @fileLine if @fileLine
        info[@status] = @status == 'paused' and unresolve(@fileLine) or true
        info
        
    # 0000000    00000000   00000000   0000000   000   000  
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    0000000    0000000   000000000  0000000    
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    000   000  00000000  000   000  000   000  
    
    setBreakpoint: (file, line, col, status) ->
        
        log "WinDbg.setBreakpoint file:#{file} line:#{line} col:#{col} status:#{status}"
        
        if not @enabled
            @breakdelay ?= []
            @breakdelay.push [file, line, col, status]
            return
            
        if path.extname(file) == '.coffee'
            [jsFile, jsLine, jsCol] = srcmap.toJs file, line, col
            if not jsFile
                return error "no js source line for #{file}:#{line}:#{col}"
                    
            [backFile, backLine] = srcmap.toCoffee jsFile, jsLine, jsCol
            return error "can't remap fileLine #{backFile}:#{backLine} #{file}:#{line}" if backFile != file or backLine != line
            log "#{unresolve backFile}:#{backLine} #{unresolve jsFile}:#{jsLine}"
        else
            [jsFile, jsLine] = [file, line]
        
        jsFile = unresolve jsFile
        breakKey = joinFileLine jsFile, jsLine, jsCol
        breakpoint = @breakpoints[breakKey]
        
        if breakpoint and status in ['toggle', 'inactive']

            if status == 'toggle'
                breakpoint.status = 'remove'
                delete @breakpoints[breakKey]

            @dbg.sendCommand "Debugger.removeBreakpoint", {breakpointId:breakpoint.id}, (err,result) => 
                return error "unable to remove breakpoint #{breakKey}", err if not empty err
                post.toWin @wid, 'setBreakpoint', breakpoint
            
        else

            if status == 'toggle' then status = 'active'
            
            breakLoc = 
                url:  resolve jsFile 
                lineNumber:   jsLine
                columnNumber: jsCol
                
            @dbg.sendCommand "Debugger.setBreakpointByUrl", breakLoc, (err,result) => 
                
                return error "unable to set breakpoint #{breakKey}", err if not empty err
                
                if result.locations.length
                    breakpoint = file:file, line:line, col: col, status:status, id:result.breakpointId
                    @breakpoints[breakKey] = breakpoint
                    log 'breakpoint', @breakpoints[breakKey]
                    post.toWin @wid, 'setBreakpoint', breakpoint
                    post.toWins 'debuggerChanged'
                else
                    log "no location for #{breakKey}?"

    breakpointsForFile: (file) ->
        
        bpts = []
        for k,v of @breakpoints
            if samePath v.file, file
                bpts.push v
        bpts        

    # 00     00  00000000   0000000   0000000   0000000    0000000   00000000  
    # 000   000  000       000       000       000   000  000        000       
    # 000000000  0000000   0000000   0000000   000000000  000  0000  0000000   
    # 000 0 000  000            000       000  000   000  000   000  000       
    # 000   000  00000000  0000000   0000000   000   000   0000000   00000000  
    
    onMessage: (event, method, params) =>
        # log "method: #{method}"
        switch method 
            
            when 'Debugger.scriptParsed' then @scriptMap[params.scriptId] = params
            when 'Debugger.breakpointResolved' then log 'breakpoint: '+ params # never happens?
            when 'Debugger.paused' 

                # log 'debugger.paused', params.reason
                
                @buildStackTrace params.callFrames
                    
                if params.hitBreakpoints[0]
                    log 'BREAK', params.hitBreakpoints[0]
                    [file,line,col] = splitFileLine params.hitBreakpoints[0]
                    fileLine = joinFileLine.apply joinFileLine, srcmap.toCoffee file, line, col
                    
                    wtf = @fileLocation params.callFrames[0].location
                    if wtf != unresolve fileLine then error 'breakpoint and stacktrace differ?', wtf, unresolve fileLine
                else
                    fileLine = @fileLocation params.callFrames[0].location
                    
                [file, line, col] = splitFileLine fileLine
                if path.extname(file) != '.coffee'
                    # log 'step', fileLine
                    @debugCommand 'step'
                else
                    @fileLine = fileLine
                    # log 'fileLine', @fileLine
                    @status = 'paused'
                    @sendFileLine()                
                    
            when 'Debugger.resumed'
                
                @status = 'running'
                delete @fileLine
                post.toWins 'debuggerChanged'

    sendFileLine: -> @debugger.sendFileLine winID: @wid, fileLine:@fileLine

    #  0000000  000000000   0000000    0000000  000   000  000000000  00000000    0000000    0000000  00000000  
    # 000          000     000   000  000       000  000      000     000   000  000   000  000       000       
    # 0000000      000     000000000  000       0000000       000     0000000    000000000  000       0000000   
    #      000     000     000   000  000       000  000      000     000   000  000   000  000       000       
    # 0000000      000     000   000   0000000  000   000     000     000   000  000   000   0000000  00000000  
    
    buildStackTrace: (frames) ->
        
        @stacktrace = []
        i = 0
        for frame in frames
            frame.name = empty(frame.functionName.trim()) and "▶" or "▶ "+frame.functionName
            frame.file = @fileLocation frame.location
            frame.functionFile = @fileLocation frame.functionLocation
            @stacktrace.push frame 
            i++
            
        log @stacktrace

    # 000       0000000    0000000   0000000   000000000  000   0000000   000   000  
    # 000      000   000  000       000   000     000     000  000   000  0000  000  
    # 000      000   000  000       000000000     000     000  000   000  000 0 000  
    # 000      000   000  000       000   000     000     000  000   000  000  0000  
    # 0000000   0000000    0000000  000   000     000     000   0000000   000   000  
    
    fileLocation: (location) ->
        if @scriptMap[location?.scriptId]?
            jsFile = @scriptMap[location.scriptId].url
            jsLine = location.lineNumber
            jsCol  = location.columnNumber
            [coffeeFile, coffeeLine, coffeeCol] = srcmap.toCoffee jsFile, jsLine, jsCol
            if coffeeLine
                return unresolve joinFileLine coffeeFile, coffeeLine, coffeeCol
            else
                return unresolve joinFileLine jsFile, jsLine, jsCol
        null
        
    #  0000000   0000000   00     00  00     00   0000000   000   000  0000000    
    # 000       000   000  000   000  000   000  000   000  0000  000  000   000  
    # 000       000   000  000000000  000000000  000000000  000 0 000  000   000  
    # 000       000   000  000 0 000  000 0 000  000   000  000  0000  000   000  
    #  0000000   0000000   000   000  000   000  000   000  000   000  0000000    
    
    debugCommand: (command) ->
        
        map = 
            step:  'stepOver'
            into:  'stepInto'
            out:   'stepOut'
            cont:  'resume'
            pause: 'pause'
            
        if map[command]?
            # log "send #{map[command]}"
            @dbg.sendCommand "Debugger.#{map[command]}"

module.exports = WinDbg