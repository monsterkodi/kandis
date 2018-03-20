###
 0000000   000  000000000   0000000  000000000   0000000   000000000  000   000   0000000  
000        000     000     000          000     000   000     000     000   000  000       
000  0000  000     000     0000000      000     000000000     000     000   000  0000000   
000   000  000     000          000     000     000   000     000     000   000       000  
 0000000   000     000     0000000      000     000   000     000      0000000   0000000   
###

{ childp, slash, str, log, _ } = require 'kxk'

gitRoot = require './gitroot'

gitStatus = (fileOrDir) ->

    # log 'gitStatus', fileOrDir
    gitDir = slash.unslash gitRoot fileOrDir

    if not gitDir? or not slash.isDir gitDir
        log 'no git?', fileOrDir, gitDir
        return 
    
    result = childp.execSync 'git status --porcelain', 
        cwd:      gitDir
        encoding: 'utf8'
    
    lines = result.split '\n'

    info = 
        gitDir:  gitDir
        changed: []
        deleted: []
        added:   []
        
    dirSet = new Set
    
    while line = lines.shift()
        rel    = line.slice 3
        file   = slash.join gitDir, line.slice 3
        while (rel = slash.dirname rel) != '.'
            dirSet.add rel
            
        header = line.slice 0,2
        switch header
            when ' D' then info.deleted.push file
            when ' M' then info.changed.push file
            when '??' then info.added  .push file
            
    info.dirs = Array.from(dirSet).map (d) -> slash.join gitDir, d
    
    return info

if module.parent
    module.exports = gitStatus
else
    log gitStatus process.cwd()
    