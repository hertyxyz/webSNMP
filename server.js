const   config              = require('./config.js');
const   express             = require('express'),
        ratelimit           = require('express-rate-limit'),
        snmp                = require('net-snmp');
const   routes              = require('express').Router();

let snmpdata = {
    printername: "",
    toner: {cyan: 0,magenta: 0,yellow: 0,black: 0,waste: 0},
    photodrum: {cyan: 0,magenta: 0,yellow: 0,black: 0},
    developer: {cyan: 0,magenta: 0,yellow: 0,black: 0},
    fuser: 0,
    paper: {
        bypass: {max: 0,actual: 0,type: "unsupported"},
        tray1: {max: 0,actual: 0,type: "unsupported"},
        tray2: {max: 0,actual: 0,type: "unsupported"},
        tray3: {max: 0,actual: 0,type: "unsupported"},
        tray4: {max: 0,actual: 0,type: "unsupported"}
    },
    covers: {
        front: "unsupported", right: "unsupported", duplex: "unsupported",
        lowright: "unsupported", desk: "unsupported", toner: "unsupported",
        relay: "unsupported", finisherfront: "unsupported",
        finishertop: "unsupported"
    },
    counters: {grayscale: 0, color: 0}
}

let updateSNMP = () => {
    let session = snmp.createSession(config.connection.ip,
        config.connection.community, {version: snmp.Version1});
    let oids = [
        "1.3.6.1.2.1.43.11.1.1.9.1.1","1.3.6.1.2.1.43.11.1.1.9.1.2",
        "1.3.6.1.2.1.43.11.1.1.9.1.3","1.3.6.1.2.1.43.11.1.1.9.1.4",
        "1.3.6.1.2.1.43.11.1.1.9.1.5","1.3.6.1.2.1.43.11.1.1.9.1.6",
        "1.3.6.1.2.1.43.11.1.1.9.1.7","1.3.6.1.2.1.43.11.1.1.9.1.8",
        "1.3.6.1.2.1.43.11.1.1.9.1.9","1.3.6.1.2.1.43.11.1.1.9.1.10",
        "1.3.6.1.2.1.43.11.1.1.9.1.11","1.3.6.1.2.1.43.11.1.1.9.1.12",
        "1.3.6.1.2.1.43.11.1.1.9.1.13","1.3.6.1.2.1.43.11.1.1.9.1.14",
        "1.3.6.1.2.1.43.6.1.1.3.1.1","1.3.6.1.2.1.43.6.1.1.3.1.2",
        "1.3.6.1.2.1.43.6.1.1.3.1.3","1.3.6.1.2.1.43.6.1.1.3.1.4",
        "1.3.6.1.2.1.43.6.1.1.3.1.8",/*"1.3.6.1.2.1.43.6.1.1.3.1.5",
        "1.3.6.1.2.1.43.6.1.1.3.1.40","1.3.6.1.2.1.43.6.1.1.3.1.41",
        "1.3.6.1.2.1.43.6.1.1.3.1.42",*/"1.3.6.1.2.1.43.8.2.1.9.1.1",
        "1.3.6.1.2.1.43.8.2.1.10.1.1","1.3.6.1.2.1.43.8.2.1.12.1.1",
        "1.3.6.1.2.1.43.8.2.1.9.1.2","1.3.6.1.2.1.43.8.2.1.10.1.2",
        "1.3.6.1.2.1.43.8.2.1.12.1.2","1.3.6.1.2.1.43.8.2.1.9.1.3",
        "1.3.6.1.2.1.43.8.2.1.10.1.3","1.3.6.1.2.1.43.8.2.1.12.1.3",
        /*"1.3.6.1.2.1.43.8.2.1.9.1.4","1.3.6.1.2.1.43.8.2.1.10.1.4",
        "1.3.6.1.2.1.43.8.2.1.12.1.4","1.3.6.1.2.1.43.8.2.1.9.1.5",
        "1.3.6.1.2.1.43.8.2.1.10.1.5","1.3.6.1.2.1.43.8.2.1.12.1.5"*/
        "1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.61","1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.63",
        "1.3.6.1.4.1.2385.1.1.1.2.1.8.1"
    ];
    session.get(oids, (error, varbinds) => {
        if (error){ console.error(error); return; }
        for (var i = 0; i < varbinds.length; i++) {
            if (snmp.isVarbindError(varbinds[i])) console.error(snmp.varbindError(varbinds[i]));
            else {
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.1")	snmpdata.toner.cyan = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.2")	snmpdata.toner.magenta = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.3")	snmpdata.toner.yellow = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.4")	snmpdata.toner.black = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.5")	snmpdata.toner.waste = 100 - varbinds[i].value;   // 100-x to get fill pct, not avail pct
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.6")	snmpdata.photodrum.cyan = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.7")	snmpdata.photodrum.magenta = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.8")	snmpdata.photodrum.yellow = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.9")	snmpdata.photodrum.black = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.10")	snmpdata.developer.cyan = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.11")	snmpdata.developer.magenta = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.12")	snmpdata.developer.yellow = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.13")	snmpdata.developer.black = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.14")	snmpdata.fuser = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.1")	snmpdata.covers.front = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.2")	snmpdata.covers.right = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.3")	snmpdata.covers.duplex = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.4")	snmpdata.covers.lowright = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.8")	snmpdata.covers.desk = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.5")	snmpdata.covers.toner = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.40")	snmpdata.covers.relay = (varbinds[i].value == 3 ? "open" : "closed");
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.41")	snmpdata.covers.finisherfront = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.42")	snmpdata.covers.finishertop = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.1")	snmpdata.paper.bypass.max = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.1")	snmpdata.paper.bypass.actual = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.1")	snmpdata.paper.bypass.type = varbinds[i].value.toString() || 'not present';
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.2")	snmpdata.paper.tray1.max = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.2")	snmpdata.paper.tray1.actual = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.2")	snmpdata.paper.tray1.type = varbinds[i].value.toString() || 'not present';
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.3")	snmpdata.paper.tray2.max = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.3")	snmpdata.paper.tray2.actual = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.3")	snmpdata.paper.tray2.type = varbinds[i].value.toString() || 'not present';
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.4")	snmpdata.paper.tray3.max = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.4")	snmpdata.paper.tray3.actual = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.4")	snmpdata.paper.tray3.type = varbinds[i].value.toString() || 'not present';
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.5")	snmpdata.paper.tray4.max = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.5")	snmpdata.paper.tray4.actual = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.5")	snmpdata.paper.tray4.type = varbinds[i].value.toString() || 'not present';
                if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.61")  snmpdata.counters.grayscale = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.63")  snmpdata.counters.color = varbinds[i].value;
                if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.1.2.1.8.1")        snmpdata.printername = varbinds[i].value;
            }
        }
        session.close();
        console.log(snmpdata);
    })
}

setInterval(updateSNMP, 10 * 1000);

const server = express();

routes.get("/", async (req, res, nxt) => {
    return res.status(200).json(snmpdata);
})

server.set('trust proxy', 1);
server.use('/', routes);

server.use((req, res, next) => res.status(404).sendJSON({"error":"404"}));
server.use((req, res, next) => res.status(500).sendJSON({"error":"500"}));

server.listen(9281, () => console.log(`started on port 9281`));
