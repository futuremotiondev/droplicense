#!/usr/bin/env node
import { input, select } from '@inquirer/prompts';
import * as path from 'path';
import { createRequire } from 'module';
import fetch from 'node-fetch';
import * as fs from 'fs';
const require = createRequire(import.meta.url);
const userName = require('git-user-name');
const Spinner = require('cli-spinner').Spinner;
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
let loading = new Spinner('%s generating license');
loading.setSpinnerString('⣾⣽⣻⢿⡿⣟⣯⣷');
loading.setSpinnerDelay(100);
class LicenseClass {
    licenseSelection = '';
    licenseYear = '';
    licenseAuthorName = '';
    licenseProjectName = '';
    licenseProjectDescription = '';
    licenseUrl = '';
    licenseDestination = '';
    licenseSelectionRegex = '';
}
const selectedLicense = await select({
    message: 'Select your license: (Use arrow keys)',
    choices: ['MIT', 'Apache 2.0', 'MPL 2.0', 'LGPL 3.0', 'GPL 3.0', 'AGPL 3.0', 'Unlicense']
});
const licenseSelectionRegex = selectedLicense.toLowerCase().replace(/ /g, '-');
const projectDescription = licenseSelectionRegex.match(/(^gpl|agpl)/)
    ? await input({
        message: 'Give the project\'s name and a brief idea of what it does (one line):\n',
        default: (function () {
            return 'mycli. A CLI tool that generates awesome stuff.';
        })(),
    })
    : '';
const projectName = licenseSelectionRegex.match(/(^gpl\-3\.0)/)
    ? await input({
        message: 'Enter the project\'s name:\n',
        default: (function () {
            return 'My Project';
        })(),
    })
    : '';
let licenseData;
licenseData = {
    licenseSelection: selectedLicense,
    licenseYear: await input({
        message: 'Enter the project\'s year:',
        default: (function () {
            const currentDate = new Date();
            return currentDate.getFullYear().toString();
        })(),
    }),
    licenseAuthorName: await input({
        message: 'Enter the project\'s author:',
        default: (function () {
            return userName();
        })(),
    }),
    licenseProjectName: projectName.trim() !== '' ? projectName : '',
    licenseProjectDescription: projectDescription.trim() !== '' ? projectDescription : '',
    licenseUrl: 'http://choosealicense.com/licenses/' + licenseSelectionRegex,
    licenseDestination: path.resolve('.'),
    licenseSelectionRegex: licenseSelectionRegex,
};
async function fetchLicenseText(url) {
    loading.start();
    try {
        // Fetch the HTML content from the URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Get the text content of the response
        const htmlText = await response.text();
        // Use JSDOM to parse the HTML content
        const dom = new JSDOM(htmlText);
        const document = dom.window.document;
        // Extract the content within the element with the specified ID
        const element = document.getElementById('license-text');
        return element ? element.textContent : null;
    }
    catch (error) {
        console.error('Error fetching or parsing the document:', error);
        return null;
    }
}
function customizeLicenseText(licenseText, data) {
    let updatedLicense = '';
    let licYear = data.licenseYear;
    let licAuthor = data.licenseAuthorName;
    let licProjectName = data.licenseProjectName;
    let licDescription = data.licenseProjectDescription;
    let licenseId = data.licenseSelectionRegex;
    switch (licenseId) {
        case 'mit':
            updatedLicense = licenseText.replace('[year]', licYear).replace('[fullname]', licAuthor);
            break;
        case 'apache-2.0':
            updatedLicense = licenseText.replace('[yyyy]', licYear).replace('[name of copyright owner]', licAuthor);
            break;
        case 'gpl-3.0':
            updatedLicense = licenseText.replace('<year>', licYear).replace('<name of author>', licAuthor).replace('<program>', licProjectName)
                .replace('<one line to give the program\'s name and a brief idea of what it does.>', licDescription);
            break;
        case 'agpl-3.0':
            updatedLicense = licenseText.replace('<year>', licYear).replace('<name of author>', licAuthor)
                .replace('<one line to give the program\'s name and a brief idea of what it does.>', licDescription);
            break;
        default:
            updatedLicense = licenseText;
    }
    return updatedLicense;
}
async function populateLicense() {
    try {
        const licenseText = await fetchLicenseText(licenseData.licenseUrl);
        if (licenseText !== null) {
            let populatedLicense = customizeLicenseText(licenseText, licenseData);
            return populatedLicense;
        }
        else {
            console.log('Element not found or error occurred.');
        }
    }
    catch (error) {
        console.error('An error occurred while fetching the license text:', error);
    }
}
async function writeLicenseToFile() {
    let fileName = 'LICENSE';
    try {
        let finalLicense = await populateLicense();
        if (finalLicense) {
            fs.writeFile(fileName, finalLicense, 'utf-8', function (err) {
                if (err) {
                    return console.log('Error writing license to disk.', err);
                }
                loading.stop(true);
                console.log('Complete: License has been created: ' + '"' + licenseData.licenseDestination + '\\' + fileName + '"');
            });
        }
        else {
            console.log('No license text was generated.');
        }
    }
    catch (error) {
        console.error('An error occurred:', error);
    }
}
writeLicenseToFile();
//# sourceMappingURL=index.js.map