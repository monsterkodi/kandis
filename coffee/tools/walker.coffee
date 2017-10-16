
# 000   000   0000000   000      000   000  00000000  00000000 
# 000 0 000  000   000  000      000  000   000       000   000
# 000000000  000000000  000      0000000    0000000   0000000  
# 000   000  000   000  000      000  000   000       000   000
# 00     00  000   000  0000000  000   000  00000000  000   000

{ fileExists, dirExists, relative, path, fs, error, log
}       = require 'kxk'
walkdir = require 'walkdir'

class Walker

    constructor: (@cfg) ->
        
        @cfg.files       = []
        @cfg.stats       = []
        @cfg.maxDepth    ?= 3
        @cfg.dotFiles    ?= false
        @cfg.includeDirs ?= true
        @cfg.maxFiles    ?= 500
        @cfg.ignore      ?= ['node_modules', 'app', 'dist', 'build', 'Library', 'Applications']
        @cfg.include     ?= ['.konrad.noon', '.gitignore', '.npmignore']
        @cfg.ignoreExt   ?= ['.app']
        @cfg.includeExt  ?= ['.coffee', '.styl', '.pug', '.md', '.noon', # '.html', '.js', '.css',
                            '.txt', '.json', '.sh', '.py',                            
                            '.cpp', '.cc', '.c', '.h', '.hpp']
      
    #  0000000  000000000   0000000   00000000   000000000
    # 000          000     000   000  000   000     000   
    # 0000000      000     000000000  0000000       000   
    #      000     000     000   000  000   000     000   
    # 0000000      000     000   000  000   000     000   
    
    start: ->           
        # profile 'walker start'
        try
            dir = @cfg.root
            @walker = walkdir.walk dir, max_depth: @cfg.maxDepth
            onWalkerPath = (cfg) -> (p,stat) ->
                name = path.basename p
                extn = path.extname p

                if cfg.filter?(p)
                    return @ignore p
                else if name in ['.DS_Store', 'Icon\r'] or extn in ['.pyc']
                    return @ignore p
                else if cfg.includeDir? and path.dirname(p) == cfg.includeDir
                    cfg.files.push p
                    cfg.stats.push stat
                    @ignore p if name in cfg.ignore
                    @ignore p if name.startsWith('.') and not cfg.dotFiles
                else if name in cfg.ignore
                    return @ignore p
                else if name in cfg.include
                    cfg.files.push p
                    cfg.stats.push stat
                else if name.startsWith '.'
                    if cfg.dotFiles
                        cfg.files.push p
                        cfg.stats.push stat
                    else
                        return @ignore p 
                else if extn in cfg.ignoreExt
                    return @ignore p
                else if extn in cfg.includeExt or cfg.includeExt.indexOf('') >= 0
                    cfg.files.push p
                    cfg.stats.push stat
                else if stat.isDirectory()
                    if p != cfg.root and cfg.includeDirs
                        cfg.files.push p 
                        cfg.stats.push stat
                        
                cfg.path? p, stat
                if stat.isDirectory()
                    if cfg.includeDirs
                        cfg.dir? p, stat
                    if cfg.skipDir? p
                        @ignore p
                else
                    if path.extname(p) in cfg.includeExt or path.basename(p) in cfg.include or cfg.includeExt.indexOf('') >= 0
                        cfg.file? p, stat
                                                
                if cfg.files.length > cfg.maxFiles
                    # log "max files reached: #{cfg.files.length}"
                    @end()

                else if cfg.slowdown and (cfg.files.length % 20) == 19
                    @pause()
                    setTimeout @resume, 30
                    
            @walker.on 'path', onWalkerPath @cfg
            @walker.on 'end', => @cfg.done? @cfg.files, @cfg.stats
                
        catch err
            error "Walker.start -- #{err} dir: #{dir} stack:", err.stack

    stop: -> 
        
        @walker?.pause()
        @walker?.end()
        @walker = null
    
module.exports = Walker
