const fs  = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function loadAccountBalances(filePath) {
    return new Promise((resolve, reject) => {
        const accountBalances = {};
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                accountBalances[row['Account']] = parseFloat(row['Balance']);
            })
            .on('end', () => {
                resolve(accountBalances);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function processTransfers(accountBalances, transfersFilePath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(transfersFilePath)
            .pipe(csv())
            .on('data', (row) => {
                const fromAccount = row['FromAccount'];
                const toAccount = row['ToAccount'];
                const amount = parseFloat(row['Amount']);

                if (accountBalances[fromAccount] !== undefined && accountBalances[toAccount] !== undefined) {
                    if (accountBalances[fromAccount] >= amount) {
                        accountBalances[fromAccount] -= amount;
                        accountBalances[toAccount] += amount;
                    } else {
                        console.log(`Transfer from ${fromAccount} to ${toAccount} of amount ${amount} failed due to insufficient funds.`);
                    }
                } else {
                    console.log(`Transfer from ${fromAccount} to ${toAccount} of amount ${amount} failed due to invalid account.`);
                }
            })
            .on('end', () => {
                resolve(accountBalances);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

function saveAccountBalances(accountBalances, outputFilePath) {
    const csvWriter = createCsvWriter({
        path: outputFilePath,
        header: [
            { id: 'Account', title: 'Account' },
            { id: 'Balance', title: 'Balance' }
        ]
    });

    const records = Object.keys(accountBalances).map(account => ({
        Account: account,
        Balance: accountBalances[account]
    }));

    return csvWriter.writeRecords(records);
}


async function main() {
    try {
        const accountBalances = await loadAccountBalances('account_balances.csv');
        const updatedBalances = await processTransfers(accountBalances, 'transfers.csv');
        await saveAccountBalances(updatedBalances, 'updated_account_balances.csv');
        console.log('Account balances updated successfully.');
    } catch (error) {
        console.error('Error:', error);
    }
}

