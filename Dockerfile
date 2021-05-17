# Sources: 
# https://www.cloudbees.com/blog/using-docker-compose-for-nodejs-development/
# https://stackoverflow.com/questions/42040317/cannot-find-module-for-a-node-js-app-running-in-a-docker-compose-environment

FROM node:15.12.0-alpine

# Create app dir
WORKDIR /usr/app

# Install app dependencies
COPY package.json .
RUN npm install

# Bundle app source
COPY . .

EXPOSE 4343
CMD ["npm", "start"]