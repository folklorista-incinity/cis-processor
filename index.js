#!/usr/bin/node

import * as ftp from "basic-ftp";
import fs from "fs";
import unzipper from "unzipper";
import CsvReadableStream from 'csv-reader';
import iconv from 'iconv-lite';
import { readFile } from 'fs/promises';
import minimist from 'minimist';
import createSymlink from 'create-symlink';

const config = JSON.parse(
    await readFile(
        new URL('./config.json', import.meta.url)
    )
);

var argv = minimist(process.argv.slice(2));
if (argv.id) {
    if (argv.id in config.dopravci) {
        run(argv.id)
    } else {
        var filtered = filterObject(config.dopravci, (val, key) => key.toLowerCase().includes(argv.id.toString().toLowerCase()) || val.toLowerCase().includes(argv.id.toString().toLowerCase()));
        var found = Object.keys(filtered);
        if (found.length == 1) {
            run(found[0]);
        } else if (found.length > 1) {
            console.error('Ambiguous transport service.');
            console.log('Maybe you meant:', filtered);
        } else {
            console.error('Unknown transport service.');
            console.log('List of available transport services:', config.dopravci);
        }
    }
} else {
    console.error('No transport service defined.')
    console.log('List of available transport services:', config.dopravci);
}

async function run(icoDopravce) {
    console.log('Results for ', config.dopravci[icoDopravce]);

    const tempPath = "temp";
    const zipFile = tempPath + "/JDF.zip";
    const unpackedPath = tempPath + "/unpacked";

    var outputPath = tempPath + "/filtered";

    if (!fs.existsSync(unpackedPath + "/")) {
        fs.mkdirSync(unpackedPath);
    }

    if (fs.existsSync(outputPath + "/")) {
        fs.rmSync(outputPath, { recursive: true });
    }
    fs.mkdirSync(outputPath);

    // await ftpDownload(zipFile);
    // await unzip(zipFile, unpackedPath);
    await getByDopravce(icoDopravce, unpackedPath, outputPath);
}

async function ftpDownload(destinationPath) {
    const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: "ftp.cisjr.cz",
            secure: false
        })
        console.log(await client.list())
        await client.downloadTo(destinationPath, "JDF/JDF.zip")
    }
    catch (err) {
        console.log(err)
    }
    client.close()
}

async function unzip(zipFile, outputPath) {
    console.log({ unzip: { zipFile, outputPath } });
    await fs.createReadStream(zipFile)
        .pipe(unzipper.Extract({ path: outputPath }));
}

async function getByDopravce(idDopravce, zipPath, outputPath) {
    console.log({ getByDopravce: { idDopravce, zipPath, outputPath } });
    await fs.readdirSync(zipPath, { withFileTypes: true }).forEach(dirent => {
        // console.log({dirent: {name: dirent.name, isDirectory: dirent.isDirectory()}})
        if (!dirent.isDirectory()) {
            try {
                var file = dirent.name;
                // console.log({ readdirSync: { zipPath, file } });
                var filePath = zipPath + '/' + file;
                fs.createReadStream(filePath)
                    .pipe(unzipper.ParseOne('Linky\.txt'))
                    .pipe(iconv.decodeStream('win1250'))
                    .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
                    .on('data', function (row) {
                        if (row[2] == idDopravce) {
                            createSymlink("../../" + filePath, outputPath + "/" + file).then(() => {
                                fs.realpathSync(outputPath);
                            });

                            console.log(file + "\t" + row[1]);
                        }
                    });
            }
            catch (err) {
                console.log(err)
            }
        }
    });

    // TODO: zavolat `python3 jdf2gtfs.py --db_name gtfs --db_server localhost --db_user gtfs --db_password gtfs --zip --stopids --stopnames ./script/temp/filtered/ output2/`
}

function filterObject(obj, callback) {
    return Object.fromEntries(Object.entries(obj).
        filter(([key, val]) => callback(val, key)));
}