/**
 * Created by amarchesini on 05/02/15.
 */
var app = require('http').createServer(handler)
    , io = require('socket.io').listen(app)
    , fs = require('fs')
    , url = require('url')
    , cfg = require('./setting.cfg')
    , downloaded = 0
    , uploadSize = 0
    , chunkSize = cfg.chunkSize * 1024
    , port = cfg.port
    , clientPath = __dirname + '/client/'
    ;

app.listen(port);

function handler(req, res) {

    var u = url.parse(req.url, true);
    if (u.path === '/favicon.ico') {
        res.writeHead(404);
        res.end();
        return;
    }
    else if (u.path.indexOf('js/') >= 1) {
        fs.readFile(clientPath + u.path, function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading ' + u);
            }
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.end(data, 'utf-8');
        });
    }
    else if (u.path.indexOf('css/') >= 1) {
        fs.readFile(clientPath + u.path, function (err, data) {
            if (err) {
                res.writeHead(500);
                return res.end('Error loading ' + u);
            }
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.end(data, 'utf-8');
        });
    }
    else {
        fs.readFile(clientPath + 'index.html',
            function (err, data) {
                if (err) {
                    res.writeHead(500);
                    return res.end('Error loading index.html');
                }
                res.writeHead(200);
                res.end(data);
            });
    }
}

//prepare packet to dowload
function prepareDataToDownload() {

    var chunk = '';
    while (chunk.length < chunkSize) {
        chunk += 'x';
    }
    //console.log('chunk size', chunk.length);
    return chunk;
}

//socket.io handlers
io.sockets.on('connection', function (socket) {
    //at first transfer chunkSize only
    socket.on('StartUpload', function (data) {
        uploadSize = data['Size'];
        downloaded = 0;
        socket.emit('MoreData', {ChunkSize: chunkSize, Transferred: 0});
    });

    //upload chunk of data from client to server
    socket.on('Upload', function (data) {

        downloaded += data['Data'].length;
        if (downloaded >= uploadSize) {
            //console.log('Done!');
            socket.emit('Done', {Ope: 'U'});

        }
        else {
            socket.emit('MoreData', {ChunkSize: chunkSize, Transferred: downloaded, Data: 0});
        }
    });

    //at first transfer chunkSize only
    socket.on('StartDownload', function (data) {
        uploadSize = data['Size'];
        downloaded = 0;
        socket.emit('MoreDataToDownload', {ChunkSize: chunkSize, Transferred: 0});
    });

    socket.on('Download', function (data) {
        downloaded += chunkSize;
        if (downloaded >= uploadSize) {
            console.log('Done!');
            socket.emit('Done', {Ope: 'D'});
        }
        else {
            var chunk = prepareDataToDownload();
            socket.emit('MoreDataToDownload', {ChunkSize: chunkSize, Transferred: downloaded, Data: chunk});
        }

    });
});
