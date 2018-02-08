#!/usr/bin/env node
/* 
 * This file is part of the noncloud.
 * Copyright (c) 2018 TANIGUCHI Masaya.
 * 
 * This program is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const WebSocket = require('ws');
const CircularJSON = require('circular-json');
const Request = require('request');
const Commander = require('commander');
const URL = require('url').URL;
const version = require('./package.json').version;

Commander
    .version(version, '-v, --version')
    .option('-s, --secure', 'use SSL/TLS')
    .option('-n, --name <name>',  'set application name')
    .option('-r, --remotehost <remotehost:port>', 'set noncloud server', 'noncloud.herokuapp.com')
    .option('-l, --localhost <localhost:port>',  'tunnel traffic to this host', 'localhost:80')
    .parse(process.argv);

if (Commander.name && Commander.localhost) {
    const websocketclient = new WebSocket(`ws${Commander.secure ? 's' : ''}://${Commander.remotehost}`);
    websocketclient.once('open', ()=>{
        websocketclient.send(Commander.name);
        websocketclient.on('message', (data)=>{
            const websocketrequest = CircularJSON.parse(data);
            websocketrequest.headers.host = new URL(Commander.localhost).host;
            Request({
                url: websocketrequest.params[0] || '/',
                baseUrl: `http://${Commander.localhost}`,
                method: websocketrequest.method,
                headers: websocketrequest.headers,
                qs: websocketrequest.query,
                body: websocketrequest.body.data && Buffer.from(websocketrequest.body.data)
            }, (error, response, body)=>{
                websocketclient.send(CircularJSON.stringify(response));
            });
        });
    });
}