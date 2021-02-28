var numeral = require('numeral');
var ccunits = require('ccunits');

// Declare Satoshi object
const Satoshi = {};

/**
 *  Make BTC To Satoshi / Example: 0.0022918 BTC ===> 2291.80 Satoshi
 * @param number
 * @return {string}
 */
Satoshi.toSatoshi = function (val) {
    number = val * 100000000;
    return (number/100).toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1");
};

/**
 * Satoshi Format
 * @param number
 * @return {string}
 */
Satoshi.format = function (number) {
    number = number * 100000000;
    return (number/100).toFixed(2).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

/**
 * Add Satoshis
 * @param value
 * @param value2
 * @return {*}
 */
Satoshi.addSatoshi = function (value, value2) {
    var firstValue   = numeral(value);
    var addValue     = firstValue.add(value2);
    var number       = numeral(addValue);
    return number._value;
};

/**
 * Reduce Satoshis
 * @param high
 * @param low
 * @return {*}
 */
Satoshi.reduceSatoshi = function (high, low) {
    const { toMinimal , formatted} = ccunits;
    var number = numeral();
    number.set(high);
    var _number = numeral();
    var thisNumber = toMinimal(number._value, 7);
    _number.set(thisNumber);
    var cc = _number.subtract(low);
    var _thisNumber = formatted(cc._value, 7);
    return _thisNumber;
};

/**
 * Check Satoshie is higher from zero
 * @param value
 * @return {boolean}
 */
Satoshi.isHigher = function (value) {
    var number = numeral();
    number.set(value);

    var getNumber = number.value();

    if(getNumber === 0)
        return false;

    if(getNumber < 0)
        return false;

    return true;
};

module.exports = Satoshi;