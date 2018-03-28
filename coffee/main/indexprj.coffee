###
000  000   000  0000000    00000000  000   000  00000000   00000000         000    
000  0000  000  000   000  000        000 000   000   000  000   000        000    
000  000 0 000  000   000  0000000     00000    00000000   0000000          000    
000  000  0000  000   000  000        000 000   000        000   000  000   000    
000  000   000  0000000    00000000  000   000  000        000   000   0000000     
###

{ slash, walkdir, empty, fs, log } = require 'kxk'

ignore = require 'ignore'

indexProject = (file) ->

    depth = 20
    
    dir = slash.pkg file
    if not dir
        depth = 3
        if slash.isFile file
            dir = slash.dir file
        else if slash.isDir file
            dir = file
            
    return if not dir
    
    kofiles = []
    info = dir:dir, files:[]

    log 'indexProject dir', dir

    ign = ignore()
    
    opt = 
        max_depth: depth
        no_return: true
                
    walkdir.sync dir, opt, (path, stat) ->
        
        addIgnores = (gitignore) -> 
            # log '------------------- ', gitignore
            gitign = fs.readFileSync gitignore, 'utf8'
            gitign = gitign.split /\r?\n/
            gitign = gitign.filter (i) -> not empty(i) and not i.startsWith "#"
            gitdir = slash.dir gitignore
            if not slash.samePath gitdir, dir
                gitign = gitign.map (i) -> 
                    if i[0]=='!'
                        '!' + slash.relative(gitdir, dir) + i.slice 1
                    else
                        slash.relative(gitdir, dir) + i
            ign.add gitign
        
        if ign.ignores slash.relative path, dir
            # log 'ign!', slash.relative path, dir
            @ignore path
            return
        
        if stat.isDirectory()
            gitignore = slash.join path, '.gitignore'
            if slash.isFile gitignore
                addIgnores gitignore
        else
            file = slash.file path
            if file == '.gitignore'
                addIgnores path
                return
                
            if file == '.ko.noon'
                kofiles.push path
                
            if slash.ext(path) in [ 'coffee', 'styl', 'pug', 'md', 'noon', 'txt', 'json', 'sh', 'py',                            
                                    'cpp', 'cc', 'c', 'cs', 'h', 'hpp' ]
                if stat.size > 654321
                    log 'file to big!', path
                    return
                info.files.push slash.path path
                
    log 'kofiles', kofiles
    info

if module.parent
    module.exports = indexProject
else
    info = indexProject slash.resolve process.argv[2]
    # log info 
    log "#{info.files.length} files"
    