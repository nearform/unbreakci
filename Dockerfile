FROM node:16-alpine AS BUILD_IMAGE

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# # RUN npm build

# FROM node:16-alpine

# WORKDIR /usr/src/app

# COPY --from=BUILD_IMAGE /usr/src/app/dist ./dist
# COPY --from=BUILD_IMAGE /usr/src/app/node_modules ./node_modules

EXPOSE 3000
CMD [ "node", "index.js" ]
