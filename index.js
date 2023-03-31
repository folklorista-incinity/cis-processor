#!/usr/bin/node

import * as ftp from 'basic-ftp';
import CsvReadableStream from 'csv-reader';
import {
    mkdir,
    open,
    readdir,
    readFile,
    rm,
    symlink,
} from 'fs/promises';
import iconv from 'iconv-lite';
import minimist from 'minimist';
import unzipper from 'unzipper';

const config = JSON.parse(
    await readFile(
        new URL('./config.json', import.meta.url)
    )
);

init();

async function init() {
    var argv = minimist(process.argv.slice(2));
    var transportCompanyId = argv.id;
    if (transportCompanyId) {
        if (transportCompanyId in config.transportCompanies) {
            await run(transportCompanyId)
        } else {
            var filteredTransportCompanies = filterObject(config.transportCompanies, (val, key) => [val, key].some(value => value.toLowerCase().includes(transportCompanyId.toString().toLowerCase())));
            var found = Object.keys(filteredTransportCompanies);
            if (found.length == 1) {
                console.log('List of transport lines for ' + config.transportCompanies[transportCompanyId] + ':');
                await run(found[0]);
            } else if (found.length > 1) {
                console.error('Ambiguous transport company.');
                console.log('Maybe you meant:', filteredTransportCompanies);
            } else {
                console.error('Unknown transport company.');
                console.log('List of available transport companies:', config.transportCompanies);
            }
        }
    } else {
        console.error('No transport company defined.')
        console.log('List of available transport companies:', config.transportCompanies);
    }
}

async function run(transportCompanyId) {
    await preparePaths();
    await ftpDownload(config.ftp.connection, config.ftp.remoteFile, config.paths.zip);
    await unzip(config.paths.zip, config.paths.unpacked);
    await getTransportLines(transportCompanyId, config.paths.unpacked, config.paths.output);
}

async function preparePaths() {
    await mkdir(config.paths.unpacked, { recursive: true });
    await rm(config.paths.output, { recursive: true, force: true });
    await mkdir(config.paths.output, { recursive: true });
}

async function getTransportLines(transportCompanyId, zipPath, outputPath) {
    const files = await readdir(zipPath, { withFileTypes: true });
    var counter = 0;
    await asyncForEach(files, async dirent => {
        if (!dirent.isDirectory()) {
            ++counter;
            try {
                var file = dirent.name;
                var filePath = zipPath + '/' + file;

                const fd = await open(filePath);
                fd.createReadStream()
                    .pipe(unzipper.ParseOne(config.pathRegexp))
                    .pipe(iconv.decodeStream(config.ftp.encoding))
                    .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
                    .on('data', async function (row) {
                        if (row[2] == transportCompanyId) {
                            await symlink("../../" + filePath, outputPath + "/" + file);
                            console.log("\t- " + row[1]);
                        }
                    });
            }
            catch (err) {
                console.error(err);
            }
        }
    });
}

async function ftpDownload(ftpConfig, fromRemotePath, destination) {
    const client = new ftp.Client()
    client.ftp.verbose = false
    try {
        await client.access(ftpConfig)
        await client.downloadTo(destination, fromRemotePath)
    }
    catch (err) {
        error.log(err)
    }
    client.close()
}

async function unzip(zipFile, outputPath) {
    const fd = await open(zipFile);
    fd.createReadStream()
        .pipe(unzipper.Extract({ path: outputPath }));
}

function filterObject(obj, callback) {
    return Object.fromEntries(Object.entries(obj).
        filter(([key, val]) => callback(val, key)));
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}