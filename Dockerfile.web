FROM node:20

COPY apps/gizual-api/dist /srv
COPY apps/gizual-app/dist /srv/public

WORKDIR /srv
RUN npm install

ENV PORT=7172
EXPOSE 7172

CMD ["node", "main.js"]
