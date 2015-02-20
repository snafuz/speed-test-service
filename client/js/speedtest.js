/**
 * Created by amarchesini on 05/02/15.
 */


function ready() {
    document.getElementById('UploadButton').addEventListener('click', startUpload);
    document.getElementById('DownloadButton').addEventListener('click', startDownload);

    var socket = io.connect(document.URL)
        , allStartTime
        , recentTransferred = 0
        , recentStartTime = Date.now()
        , recentCurrentCount = 0
        , recentMaxCount
        , maxSize
        , maxSpeed = 0
        , dataTransferSize
        , chunkSize = 128 * 1024;
    ;

    function startUpload() {
        dataTransferSize = document.getElementById('uploadSize').value;
        if (dataTransferSize != '' && !isNaN(dataTransferSize) && dataTransferSize > 0 ) {
            reset();
            socket.emit('StartUpload', {'Size': maxSize});
        }
        else {
            alert("Please select a valid upload size");
        }
    }

    function startDownload() {
        dataTransferSize = document.getElementById('uploadSize').value;
        if (dataTransferSize != '' && !isNaN(dataTransferSize) && dataTransferSize > 0 ) {
            reset();
            socket.emit('StartDownload', {'Size': maxSize});
        }
        else {
            alert("Please select a valid download size");
        }
    }

    function reset(){
        maxSize = dataTransferSize * 1048576;
        allStartTime = (new Date()).getTime();
        recentTransferred = 0
        recentStartTime = (new Date()).getTime();
        recentCurrentCount = 0;
        maxSpeed = 0;
        sAvgRateSec.innerText = '.';
        sAvgRateBit.innerText = '.';
        sAvgRateMin.innerText = '.';
        sCurRateSec.innerText = '.';
        sCurRateBit.innerText = '.';
        sCurRateMin.innerText = '.';
        sMaxRateSec.innerText = '.';
        sMaxRateBit.innerText = '.';
        sMaxRateMin.innerText = '.';
        sTotalTime.innerText = '.';
        sTransferredData.innerText = '0';
    }

    socket.on('MoreData', function (data) {
        //if is the first loop
        if (data['Transferred'] == 0) {
            chunkSize = data['ChunkSize'];
            //current packet speed is calculated on 1 mb transfer
            recentMaxCount = 1048576 / chunkSize;
        }
        updateUploadStats(data['Transferred'], data['ChunkSize']);
        //set chunk size in kb
        var chunkSize = data['ChunkSize'];
        if (chunkSize <= 0) chunkSize = 128;

        var chunk = prepareDataToUpload(chunkSize);
        socket.emit('Upload', {'Data': chunk, 'Size': dataTransferSize});

    });

    socket.on('MoreDataToDownload', function (data) {
        //if is the first loop
        if (data['Transferred'] == 0) {
            chunkSize = data['ChunkSize'];
            //current packet speed is calculated on 1 mb transfer
            recentMaxCount = 1048576 / chunkSize;
        }
        else {
            var chunk = data['Data'].length;
        }
        updateUploadStats(data['Transferred'], data['ChunkSize']);
        socket.emit('Download', {'Data': chunk, 'Size': dataTransferSize});

    });

    socket.on('Done', function (data) {
        reached.style.width = '100%';
        reached.innerText = Math.round(100) + '%';
        var now = (new Date()).getTime();
        sTotalTime.innerText = Math.round((now - allStartTime) / 1000);
        sTransferredData.innerText = (data['Ope']=='D'? 'download size: ':'upload size: ') + dataTransferSize + ' MB';
        console.log('Done');
    });

    //prepare packet to upload
    function prepareDataToUpload() {

        var chunk = '';
        while (chunk.length < chunkSize) {
            chunk += 'x';
        }
        //console.log('chunk size', chunk.length);
        return chunk;
    }




    //upload stats
    function updateUploadStats(transferred, chunkSize) {
        var now = (new Date()).getTime();
        var base;
        //sChunkCount.innerText = ( ++chunkCount);
        sTotalTime.innerText =  sTotalTime.innerText == '\\' ? '/' : '\\';
        sTransferredData.innerText = sTotalTime.innerText;
        sTransferred.innerText = (transferred += chunkSize);
        //console.log(transferred, (now - allStartTime))
        base = (transferred / 1024) / ((now - allStartTime ) / 1000);
        //console.log('Transferred: ', transferred, 'Time: ', (now - allStartTime), now, allStartTime, 'Base: ', base)
        sAvgRateSec.innerText = Math.round(base);
        sAvgRateBit.innerText = Math.round((base * 8) / 100) / 10;
        sAvgRateMin.innerText = Math.round((base * 60) / 1024);
        var percent = 100 * transferred / (maxSize);
        reached.style.backgroundColor = 'lime';
        reached.style.width = percent + '%';
        reached.innerText = Math.round(percent) + '%';


        recentTransferred += chunkSize;
        recentCurrentCount++;
        if (recentCurrentCount === recentMaxCount) {
            base = (recentTransferred / 1024) / ((now - recentStartTime) / 1000);
            sCurRateSec.innerText = Math.round(base);
            sCurRateBit.innerText = Math.round((base * 8) / 100) / 10;
            sCurRateMin.innerText = Math.round((base * 60) / 1024);
            recentCurrentCount = 0;
            recentTransferred = 0;
            recentStartTime = now;
            if (base > maxSpeed) {
                sMaxRateSec.innerText = Math.round(base);
                sMaxRateBit.innerText = Math.round((base * 8) / 100) / 10;
                sMaxRateMin.innerText = Math.round((base * 60) / 1024);
                maxSpeed = base;
            }
        }
    }
}