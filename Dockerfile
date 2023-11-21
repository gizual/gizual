FROM caddy:2.4.6-alpine

# Write Caddy file
RUN echo -en ":8080\nroot * /srv\nfile_server" > /etc/caddy/Caddyfile

COPY apps/gizual-app/dist /srv

EXPOSE 8080
