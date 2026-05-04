Title: Proxy-Aware Short URL Construction
Demonstrated: buildShortUrl() respects x-forwarded-proto and x-forwarded-host headers for correct URLs behind load balancers
Technical detail: LinksService.buildShortUrl() reads forwardedProto and forwardedHost headers, falls back to request.protocol and request.get('host'). firstHeaderValue() splits on comma and trims to handle chained proxies (e.g., "https, http" → "https").
Proof: Behind an HTTPS load balancer: POST /links with x-forwarded-proto:https, x-forwarded-host:short.io → short_url:"https://short.io/r/aB3kLm9x" (not http://localhost:3000).
Reasoning: Without proxy awareness, short URLs would contain internal hostnames, making them unusable. This mirrors how Heroku and AWS ALB forward the original protocol and host.
