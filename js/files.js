"use strict";
var cl = console.log;

const {dialog, BrowserWindow} = require('electron').remote
const currentWindow = require('electron').remote.getCurrentWindow();
let jQuery = require('jquery');
let util = require('util');
let fs = require('fs');
var str2ab = require('string-to-arraybuffer')
let fileType = require('file-type');
let $ = jQuery;

const Web3 = require('web3');
const web3 = new Web3("https://rinkeby.infura.io/AZEp0X3f9Cl4it3m6lz1");
const contractAddress = "0x608313dc9e39d265754920fe23ad2e1e2ed06401";
const contractAbi = require("./assets/abi.json");
const contract = new web3.eth.Contract(contractAbi, contractAddress);

let files = [];

$(loadFiles);

async function loadFiles() {
    let fileList = $(".file-list");
    const fileCount = await contract.methods.getFileCount().call();
    console.log("File count:" + fileCount);
    for(let i = fileCount - 1; i >= 0; i--)
    {
        const fileMeta = await contract.methods.files(i).call();

        console.log("Processing fileId: '" + fileMeta.fileId + "'", "owner: " + fileMeta.owner, "finished: " + fileMeta.finalizedInBlock);

        if(parseInt(fileMeta.finalizedInBlock) <= 0)
            continue;

        const fileClass = "file-" + i;
        fileList.append("<div class='file " + fileClass + "'><div class='index'>#" + i + "</div><div class='progress-title'>Fetching metadata...</div><div class='progress'><div class='progress-indicator'></div></div>");
        let t = 0;
        const file = await getFile(i, function(current, total) {
            t = total;
            $("." + fileClass + " .progress-indicator").css('width', (current / total * 100) + '%');
            $("." + fileClass + " .progress-title").html((current / total * 100).toFixed(2) + '% (' + current + "/" + total + ')')
        });
        files[i] = file;

        setTimeout(function() {

            $("." + fileClass).html(
                "<div class='index'>#" + i + "</div>"
                + "<div class='preview'>" + (file.type ? (file.type.mime.startsWith('image') ? "<img src='data:" + file.type.mime + ";base64," + btoa(file.file) + "' />" : file.type.ext.toUpperCase()) : "?") + "</div>"
                + "<div class='meta'><p class='name'>" + file.meta.fileId + "</p>Type: " + (file.type ? file.type.mime : "unknown") + " Chunks: " + t + "<a href='#' class='download'>Download</a></div>");
            $("." + fileClass + " .download").on('click', function() {
                dialog.showSaveDialog(currentWindow, { title: "Download", defaultPath: files[i].meta.fileId + (files[i].type ? "." + files[i].type.ext : "")  }, function(filename) {
                    fs.writeFile(filename, files[i].file, { encoding: 'ascii' });
                });
            });
        }, 1000);

    }
}

async function getFile(index, onprogress) {
    const file_meta = await contract.methods.files(index).call();
    const chunk_count = await contract.methods.getChunkCount(index).call();

    onprogress(0, chunk_count);

    let buf = "";

    for(let i = 0; i < parseInt(chunk_count); i++)
    {
        const chunk = await contract.methods.getChunk(index, i).call();
        onprogress(i + 1, chunk_count);

        buf += new Uint8Array(web3.utils.hexToBytes(chunk)).reduce(function (data, byte) {
            return data + String.fromCharCode(byte);
        }, '');
    }

    return {
        file: buf,
        meta: file_meta,
        type: fileType(str2ab(buf))
    }
}