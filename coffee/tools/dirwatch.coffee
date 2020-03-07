###
0000000    000  00000000   000   000   0000000   000000000   0000000  000   000  
000   000  000  000   000  000 0 000  000   000     000     000       000   000  
000   000  000  0000000    000000000  000000000     000     000       000000000  
000   000  000  000   000  000   000  000   000     000     000       000   000  
0000000    000  000   000  00     00  000   000     000      0000000  000   000  
###

{ klog, post, watch } = require 'kxk'

class DirWatch
       
    @watches = {}
        
    @watch: (dir) ->
        
        return if DirWatch.watches[dir]
        # klog "watch #{dir}" Object.keys DirWatch.watches
        
        watcher = watch.dir dir
        watcher.on 'change' (info) ->
            if info.change != 'change'
                klog 'DirWatch' info.change, info.path, info.dir
                post.emit 'dirChanged' info
        watcher.on 'error' (err) -> error "watch.error #{err}"
        DirWatch.watches[dir] = watcher
        
    @unwatch: (dir) -> 
        
        DirWatch.watches[dir]?.close()
        delete DirWatch.watches[dir]
        # klog "unwatch #{dir}" Object.keys DirWatch.watches

module.exports = DirWatch
