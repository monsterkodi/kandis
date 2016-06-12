#  0000000   00000000   00000000  000   000
# 000   000  000   000  000       0000  000
# 000   000  00000000   0000000   000 0 000
# 000   000  000        000       000  0000
#  0000000   000        00000000  000   000

{
fileExists,
fileList,
relative,
resolve,
clamp,
last,
$
}       = require '../tools/tools'
log     = require '../tools/log'
Command = require '../commandline/command'
render  = require '../editor/render'
split   = require '../split'
path    = require 'path'
walkdir = require 'walkdir'
fuzzy   = require 'fuzzy'
fs      = require 'fs'
_       = require 'lodash'

class Open extends Command

    constructor: ->
        
        @shortcut = 'command+p'
        @files    = null
        @file     = null
        @dir      = null
        @pkg      = null
        @selected = 0
        
        super
                    
    #  0000000  000   000   0000000   000   000   0000000   00000000  0000000  
    # 000       000   000  000   000  0000  000  000        000       000   000
    # 000       000000000  000000000  000 0 000  000  0000  0000000   000   000
    # 000       000   000  000   000  000  0000  000   000  000       000   000
    #  0000000  000   000  000   000  000   000   0000000   00000000  0000000  

    changed: (command) ->
        return if not @list? 
        command  = command.trim()
        if command.length
            fuzzied  = fuzzy.filter command, @files       
            filtered = (f.string for f in fuzzied)
            @listFiles filtered
        else
            @listFiles @files
        
        @select 0
        
    showList: ->
        cmdline = window.commandline
        @list = document.createElement 'div'
        @list.className = 'list'
        @list.style.top = split.botHandle.style.top
        split.elem.appendChild @list 
        @listFiles @files
        
    # 00000000   00000000   00000000  000   000
    # 000   000  000   000  000       000   000
    # 00000000   0000000    0000000    000 000 
    # 000        000   000  000          000   
    # 000        000   000  00000000      0    
            
    prev: -> 
        if @index == @history.length-1 and @selected > 0
            @select clamp 0, @list.children.length, @selected-1
            @list.children[@selected]?.value ? @history[@index]
        else
            super
        
    # 000   000  00000000  000   000  000000000
    # 0000  000  000        000 000      000   
    # 000 0 000  0000000     00000       000   
    # 000  0000  000        000 000      000   
    # 000   000  00000000  000   000     000   
    
    next: -> 
        if @index == @history.length-1
            @select clamp 0, @list.children.length, @selected+1
            @list.children[@selected]?.value ? @history[@index]
        else
            super
        
    #  0000000  00000000  000      00000000   0000000  000000000
    # 000       000       000      000       000          000   
    # 0000000   0000000   000      0000000   000          000   
    #      000  000       000      000       000          000   
    # 0000000   00000000  0000000  00000000   0000000     000   
        
    select: (i) ->
        @list?.children[@selected]?.className = 'list-file'
        @selected = clamp 0, @list?.children.length-1, i
        @list?.children[@selected]?.className = 'list-file selected'
        @list?.children[@selected]?.scrollIntoViewIfNeeded()
        
    openFileAtIndex: (i) =>
        @select i
        if @execute() == 'editor'
            split.focusEditor()
    
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
        
    start: -> 
        window.openFileAtIndex = @openFileAtIndex
        @files = []
        @selected = 0
        if window.editor.currentFile?
            @file  = window.editor.currentFile 
            @dir   = path.dirname @file
            @pkg   = @packagePath @dir
        else
            @file = null
            @dir  = @pkg = resolve '~'
        that = @
        try
            walkdir.sync @pkg, max_depth: 3, (p) ->
                name = path.basename p
                extn = path.extname p
                if name in ['node_modules', 'app', 'img', 'dist', 'build', 'Library', 'Applications']
                    @ignore p 
                else if name in ['.konrad.noon', '.gitignore', '.npmignore']
                    that.files.push p
                else if (name.startsWith '.') or extn in ['.app']
                    @ignore p 
                else if extn in ['.coffee', '.styl', '.js', '.html', '.md', '.noon', '.json', '.sh', '.py', '.css']
                    that.files.push p
                if that.files.length > 500
                    @end()
        catch err
            log err
            
        base = @dir
        weight = (f) =>
            if f.startsWith @dir
                return 10000-path.dirname(f).length
            if f.startsWith path.dirname @dir
                return 5000-path.dirname(f).length
            else
                return 1000-path.dirname(f).length
        @files.sort (a,b) -> weight(b) - weight(a)
        
        if @history.length
            h = (f for f in @history when f.length and (f != @file))
            @files = _.concat h, @files
                    
        @files = (relative(f, @dir) for f in @files)
        @files = _.uniq @files

        @showList()
        @select h.length - 1
        v = @list?.children[@selected]?.value 
        return v
            
    # 00000000  000   000  00000000   0000000  000   000  000000000  00000000
    # 000        000 000   000       000       000   000     000     000     
    # 0000000     00000    0000000   000       000   000     000     0000000 
    # 000        000 000   000       000       000   000     000     000     
    # 00000000  000   000  00000000   0000000   0000000      000     00000000
        
    execute: (command) ->

        selected = @list?.children[@selected]?.value ? command

        @hideList()
        
        files = _.words selected, new RegExp "[^, ]+", 'g'
                
        for i in [0...files.length]
            file = files[i]
            file = path.join @dir, file
            if not fileExists file
                if '' == path.extname file
                    if fileExists file + '.coffee'
                        file += '.coffee'
            files.splice i, 1, file
        
        opened = window.openFiles files
        if opened?.length
            if opened.length == 1
                super opened[0]
            else
                super selected
                
            text:  (path.basename(f) for f in opened).join ' '
            focus: 'editor'

    # 00000000    0000000    0000000  000   000   0000000    0000000   00000000
    # 000   000  000   000  000       000  000   000   000  000        000     
    # 00000000   000000000  000       0000000    000000000  000  0000  0000000 
    # 000        000   000  000       000  000   000   000  000   000  000     
    # 000        000   000   0000000  000   000  000   000   0000000   00000000
    
    packagePath: (p) ->
        while p.length and p not in ['.', '/']            
            if fs.existsSync path.join p, 'package.noon'
                return resolve p
            if fs.existsSync path.join p, 'package.json'
                return resolve p
            p = path.dirname p
        null
    
    # 000      000   0000000  000000000
    # 000      000  000          000   
    # 000      000  0000000      000   
    # 000      000       000     000   
    # 0000000  000  0000000      000   
            
    listFiles: (files) ->
        @list.innerHTML = ""        
        if files.length == 0
            @list.style.display = 'none'
        else
            @list.style.display = 'unset'
            index = 0
            for file in files
                div = document.createElement 'div'
                div.className = 'list-file'
                div.innerHTML = render.line file, 'ko'
                div.setAttribute "onclick", "window.openFileAtIndex(#{index});"
                @list.appendChild div
                div.value = file
                index += 1
    
    # 000   000  000  0000000    00000000
    # 000   000  000  000   000  000     
    # 000000000  000  000   000  0000000 
    # 000   000  000  000   000  000     
    # 000   000  000  0000000    00000000
            
    hideList: ->
        @list?.remove()
        @list = null
                
    cancel: ->
        @hideList()
        super
        
module.exports = Open