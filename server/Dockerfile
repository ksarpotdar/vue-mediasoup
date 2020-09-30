FROM node:14.11.0-stretch
ENV NODE_ENV=production
WORKDIR /server
COPY ["package.json", "package-lock.json*", "./"]
COPY ["certs/fullchain.pem", "certs/privkey.pem*", "./certs/"]
RUN npm install --production
COPY . .
CMD [ "npm", "start" ]