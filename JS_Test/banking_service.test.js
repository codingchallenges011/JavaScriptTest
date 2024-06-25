const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

jest.mock('fs');
jest.mock('csv-parser', () => jest.fn());
jest.mock('csv-writer', () => ({
    createObjectCsvWriter: jest.fn()
}));


const {
    loadAccountBalances,
    processTransfers,
    saveAccountBalances,
} = require('./banking_service'); 

describe('Banking Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loadAccountBalances', () => {
        it('should load account balances from a CSV file', async () => {
            const mockData = [
                { 'Account': '1234567890123456', 'Balance': '1000.00' },
                { 'Account': '2345678901234567', 'Balance': '1500.00' }
            ];

            const on = jest.fn();
            csv.mockImplementation(() => ({ on }));
            fs.createReadStream.mockReturnValue({
                pipe: jest.fn().mockImplementation((callback) => {
                    callback();
                    on.mock.calls.find(call => call[0] === 'data')[1](mockData[0]);
                    on.mock.calls.find(call => call[0] === 'data')[1](mockData[1]);
                    on.mock.calls.find(call => call[0] === 'end')[1]();
                    return { on };
                })
            });

            const accountBalances = await loadAccountBalances('dummy_path.csv');
            expect(accountBalances).toEqual({
                '1234567890123456': 1000.00,
                '2345678901234567': 1500.00
            });
        });
    });

    describe('processTransfers', () => {
        it('should process transfers from a CSV file', async () => {
            const accountBalances = {
                '1234567890123456': 1000.00,
                '2345678901234567': 1500.00,
                '3456789012345678': 2000.00
            };

            const mockData = [
                { 'FromAccount': '1234567890123456', 'ToAccount': '2345678901234567', 'Amount': '200.00' },
                { 'FromAccount': '2345678901234567', 'ToAccount': '3456789012345678', 'Amount': '300.00' }
            ];

            const on = jest.fn();
            csv.mockImplementation(() => ({ on }));
            fs.createReadStream.mockReturnValue({
                pipe: jest.fn().mockImplementation((callback) => {
                    callback();
                    on.mock.calls.find(call => call[0] === 'data')[1](mockData[0]);
                    on.mock.calls.find(call => call[0] === 'data')[1](mockData[1]);
                    on.mock.calls.find(call => call[0] === 'end')[1]();
                    return { on };
                })
            });

            const updatedBalances = await processTransfers(accountBalances, 'dummy_path.csv');
            expect(updatedBalances).toEqual({
                '1234567890123456': 800.00,
                '2345678901234567': 1700.00,
                '3456789012345678': 2300.00
            });
        });
    });

    describe('saveAccountBalances', () => {
        it('should save account balances to a CSV file', async () => {
            const accountBalances = {
                '1234567890123456': 1000.00,
                '2345678901234567': 1500.00
            };

            const writeRecords = jest.fn().mockResolvedValue();
            createCsvWriter.mockReturnValue({ writeRecords });

            await saveAccountBalances(accountBalances, 'dummy_output.csv');
            expect(createCsvWriter).toHaveBeenCalledWith({
                path: 'dummy_output.csv',
                header: [
                    { id: 'Account', title: 'Account' },
                    { id: 'Balance', title: 'Balance' }
                ]
            });
            expect(writeRecords).toHaveBeenCalledWith([
                { Account: '1234567890123456', Balance: 1000.00 },
                { Account: '2345678901234567', Balance: 1500.00 }
            ]);
        });
    });
});
