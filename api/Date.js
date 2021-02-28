/**
 * Get Current Date and Time
 * @return {string}
 */
function getCurrent(type){
    var current = 0;
    var now = new Date();
    var hr  = now.getHours();
    var min = now.getMinutes();
    var sec = now.getSeconds();

    if(type === 'datetime') {
        current = now.getUTCFullYear() + "-" + (now.getUTCMonth()+1)  + "-" + now.getUTCDate() + "-" + hr + ':' + min + ':' + sec;
    }
    else if(type === 'date') {
        current = now.getUTCFullYear() + "-" + (now.getUTCMonth()+1)  + "-" + now.getUTCDate();
    }
    else if(type === 'time') {
        current = hr + ':' + min + ':' + sec;
    }
    else if(type === 'militime') {
        current = (now)['getTime']();
    }
    else if(type === 'fulldate') {
        current = now;
    }

    return current;
}

module.exports = {
    militime: getCurrent('militime'),
    datetime: getCurrent('datetime'),
    date: getCurrent('date'),
    time: getCurrent('time'),
    fulldate: getCurrent('fulldate'),
    fulldatetime: getCurrent('fulldatetime')
};