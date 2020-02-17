const   config              = require('./config.js'),
        express             = require('express'),
        ratelimit           = require('express-rate-limit'),
        snmp                = require('net-snmp'),
        cors                = require('cors'),
        nodemailer          = require('nodemailer'),
        moment              = require('moment'),
        routes              = require('express').Router();


const   allprinters         = [{}, {}, {}, {}, {}, {}];

for (let x = 0; x < allprinters.length; x++) {
    allprinters[x] = {
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
}

let updateSNMP = () => {
    for (let p = 0; p < config.connection.ip.length; p++) {
        let session = snmp.createSession(config.connection.ip[p],
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
            let result = varbinds.reduce((map, obj) => {
                map[obj.oid] = obj.value;
                return map;
            }, {});
            console.log(result);
            for (var i = 0; i < varbinds.length; i++) {
                if (snmp.isVarbindError(varbinds[i])) console.error(snmp.varbindError(varbinds[i]));
                else {
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.1")	allprinters[p].toner.cyan = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.2")	allprinters[p].toner.magenta = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.3")	allprinters[p].toner.yellow = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.4")	allprinters[p].toner.black = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.5")	allprinters[p].toner.waste = 100 - varbinds[i].value;   // 100-x to get fill pct, not avail pct
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.6")	allprinters[p].photodrum.cyan = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.7")	allprinters[p].photodrum.magenta = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.8")	allprinters[p].photodrum.yellow = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.9")	allprinters[p].photodrum.black = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.10")	allprinters[p].developer.cyan = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.11")	allprinters[p].developer.magenta = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.12")	allprinters[p].developer.yellow = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.13")	allprinters[p].developer.black = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.11.1.1.9.1.14")	allprinters[p].fuser = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.1")	allprinters[p].covers.front = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.2")	allprinters[p].covers.right = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.3")	allprinters[p].covers.duplex = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.4")	allprinters[p].covers.lowright = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.8")	allprinters[p].covers.desk = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.5")	allprinters[p].covers.toner = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.40")	allprinters[p].covers.relay = (varbinds[i].value == 3 ? "open" : "closed");
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.41")	allprinters[p].covers.finisherfront = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.6.1.1.3.1.42")	allprinters[p].covers.finishertop = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.1")	allprinters[p].paper.bypass.max = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.1")	allprinters[p].paper.bypass.actual = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.1")	allprinters[p].paper.bypass.type = varbinds[i].value.toString() || 'not present';
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.2")	allprinters[p].paper.tray1.max = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.2")	allprinters[p].paper.tray1.actual = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.2")	allprinters[p].paper.tray1.type = varbinds[i].value.toString() || 'not present';
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.3")	allprinters[p].paper.tray2.max = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.3")	allprinters[p].paper.tray2.actual = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.3")	allprinters[p].paper.tray2.type = varbinds[i].value.toString() || 'not present';
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.4")	allprinters[p].paper.tray3.max = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.4")	allprinters[p].paper.tray3.actual = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.4")	allprinters[p].paper.tray3.type = varbinds[i].value.toString() || 'not present';
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.9.1.5")	allprinters[p].paper.tray4.max = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.10.1.5")	allprinters[p].paper.tray4.actual = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.2.1.43.8.2.1.12.1.5")	allprinters[p].paper.tray4.type = varbinds[i].value.toString() || 'not present';
                    if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.61")  allprinters[p].counters.grayscale = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.19.2.1.3.5.4.63")  allprinters[p].counters.color = varbinds[i].value;
                    if (varbinds[i].oid == "1.3.6.1.4.1.2385.1.1.1.2.1.8.1")        allprinters[p].printername = varbinds[i].value.toString();
                }
            }
            session.close();
            /* console.log(allprinters[p]); */
        })
    }
}

var alarms = {
    da: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0, t3: 0, t4: 0},
    dv: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0},
    fr: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0},
    pd: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0},
    fo: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0},
    ar: {tc: 0, tm: 0, ty: 0, tk: 0, t1:0, t2: 0}
}

let checkAlarms = () => {
    let now = moment();
}

setInterval(updateSNMP, 10 * 1000);

const server = express();

server.use(cors());

routes.get("/", async (req, res, nxt) => {
    return res.status(200).json(allprinters);
})

server.set('trust proxy', 1);
server.use('/', routes);

server.use((req, res, next) => res.status(404).sendJSON({"error":"404"}));
server.use((req, res, next) => res.status(500).sendJSON({"error":"500"}));

server.listen(9281, () => console.log(`started on port 9281`));

let doMail = () => {
    console.log("Sending Mail");
    let transporter = nodemailer.createTransport(config.nmtransport);
    let mailopts = {
        from: config.nmtransport.auth.user,
        to: config.nmoptions.to,
        subject: 'Darwin Workroom - Tray 3 low!',
        html: '<h2>Tray 3 is low on A4 paper in the Darwin workroom.</h2><p>There are 12 sheets remaining.</p><br /><a href="#">Visit the web panel for more info.</a>'
    }
    transporter.sendMail(mailopts, (e, i) => {
        if (e) return console.log(error);
        console.log('Mail sent: ' + i.response);
    })
}

setTimeout(doMail, 15*1000);
