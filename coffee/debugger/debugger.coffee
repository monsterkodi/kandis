
# 0000000    00000000  0000000    000   000   0000000    0000000   00000000  00000000   
# 000   000  000       000   000  000   000  000        000        000       000   000  
# 000   000  0000000   0000000    000   000  000  0000  000  0000  0000000   0000000    
# 000   000  000       000   000  000   000  000   000  000   000  000       000   000  
# 0000000    00000000  0000000     0000000    0000000    0000000   00000000  000   000  

{ joinFileLine, splitFileLine, unresolve, post, path, log, _
} = require 'kxk'

electron = require 'electron'
srcmap   = require './srcmap'

# 000   000  000  000   000  0000000    0000000     0000000   
# 000 0 000  000  0000  000  000   000  000   000  000        
# 000000000  000  000 0 000  000   000  0000000    000  0000  
# 000   000  000  000  0000  000   000  000   000  000   000  
# 00     00  000  000   000  0000000    0000000     0000000   

class WinDbg 
    
    constructor: (@wid) ->
        
        @win         = null
        @status      = 'running'
        @scripts     = {}
        @scriptMap   = {}
        @breakpoints = {}
        @stacktrace  = {}
        
        @dbg = electron.BrowserWindow.fromId(@wid).webContents.debugger

        if not @dbg.isAttached()
            try
                @dbg.attach '1.2'
            catch err
                error "can't attach!", err

        @dbg.on 'message', @onMessage

        @dbg.sendCommand 'Debugger.enable', (err,result) => 
            return error "unable to enable debugger" if not _.isEmpty(err) # or not result
            log "winDbg #{@wid}"
            
            @enabled = true
            
            if @breakdelay
                while bp = @breakdelay.shift()
                    @setBreakpoint bp[0], bp[1], bp[2]
                delete @breakdelay
            
            for k,s of @scriptMap
                s.file = unresolve s.url
                if s.sourceMapURL and s.sourceMapURL.length
                    s.file = unresolve srcmap.toCoffee s.url
                @scripts[s.file] = s
                
    # 000  000   000  00000000   0000000   
    # 000  0000  000  000       000   000  
    # 000  000 0 000  000000    000   000  
    # 000  000  0000  000       000   000  
    # 000  000   000  000        0000000   
    
    info: ->
                    
        info =
            breakpoints: @breakpoints
            stacktrace:  @stacktrace
            scriptMap:   @scriptMap
            scripts:     @scripts 
            winID:       @wid
        
        info.file = unresolve @fileLine if @fileLine
        info[@status] = @status
        info
        
    # 0000000    00000000   00000000   0000000   000   000  
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    0000000    0000000   000000000  0000000    
    # 000   000  000   000  000       000   000  000  000   
    # 0000000    000   000  00000000  000   000  000   000  
    
    setBreakpoint: (file, line, status) ->
        
        if not @enabled
            @breakdelay ?= []
            @breakdelay.push [file, line, status]
            return
            
        if path.extname(file) == '.coffee'
            [jsSource, jsLine] = srcmap.toJs file, line
            if not jsSource
                return error "no js source line for #{file}:#{line}"
        else
            [jsSource, jsLine] = [file, line]
        
        breakpoint = @breakpoints["#{jsSource}:#{jsLine}"]
        
        if breakpoint and status in ['toggle', 'inactive']

            if status == 'toggle'
                breakpoint.status = 'remove'
                delete @breakpoints["#{jsSource}:#{jsLine}"]

            @dbg.sendCommand "Debugger.removeBreakpoint", {breakpointId:breakpoint.id}, (err,result) => 
                return error "unable to remove breakpoint #{jsSource}:#{jsLine}", err if not _.isEmpty(err)
                post.toWin @wid, 'setBreakpoint', breakpoint
            
        else

            if status == 'toggle'
                status = 'active'

            @dbg.sendCommand "Debugger.setBreakpointByUrl", {url:jsSource, lineNumber:jsLine}, (err,result) => 
                return error "unable to set breakpoint #{jsSource}:#{jsLine}", err if not _.isEmpty(err)
                if result.locations.length
                    breakpoint = file:file, line:line, status:status, id:result.breakpointId
                    @breakpoints["#{jsSource}:#{jsLine}"] = breakpoint
                    log "breakpoint", @breakpoints["#{jsSource}:#{jsLine}"]
                    post.toWin @wid, 'setBreakpoint', breakpoint
                else
                    log "no location for #{jsSource}:#{jsLine}?"

    # 00     00  00000000   0000000   0000000   0000000    0000000   00000000  
    # 000   000  000       000       000       000   000  000        000       
    # 000000000  0000000   0000000   0000000   000000000  000  0000  0000000   
    # 000 0 000  000            000       000  000   000  000   000  000       
    # 000   000  00000000  0000000   0000000   000   000   0000000   00000000  
    
    onMessage: (event, method, params) =>

        switch method 
            
            when 'Debugger.scriptParsed' then @scriptMap[params.scriptId] = params
            when 'Debugger.breakpointResolved' then log 'breakpoint: '+ params # never happens?
            when 'Debugger.paused' 

                @buildStackTrace params.callFrames
                    
                @fileLine = params.hitBreakpoints[0]
                [file, line] = splitFileLine @fileLine
                
                [coffeeSource, coffeeLine] = srcmap.toCoffee file, line
                if coffeeLine
                    @fileLine = joinFileLine coffeeSource, coffeeLine
                    
                @status = 'paused'
                @sendInfo()                
                    
            when 'Debugger.resumed'
                @status = 'running'
                delete @fileLine
                @sendInfo()
                
            else log "method: #{method}"

    sendInfo: ->
        if not @win or not main.activateWindowWithID @win.id
            @win = main.createWindow file:@fileLine, debug:@info()
        else
            post.toWin @win.id, 'debug', @info()

    buildStackTrace: (frames) ->
        
        @stacktrace = {}
        i = 0
        for frame in frames
            frame.file = @fileLocation frame.location
            frame.functionFile = @fileLocation frame.functionLocation
            @stacktrace["#{i++}: #{frame.functionName}"] = frame

    fileLocation: (location) ->
        if @scriptMap[location?.scriptId]?
            return "#{@scriptMap[location.scriptId].url}:#{location.lineNumber}:#{location.columnNumber}"
        null
        
    debugCommand: (command) ->
        
        map = 
            step: 'stepOver'
            in:   'stepInto'
            out:  'stepOut'
            cont: 'resume'
            pause:'pause'
            
        if map[command]?
            log "send #{map[command]}"
            @dbg.sendCommand "Debugger.#{map[command]}"
            

# 0000000    00000000  0000000    000   000   0000000    0000000   00000000  00000000   
# 000   000  000       000   000  000   000  000        000        000       000   000  
# 000   000  0000000   0000000    000   000  000  0000  000  0000  0000000   0000000    
# 000   000  000       000   000  000   000  000   000  000   000  000       000   000  
# 0000000    00000000  0000000     0000000    0000000    0000000   00000000  000   000  

class Debugger
    
    constructor: ->
        # log 'Debugger'
        post.onGet 'dbgInfo',   @onDbgInfo
        post.on 'breakpoint',   @onBreakpoint
        post.on 'debugCommand', @onDebugCommand
        @winDbg = {}
        
    onDbgInfo: =>
        info = {}
        for wid,dbg of @winDbg
            info[wid] = dbg.info()
        info
        
    onBreakpoint: (wid, file, line, status='toggle') =>
        return error 'wrong file type' if path.extname(file) not in ['.js', '.coffee']
        # log 'onBreakpoint', wid, file, line
        @winDbg[wid] ?= new WinDbg wid
        @winDbg[wid].setBreakpoint file, line, status
        
    onDebugCommand: (wid, cmd) =>
        log 'onDebugCommand', wid, cmd
        for w,dbg of @winDbg
            if dbg.win?.id == wid
                dbg.debugCommand cmd
                return
        
module.exports = Debugger
    