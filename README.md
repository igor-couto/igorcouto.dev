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

The website deployment copies static files only; it does not change DNS or Nginx.
To redirect old project URLs, replace the existing `location /projects/` block
in the site's Nginx configuration with
[`deployment/nginx-project-pages.conf`](deployment/nginx-project-pages.conf).
Remove the old individual Runner Manager and Home Server location blocks if
they are still present. Leave all other application routes in place, then run:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

For `www.igorcouto.com`, configure a proxied `www` CNAME pointing to
`igorcouto.com` in Cloudflare DNS. Configure a permanent redirect that matches
only the `www.igorcouto.com` hostname and sends requests to
`https://igorcouto.com`, preserving their path and query string. Ensure the
Cloudflare edge certificate covers `www.igorcouto.com` so HTTPS requests can
reach the redirect. Existing redirects for other hosts should remain unchanged.

After applying the server changes, verify that a clean project URL returns
`200`, its `.html` version redirects to that URL, and `www` redirects to the
non-`www` host. Submit the updated `https://igorcouto.com/sitemap.xml` in Search
Console after deployment.
