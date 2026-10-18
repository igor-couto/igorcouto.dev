# igorcouto.com

[![igorcouto.com](https://github.com/igor-couto/igorcouto.dev/actions/workflows/publish.yml/badge.svg?branch=master)](https://github.com/igor-couto/igorcouto.dev/actions/workflows/publish.yml)

## About

Welcome to the repository for my personal website! It's a simple site with links to find me around the internet. Check it out: [https://igorcouto.com](https://igorcouto.com)

## Get in Touch
If you have any questions, feedback, or just want to say hello, you can reach me via:

* **Email** - [igor.fcouto@gmail.com](mailto:igor.fcouto@gmail.com)
* **LinkedIn** - [https://linkedin.com/in/igor-fcouto](https://linkedin.com/in/igor-fcouto)

## Public URLs and search metadata

The preferred origin is `https://igorcouto.com`. The homepage and project
directory use `/` and `/projects/`; individual project pages use
`/projects/<name>` without `.html`. Files on disk retain their `.html` extension.
Keep internal links, canonical tags, Open Graph URLs, and `website/sitemap.xml`
aligned with these public URLs. Error pages are excluded from the sitemap and
marked `noindex`.

The deployment copies static files only; DNS, TLS and Nginx must be configured
separately. Include [deployment/nginx-project-pages.conf](deployment/nginx-project-pages.conf)
inside the existing server block with `root /var/www/html;`. Remove conflicting
exact locations for the pages covered by the snippet, keeping application
and API routes in place. Keep only one `absolute_redirect` directive in the
server block. The snippet redirects legacy URLs to HTTPS and uses relative
automatic directory redirects when TLS terminates at a proxy.

For `www.igorcouto.com`, configure DNS and a certificate covering that hostname,
then redirect to `https://igorcouto.com` while preserving the path and query
string. Use a Cloudflare redirect or adapt
[deployment/nginx-www-redirect.conf.example](deployment/nginx-www-redirect.conf.example)
as separate Nginx server blocks. Its certificate paths are placeholders.

Validate the server configuration before reloading:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

After applying it, check that clean URLs return 200, legacy `.html` URLs return
301 to their canonical URLs, and both HTTP and HTTPS on `www` redirect to the
preferred host with paths and query strings intact.

## Checks

Run `node scripts/check-seo.mjs` with Node.js 20 or newer to check the sitemap,
page metadata and internal links. Pass `website/dist` to check the built files.
These checks run on pull requests and before deployment. They validate local
files; public HTTP redirects and externally hosted applications require
separate verification after deployment.
