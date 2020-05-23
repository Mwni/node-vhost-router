# Virtual Hosts Router

![illustration of possible setup](https://manuelotto.com/files/vhost-graphic.png)

The purpose of this module is to provide a very easy to setup proxy router for when you have multiple different projects with different domain names running on the same server.
It is based on [bouncy](https://www.npmjs.com/package/bouncy), but aims to simplify a couple of things.

## Setup

Include the module and instantiate a new instance of it via:

    const Router = require('vhost-router')
    
    let router = new Router({
    	forceHttps: true,
    	defaultKey: '/path/to/default.key',
    	defaultCert: '/path/to/default.cert'
    })
Where `defaultKey` and `defaultCert` should point to a standard SSL certificate of yours. Since this certificate won't actually be used, and is just there to statisfy the requirements to instantiate a node https server, the module comes with a default certificate already packed. When omitted, the packed one is used.

## Routing
To route a request for a specific domain to a local running port, call:

    router.proxy('domain1.com', 'localhost:3000')

For redirecting based on domain, call:

    router.redirect('www.domain1.com', 'domain.com')

## Securing

To actually apply a valid SSL certificate to a routed domain, call:

    router.cert('domain1.com', 'domain1/privkey.pem', 'domain1/fullchain.pem')

## Finally
Call

    router.listen()
to have the router listen to port 80 for http, and port 443 for https.
Incase you want it to listen to other ports call

    router.listen(81, 444)
