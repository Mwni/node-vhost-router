const fs = require('fs')
const tls = require('tls')
const bouncy = require('bouncy')

class ProxyRouter{
	constructor(opts){
		if(!opts.defaultKey || !opts.defaultCert){
			opts.defaultKey = __dirname + '/cert/default.key'
			opts.defaultCert = __dirname + '/cert/default.cert'

			console.log('[Router] using default initial certificate. please consider specifying your own cert/key.')
		}else if(!fs.existsSync(opts.defaultKey) || !fs.existsSync(opts.defaultCert)){
			throw new Error('defaultKey or defaultCert file not found. cannot continue.')
		}

		this.opts = opts
		this.actions = {}
		this.certs = {}

		this.httpServer = bouncy((req, res, bounce) => {
			if(this.opts.forceHttps){
				if(this.certs[req.headers.host]){
					res.writeHead(302, {Location: 'https://' + req.headers.host + req.url})
					res.end()
					return
				}
			}

			this.handleRequest(req, res, bounce)
		})

		this.httpsServer = bouncy(
			{
				key: fs.readFileSync(opts.defaultKey),
				cert: fs.readFileSync(opts.defaultCert),
				SNICallback: this.serveCertificate.bind(this)
			},
			this.handleRequest.bind(this)
		)
	}

	handleRequest(req, res, bounce){
		let host = req.headers.host

		this.log('[Router] new request:',host)

		let action = this.actions[host]

		if(!action){
			res.statusCode = 404
			res.end('no such host')
			return
		}

		switch(action.action){
			case 'proxy':
				bounce(action.destination)
				break

			case 'redirect':
				res.writeHead(302, {Location: '//' + action.destination})
				res.end()
				break
		}
	}

	serveCertificate(host, cb){
		let cert = this.certs[host]

		if(!cert)
			return null

		this.log('[Router] serving cert context:', host)

		let context = tls.createSecureContext(cert)

		if(cb)
			cb(null, context)
		else
			return context
	}

	proxy(host, destination){
		this.actions[host] = {
			action: 'proxy',
			destination: destination
		}

		this.log('[Router] added proxy', host, '->', destination)
	}

	redirect(host, targetHost){
		this.actions[host] = {
			action: 'redirect',
			destination: targetHost
		}

		this.log('[Router] added redirect', host, '->', targetHost)
	}

	cert(host, key, cert){
		this.certs[host] = {
			key: fs.readFileSync(key),
			cert: fs.readFileSync(cert),
		}
	}

	listen(httpPort, httpsPort){
		this.httpPort = httpPort = httpPort || 80
		this.httpsPort = httpsPort = httpsPort || 443

		this.httpServer.listen(httpPort)
		this.httpsServer.listen(httpsPort)

		this.log('[Router] http listening on port', httpPort)
		this.log('[Router] https listening on port', httpsPort)
	}

	log(...args){
		if(this.opts.log)
			console.log.apply(console, ['[Router]'].concat(args))
	}
}

module.exports = ProxyRouter