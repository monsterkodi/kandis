# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

resolve       = require './tools/resolve'
prefs         = require './tools/prefs'
log           = require './tools/log'
{first}       = require './tools/tools'
pkg           = require "../package.json"
execute       = require './execute'
MainMenu      = require './mainmenu'
fs            = require 'fs'
noon          = require 'noon'
colors        = require 'colors'
electron      = require 'electron'
app           = electron.app
BrowserWindow = electron.BrowserWindow
Tray          = electron.Tray
Menu          = electron.Menu
clipboard     = electron.clipboard
ipc           = electron.ipcMain
dialog        = electron.dialog
tray          = undefined
main          = undefined
wins          = []

#  0000000   00000000    0000000    0000000
# 000   000  000   000  000        000     
# 000000000  0000000    000  0000  0000000 
# 000   000  000   000  000   000       000
# 000   000  000   000   0000000   0000000 

args  = require('karg') """

#{pkg.name}

    arglist  . ? argument list           . ** .
    show     . ? open window on startup  . = true
    noprefs  . ? don't load preferences  . = false
    debug    . ? open developer tools    . = false . - D
    verbose  . ? log more                . = false
    
version  #{pkg.version}

""", dontExit: true

app.exit(0) if not args?

if args.verbose
    log colors.yellow.bold 'args'
    log noon.stringify args, colors:true
    log ''

# 00000000   00000000   00000000  00000000   0000000
# 000   000  000   000  000       000       000     
# 00000000   0000000    0000000   000000    0000000 
# 000        000   000  000       000            000
# 000        000   000  00000000  000       0000000 

prefs.init "#{app.getPath('userData')}/#{pkg.name}.json",
    shortcut: 'F2'

if args.verbose
    log colors.yellow.bold 'prefs'
    log noon.stringify prefs.load(), colors:true
    log ''

mostRecentFile = -> first prefs.get 'recentFiles', []

# 000   000  000  000   000   0000000
# 000 0 000  000  0000  000  000     
# 000000000  000  000 0 000  0000000 
# 000   000  000  000  0000       000
# 00     00  000  000   000  0000000 

wins        = -> BrowserWindow.getAllWindows()
activeWin   = -> BrowserWindow.getFocusedWindow()
visibleWins = -> (w for w in wins() when w?.isVisible() and not w?.isMinimized())
winWithID   = (winID) -> 
    for w in wins()
        return w if w.id == winID

# 0000000     0000000    0000000  000   000
# 000   000  000   000  000       000  000 
# 000   000  000   000  000       0000000  
# 000   000  000   000  000       000  000 
# 0000000     0000000    0000000  000   000

hideDock = ->
    return if prefs.get 'trayOnly', false
    app.dock.hide() if app.dock

# 000  00000000    0000000
# 000  000   000  000     
# 000  00000000   000     
# 000  000        000     
# 000  000         0000000

ipc.on 'execute',           (event, arg)   => event.sender.send 'executeResult', execute.execute arg
ipc.on 'toggleDevTools',    (event)        => event.sender.toggleDevTools()
ipc.on 'newWindowWithFile', (event, file)  => main.createWindow file
ipc.on 'reloadWindow',      (event, winID) => main.reloadWin winWithID winID
ipc.on 'saveBounds',        (event, winID) => main.saveWinBounds winWithID(winID) 
    
# 00     00   0000000   000  000   000
# 000   000  000   000  000  0000  000
# 000000000  000000000  000  000 0 000
# 000 0 000  000   000  000  000  0000
# 000   000  000   000  000  000   000

class Main
    
    constructor: -> 
        
        if app.makeSingleInstance @otherInstanceStarted
            log 'other instance already active -> quit'
            app.exit 0
            return
                
        MainMenu.init @
        
        tray = new Tray "#{__dirname}/../img/menu.png"
        tray.on 'click', @toggleWindows
        hideDock()
        
        electron.globalShortcut.register prefs.get('shortcut'), @toggleWindows

        execute.init()
            
        @restoreWindows() if not args.noprefs

        for file in args.arglist
            log 'create', file
            @createWindow file

        if not wins().length
            if args.show
                log 'load recent',mostRecentFile() 
                w = @createWindow mostRecentFile()
        
        if args.debug
            wins()?[0]?.webContents.openDevTools() 

        setTimeout @showWindows, 10
        
    # 000   000  000  000   000  0000000     0000000   000   000   0000000
    # 000 0 000  000  0000  000  000   000  000   000  000 0 000  000     
    # 000000000  000  000 0 000  000   000  000   000  000000000  0000000 
    # 000   000  000  000  0000  000   000  000   000  000   000       000
    # 00     00  000  000   000  0000000     0000000   00     00  0000000 
        
    reloadWin: (win) ->
        if win?
            dev = win.webContents.isDevToolsOpened()
            if dev
                win.webContents.closeDevTools()
                setTimeout win.webContents.reloadIgnoringCache, 100
            else
                win.webContents.reloadIgnoringCache()

    saveWinBounds: (win) ->
        prefs.setPath "windows.#{win.id}.bounds",win.getBounds()
    
    toggleWindows: =>
        if wins().length
            if visibleWins().length
                if activeWin()
                    @hideWindows()
                else
                    @raiseWindows()
            else
                @showWindows()
        else
            @createWindow()

    hideWindows: =>
        for w in wins()
            w.hide()
            hideDock()
            
    showWindows: =>
        for w in wins()
            w.show()
            app.dock.show()
            
    raiseWindows: =>
        if visibleWins().length
            for w in visibleWins()
                w.showInactive()
            visibleWins()[0].showInactive()
            visibleWins()[0].focus()
        
    focusNextWindow: (win) =>
        allWindows = wins()
        for w in allWindows
            if w == win
                i = 1 + allWindows.indexOf w
                i = 0 if i >= allWindows.length
                allWindows[i].focus()

    closeOtherWindows:=>
        for w in wins()
            w.close() if w != activeWin()
    
    closeWindows: =>
        for w in wins()
            w.close()
            hideDock()
            
    closeWindowsAndQuit: => 
        @closeWindows()
        @quit()
        
    #  0000000   00000000   00000000    0000000   000   000   0000000   00000000
    # 000   000  000   000  000   000  000   000  0000  000  000        000     
    # 000000000  0000000    0000000    000000000  000 0 000  000  0000  0000000 
    # 000   000  000   000  000   000  000   000  000  0000  000   000  000     
    # 000   000  000   000  000   000  000   000  000   000   0000000   00000000
        
    arrangeWindows: ->
        wl = visibleWins()
        {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
        if wl.length == 1
            wl[0].setBounds
                x:      parseInt width/4
                y:      parseInt 0
                width:  parseInt width/2
                height: parseInt height
            , true
        else if wl.length > 1 and wl.length < 4
            w = width/wl.length
            for i in [0...wl.length]
                wl[i].setBounds
                    x:      parseInt i * w
                    y:      parseInt 0
                    width:  parseInt w
                    height: parseInt height
                , true
        else if wl.length
            w2 = parseInt wl.length/2
            for i in [0...w2]
                w = width/w2
                wl[i].setBounds
                    x:      parseInt i * w
                    y:      parseInt 0
                    width:  parseInt w
                    height: parseInt height/2
                , true
            for i in [w2...wl.length]
                w = width/(wl.length-w2)
                wl[i].setBounds
                    x:      parseInt (i-w2) * w
                    y:      parseInt height - height/2
                    width:  parseInt w
                    height: parseInt height/2
                , true
                
    # 00000000   00000000   0000000  000000000   0000000   00000000   00000000
    # 000   000  000       000          000     000   000  000   000  000     
    # 0000000    0000000   0000000      000     000   000  0000000    0000000 
    # 000   000  000            000     000     000   000  000   000  000     
    # 000   000  00000000  0000000      000      0000000   000   000  00000000
    
    restoreWindows: ->
        windows = prefs.get 'windows', {}
        sequenced = {}
        i = 0
        for k, w of windows
            i += 1
            sequenced[i] = w
        #log 'sequenced', sequenced
        prefs.set 'windows', sequenced
        for k, w of sequenced
            @restoreWin w
                
    restoreWin: (state) ->
        w = @createWindow state.file
        w.setBounds state.bounds if state.bounds?
        w.webContents.openDevTools() if state.devTools
        w.showInactive()
        w.focus()
                
    #  0000000  00000000   00000000   0000000   000000000  00000000
    # 000       000   000  000       000   000     000     000     
    # 000       0000000    0000000   000000000     000     0000000 
    # 000       000   000  000       000   000     000     000     
    #  0000000  000   000  00000000  000   000     000     00000000
            
    createWindow: (openFile) ->
        win = new BrowserWindow
            width:           1000
            height:          1200
            minWidth:        120
            minHeight:       120
            useContentSize:  true
            backgroundColor: '#181818'
            fullscreen:      false
            show:            true
            titleBarStyle:   'hidden'
                    
        win.loadURL "file://#{__dirname}/../index.html"
        app.dock.show()
        win.on 'close', @onCloseWin
        win.on 'move', @onMoveWin
                
        winReady = =>
            win.webContents.send 'loadFile', openFile if openFile?
            win.webContents.send 'setWinID', win.id
        
        win.webContents.on 'dom-ready', winReady
                
        win 
    
    onMoveWin: (event) => @saveWinBounds event.sender
    
    onCloseWin: (event) =>
        log 'onCloseWin'
        if visibleWins().length == 1
            hideDock()
        prefs.setPath "windows.#{event.sender.id}", undefined
        
    otherInstanceStarted: (args, dir) =>
        log 'other instance args', args, 'dir', dir
        if not visibleWins().length
            @toggleWindows()
            
        for arg in args.slice(2)
            file = arg
            if not arg.startsWith '/'
                file = resolve dir + '/' + arg
            log 'create', file
            @createWindow file
            
        if !activeWin()
            visibleWins()[0]?.focus()
        
    quit: => 
        log 'exit'
        app.exit 0
    
    #  0000000   0000000     0000000   000   000  000000000
    # 000   000  000   000  000   000  000   000     000   
    # 000000000  0000000    000   000  000   000     000   
    # 000   000  000   000  000   000  000   000     000   
    # 000   000  0000000     0000000    0000000      000   
    
    showAbout: =>    
        cwd = __dirname
        w = new BrowserWindow
            dir:           cwd
            preloadWindow: true
            resizable:     true
            frame:         true
            show:          true
            center:        false
            width:         400
            height:        420
        # w.webContents.openDevTools()
        w.loadURL "file://#{cwd}/../about.html"
        w.on 'openFileDialog', @createWindow
            
# 00000000   00000000   0000000   0000000    000   000
# 000   000  000       000   000  000   000   000 000 
# 0000000    0000000   000000000  000   000    00000  
# 000   000  000       000   000  000   000     000   
# 000   000  00000000  000   000  0000000       000   

app.on 'ready', => main = new Main
app.on 'window-all-closed', -> 
    

        
                
            