import bp from 'body-parser'
import express from 'express'
import fs from 'fs'
import helmet from 'helmet'
import cache, { CacheClass } from 'memory-cache'
import snmp from 'net-snmp'
import { ILogObject, Logger } from 'tslog'

const packageData = require('../package.json')

const log: Logger = new Logger();
{
    log.silly('Logger instantiated')
    const logToTransport = (logObject: ILogObject) => {
        fs.appendFileSync('jci.log', JSON.stringify(logObject) + "\n")
    }
    log.attachTransport({
        silly: logToTransport,
        debug: logToTransport,
        trace: logToTransport,
        info: logToTransport,
        warn: logToTransport,
        error: logToTransport,
        fatal: logToTransport
    }, "debug")
    log.info(`Logger attached to file: '${'jci.log'}'`)
}
log.info('Logging initialized')

export interface WebSNMPConfig {
    server: {
        listen_ip: string,
        listen_port: number,
        access_key: string[],
        interval: number
    },
    snmp: {
        [friendly_name: string]: {
            host: string,               // IP or DNS hostname of the SNMP device
            port: number,               // Port of the SNMP device
            version: string,            // v1, v2c, or v3
            community?: string,         // v1, v2c Only
            username?: string,          // v3 Only
            context?: string,           // v3 Only
            auth_method?: string,       // v3 Only - None, MD5, or SHA1
            auth_key?: string,          // v3 Only - Authentication Key
            privacy_method?: string,    // v3 Only - None, DES56, AES128, AES192, or AES256
            privacy_key?: string,       // v3 Only - Privacy Key
            oids: {                     // Array of OIDs to check - format is 'friendly_name: OID'
                [friendly_name: string]: string
            }
        }
    }
}
let config_file = './config/config.json'
let config_data = fs.readFileSync(config_file).toString('utf-8')
const config: WebSNMPConfig = JSON.parse(config_data)
log.info(`Loaded config from '${config_file}'`)

const memCache: CacheClass<string, number> = new cache.Cache()
log.info(`Memory cache initialized`)

interface SNMPResponse {
    [friendly_name: string]: {
        [friendly_name: string]: number
    }
}
const app: express.Express = express()
{
    log.silly('Express instantiated')
    app.use(helmet())
    log.silly('Attached helmet to express')
    app.use(bp.json())
    app.use(bp.urlencoded({ extended: true }))
    log.silly('Attached body-parser to express')
    app.use((q, s, n) => {
        log.debug(`${q.method.toUpperCase().padStart(6, ' ')} ${q.path}`)
        n()
    })
    log.silly('Attached logging middleware to express')
    app.get('/', async (q, s, n) => {
        s.status(200).json({
            status: 'ok',
            server: packageData.name,
            version: packageData.version,
            homepage: packageData.repository.url
        })
    })
    log.silly('Registered route -  GET /')
    app.get('/health', async (q, s, n) => {
        s.status(200).json({ status: 'ok' })
    })
    log.silly('Registered route -  GET /health')
    app.get('/snmp/:key', async (q, s, n) => {
        if (!config.server.access_key.includes(q.params.key)) s.status(401).json({ status: 'unauthorized' })
        let response: SNMPResponse = {}
        Object.keys(config.snmp).forEach(host => {
            response[host] = {}
            Object.keys(config.snmp[host].oids).forEach(oid => {
                let value = memCache.get(`${host}$$${config.snmp[host].oids[oid]}`)
                value ??= -1
                response[host][oid] = value
            })
        })
        s.status(200).json({
            status: 'ok',
            snmp: response
        })
    })
    log.silly('Registered route -  GET /snmp/:key')
}
log.info('Express initialized')

app.listen(config.server.listen_port, () => {
    log.info(`Listening on ${config.server.listen_ip}:${config.server.listen_port}`)
})

interface SNMPSessionStore {
    [hostname: string]: any
}
const sessions: SNMPSessionStore = {}
Object.keys(config.snmp).forEach(host => {
    sessions[host] = snmp.createSession(
        `${config.snmp[host].host}:${config.snmp[host].port}`,
        config.snmp[host].community
    )
})

setInterval(() => {
    log.debug('Collecting SNMP data')
    Object.keys(config.snmp).forEach(host => {
        sessions[host].get(config.snmp[host].oids, (e: any, v: any) => {
            if (e) {
                log.warn(`Failed to fetch data from host '${host}'`)
            } else {
                v.forEach((varbind: any) => {
                    if (snmp.isVarbindError(varbind)) {
                        log.warn(`Error fetching OID '${varbind.oid}' from host '${host}'`)
                    } else {
                        log.silly(`HOST: '${host}', OID: '${varbind.oid}, VALUE: ${varbind.value}'`)
                        memCache.put(`${host}$$${varbind.oid}`, varbind.value)
                    }
                })
            }
        })
    })
}, config.server.interval * 1000)