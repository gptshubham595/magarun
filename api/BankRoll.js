const Bank = require("./models/BankRoll");

module.exports = function (){
    var Amount = 0;

    /**
    * Get BankRoll Amount
    */
    function getBankRollAmount()
    {
        Bank.get((result) => {
            Amount = result;
        });

        return Amount;
    }
    return {
        getBankRollAmount
    }
};