const { app, BrowserWindow, ipcMain } = require('electron');
const xlsx = require('xlsx');
const _ = require('lodash');
const prompt = require('prompt-sync')();

let win;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('calculate-difference', async (event, files, startDate, endDate) => {
  return calculateDifference(files[0], files[1], startDate, endDate);
});

function calculateTotal(fileName, startDate, endDate) {
  const workbook = xlsx.readFile(fileName);
  const sheet_name_list = workbook.SheetNames;
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {raw: false});

  const filteredData = data.filter(item => {
    const date = new Date(item.Tanggal);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });

  const totalByCategory = _.reduce(filteredData, function(result, value) {
    if (!result[value.Kategori]) {
      result[value.Kategori] = 0;
    }
    result[value.Kategori] += Number(value.Total); // ensure that Total is a number
    return result;
  }, {});

  return totalByCategory;
}

function calculateDifference(file1, file2, startDate, endDate) {
  const total1 = calculateTotal(file1, startDate, endDate);
  const total2 = calculateTotal(file2, startDate, endDate);

  const categories = _.union(Object.keys(total1), Object.keys(total2));
  const diff = {};
  categories.forEach(category => {
    diff[category] = (total2[category] || 0) - (total1[category] || 0);
  });

  return { total1, total2, diff };
}

