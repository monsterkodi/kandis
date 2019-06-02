// koffee 0.56.0

/*
00000000   0000000   00000000   000   000  00000000  000   000  000   000   0000000    
000       000   000  000   000  000  000   000       000   000  0000  000  000         
000000    000   000  0000000    0000000    000000    000   000  000 0 000  000         
000       000   000  000   000  000  000   000       000   000  000  0000  000         
000        0000000   000   000  000   000  000        0000000   000   000   0000000
 */
var callFunc, childp, forkfunc, ref, sendResult, slash,
    slice = [].slice;

if (module.parent) {
    ref = require('kxk'), childp = ref.childp, slash = ref.slash;
    forkfunc = function() {
        var args, callback, cp, dirname, err, file, i, match, onExit, onResult, regx, stack;
        file = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), callback = arguments[i++];
        if (/^[.]?\.\//.test(file)) {
            stack = new Error().stack.split(/\r\n|\n/);
            regx = /\(([^\)]*)\)/;
            match = regx.exec(stack[3]);
            dirname = slash.dir(match[1]);
            file = slash.join(dirname, file);
        }
        try {
            cp = childp.fork(__filename);
            onExit = function() {
                cp.removeListener('message', onResult);
                cp.removeListener('exit', onExit);
                if (cp.connected) {
                    cp.disconnect();
                }
                return cp.kill();
            };
            onResult = function(msg) {
                var result;
                result = msg;
                callback(result.err, result.result);
                return onExit();
            };
            cp.on('error', function(err) {
                return callback(err, null);
            });
            cp.on('message', onResult);
            cp.on('exit', onExit);
            cp.send({
                file: file,
                args: args
            });
        } catch (error) {
            err = error;
            callback(err, null);
        }
        return cp;
    };
    module.exports = forkfunc;
} else {
    sendResult = function(err, result) {
        process.removeListener('message', callFunc);
        return process.send({
            err: err,
            result: result
        }, function() {
            if (process.connected) {
                process.disconnect();
            }
            return process.exit(0);
        });
    };
    callFunc = function(msg) {
        var err, func, result;
        try {
            func = require(msg.file);
            result = func.apply(func, msg.args);
            return sendResult(null, result);
        } catch (error) {
            err = error;
            return sendResult(err.stack);
        }
    };
    process.on('message', callFunc);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ya2Z1bmMuanMiLCJzb3VyY2VSb290IjoiLiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7QUFBQSxJQUFBLGtEQUFBO0lBQUE7O0FBUUEsSUFBRyxNQUFNLENBQUMsTUFBVjtJQVFJLE1BQW9CLE9BQUEsQ0FBUSxLQUFSLENBQXBCLEVBQUUsbUJBQUYsRUFBVTtJQUVWLFFBQUEsR0FBVyxTQUFBO0FBRVAsWUFBQTtRQUZRLHFCQUFNLGlHQUFTO1FBRXZCLElBQUcsV0FBVyxDQUFDLElBQVosQ0FBaUIsSUFBakIsQ0FBSDtZQUNJLEtBQUEsR0FBVSxJQUFJLEtBQUosQ0FBQSxDQUFXLENBQUMsS0FBSyxDQUFDLEtBQWxCLENBQXdCLFNBQXhCO1lBQ1YsSUFBQSxHQUFVO1lBQ1YsS0FBQSxHQUFVLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBTSxDQUFBLENBQUEsQ0FBaEI7WUFDVixPQUFBLEdBQVUsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFNLENBQUEsQ0FBQSxDQUFoQjtZQUNWLElBQUEsR0FBVSxLQUFLLENBQUMsSUFBTixDQUFXLE9BQVgsRUFBb0IsSUFBcEIsRUFMZDs7QUFPQTtZQUNJLEVBQUEsR0FBSyxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQVo7WUFFTCxNQUFBLEdBQVMsU0FBQTtnQkFDTCxFQUFFLENBQUMsY0FBSCxDQUFrQixTQUFsQixFQUE2QixRQUE3QjtnQkFDQSxFQUFFLENBQUMsY0FBSCxDQUFrQixNQUFsQixFQUE2QixNQUE3QjtnQkFDQSxJQUFtQixFQUFFLENBQUMsU0FBdEI7b0JBQUEsRUFBRSxDQUFDLFVBQUgsQ0FBQSxFQUFBOzt1QkFDQSxFQUFFLENBQUMsSUFBSCxDQUFBO1lBSks7WUFNVCxRQUFBLEdBQVcsU0FBQyxHQUFEO0FBQ1Asb0JBQUE7Z0JBQUEsTUFBQSxHQUFTO2dCQUNULFFBQUEsQ0FBUyxNQUFNLENBQUMsR0FBaEIsRUFBcUIsTUFBTSxDQUFDLE1BQTVCO3VCQUNBLE1BQUEsQ0FBQTtZQUhPO1lBS1gsRUFBRSxDQUFDLEVBQUgsQ0FBTSxPQUFOLEVBQWlCLFNBQUMsR0FBRDt1QkFBUyxRQUFBLENBQVMsR0FBVCxFQUFjLElBQWQ7WUFBVCxDQUFqQjtZQUNBLEVBQUUsQ0FBQyxFQUFILENBQU0sU0FBTixFQUFpQixRQUFqQjtZQUNBLEVBQUUsQ0FBQyxFQUFILENBQU0sTUFBTixFQUFpQixNQUFqQjtZQUVBLEVBQUUsQ0FBQyxJQUFILENBQ0k7Z0JBQUEsSUFBQSxFQUFPLElBQVA7Z0JBQ0EsSUFBQSxFQUFPLElBRFA7YUFESixFQWxCSjtTQUFBLGFBQUE7WUFzQk07WUFFRixRQUFBLENBQVMsR0FBVCxFQUFjLElBQWQsRUF4Qko7O2VBMEJBO0lBbkNPO0lBcUNYLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBL0NyQjtDQUFBLE1BQUE7SUF5REksVUFBQSxHQUFhLFNBQUMsR0FBRCxFQUFNLE1BQU47UUFFVCxPQUFPLENBQUMsY0FBUixDQUF1QixTQUF2QixFQUFrQyxRQUFsQztlQUNBLE9BQU8sQ0FBQyxJQUFSLENBQWE7WUFBQyxHQUFBLEVBQUksR0FBTDtZQUFVLE1BQUEsRUFBTyxNQUFqQjtTQUFiLEVBQXVDLFNBQUE7WUFDbkMsSUFBd0IsT0FBTyxDQUFDLFNBQWhDO2dCQUFBLE9BQU8sQ0FBQyxVQUFSLENBQUEsRUFBQTs7bUJBQ0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxDQUFiO1FBRm1DLENBQXZDO0lBSFM7SUFPYixRQUFBLEdBQVcsU0FBQyxHQUFEO0FBRVAsWUFBQTtBQUFBO1lBRUksSUFBQSxHQUFPLE9BQUEsQ0FBUSxHQUFHLENBQUMsSUFBWjtZQUNQLE1BQUEsR0FBUyxJQUFJLENBQUMsS0FBTCxDQUFXLElBQVgsRUFBaUIsR0FBRyxDQUFDLElBQXJCO21CQUNULFVBQUEsQ0FBVyxJQUFYLEVBQWlCLE1BQWpCLEVBSko7U0FBQSxhQUFBO1lBTU07bUJBRUYsVUFBQSxDQUFXLEdBQUcsQ0FBQyxLQUFmLEVBUko7O0lBRk87SUFZWCxPQUFPLENBQUMsRUFBUixDQUFXLFNBQVgsRUFBc0IsUUFBdEIsRUE1RUoiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgIFxuMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAgXG4wMDAwMDAgICAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgICAgICBcbjAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgICAgIFxuMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgXG4jIyNcblxuaWYgbW9kdWxlLnBhcmVudFxuXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAgIDAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMFxuXG4gICAgeyBjaGlsZHAsIHNsYXNoIH0gPSByZXF1aXJlICdreGsnXG5cbiAgICBmb3JrZnVuYyA9IChmaWxlLCBhcmdzLi4uLCBjYWxsYmFjaykgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIC9eWy5dP1xcLlxcLy8udGVzdCBmaWxlXG4gICAgICAgICAgICBzdGFjayAgID0gbmV3IEVycm9yKCkuc3RhY2suc3BsaXQgL1xcclxcbnxcXG4vXG4gICAgICAgICAgICByZWd4ICAgID0gL1xcKChbXlxcKV0qKVxcKS9cbiAgICAgICAgICAgIG1hdGNoICAgPSByZWd4LmV4ZWMgc3RhY2tbM11cbiAgICAgICAgICAgIGRpcm5hbWUgPSBzbGFzaC5kaXIgbWF0Y2hbMV1cbiAgICAgICAgICAgIGZpbGUgICAgPSBzbGFzaC5qb2luIGRpcm5hbWUsIGZpbGVcbiAgICAgICAgICAgIFxuICAgICAgICB0cnlcbiAgICAgICAgICAgIGNwID0gY2hpbGRwLmZvcmsgX19maWxlbmFtZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBvbkV4aXQgPSAtPlxuICAgICAgICAgICAgICAgIGNwLnJlbW92ZUxpc3RlbmVyICdtZXNzYWdlJywgb25SZXN1bHRcbiAgICAgICAgICAgICAgICBjcC5yZW1vdmVMaXN0ZW5lciAnZXhpdCcsICAgIG9uRXhpdFxuICAgICAgICAgICAgICAgIGNwLmRpc2Nvbm5lY3QoKSBpZiBjcC5jb25uZWN0ZWRcbiAgICAgICAgICAgICAgICBjcC5raWxsKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG9uUmVzdWx0ID0gKG1zZykgLT4gXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbXNnXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgcmVzdWx0LmVyciwgcmVzdWx0LnJlc3VsdFxuICAgICAgICAgICAgICAgIG9uRXhpdCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBjcC5vbiAnZXJyb3InLCAgIChlcnIpIC0+IGNhbGxiYWNrIGVyciwgbnVsbFxuICAgICAgICAgICAgY3Aub24gJ21lc3NhZ2UnLCBvblJlc3VsdFxuICAgICAgICAgICAgY3Aub24gJ2V4aXQnLCAgICBvbkV4aXRcblxuICAgICAgICAgICAgY3Auc2VuZFxuICAgICAgICAgICAgICAgIGZpbGU6ICBmaWxlXG4gICAgICAgICAgICAgICAgYXJnczogIGFyZ3NcblxuICAgICAgICBjYXRjaCBlcnJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FsbGJhY2sgZXJyLCBudWxsXG4gICAgICAgICAgICBcbiAgICAgICAgY3BcblxuICAgIG1vZHVsZS5leHBvcnRzID0gZm9ya2Z1bmNcblxuZWxzZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwXG5cbiAgICBzZW5kUmVzdWx0ID0gKGVyciwgcmVzdWx0KSAtPlxuICAgICAgICBcbiAgICAgICAgcHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciAnbWVzc2FnZScsIGNhbGxGdW5jXG4gICAgICAgIHByb2Nlc3Muc2VuZCB7ZXJyOmVyciwgcmVzdWx0OnJlc3VsdH0sIC0+XG4gICAgICAgICAgICBwcm9jZXNzLmRpc2Nvbm5lY3QoKSBpZiBwcm9jZXNzLmNvbm5lY3RlZFxuICAgICAgICAgICAgcHJvY2Vzcy5leGl0IDBcbiAgICAgICAgXG4gICAgY2FsbEZ1bmMgPSAobXNnKSAtPlxuICAgICAgICBcbiAgICAgICAgdHJ5XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZ1bmMgPSByZXF1aXJlIG1zZy5maWxlXG4gICAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5IGZ1bmMsIG1zZy5hcmdzXG4gICAgICAgICAgICBzZW5kUmVzdWx0IG51bGwsIHJlc3VsdFxuICAgICAgICAgICAgXG4gICAgICAgIGNhdGNoIGVyclxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZW5kUmVzdWx0IGVyci5zdGFja1xuXG4gICAgcHJvY2Vzcy5vbiAnbWVzc2FnZScsIGNhbGxGdW5jXG4iXX0=
//# sourceURL=../../coffee/tools/forkfunc.coffee